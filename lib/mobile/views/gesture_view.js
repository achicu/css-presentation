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
		computeGestureTransform: function() {
			var pointA = this.touchPoints[0];
			var pointB = this.touchPoints[1];
			
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

			return {
				scale: (distanceStart > 0) ? (distanceEnd / distanceStart) : 0,
				dragX: centerEndX - centerStartX,
				dragY: centerEndY - centerStartY,
				rotation: vectorRotation
			};
		},
		onGestureTouchStart: function(touch) {
			this.touchesStarted = (this.touchPoints.length == 1) ? 1 : (this.touchesStarted + 1);
			if (this.touchesStarted == 1)
				this.installGestureTimers(touch);
			else if (!this.didStartTransform) {
				// Two finger gesture.
				if (this.didStartDragging) {
					var oldDragTouch = this.touchPoints[0];
					this.fire("touchdragend", [oldDragTouch]);
					this.didStartDragging = false;
					oldDragTouch.startPosition = oldDragTouch.currentPosition;
				}
				this.didStartTransform = true;
				this.clearGestureTimers();
				this.fire("touchtransformstart", [touch]);
			}
		},
		onGestureTouchMove: function(touch) {
			if (this.didStartTransform) {
				// Interpret the tranform out of the first two touches.
				this.fire("touchtransform", [this.computeGestureTransform()]);
				return;
			}
			if (!this.didStartDragging) { 
				var distanceX = touch.startPosition.screenX - touch.currentPosition.screenX;
				var distanceY = touch.startPosition.screenY - touch.currentPosition.screenY;
				if (Math.abs(distanceX) > this.minDragLength || Math.abs(distanceY) > this.minDragLength) {
					this.clearGestureTimers();
					touch.dragStartTime = touch.currentPosition.time - touch.startPosition.time;
					this.didStartDragging = true;
					this.fire("touchdragstart", [touch]);
				}
			}
			if (this.didStartDragging) {
				var transform = {
					dragX: touch.currentPosition.screenX - touch.startPosition.screenX,
					dragY: touch.currentPosition.screenY - touch.startPosition.screenY
				};
				this.fire("touchdragmove", [transform, touch]);
			}
		},
		onLongTapTimer: function() {
			this.fire("longtaptimer", [this.longTapTouch]);
			this.clearGestureTimers();
		},
		onGestureTouchEnd: function(touch) {
			this.clearGestureTimers();
			if (this.didStartTransform) {
				if (this.touchPoints.length == 1) {
					this.fire("touchtransformend", [touch]);
					// One touch remaining, go back to dragging.
					this.didStartTransform = false;
					this.didStartDragging = true;
					var newDragTouch = this.touchPoints[0];
					// We've been moving this touch before, so start from scratch for the drag transform.
					newDragTouch.startPosition = newDragTouch.currentPosition;
					this.fire("touchdragstart", [newDragTouch]);
				}
			} else if (this.touchesStarted == 1 && !this.didStartDragging) {
				// We only had one touch during this interval. Figure out if it's a tap or
				// a long-tap and fire the event.
				var touchDuration = touch.currentPosition.time - touch.startPosition.time;
				this.fire((touchDuration < this.longTapDuration) ? "tap" : "longtap", [touch]);
			}
			if (!this.touchPoints.length) {
				if (this.didStartDragging)
					this.fire("touchdragend", [touch]);
				else if (this.didStartTransform)
					this.fire("touchtransformend", [touch]);
				this.didStartTransform = false;
				this.didStartDragging = false;
				this.touchesStarted = 0;
			}
		},
		onGestureTouchCanceled: function(touch) {
			this.onGestureTouchEnd(touch);
		}
	});

	Global.GestureView = GestureView;

})();