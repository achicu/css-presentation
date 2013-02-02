/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function() {

	function dist(x1, y1, x2, y2) {
		return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
	}

	function angle(x1, y1, x2, y2) {
		var cos = (x1 * x2 + y1 * y2) / (dist(0, 0, x1, y1) * dist(0, 0, x2, y2));
		return Math.acos(cos) * 180 / Math.PI;
	}

	function rotation(x1, y1, x2, y2) {
		var angle1 = angle(1, 0, x1, y1);
		var angle2 = angle(1, 0, x2, y2);
		if (y1 > 0)
			angle1 = - angle1;
		if (y2 > 0)
			angle2 = - angle2;
		return angle1 - angle2;
	}

	function GestureStart(type, scrollX, scrollY) {
		this.type = type;
		this.scrollX = scrollX;
		this.scrollY = scrollY;
	}

	GestureStart.DRAG = "drag";
	GestureStart.TRANSFORM = "transform";

	/*
	Gesture types detected:
	1. Tap
	2. Long-tap
	3. Drag - Swipe
	4. Transform (move, scale, rotate)
	*/
	function GestureView() {
		GestureView.$super.call(this);
		this.on("touchstart", this.onGestureTouchStart.bind(this));
		this.on("touchmove", this.onGestureTouchMove.bind(this));
		this.on("touchend", this.onGestureTouchEnd.bind(this));
		this.on("touchcanceled", this.onGestureTouchCanceled.bind(this));
		this.touchesStarted = 0;
		this.didStartDragging = false;
		this.didStartTransform = false;
		this.longTapDuration = 500;
		this.minDragLength = 5;
		this.longTapTimer = null;
		this.longTapTimerCallback = this.onLongTapTimer.bind(this);
		this.longTapTouch = null;
		this.touchParent = null;
		this.dragSurface = null;
	}
	Global.Utils.extend(GestureView).from(Global.TouchView);

	$.extend(GestureView.prototype, {
		installGestureTimers: function(touch) {
			this.clearGestureTimers();
			this.longTapTouch = touch;
			this.longTapTimer = setTimeout(this.longTapTimerCallback, this.longTapDuration);
		},

		clearGestureTimers: function() {
			if (!this.longTapTimer)
				return;
			this.longTapTouch = null;
			clearTimeout(this.longTapTimer);
			this.longTapTimer = null;
		},

		installTransformCapture: function() {
			var parentTransformSurface = this.findParentTouchSurface(new GestureStart(GestureStart.TRANSFORM));
			if (parentTransformSurface)
				Global.TouchView.captureTouchSurface = this;
		},

		clearTransformCapture: function() {
			if (Global.TouchView.captureTouchSurface === this)
				Global.TouchView.captureTouchSurface = null;
		},

		computeGestureTransform: function() {
			var pointA = this.touchPoints[0];
			var pointB = this.touchPoints[1];

			var originX = (pointA.startPosition.pageX + pointB.startPosition.pageX) / 2;
			var originY = (pointA.startPosition.pageY + pointB.startPosition.pageY) / 2;
			
			var centerStartX = (pointA.startPosition.screenX + pointB.startPosition.screenX) / 2;
			var centerStartY = (pointA.startPosition.screenY + pointB.startPosition.screenY) / 2;
			var distanceStart = dist(pointA.startPosition.screenX, pointA.startPosition.screenY, pointB.startPosition.screenX, pointB.startPosition.screenY);
			
			var centerEndX = (pointA.currentPosition.screenX + pointB.currentPosition.screenX) / 2;
			var centerEndY = (pointA.currentPosition.screenY + pointB.currentPosition.screenY) / 2;
			var distanceEnd = dist(pointA.currentPosition.screenX, pointA.currentPosition.screenY, pointB.currentPosition.screenX, pointB.currentPosition.screenY);
			
			var vectorRotation = rotation(
					pointB.startPosition.screenX - pointA.startPosition.screenX,
					pointB.startPosition.screenY - pointA.startPosition.screenY,
					pointB.currentPosition.screenX - pointA.currentPosition.screenX,
					pointB.currentPosition.screenY - pointA.currentPosition.screenY
				);

			originX -= this.dragSurface.el.get(0).offsetLeft;
			originY -= this.dragSurface.el.get(0).offsetTop;

			return {
				scale: (distanceStart > 0) ? (distanceEnd / distanceStart) : 0,
				dragX: centerEndX - centerStartX,
				dragY: centerEndY - centerStartY,
				originX: originX,
				originY: originY,
				rotation: vectorRotation
			};
		},

		computeDragTransform: function(touch) {
			return {
				dragX: touch.currentPosition.screenX - touch.startPosition.screenX,
				dragY: touch.currentPosition.screenY - touch.startPosition.screenY
			};
		},

		onGestureTouchStart: function(touch) {
			this.touchesStarted = (this.touchPoints.length == 1) ? 1 : (this.touchesStarted + 1);
			if (this.touchesStarted == 1) {
				this.installGestureTimers(touch);
				this.installTransformCapture();
				this.fire("tapstart", [touch]);
			} else if (!this.didStartTransform) {
				// Two finger gesture.
				if (this.didStartDragging) {
					var oldDragTouch = this.touchPoints[0];
					this.dragSurface.fire("touchdragend", [this.computeDragTransform(oldDragTouch), oldDragTouch]);
					this.dragSurface = null;
					this.didStartDragging = false;
					oldDragTouch.startPosition = oldDragTouch.currentPosition;
				} else {
					this.fire("tapend", [touch]);
				}
				this.clearGestureTimers();
				this.dragSurface = this.findParentTouchSurface(new GestureStart(GestureStart.TRANSFORM));
				if (this.dragSurface) {
					this.didStartTransform = true;
					this.dragSurface.fire("touchtransformstart", [touch]);
				}
			}
		},

		cancelTransform: function() {
			if (!this.didStartTransform)
				return;
			this.didStartTransform = false;
			this.dragSurface = null;
			//this.clearTransformCapture();
		},

		onGestureTouchMove: function(touch) {
			if (this.didStartTransform) {
				// Interpret the tranform out of the first two touches.
				this.dragSurface.fire("touchtransform", [this.computeGestureTransform()]);
				return;
			}
			if (!this.didStartDragging) {
				var distanceX = touch.startPosition.screenX - touch.currentPosition.screenX;
				var distanceY = touch.startPosition.screenY - touch.currentPosition.screenY;
				var scrollX = Math.abs(distanceX) > this.minDragLength;
				var scrollY = Math.abs(distanceY) > this.minDragLength;
				if (scrollX || scrollY) {
					this.fire("tapend", [touch]);
					this.clearGestureTimers();
					this.dragSurface = this.findParentTouchSurface(new GestureStart(GestureStart.DRAG, scrollX, scrollY));
					if (this.dragSurface) {
						touch.dragStartTime = touch.currentPosition.time - touch.startPosition.time;
						this.didStartDragging = true;
						this.dragSurface.fire("touchdragstart", [touch]);
					}
				}
			}
			if (this.didStartDragging)
				this.dragSurface.fire("touchdragmove", [this.computeDragTransform(touch), touch]);
		},

		onLongTapTimer: function() {
			this.fire("longtaptimer", [this.longTapTouch]);
			this.clearGestureTimers();
		},

		onGestureTouchEnd: function(touch) {
			this.clearGestureTimers();
			if (this.didStartTransform) {
				if (this.touchPoints.length == 1) {
					this.dragSurface.fire("touchtransformend", [touch]);
					// One touch remaining, go back to dragging.
					this.didStartTransform = false;
					this.didStartDragging = false;
					this.dragSurface = null;
				}
			} else if (this.touchesStarted == 1 && !this.didStartDragging) {
				this.fire("tapend", [touch]);
				// We only had one touch during this interval. Figure out if it's a tap or
				// a long-tap and fire the event.
				var touchDuration = touch.currentPosition.time - touch.startPosition.time;
				this.fire((touchDuration < this.longTapDuration) ? "tap" : "longtap", [touch]);
			}
			if (!this.touchPoints.length) {
				if (this.didStartDragging)
					this.dragSurface.fire("touchdragend", [this.computeDragTransform(touch), touch]);
				else if (this.didStartTransform)
					this.dragSurface.fire("touchtransformend", [touch]);
				if (this.dragSurface)
					this.dragSurface.fire("gestureend", [touch]);
				this.didStartTransform = false;
				this.didStartDragging = false;
				this.dragSurface = null;
				this.touchesStarted = 0;
				this.clearTransformCapture();
			}
		},

		onGestureTouchCanceled: function(touch) {
			this.onGestureTouchEnd(touch);
		},

		respondsToTouchGesture: function(gesture) {
			return false;
		},

		findParentTouchSurface: function(gesture) {
			for (var node = this; node; node = node.parentView())
				if (node.respondsToTouchGesture && node.respondsToTouchGesture(gesture))
					return node;
			return null;
		}
	});

	Global.GestureView = GestureView;
	Global.GestureStart = GestureStart;

})();