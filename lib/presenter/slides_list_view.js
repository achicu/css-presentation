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
    function SlidesListView(slides) {
        SlidesListView.$super.call(this);
        this.el.addClass("slides-list-view");

        this.scrollView = new Global.StepScrollView(Global.ScrollView.HORIZONTAL);
        this.scrollView.fillParent();
        this.scrollView.maxScrollCount = 1;
        this.scrollView.contentView.setLayout(new Global.HorizontalLayout());
        this.append(this.scrollView);

        var self = this;
        slides.each(function(i, child) {
            var slideView = new Global.SlideContentView();
            slideView.slideView = new Global.TemplateView.convert($(child).clone());
            slideView.contentView.append(slideView.slideView);
            self.scrollView.contentView.append(slideView);
        });

        this.on("keyup", this.onKeyUp.bind(this));
    }
    Global.Utils.extend(SlidesListView).from(Global.View);

    $.extend(SlidesListView.prototype, {
        onKeyUp: function(event) {
            switch (event.keyCode) {
                case 37: // left arrow
                    this.prevSlide();
                    return false;
                case 39: // right arrow
                    this.nextSlide();
                    return false;
            }
        },

        prevSlide: function() {
            this.scrollView.prev();
        },

        nextSlide: function() {
            this.scrollView.next();
        }
    });

    Global.SlidesListView = SlidesListView;

})();
