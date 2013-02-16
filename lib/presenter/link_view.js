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
    
    function LinkView() {
        LinkView.$super.call(this);
        this.href = this.el.attr("href");
        this.remote = this.href && this.href.length ? this.href.charAt(0) != "#" : false;
        this.el.addClass("link-view");
        this.on("tap", this.onLinkTap.bind(this));
    }
    Global.Utils.extend(LinkView).from(Global.HighlightTouchView);

    $.extend(LinkView.prototype, {
        onLinkTap: function() {
            if (this.remote)
                window.open(this.href);
            else
                window.location = this.href;
        }
    });

    Global.LinkView = LinkView;

})();
