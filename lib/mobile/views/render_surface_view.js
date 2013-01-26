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
        $(this.mainEl).bind("touchstart", this.onTouchStart.bind(this));
        $(this.mainEl).bind("touchend", this.onTouchEnd.bind(this));
        $(this.mainEl).bind("touchmove", this.onTouchMove.bind(this));
        this.trackingTouch = null;
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
                this.offset = Math.min(this.rightDock.el.outerWidth() - this.mainEl.outerWidth(), this.offset);
            else
                this.offset = Math.min(0, this.offset);
        },

        onTrackingTouchMoved: function(touch)
        {
            this.trackOffsetInTouchEvent(touch);
            this.updateOffset();
        },

        updateOffset: function() {
            var offset = this.offset;
            if (this.leftDock)
                this.leftDock.el.css("-webkit-transform", "translateX(-100%) translateX(" + (-offset) + "px)");
            this.mainEl.css("-webkit-transform", "translateX(" + (-offset) + "px)");
            if (this.rightDock)
                this.rightDock.el.css("-webkit-transform", "translateX(100%) translateX(" + (-offset) + "px)");
        },

        lookupNearest: function() {
            var offset = this.offset, points = [];
            if (this.leftDock)
                points.push(-this.leftDock.el.outerWidth());
            points.push(0);
            if (this.rightDock)
                points.push(this.rightDock.el.outerWidth() - this.mainEl.outerWidth());
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

        endTrackingTouch: function(touch) {
            this.trackOffsetInTouchEvent(touch);
            this.trackingTouch = null;
            this.lookupNearest();
            this.updateOffset();
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
        }
    };

    Global.RenderSurfaceView = RenderSurfaceView;

})();