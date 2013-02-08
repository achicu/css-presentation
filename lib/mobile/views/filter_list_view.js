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
        this.listView.el.css("width", "100%");
        this.listView.contentView.setLayout(new Global.VerticalLayout());
        this.listView.fillHeight = 1;
        this.append(this.listView);

        this.topBarView = new Global.HighlightTouchView();
        this.topBarView.el.addClass("top-bar-view").prepend("Cancel");
        var self = this;
        this.topBarView.on("tap", function() {
            self.hide();
        });
        this.append(this.topBarView);

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
            filterView.el.addClass("stock-filter-box-view");

            var self = this;
            filterView.on("tap", function() {
                var filter = self.filterList.addFilter(filterConfig);
                filter.setActive(true);
                self.hide();
            });

            filterView.el.prepend($("<div />").addClass("stock-filter-box-label").text(filterConfig.label));
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
