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

    function PopupView(mainView) {
        PopupView.$super.call(this);
        this.mainView = mainView;
        if (!this.contentView)
            this.contentView = new Global.View();
        this.append(this.contentView);
        this.el.addClass("popup-view-background");
        this.contentView.el.addClass("popup-view");
        this.on("tap", this.hide.bind(this));
        this.visible = false;
    }
    Global.Utils.extend(PopupView).from(Global.GestureView);

    $.extend(PopupView.prototype, {
        show: function() {
            if (this.visible)
                return;
            this.visible = true;
            this.mainView.append(this);
            this.relayout();
            var self = this;
            // Wait until the css properties are applied.
            this.requestAnimationFrame(function() {
                setTimeout(function() {
                    self.el.addClass("open");
                }, 0);
            });
        },

        hide: function() {
            if (!this.visible)
                return;
            this.visible = false;
            this.el.removeClass("open");
            var self = this;
            setTimeout(function() {
                self.el.detach();
            }, 300);
        }
    });

    Global.PopupView = PopupView;

})();
