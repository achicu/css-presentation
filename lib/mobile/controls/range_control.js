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

    function RangeControl() {
        RangeControl.$super.call(this);
        this.ticksBarWidth = 500;
        this.on("touchdragstart", this.onImageViewTouchDragStart.bind(this));
        this.on("touchdragmove", this.onTouchDragMove.bind(this));
    }
    Global.Utils.extend(RangeControl).from(Global.BaseControl);

    $.extend(RangeControl.prototype, {
        init: function() {
            this.min = this.filterParam.min;
            this.max = this.filterParam.max;
            this.step = this.filterParam.step;
            this.length = this.max - this.min;
            this.ticks = Math.min(20, this.length / this.step);
            this.tickStep = this.ticksBarWidth / (this.ticks - 1);

            this.ticksBarEl = $("<div />").css({
                    "width": this.ticksBarWidth + "px",
                    "height": "40px",
                    "position": "absolute",
                    "left": 0,
                    "bottom": 0,
                    "-webkit-transform": "translateZ(1px)"
                }).appendTo(this.el);
            this.createTicks();
        },

        updateUI: function() {
            var value = this.getValue();
            var midpoint = this.width() / 2;
            var position = midpoint - (value / this.length * this.ticksBarWidth);
            this.ticksBarEl.css("-webkit-transform", "translate3d(" + position + "px, 0, 1px)");
        },

        createTicks: function() {
            for (var i = 0; i < this.ticks; ++i) {
                var tick = $("<div />").addClass("range-view-tick").css({
                    "position": "absolute",
                    "left": (i * this.tickStep) + "px",
                    "top": "0px",
                    "width": "1px",
                    "height": "100%",
                    "background": "white"
                });
                this.ticksBarEl.append(tick);
            }
        },

        onImageViewTouchDragStart: function() {
            this.initialValue = this.getValue();
        },

        onTouchDragMove: function(transform) {
            var value = this.initialValue - (transform.dragX / this.ticksBarWidth * this.length);
            value = Math.max(this.min, Math.min(this.max, value));
            this.setValue(value);
            this.notifyValueChange();
        },

        respondsToTouchGesture: function(gesture) {
            return gesture.type == Global.GestureStart.DRAG;
        }
    });
    
    Global.Controls.register("range", RangeControl);

})();