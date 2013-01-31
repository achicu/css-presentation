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

	/*
	Gesture types detected:
	1. Tap
	2. Long-tap
	3. Drag - Swipe
	4. Scale - Pinch-zoom
	5. Rotate
	*/
	function GestureView() {
		GestureView.$super.call(this);
		this.on("touchstart", this.onGestureTouchStart.bind(this));
		this.on("touchmove", this.onGestureTouchMove.bind(this));
		this.on("touchend", this.onGestureTouchEnd.bind(this));
		this.on("touchcanceled", this.onGestureTouchCanceled.bind(this));
		this.touchesStarted = 0;
		this.didStartDragging = false;
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
		onGestureTouchStart: function(touch) {
			this.touchesStarted = (this.touchPoints.length == 1) ? 1 : (this.touchesStarted + 1);
			if (this.touchesStarted == 1)
				this.installGestureTimers(touch);
			else
				this.clearGestureTimers();
		},
		onGestureTouchMove: function(touch) {
			var distanceX = touch.startPosition.screenX - touch.currentPosition.screenX;
			var distanceY = touch.startPosition.screenY - touch.currentPosition.screenY;
			if (!this.didStartDragging) { 
				if (Math.abs(distanceX) > this.minDragLength || Math.abs(distanceY) > this.minDragLength) {
					this.clearGestureTimers();
					touch.dragStartTime = touch.currentPosition.time - touch.startPosition.time;
					this.didStartDragging = true;
				}
			}
			if (this.didStartDragging)
				this.fire("touchdragmove", touch);
		},
		onLongTapTimer: function() {
			this.fire("longtaptimer", this.longTapTouch);
			this.clearGestureTimers();
		},
		onGestureTouchEnd: function(touch) {
			this.clearGestureTimers();
			if (this.touchesStarted == 1 && !this.didStartDragging) {
				// We only had one touch during this interval. Figure out if it's a tap or
				// a long-tap and fire the event.
				var touchDuration = touch.currentPosition.time - touch.startPosition.time;
				this.fire((touchDuration < this.longTapDuration) ? "tap" : "longtap", touch);
				return;
			}
			if (!this.touchPoints.length) {
				if (this.didStartDragging)
					this.fire("touchdragend", touch);
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