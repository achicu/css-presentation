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
    function SlidesListView(presenter, slides) {
        SlidesListView.$super.call(this);

        this.presenter = presenter;

        this.el.addClass("slides-list-view");

        this.maxLoadedSlides = 3;
        
        this.isInListViewMode = false;
        this.minScale = 0.9;

        this.infoView = new Global.InfoBarView(this);

        this.backgroundView = new Global.View();
        this.backgroundView.el.addClass("background-view");
        this.append(this.backgroundView);

        this.progressView = new Global.ProgressView();
        this.append(this.progressView);

        this.scrollView = new Global.StepScrollView(Global.ScrollView.HORIZONTAL);
        this.scrollView.fillParent();
        this.scrollView.friction = 0.1;
        this.scrollView.maxScrollCount = 1;
        this.scrollView.contentView.setLayout(new Global.HorizontalLayout());
        this.append(this.scrollView);

        this.slides = [];
        this.slidesByName = {};
        this.currentSlideName = null;

        this.logoView = new Global.View();
        this.logoView.el.addClass("logo");
        this.append(this.logoView);

        this.advanceButtonViewUpdateRequested = false;
        this.advanceButtonViewVisible = false;
        this.advanceButtonView = new Global.HighlightTouchView();
        this.advanceButtonView.el.addClass("advance-button-view");
        this.append(this.advanceButtonView);
        this.advanceButtonView.on("tap", this.onAdvanceButtonViewTap.bind(this));

        var self = this;
        slides.each(function(i, child) {
            var slideContentView = new Global.SlideContentView();
            var slideView = slideContentView.slideView = new Global.TemplateView.convert($(child).detach());
            slideView.number = i;
            slideContentView.contentView.append(slideView);
            self.scrollView.contentView.append(slideContentView);
            self.slides.push(slideView);
            self.slidesByName[slideView.getName()] = slideContentView;
            slideContentView.slideView.on("statechanged", self.onSlideStateChanged.bind(self, slideContentView.slideView));
            if (slideView.backgroundView)
                self.backgroundView.append(slideView.backgroundView);
        });

        this.scrollView.on("scroll", this.onScroll.bind(this));
        this.scrollView.on("scrollend", this.onScrollEnd.bind(this));
        this.scrollView.on("viewselected", this.onSelectedItemChanged.bind(this));
        this.scrollView.on("afterviewselected", this.onAfterSelectedItemChanged.bind(this));

        this.on("keyup", this.onKeyUp.bind(this));
        this.readSlideFromHash(true);
        $(window).on('hashchange', this.onHashChange.bind(this));

        this.on("touchdragstart", this.onTouchDragStart.bind(this));
        this.on("touchdragmove", this.onTouchDragMove.bind(this));
        this.on("touchdragend", this.onTouchDragEnd.bind(this));

        this.on("touchtransformstart", this.onTouchTransformStart.bind(this));
        this.on("touchtransform", this.onTouchTransform.bind(this));
        this.on("touchtransformend", this.onTouchTransformEnd.bind(this));
    }
    Global.Utils.extend(SlidesListView).from(Global.GestureView);

    SlidesListView.SlideNameStorageKey = "CurrentSlideName";

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

        currentSlideNumber: function() {
            return this.scrollView.selectedIndex;
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
                this.updateSlidesVisibility(false);
                this.updateHash(slideView.getName());
                this.progressView.setValue(this.scrollView.selectedIndex / (this.scrollView.count() - 1));
                var self = this;
                this.requestAnimationFrame(function() {
                    var selectedView = self.scrollView.selectedView;
                    var shouldBeVisible = selectedView && selectedView.slideView.hasRemainingStates();
                    if (self.advanceButtonViewVisible != shouldBeVisible) {
                        this.advanceButtonViewVisible = shouldBeVisible;
                        self.advanceButtonView.el.toggleClass("visible", shouldBeVisible);
                    }
                });
            }
        },

        updateAdvanceSlideViewButton: function() {
            if (this.advanceButtonViewUpdateRequested)
                return;
            this.advanceButtonViewUpdateRequested = true;
            var self = this;
            this.requestAnimationFrame(function() {
                this.advanceButtonViewUpdateRequested = false;
                var selectedView = self.scrollView.selectedView;
                var shouldBeVisible = selectedView && selectedView.slideView.hasRemainingStates();
                if (self.advanceButtonViewVisible != shouldBeVisible) {
                    this.advanceButtonViewVisible = shouldBeVisible;
                    self.advanceButtonView.el.toggleClass("visible", shouldBeVisible);
                }
            });
        },

        onSlideStateChanged: function(slideView) {
            if (slideView !== this.scrollView.selectedView.slideView)
                return;
            this.updateAdvanceSlideViewButton();
        },

        onAfterSelectedItemChanged: function(selectedContentView, previousSelectedContentView) {
            if (previousSelectedContentView)
                previousSelectedContentView.slideView.reset();
            this.updateSlidesVisibility(true);
            if (selectedContentView)
                selectedContentView.slideView.start();
        },

        updateHash: function(name) {
            var oldName = this.currentSlideName;
            this.currentSlideName = name;
            Global.Utils.writeStorage(SlidesListView.SlideNameStorageKey, name);
            window.location.hash = encodeURIComponent(name);
            this.fire("slidechanged", [oldName, name]);
        },

        readHash: function() {
            var hash = window.location.hash;
            if (!hash || hash.length <= 1)
                return null;
            return decodeURIComponent(hash.substr(1));
        },

        readSlideFromHash: function(firstRun) {
            var loadFirstSlide = true;
            var name = ((!firstRun || !window.navigator.standalone) && this.readHash()) ||
                        (firstRun && Global.Utils.readStorage(SlidesListView.SlideNameStorageKey, null));
            if (name &&  (name == this.currentSlideName || this.gotoSlide(name, !firstRun)))
                return;
            this.gotoSlideNumber(0);
        },

        onHashChange: function() {
            this.readSlideFromHash(false);
        },

        gotoSlide: function(name, useAnimation) {
            if (useAnimation === undefined)
                useAnimation = true;
            var slideContentView = this.slidesByName[name];
            if (slideContentView) {
                this.scrollView.setSelectedItem(slideContentView, useAnimation);
                return true;
            }
            return false;
        },

        gotoSlideNumber: function(number, useAnimation) {
            if (useAnimation === undefined)
                useAnimation = true;
            this.scrollView.setSelectedIndex(number, useAnimation);
        },

        onAdvanceButtonViewTap: function() {
            this.nextSlide();
        },

        updateSlidesVisibility: function(canHideContent) {
            var index = this.scrollView.selectedIndex,
                min = index - this.maxLoadedSlides,
                max = index + this.maxLoadedSlides;
            this.scrollView.contentView.forEachChild(function(childView, slideIndex) {
                var visible = slideIndex >= min && slideIndex <= max;
                if (childView.visible && !canHideContent)
                    return;
                childView.toggle(visible);
            });
        },

        onScroll: function(delta) {
            var result = this.scrollView.deltaToFloatIndex(delta),
                from = Math.floor(result),
                to = Math.ceil(result),
                frameDelta = result - from;
            this.scrollView.contentView.forEachChild(function(childView, slideIndex) {
                var state = 0;
                if (from == slideIndex)
                    state = (1 - frameDelta);
                else if (to == slideIndex)
                    state = frameDelta;
                childView.slideView.setBackgroundState(state, false);
            });
        },

        onScrollEnd: function(delta, useAnimation) {
            var index = this.scrollView.selectedIndex;
            this.scrollView.contentView.forEachChild(function(childView, slideIndex) {
                var state = slideIndex == index ? 1 : 0;
                childView.slideView.setBackgroundState(state, useAnimation);
            });
        },

        respondsToTouchGesture: function(gesture) {
            if (SlidesListView.$super.prototype.respondsToTouchGesture.call(this, gesture))
                return true;
            return ((gesture.type == Global.GestureStart.DRAG) && gesture.scrollY) ||
                (gesture.type == Global.GestureStart.TRANSFORM);
        },

        onTouchDragStart: function() {
            this.infoView.attach();
        },

        onTouchDragMove: function(transform) {
            this.infoView.update(transform);
        },

        onTouchDragEnd: function(transform, touch, endOfGesture) {
            if (!endOfGesture)
                this.infoView.cancel();
            else
                this.infoView.end(transform);
        },

        onTouchTransformStart: function() {

        },

        onTouchTransform: function(transform) {
            if (transform.scale < this.minScale && !this.isInListViewMode)
                this.switchToListViewMode();
            else if (transform.scale > this.minScale && this.isInListViewMode)
                this.switchToSlideViewMode();
        },

        switchToListViewMode: function() {
            this.isInListViewMode = true;
            this.scrollView.type = Global.ScrollView.VERTICAL;
            this.scrollView.contentView.setLayout(new Global.VerticalLayout());
            this.relayout();
        },

        switchToSlideViewMode: function() {
            this.isInListViewMode = false;
            this.scrollView.type = Global.ScrollView.HORIZONTAL;
            this.scrollView.contentView.setLayout(new Global.HorizontalLayout());
            this.relayout();
        },

        onTouchTransformEnd: function() {

        }
    });

    Global.SlidesListView = SlidesListView;

})();
