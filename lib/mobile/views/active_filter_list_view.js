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

    function ActiveFilterListView(mainView, filterList, controlsPlaceholderView) {
        ActiveFilterListView.$super.call(this);
        this.el.addClass("active-filter-list-view");
        
        this.mainView = mainView;
        this.setLayout(new Global.HorizontalLayout());
        this.controlsPlaceholderView = controlsPlaceholderView;

        this.filterList = filterList;
        this.filterList.on("filterAdded", this.onFilterAdded.bind(this));
        this.filterList.on("filterRemoved", this.onFilterRemoved.bind(this));

        this.listView = new Global.StepScrollView(Global.ScrollView.HORIZONTAL);
        this.listView.fillParent();
        this.listView.needsToFitInViewport = false;
        this.listView.contentView.setLayout(new Global.HorizontalLayout());
        this.append(this.listView);

        this.addFilterButtonView = new Global.HighlightTouchView();
        this.listView.contentView.append(this.addFilterButtonView);
        this.addFilterButtonView.el.addClass("add-filter-button-view");
        this.addFilterButtonView.el.prepend("+");
        var self = this;
        this.addFilterButtonView.on("tap", function() {
            self.mainView.filterDialogView.show();
        });

        this.activeFilter = null;
        this.filterItemsViewsByName = {};
        this.filterControlsView = null;
    }
    Global.Utils.extend(ActiveFilterListView).from(Global.View);

    $.extend(ActiveFilterListView.prototype, {
        addFilterBox: function(filter) {
            var self = this;
            var filterView = new Global.HighlightTouchView();
            filterView.filter = filter;

            this.listView.contentView.before(filterView, this.addFilterButtonView);
            filterView.el.addClass("filter-box-view");

            filterView.on("tap", function() {
                self.setActiveFilterItem(filterView);
            });

            filterView.on("longtaptimer", function() {
                // Show the add filter dialog.
                filter.removeFilter();
            });

            filterView.el.prepend($("<div />").addClass("filter-label").text(filter.name));
            filterView.el.prepend($("<div />").addClass("filter-preview").css("-webkit-filter", filter.config.generatePreviewCode()));

            this.listView.relayout();
            this.listView.setSelectedItem(filterView);

            return filterView;
        },

        onFilterAdded: function(filter, fromPreset) {
            var itemView = this.addFilterBox(filter);
            this.filterItemsViewsByName["_" + filter.name] = itemView;
            if (!fromPreset)
                this.setActiveFilterItem(itemView);
        },

        onFilterRemoved: function(filter) {
            var filterItemView = this.filterItemsViewsByName["_" + filter.name];
            if (!filterItemView)
                return;
            var index = -1;
            if (filterItemView === this.activeFilter) {
                index = this.listView.selectedIndex;
                this.setActiveFilterItem(null);
            }
            filterItemView.el.remove();
            this.listView.relayout();
            if (index != -1) {
                this.listView.setSelectedIndex(Math.max(0, index - 1));
                if (this.listView.selectedView && this.listView.selectedView.filter)
                    this.setActiveFilterItem(this.listView.selectedView);
            } else {
                if (this.activeFilter)
                    this.listView.setSelectedItem(this.activeFilter);
                else
                    this.listView.setSelectedIndex(0);
            }
        },

        setActiveFilterItem: function(newActiveFilter) {
            if (this.activeFilter === newActiveFilter) {
                if (!this.filterControlsView)
                    return;
                if (this.filterControlsView.visible) {
                    this.filterControlsView.hide();
                    this.activeFilter.el.removeClass("active-filter-box-view");
                } else {
                    this.activeFilter.el.addClass("active-filter-box-view");
                    this.filterControlsView.show();
                }
                return;
            }
            if (this.activeFilter) {
                this.activeFilter.el.removeClass("active-filter-box-view");
                this.activeFilter = null;
                if (this.filterControlsView) {
                    this.filterControlsView.destroy();
                    this.filterControlsView = null;
                }
            }
            if (newActiveFilter) {
                this.listView.setSelectedItem(newActiveFilter);
                this.activeFilter = newActiveFilter;
                this.activeFilter.el.addClass("active-filter-box-view");
                this.filterControlsView = new Global.FilterControlsView(this, newActiveFilter.filter);
                this.controlsPlaceholderView.append(this.filterControlsView);
                this.filterControlsView.show();
            }
        }
    });

    Global.ActiveFilterListView = ActiveFilterListView;

})();
