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
        this.canTap = true;
		this.longTapDuration = 500;
		this.minDragLength = 5;
		this.longTapTimer = null;
		this.longTapTimerCallback = this.onLongTapTimer.bind(this);
		this.longTapTouch = null;
		this.touchParent = null;
		this.dragSurface = null;
        this.draggingTouch = null;
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
				Global.TouchView.touchViewManager.captureTouchSurface = this;
		},

		clearTransformCapture: function() {
			if (Global.TouchView.touchViewManager.captureTouchSurface === this)
				Global.TouchView.touchViewManager.captureTouchSurface = null;
		},

		computeGestureTransform: function() {
			var pointA = this.touchPoints[0];
			var pointB = this.touchPoints[1];

			var originX = (pointA.startPosition.pageX + pointB.startPosition.pageX) / 2;
			var originY = (pointA.startPosition.pageY + pointB.startPosition.pageY) / 2;

			var centerStartX = (pointA.startPosition.pageX + pointB.startPosition.pageX) / 2;
			var centerStartY = (pointA.startPosition.pageY + pointB.startPosition.pageY) / 2;
			var distanceStart = dist(pointA.startPosition.pageX, pointA.startPosition.pageY, pointB.startPosition.pageX, pointB.startPosition.pageY);

			var centerEndX = (pointA.currentPosition.pageX + pointB.currentPosition.pageX) / 2;
			var centerEndY = (pointA.currentPosition.pageY + pointB.currentPosition.pageY) / 2;
			var distanceEnd = dist(pointA.currentPosition.pageX, pointA.currentPosition.pageY, pointB.currentPosition.pageX, pointB.currentPosition.pageY);

			var vectorRotation = rotation(
					pointB.startPosition.pageX - pointA.startPosition.pageX,
					pointB.startPosition.pageY - pointA.startPosition.pageY,
					pointB.currentPosition.pageX - pointA.currentPosition.pageX,
					pointB.currentPosition.pageY - pointA.currentPosition.pageY
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
				dragX: touch.currentPosition.pageX - touch.startPosition.pageX,
				dragY: touch.currentPosition.pageY - touch.startPosition.pageY
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
					this.dragSurface.fire("touchdragend", [this.computeDragTransform(oldDragTouch), oldDragTouch, false]);
					this.dragSurface = null;
					this.didStartDragging = false;
					oldDragTouch.startPosition = oldDragTouch.currentPosition;
				} else {
                    this.canTap = false;
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
		},

		onGestureTouchMove: function(touch) {
			if (this.didStartTransform) {
				// Interpret the tranform out of the first two touches.
				this.dragSurface.fire("touchtransform", [this.computeGestureTransform()]);
				return;
			}
			if (!this.didStartDragging && this.touchesStarted == 1) {
				var distanceX = Math.abs(touch.startPosition.pageX - touch.currentPosition.pageX);
				var distanceY = Math.abs(touch.startPosition.pageY - touch.currentPosition.pageY);
                if (distanceX > distanceY)
                    distanceY = 0;
                else
                    distanceX = 0;
				var scrollX = distanceX > this.minDragLength;
				var scrollY = distanceY > this.minDragLength;
				if (scrollX || scrollY) {
                    this.canTap = false;
					this.fire("tapend", [touch]);
					this.clearGestureTimers();
					this.dragSurface = this.findParentTouchSurface(new GestureStart(GestureStart.DRAG, scrollX, scrollY));
					if (this.dragSurface) {
						touch.dragStartTime = touch.currentPosition.time - touch.startPosition.time;
						this.didStartDragging = true;
                        this.dragSurface.draggingTouch = touch;
						this.dragSurface.fire("touchdragstart", [touch]);
					}
				}
			}
			if (this.didStartDragging && touch === this.dragSurface.draggingTouch)
				this.dragSurface.fire("touchdragmove", [this.computeDragTransform(touch), touch]);
		},

        startDraggingFromLongTap: function() {
            var touch = this.touchPoints[0];
            if (!touch)
                return;
            this.canTap = false;
            this.fire("tapend", [touch]);
            this.clearGestureTimers();
            this.dragSurface = this;
            this.didStartDragging = true;
            touch.dragStartTime = touch.currentPosition.time - touch.startPosition.time;
            this.dragSurface.draggingTouch = touch;
            this.dragSurface.fire("touchdragstart", [touch]);
        },

		onLongTapTimer: function() {
			this.clearGestureTimers();
			this.fire("longtaptimer", [this.longTapTouch]);
			if (!this.el.parent().length)
				this.clearTransformCapture();
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
			} else if (this.canTap) {
				this.fire("tapend", [touch]);
				// We only had one touch during this interval. Figure out if it's a tap or
				// a long-tap and fire the event.
				var touchDuration = touch.currentPosition.time - touch.startPosition.time;
				this.fire((touchDuration < this.longTapDuration) ? "tap" : "longtap", [touch]);
			}
            if (!this.touchPoints.length) {
                if (this.didStartDragging)
                    this.dragSurface.fire("touchdragend", [this.computeDragTransform(touch), touch, true]);
                else if (this.didStartTransform)
                    this.dragSurface.fire("touchtransformend", [touch]);
				this.finishGesture(touch);
			}
		},

        finishGesture: function(touch) {
            if (this.dragSurface) {
                this.dragSurface.draggingTouch = null;
                this.dragSurface.fire("gestureend", [touch]);
                this.dragSurface = null;
            }
            this.didStartTransform = false;
            this.didStartDragging = false;
            this.touchesStarted = 0;
            this.canTap = true;
            this.clearTransformCapture();
        },

		onGestureTouchCanceled: function(touch) {
			this.onGestureTouchEnd(touch);
		},

		respondsToTouchGesture: function(gesture) {
			return false;
		},

		findParentTouchSurface: function(gesture) {
            //console.log("looking for ", gesture, gesture.type);
			for (var node = this; node; node = node.parentView()) {
                //console.log("asking node ", node.el.get(0));
				if (node.respondsToTouchGesture && node.respondsToTouchGesture(gesture))
					return node;
            }
			return null;
		}
	});

	Global.GestureView = GestureView;
	Global.GestureStart = GestureStart;

})();
