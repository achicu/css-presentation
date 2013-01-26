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
    
    function RenderSurfaceView(app) {
        this.app = app;
        this.mainEl = $("#main").detach().appendTo(app.body);
        this.leftDock = null;
        this.rightDock = null;
        this.offset = 0;
        // Touch events
        $(this.mainEl).bind("touchstart", this.onTouchStart.bind(this));
        $(this.mainEl).bind("touchend", this.onTouchEnd.bind(this));
        $(this.mainEl).bind("touchmove", this.onTouchMove.bind(this));

        // Desktop events
        $(this.mainEl).bind("mousedown", this.onMouseDown.bind(this));
        $(window).bind("mousemove", this.onMouseMove.bind(this));
        $(window).bind("mouseup", this.onMouseUp.bind(this));

        this.trackingTouch = null;
        this.hadTransition = false;
        this.direction = 0;
        this.lastX = 0;
        this.startTime = Date.now();
        $(window).bind("resize", this.onWindowResize.bind(this));
    }

    RenderSurfaceView.prototype = {
        installLeftDock: function(dockPanel) {
            this.leftDock = dockPanel;
            dockPanel.el.addClass("dock-left").appendTo(this.app.body);
        },

        installRightDock: function(dockPanel) {
            this.rightDock = dockPanel;
            dockPanel.el.addClass("dock-right").appendTo(this.app.body);
        },

        onTouchStart: function(ev) {
            if (this.trackingTouch)
                return;
            var touch = ev.originalEvent.changedTouches[0];
            this.trackingTouch = {
                id: touch.identifier,
                x: touch.screenX,
                y: touch.screenY,
                offset: this.offset
            };
            this.startTime = Date.now();
            this.lastX = this.trackingTouch.x;
            this.direction = 0;
            ev.preventDefault();
        },

        trackOffsetInTouchEvent: function(touch)
        {
            var x = touch.screenX;
            var delta = x - this.trackingTouch.x;
            this.offset = this.trackingTouch.offset - delta;
            if (this.leftDock)
                this.offset = Math.max(-this.leftDock.el.outerWidth(), this.offset);
            if (this.rightDock)
                this.offset = Math.min(this.rightDock.el.outerWidth(), this.offset);
            else
                this.offset = Math.min(0, this.offset);
            var direction = this.lastX - x;
            this.direction += direction;
            this.lastX = x;
        },

        onTrackingTouchMoved: function(touch)
        {
            if (this.hadTransition) {
                this.insertTransitions("none");
                this.hadTransition = false;
            }
            this.trackOffsetInTouchEvent(touch);
            this.updateOffset();
        },

        updateOffset: function() {
            var offset = this.offset, size;
            if (this.leftDock) {
                size = this.leftDock.el.outerWidth();
                this.leftDock.el.css("-webkit-transform", "translate3d(" + (-size - offset) + "px, 0, 1px)");
            }
            this.mainEl.css("-webkit-transform", "translate3d(" + (-offset) + "px, 0, 1px)");
            if (this.rightDock) {
                size = this.mainEl.outerWidth();
                this.rightDock.el.css("-webkit-transform", "translate3d(" + (size - offset) + "px, 0, 1px)");
            }
        },

        snapPoints: function()
        {
            var points = [];
            if (this.leftDock)
                points.push(-this.leftDock.el.outerWidth());
            points.push(0);
            if (this.rightDock)
                points.push(this.rightDock.el.outerWidth());
            return points;
        },

        throwDistance: function() {
            return this.direction / (Date.now() - this.startTime) * 50;
        },

        lookupNearest: function(useAcceleration) {
            var points = this.snapPoints();
            var offset = this.offset + (useAcceleration ? this.throwDistance() : 0);
            var minDistance = Number.POSITIVE_INFINITY, minPoint = 0;
            for (var i = 0; i < points.length; ++i) {
                var distance = Math.abs(points[i] - offset);
                if (distance < minDistance) {
                    minDistance = distance;
                    minPoint = points[i];
                }
            }
            this.offset = minPoint;
        },

        insertTransitions: function(transition) 
        {
            if (this.leftDock)
                this.leftDock.el.css("-webkit-transition", transition);
            if (this.rightDock)
                this.rightDock.el.css("-webkit-transition", transition);
            this.mainEl.css("-webkit-transition", transition);
        },

        endTrackingTouch: function(touch) {
            this.trackOffsetInTouchEvent(touch);
            this.lookupNearest(true);
            if (!this.hadTransition)
                this.insertTransitions("-webkit-transform 0.2s linear");
            this.hadTransition = true;
            this.updateOffset();
            this.trackingTouch = null;
        },

        onTouchMove: function(ev) {
            if (!this.trackingTouch)
                return;
            var changedTouches = ev.originalEvent.changedTouches;
            for (var i = 0; i < changedTouches.length; ++i) {
                 if (this.trackingTouch.id == changedTouches[i].identifier) {
                    ev.preventDefault();
                    this.onTrackingTouchMoved(changedTouches[i]);
                    break;
                 }
            }
        },

        onTouchEnd: function(ev) {
            if (!this.trackingTouch)
                return;
            var changedTouches = ev.originalEvent.changedTouches;
            for (var i = 0; i < changedTouches.length; ++i) {
                 if (this.trackingTouch.id == changedTouches[i].identifier) {
                    ev.preventDefault();
                    this.endTrackingTouch(changedTouches[i]);
                    break;
                }
            }
        },

        onMouseDown: function(ev) {
            if (this.trackingTouch)
                return;
            var touch = ev.originalEvent;
            this.trackingTouch = {
                id: "mouse",
                x: touch.screenX,
                y: touch.screenY,
                offset: this.offset
            };
            this.startTime = Date.now();
            this.lastX = this.trackingTouch.x;
            this.direction = 0;
            ev.preventDefault();
        },

        onMouseMove: function(ev) {
            if (!this.trackingTouch)
                return;
            if (this.trackingTouch.id == "mouse") {
                ev.preventDefault();
                this.onTrackingTouchMoved(ev);
            }
        },

        onMouseUp: function(ev) {
            if (!this.trackingTouch)
                return;
            if (this.trackingTouch.id == "mouse") {
                ev.preventDefault();
                this.endTrackingTouch(ev);
            }
        },

        onWindowResize: function() {
            if (this.hadTransition) {
                this.insertTransitions("none");
                this.hadTransition = false;
            }
            this.lookupNearest(false);
            this.updateOffset();
        }
    };

    Global.RenderSurfaceView = RenderSurfaceView;

})();