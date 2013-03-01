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

    function TouchView(name) {
        TouchView.$super.call(this);
        this.el.addClass("touch-view");
        this.touchEvents = {
            onPointerDown: this.onPointerDown.bind(this),
            onTouchStart: this.onTouchStart.bind(this),
            onMouseDown: this.onMouseDown.bind(this),
            onClick: this.onClick.bind(this)
        };
        this.installTouchEvents();
        this.touchPointsSet = {};
        this.touchPoints = [];
    }
    Global.Utils.extend(TouchView).from(Global.View);

    $.extend(TouchView.prototype, {
        installTouchEvents: function() {
            this.el
                .bind("MSPointerDown", this.touchEvents.onPointerDown)
                .bind("touchstart", this.touchEvents.onTouchStart)
                .bind("mousedown", this.touchEvents.onMouseDown)
                .bind("click", this.touchEvents.onClick);
        },

        removeTouchEvents: function() {
            this.el
                .unbind("MSPointerDown", this.touchEvents.onPointerDown)
                .unbind("touchstart", this.touchEvents.onTouchStart)
                .unbind("mousedown", this.touchEvents.onMouseDown)
                .unbind("click", this.touchEvents.onClick);
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

        onPointerDownInternal: function(event) {
            event.preventDefault();
            event.stopImmediatePropagation();
            var internalTouch = Global.TouchViewManager.instance.findTouch(event.pointerId);
            if (!internalTouch) {
                console.log("Current view could not attach to pointer event.", event, this);
                return;
            }
            internalTouch.view = this;
            this.setTouch(internalTouch);
            this.fire("touchstart", [internalTouch]);
        },

        onPointerDown: function(event) {
            if ($(event.target).attr("data-native-touch") !== undefined)
                return;
            this.onPointerDownInternal(event.originalEvent);
        },

        onTouchStartInternal: function(event) {
            event.preventDefault();
            event.stopImmediatePropagation();

            var touches = event.changedTouches;
            for (var i = 0; i < touches.length; ++i) {
                var touch = touches[i];
                var internalTouch = Global.TouchViewManager.instance.findTouch(touch.identifier);
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
            if ($(event.target).attr("data-native-touch") !== undefined)
                return;
            this.onTouchStartInternal(event.originalEvent);
        },

        onMouseDown: function(event) {
            if ($(event.target).attr("data-native-touch") !== undefined)
                return;
            event.preventDefault();
            event.stopImmediatePropagation();

            var internalTouch = Global.TouchViewManager.instance.findTouch(Global.Touch.MOUSE);
            if (!internalTouch) {
                console.log("Current view could not attach to mouse event.", event, this);
                return;
            }
            internalTouch.view = this;
            this.setTouch(internalTouch);
            this.fire("touchstart", [internalTouch]);
        },

        onClick: function(event) {
            if ($(event.target).attr("data-native-touch") !== undefined)
                return;
            event.preventDefault();
            event.stopImmediatePropagation();
        }

    });

    Global.TouchView = TouchView;

})();
