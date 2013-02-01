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
    }
    Global.Utils.extend(HighlightTouchView).from(Global.GestureView);
    
    $.extend(HighlightTouchView.prototype, {
        onTapStart: function(touch) {
            this.el.css("-webkit-filter", "blur(10px)");
        },
        onTapEnd: function(touch) {
            this.el.css("-webkit-filter", "none");
        },
        onLongTap: function(touch) {
            this.onTapEnd(touch);
            alert("Long tap");
        }
    });

    Global.HighlightTouchView = HighlightTouchView;

})();