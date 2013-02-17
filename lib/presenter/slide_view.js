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

    function State(slideView, number) {
        this.slideView = slideView;
        this.number = number;
        this.elements = $([]);
        this.time = 0;
        this.advance = "none";
        this.started = false;
        this.advanceTimer = null;
        this.isReset = false;
    }

    Global.Utils.extend(State).from(Global.EventDispatcher);

    $.extend(State.prototype, {
        push: function(el) {
            this.elements = this.elements.add(el);
            var time = el.attr("data-time");
            if (time !== undefined)
                this.time = Math.max(this.time, parseFloat(time));
            var advance = el.attr("data-advance");
            if (advance !== undefined)
                this.advance = advance;
            el.addClass("state-view");
        },

        toggle: function(started) {
            if (started)
                this.open();
            else
                this.close();
        },

        open: function() {
            this.clearAdvanceTimer();
            if (this.started)
                return;
            this.started = true;
            this.updateClass();
        },

        prepare: function(oldState) {
            this.clearAdvanceTimer();
            if (this.isAutoAdvance())
                this.advanceTimer = setTimeout(this.onAdvanceTimerCallback.bind(this), oldState ? oldState.time * 1000 : 0);
        },

        onAdvanceTimerCallback: function() {
            this.clearAdvanceTimer();
            this.slideView.advanceTo(this.number);
        },

        clearAdvanceTimer: function() {
            if (!this.advanceTimer)
                return;
            clearTimeout(this.advanceTimer);
            this.advanceTimer = null;
        },

        updateClass: function() {
            var self = this;
            setTimeout(function() {
                self.unreset();
                self.elements.toggleClass("state-open", self.started);
            }, 0);
        },

        close: function() {
            this.clearAdvanceTimer();
            if (!this.started)
                return;
            this.started = false;
            this.updateClass();            
        },

        unreset: function() {
            if (!this.isReset)
                return;
            this.isReset = false;
            this.elements.css(Global.Utils.prefixOne("transition"), "");
        },

        reset: function() {
            this.clearAdvanceTimer();
            if (this.isReset)
                return;
            this.started = false;
            this.isReset = true;
            this.elements.css(Global.Utils.prefixOne("transition"), "none");
            this.elements.removeClass("state-open");
        },

        isAutoAdvance: function() {
            return this.advance == "auto";
        }
    });
    
    function SlideView() {
        SlideView.$super.call(this);
        this.el.addClass("slide-view");
        this.name = this.el.attr("data-name");
        this.states = [];
        this.currentState = -1;
        this.initStates();
    }
    Global.Utils.extend(SlideView).from(Global.View);

    $.extend(SlideView.prototype, {
        initStates: function() {
            var stateElements = this.el.find("[data-state]"),
                self = this;
            stateElements.each(function(i, el) {
                el = $(el);
                var number = parseInt(el.attr("data-state"), 10);
                if (isNaN(number)) {
                    console.log("Invalid data-state value.", el.get(0));
                    return;
                }
                var state = self.getState(number);
                state.push(el);
            });
        },

        createState: function(number) {
            var state = new State(this, number);
            this.states[number] = state;
            return state;
        },

        getState: function(number) {
            var state = this.states[number];
            return state ? state : this.createState(number);
        },

        next: function() {
            return this.setState(this.currentState + 1, 1, true);
        },

        advanceTo: function(number) {
            this.setState(number, 1, false);
        },

        prev: function() {
            return this.setState(this.currentState - 1, -1, true);
        },

        findState: function(index, direction, skipAuto) {
            if (direction === undefined)
                direction = 1;
            if (skipAuto === undefined)
                skipAuto = false;
            for (; index >= 0 && index < this.states.length; index += direction) {
                var state = this.states[index];
                if (state) {
                    if (skipAuto && state.isAutoAdvance())
                        continue;
                    return state;
                }
            }
            return null;
        },

        setState: function(number, direction, skipAuto) {
            var index = Math.max(0, Math.min(this.states.length, number));
            if (index != number)
                return false;
            var state = this.findState(index, direction, skipAuto);
            if (!state)
                return false;
            this.currentState = state.number;
            for (var i = 0; i < this.states.length; ++i) {
                var childState = this.states[i];
                if (childState)
                    childState.toggle(childState.number <= state.number);
            }
            if (direction > 0) {
                var nextState = this.findState(index + 1, direction);
                if (nextState)
                    nextState.prepare(state);
            }
            this.fire("statechanged");
            return true;
        },

        reset: function() {
            this.currentState = -1;
            for (var i = 0; i < this.states.length; ++i) {
                var childState = this.states[i];
                if (childState)
                    childState.reset();
            }
        },

        start: function() {
            var nextState = this.findState(Math.max(0, this.currentState), 1);
            if (nextState)
                nextState.prepare();
        },

        hasRemainingStates: function() {
            for (var i = this.currentState + 1; i < this.states.length; ++i) {
                var childState = this.states[i];
                if (childState && !childState.isAutoAdvance())
                    return true;
            }
            return false;
        }

    });

    Global.State = State;
    Global.SlideView = SlideView;

})();
