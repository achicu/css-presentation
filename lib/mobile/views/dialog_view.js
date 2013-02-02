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

    function DialogView(mainView) {
        DialogView.$super.call(this);
        this.fillParent();
        this.el.css({
            "left": 0,
            "top": 0
        });
        this.el.addClass("dialog-view").css({
            "background-color": "white"
        });
        this.mainView = mainView;
    }
    Global.Utils.extend(DialogView).from(Global.View);
    
    $.extend(DialogView.prototype, {
        show: function() {
            this.el.css({
                "z-index": 400,
                "-webkit-transition": "-webkit-transform 0.3s linear",
                "-webkit-transform": "translate3d(0, " + this.mainView.height() + "px, 10px)"
            });
            this.mainView.append(this);
            this.relayout();
            var self = this;
            setTimeout(function() {
                self.el.css({
                    "-webkit-transform": "translate3d(0, 0, 1px)"
                });
            }, 0);
        },

        hide: function() {
            this.css({
                "-webkit-transition": "-webkit-transform 0.3s linear",
                "-webkit-transform": "translate3d(0, " + this.mainView.height() + "px, 10px)"
            });
            var self = this;
            setTimeout(function() {
                self.el.detach();
            }, 300);
        }
    });

    Global.DialogView = DialogView;

})();