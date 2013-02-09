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

    function DocumentListView(mainView, presetStore) {
        DocumentListView.$super.call(this, Global.ScrollView.HORIZONTAL);
        this.mainView = mainView;
        this.presetStore = presetStore;
        this.contentView.setLayout(new Global.HorizontalLayout());
        this.needsToFitInViewport = false;
        this.el.addClass("document-list-view");
        this.contentView.el.addClass("document-list-content-view");
        this.fillParent();
        this.presetStore.on("presetAdded", this.onPresetAdded.bind(this));
        this.presetStore.on("presetRemoved", this.onPresetRemoved.bind(this));
        this.presetStore.on("activePresetChanged", this.onActivePresetChanged.bind(this));

        this.presetsByName = {};
        this.visible = true;

        this.logoEl = $("<div class='document-list-logo' />").appendTo(this.contentView.el);
        this.logoPointerEl = $("<div class='document-list-logo-pointer' />").appendTo(this.contentView.el);
        this.logoReleaseEl = $("<div class='document-list-logo-release-info' />").text("Release to check for updates").appendTo(this.contentView.el);

        this.addPresetButtonView = new Global.HighlightTouchView();
        this.addPresetButtonView.fillHeight = 1;
        this.addPresetButtonView.el.addClass("add-preset-button").prepend("+");
        var self = this;
        this.addPresetButtonView.on("tap", function() {
            self.presetStore.savePresetAs();
        });
        this.contentView.append(this.addPresetButtonView);

        this.on("scroll", this.onScroll.bind(this));
        this.on("scrollend", this.onScrollEnd.bind(this));

        this.documentZoomRatio = 0.6;
        this.lastLogoPointerRotation = 0;
    }
    Global.Utils.extend(DocumentListView).from(Global.StepScrollView);

    $.extend(DocumentListView.prototype, {
        show: function() {
            if (this.visible)
                return;
            this.el.css({
                "visibility": "visible",
                "opacity": 1
            });
            this.visible = true;
            this.relayout();
            this.setSelectedItem(this.selectedView);
        },
        hide: function() {
            if (!this.visible)
                return;
            this.el.css({
                "visibility": "hidden",
                "opacity": 0
            });
            this.visible = false;
        },
        createDocumentView: function(preset) {
            var documentView = new Global.HighlightTouchView();
            documentView.preset = preset;
            documentView.el.addClass("document-list-item-view");

            var labelView = new Global.View();
            labelView.el.addClass("document-list-item-view-label").text(preset + " preset");
            documentView.prepend(labelView);

            var contentView = new Global.ContentView();
            if (this.presetStore.currentPreset == preset) {
                contentView.sourceEl.css("-webkit-filter", this.presetStore.animation.getCSSFilters());
            } else {
                this.presetStore.loadPresetPreview(preset, function(animation) {
                    if (!animation)
                        return;
                    contentView.sourceEl.css("-webkit-filter", animation.getCSSFilters());
                });
            }
            documentView.prepend(contentView);
            documentView.contentView = contentView;

            var self = this;
            documentView.on("tap", function() {
                if (self.selectedView === documentView) {
                    self.presetStore.loadPreset(preset, function() {
                        self.mainView.documentView.restoreView();
                    });
                } else
                    self.setSelectedItem(documentView);
            });

            documentView.on("longtaptimer", function() {
                if (self.selectedView !== documentView)
                    return;
                var message = "Are you sure you want to delete the '"+ preset +"' preset?";
                if(window.confirm(message))
                    self.presetStore.deletePreset(preset);
            });

            return documentView;
        },

        updateCurrentFilterPreset: function(filter) {
            var documentView = this.presetsByName["_" + this.presetStore.currentPreset];
            if (!documentView)
                return;
            documentView.contentView.sourceEl.css("-webkit-filter", filter);
        },

        onPresetAdded: function(preset) {
            var key = "_" + preset;
            if (this.presetsByName.hasOwnProperty(key))
                return;
            var presetEl = this.createDocumentView(preset);
            this.presetsByName[key] = presetEl;
            this.contentView.before(presetEl, this.addPresetButtonView);
            return presetEl;
        },

        onPresetRemoved: function(preset) {
            var key = "_" + preset,
                presetEl = this.presetsByName[key];
            if (!presetEl)
                return;
            delete this.presetsByName[key];
            var index = this.selectedIndex;
            if (this.selectedView === presetEl) {
                index = Math.max(0, index - 1);
                this.selectedView = null;
            }
            presetEl.el.remove();
            this.relayout();
            this.setSelectedIndex(index);
        },

        onActivePresetChanged: function(newPreset, oldPreset) {
            var oldEl = this.presetsByName["_" + oldPreset],
                newEl = this.presetsByName["_" + newPreset];
            if (!newEl) {
                newEl = this.onPresetAdded(newPreset);
                this.relayout();
            }
            this.setSelectedItem(newEl);
        },

        computeDocumentTransform: function(view) {
            var selectedView = this.selectedView;
            if (!selectedView || !selectedView.contentView)
                return "none";
            var rect = selectedView.contentView.el.get(0).getBoundingClientRect();
            var scaleX = rect.width / view.width();
            var scaleY = rect.height / view.height();
            return "translate(" + rect.left + "px, " + rect.top + "px) scale(" + scaleX + ", " + scaleY + ")";
        },

        relayout: function() {
            var width = this.mainView.width() * this.documentZoomRatio;
            var height = this.mainView.height() * this.documentZoomRatio;
            var top = (this.mainView.height() - height) / 2;
            this.contentView.forEachChild(function(childView) {
                if (childView.contentView) {
                    childView.css("margin-top", top)
                             .css("width", width)
                             .css("height", height + 40);
                    childView.contentView.css("width", width).css("height", height);
                }
            });
            this.updateLogoPosition();
            DocumentListView.prototype.$super.relayout.call(this);
        },

        updateLogoPosition: function() {
            var width = this.mainView.width() * this.documentZoomRatio;
            this.logoEl.css({
                "left":  - (this.mainView.width() - width) / 2 - this.logoEl.width()
            });
        },

        restoreTransformWithLogoAnimation: function() {
            var delta = { x: 0, y: 0, oldTransform: this.cloneTransform(this.contentEl) };
            this.injectAnimationDelta(delta);
            this.fixDeltaValue(delta);
            this.contentEl.css("-webkit-transition", "-webkit-transform 1s ease-in-out");
            this.contentEl.css("-webkit-transform", "translate3d(" + delta.x + "px, " + delta.y + "px, 0px) " + delta.oldTransform);
            var self = this;
            setTimeout(function() {
                self.updateLogoPosition();
            }, 1000);
        },

        showLogoWithTransition: function() {
            this.contentEl.css("-webkit-transform", "translate3d(" + (this.mainView.width()) + "px, 0px, 0px)");
            this.logoEl.css({
                "left": - (this.mainView.width() + this.logoEl.width()) / 2
            });
            var self = this;
            setTimeout(function() {
                self.restoreTransformWithLogoAnimation();
            }, 0);
        },

        onScrollEnd: function() {
            if (this.lastLogoPointerRotation >= 180) {
                // FIXME: Show the info dialog instead of checking for updates directly.
                this.mainView.app.checkForUpdates();
                this.logoReleaseEl.removeClass("visible");
                this.logoPointerEl.removeClass("hidden");
            }
            this.logoPointerEl.css({
                "-webkit-transition": "-webkit-transform 0.3s linear, opacity 0.3s linear",
                "-webkit-transform": "translate3d(0px, -50%, 0px) rotate(0deg)"
            });
        },

        onScroll: function(delta) {
            var transform = this.cloneTransform(this.contentEl);
            var transformDrag = this.readTransformDrag(transform);
            var newDragX = transformDrag.x + delta.dragX;

            var width = this.mainView.width() * this.documentZoomRatio;
            var logoRightPoint = - (this.mainView.width() - width) / 2 + newDragX;
            var maxDrag = this.mainView.width() / 2;

            if (logoRightPoint >= 0) {
                var rotation = Math.max(0, Math.min(maxDrag, logoRightPoint)) / maxDrag * 180;
                this.lastLogoPointerRotation = rotation;
                this.logoPointerEl.css({
                    "-webkit-transition": "none, opacity 0.3s linear",
                    "-webkit-transform": "translate3d(0px, -50%, 0px) rotate(" + rotation + "deg)"
                });
                if (rotation >= 180) {
                    this.logoReleaseEl.addClass("visible");
                    this.logoPointerEl.addClass("hidden");
                } else {
                    this.logoReleaseEl.removeClass("visible");
                    this.logoPointerEl.removeClass("hidden");
                }
            }
        }
    });

    Global.DocumentListView = DocumentListView;

})();
