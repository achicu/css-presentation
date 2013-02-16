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

    function MainView(app) {
        MainView.$super.call(this);
        this.app = app;
        this.fillParent();

        this.el.css(Global.Utils.prefix({
            "opacity": 0,
            "transform": "translateZ(0px)"
        }));

        this.on("afterresize", this.onAfterViewResize.bind(this));
        this.installResizeEvent();
        this.installKeyboardEvents();
    }
    Global.Utils.extend(MainView).from(Global.View);

    $.extend(MainView.prototype, {
        onAfterViewResize: function() {
            this._width = this.el.width();
            this._height = this.el.height();
            this.relayout();
        },

        onWindowResize: function() {
            this.propagateResizedEvent();
        },

        installResizeEvent: function() {
            $(window).bind("resize", this.onWindowResize.bind(this));
            var self = this;
            this.requestAnimationFrame(function() {
                self.propagateResizedEvent();
                self.fire("firstlayout");
            });
        },

        installKeyboardEvents: function() {
            $(window).bind("keydown", this.onKeyEvent.bind(this, "keydown"));
            $(window).bind("keypress", this.onKeyEvent.bind(this, "keypress"));
            $(window).bind("keyup", this.onKeyEvent.bind(this, "keyup"));
        },

        onKeyEvent: function(type, event) {
            this.propagateEvent(type, [event]);
        },

        width: function() {
            return this._width;
        },

        height: function() {
            return this._height;
        },

        init: function() {
            this.fire("init");
            this.el.css("opacity", 1);
        }
    });

    Global.MainView = MainView;

})();
