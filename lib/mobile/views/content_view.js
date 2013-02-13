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

    function ContentView() {
        ContentView.$super.call(this);
        this.el.addClass("content-view");
        this.fillParent();
        this.sourceWidth = window.clientWidth;
        this.sourceHeight = window.clientHeight;
        this.sourceEl = ContentView.source.clone().css(Global.Utils.prefix({
            "width": this.sourceWidth,
            "height": this.sourceHeight,
            "transform": "translateZ(0px)",
            "transform-origin": "0 0"
        })).appendTo(this.el);
        this.savedSourceEl = this.sourceEl;
        this.hasImage = false;
        this.imageUrl = null;
    }
    Global.Utils.extend(ContentView).from(Global.View);

    ContentView.loadSource = function() {
        ContentView.source = $("#main").detach();
    };

    $.extend(ContentView.prototype, {
        internalRelayout: function() {
            ContentView.prototype.$super.internalRelayout.call(this);
            var mainView = this.mainView();
            this.sourceWidth = mainView.width();
            this.sourceHeight = mainView.height();
            var scaleX = this.width() / this.sourceWidth,
                scaleY = this.height() / this.sourceHeight;
            this.sourceEl.css(Global.Utils.prefix({
                "width": this.sourceWidth,
                "height": this.sourceHeight,
                "transform": "scale(" + scaleX + ", " + scaleY + ") translateZ(0px)"
            }));
        },

        setImage: function(url) {
            if ((!url && !this.imageUrl) || url == this.imageUrl)
                return;
            this.imageUrl = url;
            if (!url)
                return this.restore();
            this.sourceEl.remove();
            this.hasImage = true;
            this.sourceEl = $("<div />")
                .css(Global.Utils.prefix({
                    "transform-origin": "0 0",
                    "background": "url(" + url + ") no-repeat center",
                    "background-color": "black",
                    "background-size": "contain"
                }))
                .appendTo(this.el);
            this.relayout();
        },

        restore: function() {
            if (!this.hasImage)
                return;
            this.hasImage = false;
            this.sourceEl.remove();
            this.sourceEl = this.savedSourceEl.appendTo(this.el);
            this.relayout();
        }
    });

    Global.ContentView = ContentView;

})();
