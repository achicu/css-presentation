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

    Touch.Point = Global.Utils.lookupUpperCasePrefix(window, "Point");
    Touch.convertPointFromPageToNode = Global.Utils.lookupPrefix(window, "convertPointFromPageToNode");

    Touch.getPosition = function(touch) {
        var localX = touch.pageX,
            localY = touch.pageY;

        if (Touch.Point) {
            var point = new Touch.Point();
            point.x = touch.pageX;
            point.y = touch.pageY;
            point = Touch.convertPointFromPageToNode.call(window, touch.target, point);
            localX = point.x;
            localY = point.y;
        }

        return {
            clientX: touch.clientX,
            clientY: touch.clientY,
            pageX: touch.pageX,
            pageY: touch.pageY,
            screenX: touch.screenX,
            screenY: touch.screenY,
            localX: localX,
            localY: localY,
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
            onMouseDown: this.onMouseDown.bind(this)
        };
        this.installTouchEvents();
        this.touchPointsSet = {};
        this.touchPoints = [];
    }
    Global.Utils.extend(TouchView).from(Global.View);

    function TouchViewManager() {
        this.touchEvents = {
           onTouchStart: this.onTouchStart.bind(this),
           onTouchMove: this.onTouchMove.bind(this),
           onTouchEnd: this.onTouchEnd.bind(this),
           onTouchCancel: this.onTouchCancel.bind(this),
           onMouseDown: this.onMouseDown.bind(this),
           onMouseMove: this.onMouseMove.bind(this),
           onMouseUp: this.onMouseUp.bind(this)
        };
        this.mouseEvent = null;
        this.touchPointsSet = {};
        this.touchPoints = [];
        this.touchEventsInstalled = false;
        this.mouseEventsInstalled = false;
        this.captureTouchSurface = null;

        this.installTouchTrackingEvents();
        this.installMouseTrackingEvents();
    }
    Global.Utils.extend(TouchViewManager).from(Global.EventDispatcher);

    $.extend(TouchViewManager.prototype, {

        findTouch: function(identifier) {
            return this.touchPointsSet[identifier];
        },

        setTouch: function(touch) {
            this.touchPointsSet[touch.identifier] = touch;
            this.touchPoints.push(touch);
        },

        cancelTouch: function(identifier) {
            var touch = this.findTouch(identifier);
            if (!touch)
                return;
            if (touch.view) {
                touch.view.removeTouch(touch);
                touch.view.fire("touchcanceled", [touch]);
            }
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
            window.addEventListener("touchstart", this.touchEvents.onTouchStart, true);
            window.addEventListener("touchmove", this.touchEvents.onTouchMove, true);
            window.addEventListener("touchend", this.touchEvents.onTouchEnd, true);
            window.addEventListener("touchcancel", this.touchEvents.onTouchCancel, true);
        },

        removeTouchTrackingEvents: function() {
            if (!this.touchEventsInstalled)
                return;
            this.touchEventsInstalled = false;
            window.removeEventListener("touchstart", this.touchEvents.onTouchStart, true);
            window.removeEventListener("touchmove", this.touchEvents.onTouchMove, true);
            window.removeEventListener("touchend", this.touchEvents.onTouchEnd, true);
            window.removeEventListener("touchcancel", this.touchEvents.onTouchCancel, true);
        },

        installMouseTrackingEvents: function() {
            if (this.mouseEventsInstalled)
                return;
            this.mouseEventsInstalled = true;
            window.addEventListener("mousedown", this.touchEvents.onMouseDown, true);
            window.addEventListener("mousemove", this.touchEvents.onMouseMove, true);
            window.addEventListener("mouseup", this.touchEvents.onMouseUp, true);
        },

        removeMouseTrackingEvents: function() {
            if (!this.mouseEventsInstalled)
                return;
            this.mouseEventsInstalled = false;
            window.removeEventListener("mousedown", this.touchEvents.onMouseDown, true);
            window.removeEventListener("mousemove", this.touchEvents.onMouseMove, true);
            window.removeEventListener("mouseup", this.touchEvents.onMouseUp, true);
        },

        onTouchStart: function(event) {
            var touches = event.changedTouches;
            for (var i = 0; i < touches.length; ++i) {
                var touch = touches[i];
                this.cancelTouch(touches[i].identifier);
                var internalTouch = new Touch(touches[i].identifier);
                internalTouch.view = null;
                internalTouch.startPosition = internalTouch.currentPosition = Touch.getPosition(touch);
                internalTouch.state = Touch.START;
                this.setTouch(internalTouch);
            }
            if (this.captureTouchSurface)
                this.captureTouchSurface.onTouchStartInternal(event);
        },

        onTouchMove: function(event) {
            event.preventDefault();
            event.stopImmediatePropagation();

            var touches = event.changedTouches;
            for (var i = 0; i < touches.length; ++i) {
                var touch = touches[i];
                var internalTouch = this.findTouch(touch.identifier);
                if (!internalTouch) {
                    console.log("Unregister touch identifier detected for touchmove event", touch);
                    continue;
                }
                internalTouch.currentPosition = Touch.getPosition(touch);
                internalTouch.state = Touch.MOVE;
                if (internalTouch.view)
                    internalTouch.view.fire("touchmove", [internalTouch]);
            }
        },

        onTouchEnd: function(event) {
            event.preventDefault();
            event.stopImmediatePropagation();

            var touches = event.changedTouches;
            for (var i = 0; i < touches.length; ++i) {
                var touch = touches[i];
                var internalTouch = this.findTouch(touch.identifier);
                if (!internalTouch) {
                    console.log("Unregister touch identifier detected for touchend event", touch);
                    continue;
                }
                internalTouch.currentPosition = Touch.getPosition(touch);
                internalTouch.state = Touch.END;
                this.removeTouch(internalTouch);
                if (internalTouch.view) {
                    internalTouch.view.removeTouch(internalTouch);
                    internalTouch.view.fire("touchend", [internalTouch]);
                }
            }
        },

        onTouchCancel: function(event) {
            event.preventDefault();
            event.stopImmediatePropagation();

            var touches = event.changedTouches;
            for (var i = 0; i < touches.length; ++i) {
                var touch = touches[i];
                var internalTouch = this.findTouch(touch.identifier);
                if (!internalTouch) {
                    console.log("Unregister touch identifier detected for touchcanceled event", touch);
                    continue;
                }
                internalTouch.currentPosition = Touch.getPosition(touch);
                internalTouch.state = Touch.CANCELED;
                this.removeTouch(internalTouch);
                if (internalTouch.view) {
                    internalTouch.view.removeTouch(internalTouch);
                    internalTouch.view.fire("touchcanceled", [internalTouch]);
                }
            }
        },

        onMouseDown: function(event) {
            this.cancelTouch(Touch.MOUSE);
            var internalTouch = new Touch(Touch.MOUSE);
            internalTouch.type = Touch.MOUSE;
            internalTouch.view = null;
            this.mouseEvent = internalTouch;
            this.setTouch(internalTouch);
            internalTouch.startPosition = internalTouch.currentPosition = Touch.getPosition(event);
            internalTouch.state = Touch.START;
            if (this.captureTouchSurface)
                this.captureTouchSurface.onMouseDown(event);
        },

        onMouseMove: function(event) {
            event.preventDefault();
            event.stopImmediatePropagation();
            var internalTouch = this.findTouch(Touch.MOUSE);
            if (!internalTouch) {
                return;
            }
            internalTouch.currentPosition = Touch.getPosition(event);
            internalTouch.state = Touch.MOVE;
            if (internalTouch.view)
                internalTouch.view.fire("touchmove", [internalTouch]);
        },

        onMouseUp: function(event) {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.mouseEvent = null;
            var internalTouch = this.findTouch(Touch.MOUSE);
            if (!internalTouch) {
                return;
            }
            internalTouch.currentPosition = Touch.getPosition(event);
            internalTouch.state = Touch.END;
            this.removeTouch(internalTouch);
            if (internalTouch.view) {
                internalTouch.view.removeTouch(internalTouch);
                internalTouch.view.fire("touchend", [internalTouch]);
            }
        }

    });

    var touchViewManager = TouchView.touchViewManager = new TouchViewManager();

    $.extend(TouchView.prototype, {
        installTouchEvents: function() {
            this.el
                .bind("touchstart", this.touchEvents.onTouchStart)
                .bind("mousedown", this.touchEvents.onMouseDown);
        },

        removeTouchEvents: function() {
            this.el
                .unbind("touchstart", this.touchEvents.onTouchStart)
                .unbind("mousedown", this.touchEvents.onMouseDown);
        },

        removeTouch: function(touch) {
            this.touchPointsSet[touch.identifier] = null;
            var index = this.touchPoints.indexOf(touch);
            if (index != -1)
                this.touchPoints.splice(index, 1);
        },

        setTouch: function(touch) {
            this.touchPointsSet[touch.identifier] = touch;
            this.touchPoints.push(touch);
        },

        onTouchStartInternal: function(event) {
            event.preventDefault();
            event.stopImmediatePropagation();

            var touches = event.changedTouches;
            for (var i = 0; i < touches.length; ++i) {
                var touch = touches[i];
                var internalTouch = touchViewManager.findTouch(touch.identifier);
                if (!internalTouch) {
                    console.log("Current view could not attach to touch event.", touch, this);
                    continue;
                }
                internalTouch.view = this;
                this.setTouch(internalTouch);
                this.fire("touchstart", [internalTouch]);
            }
        },

        onTouchStart: function(event) {
            this.onTouchStartInternal(event.originalEvent);
        },

        onMouseDown: function(event) {
            event.preventDefault();
            event.stopImmediatePropagation();

            var internalTouch = touchViewManager.findTouch(Touch.MOUSE);
            if (!internalTouch) {
                console.log("Current view could not attach to mouse event.", event, this);
                return;
            }
            internalTouch.view = this;
            this.setTouch(internalTouch);
            this.fire("touchstart", [internalTouch]);
        }

    });

    Global.TouchView = TouchView;

})();
