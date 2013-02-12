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

    function FilterListView(mainView, filterList, filterStore) {
        FilterListView.$super.call(this, mainView);
        this.setLayout(new Global.VerticalLayout());
        this.el.addClass("filter-list-view");

        this.filterList = filterList;

        this.listView = new Global.StepScrollView(Global.ScrollView.VERTICAL);
        this.listView.el.addClass("filter-list-view-container");
        this.listView.contentView.el.addClass("filter-list-view-container-content-view");
        this.listView.fillWidth = 1;
        this.listView.fillHeight = 1;
        this.append(this.listView);

        this.titleView = new Global.View();
        this.titleView.el.addClass("filter-list-view-title").text("Add a Filter");
        this.titleView.layoutIgnore = true;
        this.append(this.titleView);

        this.cancelButtonView = new Global.HighlightTouchView();
        this.cancelButtonView.el.addClass("cancel-filter-list-button-view").prepend("Cancel");
        this.cancelButtonView.layoutIgnore = true;
        var self = this;
        this.cancelButtonView.on("tap", function() {
            self.hide();
        });
        //this.append(this.cancelButtonView);
        this.titleView.append(this.cancelButtonView);

        this.filterStore = filterStore;
        this.filterStore.on("filterAdded", this.onFilterAdded.bind(this));
        this.filterStore.on("filterDeleted", this.onFilterDeleted.bind(this));
    }
    Global.Utils.extend(FilterListView).from(Global.DialogView);

    $.extend(FilterListView.prototype, {
        addFilterBox: function(filterConfig) {
            var filterView = new Global.HighlightTouchView();
            this.listView.contentView.append(filterView);
            filterView.fillWidth = 1;
            filterView.el.addClass("filter-box-view");

            var self = this;
            filterView.on("tap", function() {
                var filter = self.filterList.addFilter(filterConfig);
                filter.setActive(true);
                self.hide();
            });

            filterView.el.prepend($("<div />").addClass("filter-label").text(filterConfig.label));
            filterView.el.prepend($("<div />").addClass("filter-gradient"));
            filterView.el.prepend($("<div />").addClass("filter-preview").css(Global.Utils.prefixOne("filter"), filterConfig.generatePreviewCode()));
        },

        onFilterAdded: function(filterConfig, loadedFromPreset) {
            if (!filterConfig.isBuiltin)
                return;
            var filterView = this.addFilterBox(filterConfig);
            if (!loadedFromPreset) {
                this.listView.relayout();
                this.listView.setSelectedItem(filterView);
            }
        },

        onFilterDeleted: function() {
            // FIXME: implement.
        }

    });

    Global.FilterListView = FilterListView;

})();
