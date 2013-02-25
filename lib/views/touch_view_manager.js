/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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

    function TouchViewManager() {
        this.touchEvents = {
            onPointerDown: this.onPointerDown.bind(this),
            onPointerMove: this.onPointerMove.bind(this),
            onPointerUp: this.onPointerUp.bind(this),
            onPointerCancel: this.onPointerCancel.bind(this),

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
        this.pointerEventsInstalled = false;
        this.touchEventsInstalled = false;
        this.mouseEventsInstalled = false;
        this.captureTouchSurface = null;

        this.installPointerTrackingEvents();
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
            touch.state = Global.Touch.CANCELED;
            touch.updatePreviewBox();
        },

        removeTouch: function(touch) {
            this.touchPointsSet[touch.identifier] = null;
            var index = this.touchPoints.indexOf(touch);
            if (index != -1)
                this.touchPoints.splice(index, 1);
        },

        installPointerTrackingEvents: function() {
            if (this.pointerEventsInstalled)
                return;
            this.pointerEventsInstalled = true;
            window.addEventListener("MSPointerDown", this.touchEvents.onPointerDown, true);
            window.addEventListener("MSPointerMove", this.touchEvents.onPointerMove, true);
            window.addEventListener("MSPointerUp", this.touchEvents.onPointerUp, true);
            window.addEventListener("MSPointerCancel", this.touchEvents.onPointerCancel, true);
        },

        removePointerTrackingEvents: function() {
            if (!this.pointerEventsInstalled)
                return;
            this.pointerEventsInstalled = false;
            window.removeEventListener("MSPointerDown", this.touchEvents.onPointerDown, true);
            window.removeEventListener("MSPointerMove", this.touchEvents.onPointerMove, true);
            window.removeEventListener("MSPointerUp", this.touchEvents.onPointerUp, true);
            window.removeEventListener("MSPointerCancel", this.touchEvents.onPointerCancel, true);
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

        needsNativeTouch: function(event) {
            return (!this.captureTouchSurface && $(event.target).attr("data-native-touch") !== undefined);
        },

        removeFocus: function() {
            if (document.activeElement)
                $(document.activeElement).blur();
        },

        onPointerDown: function(event) {
            if (this.needsNativeTouch(event))
                return;
            this.removeFocus();
            
            if (this.findTouch(event.pointerId)) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
            var internalTouch = new Global.Touch(event.pointerId);
            internalTouch.view = null;
            internalTouch.state = Global.Touch.START;
            internalTouch.startPosition = internalTouch.currentPosition = Global.Touch.getPointerPosition(event);
            internalTouch.updatePreviewBox();
            this.setTouch(internalTouch);
        
            if (this.captureTouchSurface)
                this.captureTouchSurface.onPointerDownInternal(event);
        },

        onPointerMove: function(event) {
            var internalTouch = this.findTouch(event.pointerId);
            if (!internalTouch) {
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            internalTouch.state = Global.Touch.MOVE;
            internalTouch.update(Global.Touch.getPointerPosition(event));
            if (internalTouch.view)
                internalTouch.view.fire("touchmove", [internalTouch]);
        },

        onPointerUp: function(event) {
            var internalTouch = this.findTouch(event.pointerId);
            if (!internalTouch) {
                console.log("Unregister touch identifier detected for pointerup event", event);
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            internalTouch.state = Global.Touch.END;
            internalTouch.update(Global.Touch.getPointerPosition(event));
            this.removeTouch(internalTouch);
            if (internalTouch.view) {
                internalTouch.view.removeTouch(internalTouch);
                internalTouch.view.fire("touchend", [internalTouch]);
            }
        },

        onPointerCancel: function(event) {
            var internalTouch = this.findTouch(event.pointerId);
            if (!internalTouch) {
                console.log("Unregister touch identifier detected for pointercancel event", event);
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            internalTouch.state = Global.Touch.CANCELED;
            internalTouch.update(Global.Touch.getPointerPosition(event));
            this.removeTouch(internalTouch);
            if (internalTouch.view) {
                internalTouch.view.removeTouch(internalTouch);
                internalTouch.view.fire("touchcanceled", [internalTouch]);
            }
        },

        onTouchStart: function(event) {
            if (this.needsNativeTouch(event))
                return;
            this.removeFocus();
            var touches = event.changedTouches;
            for (var i = 0; i < touches.length; ++i) {
                var touch = touches[i];
                if (this.findTouch(touches[i].identifier)) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    continue;
                }
                var internalTouch = new Global.Touch(touches[i].identifier);
                internalTouch.view = null;
                internalTouch.state = Global.Touch.START;
                internalTouch.startPosition = internalTouch.currentPosition = Global.Touch.getPosition(touch);
                internalTouch.updatePreviewBox();
                this.setTouch(internalTouch);
            }
            if (this.captureTouchSurface)
                this.captureTouchSurface.onTouchStartInternal(event);
        },

        onTouchMove: function(event) {
            var touches = event.changedTouches;
            for (var i = 0; i < touches.length; ++i) {
                var touch = touches[i];
                var internalTouch = this.findTouch(touch.identifier);
                if (!internalTouch) {
                    console.log("Unregister touch identifier detected for touchmove event", touch);
                    continue;
                }
                event.preventDefault();
                event.stopImmediatePropagation();
                internalTouch.state = Global.Touch.MOVE;
                internalTouch.update(Global.Touch.getPosition(touch));
                if (internalTouch.view)
                    internalTouch.view.fire("touchmove", [internalTouch]);
            }
        },

        onTouchEnd: function(event) {
            var touches = event.changedTouches;
            for (var i = 0; i < touches.length; ++i) {
                var touch = touches[i];
                var internalTouch = this.findTouch(touch.identifier);
                if (!internalTouch) {
                    console.log("Unregister touch identifier detected for touchend event", touch);
                    continue;
                }
                event.preventDefault();
                event.stopImmediatePropagation();
                internalTouch.state = Global.Touch.END;
                internalTouch.update(Global.Touch.getPosition(touch));
                this.removeTouch(internalTouch);
                if (internalTouch.view) {
                    internalTouch.view.removeTouch(internalTouch);
                    internalTouch.view.fire("touchend", [internalTouch]);
                }
            }
        },

        onTouchCancel: function(event) {
            var touches = event.changedTouches;
            for (var i = 0; i < touches.length; ++i) {
                var touch = touches[i];
                var internalTouch = this.findTouch(touch.identifier);
                if (!internalTouch) {
                    console.log("Unregister touch identifier detected for touchcanceled event", touch);
                    continue;
                }
                event.preventDefault();
                event.stopImmediatePropagation();
                internalTouch.state = Global.Touch.CANCELED;
                internalTouch.update(Global.Touch.getPosition(touch));
                this.removeTouch(internalTouch);
                if (internalTouch.view) {
                    internalTouch.view.removeTouch(internalTouch);
                    internalTouch.view.fire("touchcanceled", [internalTouch]);
                }
            }
        },

        onMouseDown: function(event) {
            if (event.button)
                return;
            if (this.touchPoints.length) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
            if (this.needsNativeTouch(event))
                return;
            this.removeFocus();
            this.cancelTouch(Global.Touch.MOUSE);
            var internalTouch = new Global.Touch(Global.Touch.MOUSE);
            internalTouch.type = Global.Touch.MOUSE;
            internalTouch.view = null;
            this.mouseEvent = internalTouch;
            this.setTouch(internalTouch);
            internalTouch.startPosition = internalTouch.currentPosition = Global.Touch.getPosition(event);
            internalTouch.state = Global.Touch.START;
            internalTouch.updatePreviewBox();
            if (this.captureTouchSurface)
                this.captureTouchSurface.onMouseDown(event);
        },

        onMouseMove: function(event) {
            var internalTouch = this.findTouch(Global.Touch.MOUSE);
            if (!internalTouch) {
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            internalTouch.state = Global.Touch.MOVE;
            internalTouch.update(Global.Touch.getPosition(event));
            if (internalTouch.view)
                internalTouch.view.fire("touchmove", [internalTouch]);
        },

        onMouseUp: function(event) {
            this.mouseEvent = null;
            var internalTouch = this.findTouch(Global.Touch.MOUSE);
            if (!internalTouch) {
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            internalTouch.state = Global.Touch.END;
            internalTouch.update(Global.Touch.getPosition(event));
            this.removeTouch(internalTouch);
            if (internalTouch.view) {
                internalTouch.view.removeTouch(internalTouch);
                internalTouch.view.fire("touchend", [internalTouch]);
            }
        }

    });

    TouchViewManager.instance = new TouchViewManager();
    Global.TouchViewManager = TouchViewManager;

})();
