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

    ContentView.loadSource = function() {
        ContentView.source = $("#main").detach();
    };

    function ContentView() {
        ContentView.$super.call(this);
        this.el.addClass("content-view").css({
            "background-color": "green",
            "-webkit-transform": "translateZ(0px)",
            "overflow": "hidden"
        });
        this.fillParent();
        this.sourceWidth = 350;
        this.sourceHeight = 450;
        this.sourceEl = ContentView.source.clone().css({
            "width": this.sourceWidth,
            "height": this.sourceHeight,
            "-webkit-transform": "translateZ(0px)",
            "-webkit-transform-origin": "0 0"
        }).appendTo(this.el);
        this.on("afterresize", this.onAfterResize.bind(this));
    }
    Global.Utils.extend(ContentView).from(Global.View);

    $.extend(ContentView.prototype, {
        relayout: function() {
            var scaleX = this.width() / this.sourceWidth, scaleY = this.height() / this.sourceHeight;
            this.sourceEl.css("-webkit-transform", "scale(" + scaleX + ", " + scaleY + ")");
            ContentView.prototype.$super.relayout.call(this);
        },
        onAfterResize: function() {
            this.relayout();
        }
    });

    Global.ContentView = ContentView;

})();
