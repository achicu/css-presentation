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
    
    function SlideContentView() {
        SlideContentView.$super.call(this);
        this.el.addClass("slide-content-view");
        this.contentView = new Global.View();
        this.contentView.el.addClass("slide-content-view-transform");
        this.append(this.contentView);
        this.slideView = null;
        this.slideWidth = 0;
        this.slideHeight = 0;
    }
    Global.Utils.extend(SlideContentView).from(Global.GestureView);

    $.extend(SlideContentView.prototype, {
        
        internalRelayout: function() {
            var width = this.mainView().width(),
                height = this.mainView().height();
            this.css("width", width)
                .css("height", height);
            SlideContentView.prototype.$super.internalRelayout.call(this);
            if (!this.slideView)
                return;
            this.slideWidth = this.slideView.width();
            this.slideHeight = this.slideView.height();
            var scale = Math.min(width / this.slideWidth, height / this.slideHeight),
                left = (width - this.slideWidth * scale) / 2, 
                top = (height - this.slideHeight * scale) / 2;
            this.contentView.css(
                Global.Utils.prefixOne("transform"), 
                "translate(" + left + "px, " + top + "px) " +
                "scale(" + scale + ")"
            );
        }

    });

    Global.SlideContentView = SlideContentView;

})();
