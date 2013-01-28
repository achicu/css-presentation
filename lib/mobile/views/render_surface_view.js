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
        this.transformLayerEl = $("<div />").addClass("transform-layer").appendTo(app.body);
        this.mainEl = $("#main").detach().appendTo(this.transformLayerEl);
        this.leftDock = null;
        this.rightDock = null;
        this.offset = 0;
        // Touch events
        $(this.mainEl).bind("touchstart", this.onTouchStart.bind(this));
        $(this.mainEl).bind("touchend", this.onTouchEnd.bind(this));
        $(this.mainEl).bind("touchcancel", this.onTouchEnd.bind(this));
        $(this.mainEl).bind("touchmove", this.onTouchMove.bind(this));

        // Desktop events
        $(this.mainEl).bind("mousedown", this.onMouseDown.bind(this));
        $(window).bind("mousemove", this.onMouseMove.bind(this));
        $(window).bind("mouseup", this.onMouseUp.bind(this));

        // Div box used to track issues
        // this.mouseTrackerEl = $("<div />").css({
        //     "position": "fixed",
        //     "left": "10px",
        //     "bottom": "10px",
        //     "background": "red",
        //     "color": "white",
        //     "width": "100px",
        //     "height": "50px"
        // }).appendTo(app.body);

        this.trackingTouch = null;
        this.hadTransition = false;
        this.direction = 0;
        this.lastX = 0;
        this.startTime = Date.now();
        this.hadFirstLayout = false;
        $(window).bind("resize", this.onWindowResize.bind(this));
    }

    RenderSurfaceView.prototype = {
        installLeftDock: function(dockPanel) {
            this.leftDock = dockPanel;
            dockPanel.el.addClass("dock-left").appendTo(this.transformLayerEl);
        },

        installRightDock: function(dockPanel) {
            this.rightDock = dockPanel;
            dockPanel.el.addClass("dock-right").appendTo(this.transformLayerEl);
        },

        onTouchStart: function(ev) {
            if (this.trackingTouch) {
                //this.mouseTrackerEl.css("-webkit-transform", "rotate(20deg)");
                return;
            }
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
            //this.mouseTrackerEl.css("-webkit-transform", "rotate(0deg)");
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
            if ((direction < 0 && this.direction > 0) ||
                (direction > 0 && this.direction < 0))
                this.direction = 0;
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

        updateChildren: function() {
            var offset = this.offset, size;
            this.hadFirstLayout = true;
            if (this.leftDock) {
                size = this.leftDock.el.outerWidth();
                this.leftDock.el.css("-webkit-transform", "translate3d(" + (-size) + "px, 0px, 1px)");
            }
            this.mainEl.css("-webkit-transform", "translate3d(0px, 0px, 1px)");
            if (this.rightDock) {
                size = this.mainEl.outerWidth();
                this.rightDock.el.css("-webkit-transform", "translate3d(" + size + "px, 0px, 1px)");
            }
        },

        updateOffset: function() {
            if (!this.hadFirstLayout)
                this.updateChildren();
            this.transformLayerEl.css("-webkit-transform", "translate3d(" + (-this.offset) + "px, 0px, 1px)");
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

        lookupNearest: function(useAcceleration) {
            var points = this.snapPoints();
            var offset = this.offset;
            var minDistance = Number.POSITIVE_INFINITY, minPoint = 0;
            for (var i = 0; i < points.length; ++i) {
                var distance = Math.abs(points[i] - offset);
                if (distance < minDistance) {
                    minDistance = distance;
                    minPoint = i;
                }
            }
            if (useAcceleration && this.trackingTouch && points[minPoint] == this.trackingTouch.offset) {
                minDistance = offset - points[minPoint];
                if (minDistance) {
                    var scrollDirection = minDistance > 0 ? 1 : -1;
                    var touchDirection = (this.direction > 0 ? 1 : -1);
                    if (scrollDirection == touchDirection) {
                        var size = points[points.length - 1] - points[0];
                        if (Math.abs(this.direction / size) > 0.05)
                            minPoint = Math.min(points.length, Math.max(0, minPoint + touchDirection));
                    }
                }
            }
            this.offset = points[minPoint];
        },

        insertTransitions: function(transition) 
        {
            this.transformLayerEl.css("-webkit-transition", transition);
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
                    //this.mouseTrackerEl.css("-webkit-transform", "rotate(45deg)");
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
                    //this.mouseTrackerEl.css("-webkit-transform", "rotate(90deg)");
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
            this.updateChildren();
            this.updateOffset();
        }
    };

    Global.RenderSurfaceView = RenderSurfaceView;

})();