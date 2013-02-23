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

    function DialogView(mainView) {
        DialogView.$super.call(this);
        this.el.addClass("dialog-view");
        this.mainView = mainView;
        this.visible = false;
    }
    Global.Utils.extend(DialogView).from(Global.View);

    $.extend(DialogView.prototype, {
        show: function() {
            if (this.visible)
                return;
            this.visible = true;
            this.el.css(Global.Utils.prefix({
                "transition": Global.Utils.prefixValue("transform 0.3s linear"),
                "transform": "translate3d(0, " + this.mainView.height() + "px, 0px)"
            }));
            this.mainView.append(this);
            this.relayout();
            var self = this;
            setTimeout(function() {
                self.el.css(Global.Utils.prefix({
                    "transform": "translate3d(0, 0, 20px)"
                }));
            }, 0);
        },

        hide: function() {
            if (!this.visible)
                return;
            this.visible = false;
            this.css(Global.Utils.prefix({
                "transition": Global.Utils.prefixValue("transform 0.3s linear"),
                "transform": "translate3d(0, " + this.mainView.height() + "px, 0px)"
            }));
            var self = this;
            setTimeout(function() {
                self.el.detach();
            }, 300);
        }
    });

    Global.DialogView = DialogView;

})();
