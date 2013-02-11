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

    function HighlightTouchView() {
        HighlightTouchView.$super.call(this);
        this.on("tapstart", this.onTapStart.bind(this));
        this.on("longtaptimer", this.onLongTap.bind(this));
        this.on("tapend", this.onTapEnd.bind(this));
        this.el.addClass("highlight-touch-view");
        this.hightlightEl = $("<div />").css(Global.Utils.prefix({
            "position": "absolute",
            "left": 0,
            "right": 0,
            "bottom": 0,
            "top": 0,
            "visibility": "hidden",
            "background-color": "rgba(0, 0, 0, 0.5)",
            "border-radius": "10px"
        }));
        this.el.append(this.hightlightEl);
        this.touchTimer = null;
    }
    Global.Utils.extend(HighlightTouchView).from(Global.GestureView);

    $.extend(HighlightTouchView.prototype, {
        onTapStart: function(touch) {
            if (this.touchTimer)
                return;
            var self = this;
            this.touchTimer = setTimeout(function() {
                self.hightlightEl.css("visibility", "visible");
            }, 50);
        },
        onTapEnd: function(touch) {
            if (this.touchTimer) {
                clearTimeout(this.touchTimer);
                this.touchTimer = null;
            }
            this.hightlightEl.css("visibility", "hidden");
        },
        onLongTap: function(touch) {
            this.onTapEnd(touch);
        }
    });

    Global.HighlightTouchView = HighlightTouchView;

})();
