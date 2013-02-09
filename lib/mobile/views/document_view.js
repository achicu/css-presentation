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

    function DocumentView(mainView, filterList, animation) {
        DocumentView.$super.call(this);
        this.mainView = mainView;
        this.el.addClass("document-view");
        this.fillParent();

        this.contentView = new Global.ContentView();
        this.contentView.fillParent();
        this.append(this.contentView);

        this.uiView = new Global.View();
        this.uiView.fillParent();
        this.uiView.el.addClass("document-ui-view");
        this.append(this.uiView);

        this.controlsPlaceholderView = new Global.View();
        this.controlsPlaceholderView.el.addClass("controls-placeholder-view");
        this.uiView.append(this.controlsPlaceholderView);

        this.listButtonView = new Global.HighlightTouchView();
        this.listButtonView.el.addClass("list-button-view");
        this.listButtonView.on("tap", this.onShowDocumentListClicked.bind(this));
        this.uiView.append(this.listButtonView);

        this.filterListView = new Global.ActiveFilterListView(mainView, filterList, this.controlsPlaceholderView);
        this.uiView.append(this.filterListView);

        this.on("transformchange", this.onTansformChange.bind(this));
        this.on("transformend", this.onTansformEnd.bind(this));
        this.minDocumentScale = 0.6;
        this.midPointDocumentScale = 0.7;
        this.documentListViewVisiblityTimer = null;

        this.animation = animation;
        this.animation.on("filtersUpdated", this.onFiltersUpdated.bind(this));

        this.hide();
    }
    Global.Utils.extend(DocumentView).from(Global.ImageView);

    $.extend(DocumentView.prototype, {
        onTansformChange: function(transform) {
            var opacity = Math.max(0, (transform.scale - this.minDocumentScale) / this.minDocumentScale);
            this.uiView.el.css({
                "-webkit-transition": "none",
                "opacity": opacity
            });
            this.showDocumentList();
        },

        showDocumentList: function() {
            if (this.documentListViewVisiblityTimer) {
                clearTimeout(this.documentListViewVisiblityTimer);
                this.documentListViewVisiblityTimer = null;
            }
            if (!this.mainView.documentListView.visible) {
                this.mainView.documentListView.updateCurrentFilterPreset(this.animation.getCSSFilters());
                this.mainView.documentListView.show();
            }
        },

        zoomOutDocument: function() {
            this.el.css({
                "-webkit-transition": "-webkit-transform 0.3s linear",
                "-webkit-transform": this.mainView.documentListView.computeDocumentTransform(this.contentView) + " translateZ(0px)"
            });
            this.uiView.el.css({
                "-webkit-transition": "opacity 0.3s linear",
                "opacity": 0
            });
            var self = this;
            setTimeout(function() {
                self.hide();
            }, 300);
        },

        hide: function() {
            this.el.css({
                "-webkit-transition": "none",
                "-webkit-transform": "translate3d(10000px, 10000px, 0px)"
            });
        },

        onTansformEnd: function(transform) {
            var self = this;
            if (transform && transform.scale < this.midPointDocumentScale) {
                this.zoomOutDocument();
                return false;
            }
            this.uiView.el.css({
                "-webkit-transition": "opacity 0.4s linear",
                "opacity": 1
            });
            this.documentListViewVisiblityTimer = setTimeout(function() {
                self.documentListViewVisiblityTimer = null;
                self.mainView.documentListView.hide();
            }, 400);
        },

        restoreView: function() {
            var self = this;
            this.el.css({
                "-webkit-transition": "none",
                "-webkit-transform": this.mainView.documentListView.computeDocumentTransform(this.contentView) + " translateZ(0px)"
            });
            this.uiView.el.css({
                "-webkit-transition": "none",
                "opacity": 0
            });
            setTimeout(function() {
                self.el.css({
                    "-webkit-transition": "-webkit-transform 0.2s linear",
                    "-webkit-transform": "translateZ(0px)"
                });
                self.uiView.el.css({
                    "-webkit-transition": "opacity 0.5s linear",
                    "opacity": 1
                });
                self.documentListViewVisiblityTimer = setTimeout(function() {
                    self.documentListViewVisiblityTimer = null;
                    self.mainView.documentListView.hide();
                }, 200);
            }, 0);
        },

        onShowDocumentListClicked: function() {
            this.showDocumentList();
            this.zoomOutDocument();
        },

        onFiltersUpdated: function(cssFilters, filterCodeHtml, animationCodeHtml) {
            this.contentView.sourceEl.css("-webkit-filter", cssFilters);
        }
    });

    Global.DocumentView = DocumentView;

})();
