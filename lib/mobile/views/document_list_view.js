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
        this.el.addClass("document-list-view").css({
            "background-color": "white"
        });
        this.fillParent();
        this.presetStore.on("presetAdded", this.onPresetAdded.bind(this));
        this.presetStore.on("presetRemoved", this.onPresetRemoved.bind(this));
        this.presetStore.on("activePresetChanged", this.onActivePresetChanged.bind(this));

        this.presetsByName = {};
        this.visible = true;
        this.hide();

        this.addPresetButtonView = new Global.HighlightTouchView();
        this.contentView.append(this.addPresetButtonView);
        this.addPresetButtonView.el.addClass("add-preset-button").css({
            "padding-top": "20px",
            "padding-bottom": "35px",
            "width": "70px",
            "text-align": "center",
            "height": "50px",
            "background-color": "#eee",
            "color": "black",
            "font-weight": "bold",
            "magin-left": "10px",
            "margin-right": "10px",
            "margin-top": "200px",
            "border-radius": "10px"
        });

        this.addPresetButtonView.el.prepend("+");
        var self = this;
        this.addPresetButtonView.on("tap", function() {
            self.presetStore.savePresetAs();
        });
    }
    Global.Utils.extend(DocumentListView).from(Global.StepScrollView);

    $.extend(DocumentListView.prototype, {
        show: function() {
            if (this.visible)
                return;
            this.el.css("visibility", "visible");
            this.visible = true;
            this.relayout();
            this.setSelectedItem(this.selectedView);
        },
        hide: function() {
            if (!this.visible)
                return;
            this.el.css("visibility", "hidden");
            this.visible = false;
        },
        createDocumentView: function(preset) {
            var documentView = new Global.HighlightTouchView();
            documentView.preset = preset;
            documentView.setLayout(new Global.VerticalLayout());
            documentView.el.addClass("document-list-item-view").css({
                "margin-left": "20px",
                "margin-right": "20px",
                "width": "170px",
                "margin-top": "120px",
                "-webkit-filter": "drop-shadow(0px 0px 10px #333)"
            });

            var labelView = new Global.View();
            labelView.el.css({
                "width": "100%",
                "margin-top": "20px",
                "font-weight": "bold",
                "font-size": "1.3em",
                "text-align": "center"
            });
            labelView.el.text(preset + " preset");
            documentView.prepend(labelView);

            var contentView = new Global.ContentView();
            contentView.css({
                "width": "170px",
                "height": "240px"
            });
            contentView.fillHeight = null;
            this.presetStore.loadPresetPreview(preset, function(animation) {
                if (!animation)
                    return;
                contentView.el.css("-webkit-filter", animation.getCSSFilters());
            });
            documentView.prepend(contentView);
            documentView.contentView = contentView;

            var self = this;
            documentView.on("tap", function() {
                if (self.selectedView === documentView) {
                    self.presetStore.loadPreset(preset);
                    self.mainView.documentView.restoreView();
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
            documentView.contentView.css("-webkit-filter", filter);
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
        }
    });

    Global.DocumentListView = DocumentListView;

})();
