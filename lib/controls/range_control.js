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
        this.el.addClass("range-control-view");
        this.on("touchdragstart", this.onRangeTouchDragStart.bind(this));
        this.on("touchdragmove", this.onTouchDragMove.bind(this));
    }
    Global.Utils.extend(RangeControl).from(Global.BaseControl);

    $.extend(RangeControl.prototype, {
        init: function() {
            this.min = this.floatParam("min", 0);
            this.max = this.floatParam("max", 100);
            this.step = this.floatParam("step", 0.0001);
            this.ticksBarWidth = this.floatParam("ticks-bar-width", 500);
            this.length = this.max - this.min;
            this.ticks = Math.min(20, this.length / this.step);
            this.tickStep = this.ticksBarWidth / (this.ticks - 1);

            this.ticksBarEl = $("<div />").addClass("range-ticks-bar").css(Global.Utils.prefix({
                "width": this.ticksBarWidth + "px"
            })).appendTo(this.el);
            this.createTicks();

            this.labelViewEl = $("<div />").addClass("range-label-view").appendTo(this.el);
            this.labelEl = $("<div />").addClass("range-label").appendTo(this.labelViewEl);
            this.setValue(this.min);
        },

        updateUI: function() {
            var value = this.getValue();
            var midpoint = this.width() / 2;
            var position = midpoint - ((value - this.min) / this.length * this.ticksBarWidth);
            this.ticksBarEl.css(Global.Utils.prefix({
                "transform": "translate3d(" + position + "px, 0, 0px)"
            }));
            this.labelEl.text(Math.round(value));
        },

        createTicks: function() {
            for (var i = 0; i < this.ticks; ++i) {
                var tick = $("<div />").addClass("range-tick").css(Global.Utils.prefix({
                    "left": (i * this.tickStep) + "px"
                }));
                if (!i)
                    tick.addClass("first-range-tick");
                if ((i + 1) == this.ticks)
                    tick.addClass("last-range-tick");
                this.ticksBarEl.append(tick);
            }
        },

        onRangeTouchDragStart: function() {
            this.initialValue = this.getValue();
        },

        onTouchDragMove: function(transform) {
            var value = this.initialValue - (transform.dragX / this.ticksBarWidth * this.length);
            value = Math.max(this.min, Math.min(this.max, value));
            this.setValue(value);
            this.notifyValueChange();
        },

        respondsToTouchGesture: function(gesture) {
            return gesture.type == Global.GestureStart.DRAG && gesture.scrollX;
        },

        internalRelayout: function() {
            RangeControl.prototype.$super.internalRelayout.call(this);
            this.updateUI();
        }
    });

    Global.Controls.register("range", RangeControl);

})();
