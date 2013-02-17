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

        this.slidesByName = {};
        this.currentSlideName = null;

        this.logoView = new Global.View();
        this.logoView.el.addClass("logo");
        this.append(this.logoView);

        this.advanceButtonView = new Global.HighlightTouchView();
        this.advanceButtonView.el.addClass("advance-button-view");
        this.append(this.advanceButtonView);
        this.advanceButtonView.on("tap", this.onAdvanceButtonViewTap.bind(this));

        var self = this;
        slides.each(function(i, child) {
            var slideContentView = new Global.SlideContentView();
            var slideView = slideContentView.slideView = new Global.TemplateView.convert($(child).clone());
            slideContentView.contentView.append(slideView);
            self.scrollView.contentView.append(slideContentView);
            if (slideView.name)
                self.slidesByName[slideView.name] = slideContentView;
            slideContentView.slideView.on("statechanged", self.onSlideStateChanged.bind(self, slideContentView.slideView));
        });

        this.scrollView.on("scroll", this.onScroll.bind(this));
        this.scrollView.on("scrollend", this.onScroll.bind(this));
        this.scrollView.on("viewselected", this.onSelectedItemChanged.bind(this));
        this.scrollView.on("afterviewselected", this.onAfterSelectedItemChanged.bind(this));
        
        this.on("keyup", this.onKeyUp.bind(this));
        this.readSlideFromHash(false);
        $(window).on('hashchange', this.onHashChange.bind(this));

        this.activeSlideIndex = -1;
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
            if (this.scrollView.selectedView.slideView.prev())
                return;
            this.scrollView.prev();
        },

        nextSlide: function() {
            if (this.scrollView.selectedView.slideView.next())
                return;
            this.scrollView.next();
        },

        onSelectedItemChanged: function(selectedContentView, previousSelectedContentView) {
            if (selectedContentView) {
                var slideView = selectedContentView.slideView;
                slideView.reset();
                this.advanceButtonView.el.toggleClass("visible", slideView.hasRemainingStates());
                if (slideView.name)
                    this.updateHash(slideView.name);
                else
                    this.updateHash("slide-" + this.scrollView.selectedIndex);
            }
        },

        onSlideStateChanged: function(slideView) {
            if (slideView !== this.scrollView.selectedView.slideView)
                return;
            this.advanceButtonView.el.toggleClass("visible", slideView.hasRemainingStates());
        },

        onAfterSelectedItemChanged: function(selectedContentView, previousSelectedContentView) {
            if (previousSelectedContentView)
                previousSelectedContentView.slideView.reset();
            if (selectedContentView)
                selectedContentView.slideView.start();
        },

        updateHash: function(name) {
            this.currentSlideName = name;
            window.location.hash = encodeURIComponent(name);
        },

        readHash: function() {
            var hash = window.location.hash;
            if (!hash || hash.length <= 1)
                return null;
            return decodeURIComponent(hash.substr(1));
        },

        readSlideFromHash: function(useAnimation) {
            var name = this.readHash();
            if (name) {
                if (name != this.currentSlideName)
                    this.gotoSlide(name, useAnimation);
            } else {
                this.gotoSlideNumber(0);
            }
        },

        onHashChange: function() {
            this.readSlideFromHash(true);
        },

        gotoSlide: function(name, useAnimation) {
            if (useAnimation === undefined)
                useAnimation = true;
            var slideContentView = this.slidesByName[name];
            if (slideContentView)
                this.scrollView.setSelectedItem(slideContentView, useAnimation);
        },

        gotoSlideNumber: function(number, useAnimation) {
            if (useAnimation === undefined)
                useAnimation = true;
            this.scrollView.setSelectedIndex(number, useAnimation);
        },

        onAdvanceButtonViewTap: function() {
            this.nextSlide();
        },

        updateActiveIndex: function(index) {
            if (index == this.activeSlideIndex)
                return;
            var min = index - 1,
                max = index + 1;
            this.scrollView.contentView.forEachChild(function(childView, index) {
                childView.toggle(index >= min && index <= max);
            });
        },

        onScroll: function(delta) {
            var index = this.scrollView.deltaToIndex(delta);
            this.updateActiveIndex(index);
        }
    });

    Global.SlidesListView = SlidesListView;

})();
