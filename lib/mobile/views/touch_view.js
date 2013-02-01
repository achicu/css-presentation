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

	function Touch(identifier) {
		this.identifier = identifier;
		this.startPosition = null;
		this.currentPosition = null;
		this.state = null;
		this.type = Touch.TOUCH;
	}

	Touch.getPosition = function(touch) {
		return {
			clientX: touch.clientX,
			clientY: touch.clientY,
			pageX: touch.pageX,
			pageY: touch.pageY,
			screenX: touch.screenX,
			screenY: touch.screenY,
			time: Date.now()
		};
	};

	Touch.START = "start";
	Touch.MOVE = "move";
	Touch.END = "end";
	Touch.CANCELED = "canceled";

	Touch.TOUCH = "touch";
	Touch.MOUSE = "mouse";
	
	function TouchView(name) {
		TouchView.$super.call(this);
		this.touchEvents = {
			onTouchStart: this.onTouchStart.bind(this),
			onTouchMove: this.onTouchMove.bind(this),
			onTouchEnd: this.onTouchEnd.bind(this),
			onMouseDown: this.onMouseDown.bind(this),
			onMouseMove: this.onMouseMove.bind(this),
			onMouseUp: this.onMouseUp.bind(this)
		};
		this.el = $("<div />")
			.bind("touchstart", this.touchEvents.onTouchStart)
			.bind("mousedown", this.touchEvents.onMouseDown);
		this.touchPointsSet = {};
		this.touchPoints = [];
		this.mouseEvent = null;
		this.touchEventsInstalled = false;
		this.mouseEventsInstalled = false;
	}
	Global.Utils.extend(TouchView).from(Global.EventDispatcher);

	TouchView.captureTouchSurface = null;
	
	$.extend(TouchView.prototype, {
		findTouch: function(identifier) {
			var touch = this.touchPointsSet[identifier];
			return touch;
		},

		setTouch: function(touch) {
			this.touchPointsSet[touch.identifier] = touch;
			this.touchPoints.push(touch);
		},

		cancelTouch: function(identifier) {
			var touch = this.findTouch(identifier);
			if (!touch)
				return;
			this.fire("touchcancel", touch);
			this.removeTouch(touch);
		},

		removeTouch: function(touch) {
			this.touchPointsSet[touch.identifier] = null;
			var index = this.touchPoints.indexOf(touch);
			if (index != -1)
				this.touchPoints.splice(index, 1);
		},

		installTouchTrackingEvents: function() {
			if (this.touchEventsInstalled)
				return;
			this.touchEventsInstalled = true;
			$(window)
				.bind("touchstart", this.touchEvents.onTouchStart)
				.bind("touchmove", this.touchEvents.onTouchMove)
				.bind("touchend", this.touchEvents.onTouchEnd);
		},

		removeTouchTrackingEvents: function() {
			if (!this.touchEventsInstalled)
				return;
			this.touchEventsInstalled = false;
			$(window)
				.unbind("touchstart", this.touchEvents.onTouchStart)
				.unbind("touchmove", this.touchEvents.onTouchMove)
				.unbind("touchend", this.touchEvents.onTouchEnd);
		},

		installMouseTrackingEvents: function() {
			if (this.mouseEventsInstalled)
				return;
			this.mouseEventsInstalled = true;
			$(window)
				.bind("mousedown", this.touchEvents.onMouseDown)
				.bind("mousemove", this.touchEvents.onMouseMove)
				.bind("mouseup", this.touchEvents.onMouseUp);
		},

		removeMouseTrackingEvents: function() {
			if (!this.mouseEventsInstalled)
				return;
			this.mouseEventsInstalled = false;
			$(window)
				.unbind("mousedown", this.touchEvents.onMouseDown)
				.unbind("mousemove", this.touchEvents.onMouseMove)
				.unbind("mouseup", this.touchEvents.onMouseUp);
		},

		onTouchStart: function(event) {
			event.preventDefault();
			event.stopImmediatePropagation();
			if (TouchView.captureTouchSurface && (TouchView.captureTouchSurface !== this)) {
				TouchView.captureTouchSurface.onTouchStart(event);
				return;
			}
			var touches = event.originalEvent.changedTouches;
			var list = [];
			for (var i = 0; i < touches.length; ++i) {
				var touch = touches[i];
				this.cancelTouch(touches[i].identifier);
				var internalTouch = new Touch(touches[i].identifier);
				internalTouch.startPosition = internalTouch.currentPosition = Touch.getPosition(touch);
				internalTouch.state = Touch.START;
				this.setTouch(internalTouch);
				this.fire("touchstart", [internalTouch]);
				list.push(internalTouch);
			}
			this.fire("touchstartlist", [list]);
			if (this.touchPoints.length)
				this.installTouchTrackingEvents();
		},

		onTouchMove: function(event) {
			event.preventDefault();
			if (TouchView.captureTouchSurface && (TouchView.captureTouchSurface !== this)) {
				TouchView.captureTouchSurface.onTouchMove(event);
				return;
			}
			var touches = event.originalEvent.changedTouches;
			var list = [];
			for (var i = 0; i < touches.length; ++i) {
				var touch = touches[i];
				var internalTouch = this.findTouch(touch.identifier);
				if (!internalTouch) {
					continue;
				}
				internalTouch.currentPosition = Touch.getPosition(touch);
				internalTouch.state = Touch.MOVE;
				this.fire("touchmove", [internalTouch]);
				list.push(internalTouch);
			}
			this.fire("touchmovelist", [list]);
		},

		onTouchEnd: function(event) {
			event.preventDefault();
			if (TouchView.captureTouchSurface && (TouchView.captureTouchSurface !== this)) {
				TouchView.captureTouchSurface.onTouchEnd(event);
				return;
			}
			var touches = event.originalEvent.changedTouches;
			var list = [];
			for (var i = 0; i < touches.length; ++i) {
				var touch = touches[i];
				var internalTouch = this.findTouch(touch.identifier);
				if (!internalTouch) {
					continue;
				}
				internalTouch.currentPosition = Touch.getPosition(touch);
				internalTouch.state = Touch.END;
				this.removeTouch(internalTouch);
				this.fire("touchend", [internalTouch]);
				list.push(internalTouch);
			}
			this.fire("touchendlist", [list]);
			if (!this.touchPoints.length)
				this.removeTouchTrackingEvents();
		},

		onTouchCancel: function(event) {
			event.preventDefault();
			if (TouchView.captureTouchSurface && (TouchView.captureTouchSurface !== this)) {
				TouchView.captureTouchSurface.onTouchEnd(event);
				return;
			}
			var touches = event.originalEvent.changedTouches;
			var list = [];
			for (var i = 0; i < touches.length; ++i) {
				var touch = touches[i];
				var internalTouch = this.findTouch(touch.identifier);
				if (!internalTouch) {
					continue;
				}
				internalTouch.currentPosition = Touch.getPosition(touch);
				internalTouch.state = Touch.CANCELED;
				this.removeTouch(internalTouch);
				this.fire("touchcanceled", [internalTouch]);
				list.push(internalTouch);
			}
			this.fire("touchcanceledlist", [list]);
			if (!this.touchPoints.length)
				this.removeTouchTrackingEvents();
		},

		onMouseDown: function(event) {
			event.preventDefault();
			event.stopImmediatePropagation();
			this.cancelTouch(Touch.MOUSE);
			var internalTouch = new Touch(Touch.MOUSE);
			internalTouch.type = Touch.MOUSE;
			this.mouseEvent = internalTouch;
			this.setTouch(internalTouch);
			internalTouch.startPosition = internalTouch.currentPosition = Touch.getPosition(event.originalEvent);
			internalTouch.state = Touch.START;
			this.fire("touchstart", [internalTouch]);
			this.fire("touchstartlist", [[internalTouch]]);
			this.installMouseTrackingEvents();
		},

		onMouseMove: function(event) {
			event.preventDefault();
			var internalTouch = this.findTouch(Touch.MOUSE);
			if (!internalTouch) {
				return;
			}
			internalTouch.currentPosition = Touch.getPosition(event.originalEvent);
			internalTouch.state = Touch.MOVE;
			this.fire("touchmove", [internalTouch]);
			this.fire("touchmovelist", [[internalTouch]]);
		},

		onMouseUp: function(event) {
			event.preventDefault();
			this.mouseEvent = null;
			var internalTouch = this.findTouch(Touch.MOUSE);
			if (!internalTouch) {
				return;
			}
			internalTouch.currentPosition = Touch.getPosition(event.originalEvent);
			internalTouch.state = Touch.END;
			this.removeTouch(internalTouch);
			this.fire("touchend", [internalTouch]);
			this.fire("touchendlist", [[internalTouch]]);
			this.removeMouseTrackingEvents();
		}

	});

	Global.TouchView = TouchView;

})();