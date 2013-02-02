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
        this.setLayout(new Global.VerticalLayout());
        this.contentView = new Global.ContentView();
        this.append(this.contentView);
        this.filterListView = new Global.ActiveFilterListView(mainView, filterList);
        this.append(this.filterListView);
        this.lastTransform = null;
        this.on("transformchange", this.onTansformChange.bind(this));
        this.on("transformend", this.onTansformEnd.bind(this));
        this.minDocumentScale = 0.6;
        this.midPointDocumentScale = 0.7;
        this.documentListViewVisiblityTimer = null;

        this.animation = animation;
        this.animation.on("filtersUpdated", this.onFiltersUpdated.bind(this));
    }
    Global.Utils.extend(DocumentView).from(Global.ImageView);
    
    $.extend(DocumentView.prototype, {
        onTansformChange: function(transform) {
            this.lastTransform = transform;
            var opacity = Math.max(0, (transform.scale - this.minDocumentScale) / this.minDocumentScale);
            this.filterListView.el.css({
                "-webkit-transition": "none",
                "opacity": opacity
            });
            if (this.documentListViewVisiblityTimer) {
                clearTimeout(this.documentListViewVisiblityTimer);
                this.documentListViewVisiblityTimer = null;
            }
            this.mainView.documentListView.show();
        },

        onTansformEnd: function(transform) {
            if (this.lastTransform && this.lastTransform.scale < this.midPointDocumentScale) {
                this.el.css({
                    "-webkit-transition": "opacity 0.3s linear, -webkit-transform 0.3s linear",
                    "opacity": 0,
                    "-webkit-transform": this.mainView.documentListView.computeDocumentTransform(this.contentView)
                });
                return false;
            }
            this.filterListView.el.css({
                "-webkit-transition": "opacity 0.4s linear",
                "opacity": 1
            });
            var self = this;
            this.documentListViewVisiblityTimer = setTimeout(function() {
                this.documentListViewVisiblityTimer = null;
                self.mainView.documentListView.hide();
            }, 400);
        },

        restoreView: function() {
            this.el.css("-webkit-transform", this.mainView.documentListView.computeDocumentTransform(this.contentView));
            this.el.css({
                "-webkit-transition": "opacity 0.2s linear, -webkit-transform 0.2s linear",
                "opacity": 1,
                "-webkit-transform": "translateZ(1px)"
            });
            this.filterListView.el.css({
                "-webkit-transition": "opacity 0.1s linear",
                "opacity": 1
            });
            var self = this;
            this.documentListViewVisiblityTimer = setTimeout(function() {
                this.documentListViewVisiblityTimer = null;
                self.mainView.documentListView.hide();
            }, 200);
        },

        onFiltersUpdated: function(cssFilters, filterCodeHtml, animationCodeHtml) {
            this.contentView.el.css("-webkit-filter", cssFilters);
        }
    });

    Global.DocumentView = DocumentView;

})();