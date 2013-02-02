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

    function DocumentListView(mainView) {
        DocumentListView.$super.call(this, Global.ScrollView.HORIZONTAL);
        this.mainView = mainView;
        this.contentView.setLayout(new Global.HorizontalLayout());
        this.needsToFitInViewport = false;
        this.el.addClass("document-list-view").css({
            "background-color": "white"
        });
        this.fillParent();
        this.contentView.append(this.createDocumentView());
        this.contentView.append(this.createDocumentView());
        this.visible = true;
    }
    Global.Utils.extend(DocumentListView).from(Global.StepScrollView);
    
    $.extend(DocumentListView.prototype, {
        show: function() {
            if (this.visible)
                return;
            this.el.css("visibility", "visible");
            this.visible = true;
        },
        hide: function() {
            if (!this.visible)
                return;
            this.el.css("visibility", "hidden");
            this.visible = false;
        },
        createDocumentView: function() {
            var documentView = new Global.HighlightTouchView();
            documentView.el.addClass("document-list-item-view").css({
                "margin-left": "20px",
                "margin-right": "20px",
                "width": "170px",
                "height": "230px",
                "margin-top": "120px",
                "-webkit-filter": "drop-shadow(0px 0px 10px #333)"
            });

            var contentView = new Global.ContentView();
            documentView.prepend(contentView);
            
            var self = this;
            documentView.on("tap", function() {
                if (self.selectedView === documentView)
                    self.mainView.documentView.restoreView();
                else
                    self.setSelectedItem(documentView);
            });

            return documentView;
        },

        addDocument: function(documentView) {
            this.contentView.append(documentView);
            this.invalidateChildren();
            this.setSelectedItem(documentView);
        },

        computeDocumentTransform: function(view) {
            var selectedView = this.selectedView;
            if (!selectedView)
                return "none";
            var rect = selectedView.el.get(0).getBoundingClientRect();
            var scaleX = rect.width / view.width();
            var scaleY = rect.height / view.height();
            return "translate(" + rect.left + "px, " + rect.top + "px) scale(" + scaleX + ", " + scaleY + ")";
        }
    });

    Global.DocumentListView = DocumentListView;

})();