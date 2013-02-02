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

    function ActiveFilterListView(mainView, filterList) {
        ActiveFilterListView.$super.call(this);
        this.mainView = mainView;
        this.setLayout(new Global.HorizontalLayout());

        this.filterList = filterList;
        this.filterList.on("filterAdded", this.onFilterAdded.bind(this));
        this.filterList.on("filterRemoved", this.onFilterRemoved.bind(this));

        this.el.addClass("active-filters-list-view").css({
            "width": "100%",
            "height": "100px",
            "background-color": "white"
        });
        
        this.listView = new Global.StepScrollView(Global.ScrollView.HORIZONTAL);
        this.listView.fillParent();
        this.listView.needsToFitInViewport = false;
        this.listView.contentView.setLayout(new Global.HorizontalLayout());
        this.append(this.listView);

        this.addFilterButtonView = new Global.HighlightTouchView();
        this.listView.contentView.append(this.addFilterButtonView);
        this.addFilterButtonView.el.addClass("add-filter-button").css({
            "padding-top": "20px",
            "padding-bottom": "35px",
            "width": "70px",
            "text-align": "center",
            "height": "50px",
            "background-color": "#eee",
            "margin-top": "20px",
            "color": "black",
            "font-weight": "bold",
            "magin-left": "10px",
            "margin-right": "10px",
            "border-radius": "10px"
        });

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
            filterView.el.addClass("filter-view").css({
                "padding-top": "20px",
                "padding-bottom": "20px",
                "padding-left": "20px",
                "padding-right": "20px",
                "text-align": "center",
                "background-color": "#ddd",
                "margin-top": "20px",
                "color": "black",
                "font-weight": "bold",
                "magin-left": "10px",
                "margin-right": "10px",
                "border-radius": "10px",
                "-webkit-transition": "-webkit-filter 0.1s linear",
                "white-space": "nowrap"
            });
            
            filterView.on("tap", function() {
                self.setActiveFilterItem(filterView);
            });

            filterView.on("longtaptimer", function() {
                // Show the add filter dialog.
                filter.removeFilter();
            });

            filterView.el.prepend($("<div />").text(filter.name));

            this.listView.relayout();
            this.listView.setSelectedItem(filterView);

            return filterView;
        },

        onFilterAdded: function(filter) {
            var itemView = this.addFilterBox(filter);
            this.filterItemsViewsByName["_" + filter.name] = itemView;
            this.setActiveFilterItem(itemView);
        },

        onFilterRemoved: function(filter) {
            var filterItemView = this.filterItemsViewsByName["_" + filter.name];
            if (!filterItemView)
                return;
            if (filterItemView === this.activeFilter)
                this.setActiveFilterItem(null);
            filterItemView.el.remove();
            this.listView.relayout();
            this.listView.setSelectedIndex(Math.max(0, this.listView.selectedIndex - 1));
        },

        setActiveFilterItem: function(newActiveFilter) {
            if (this.activeFilter === newActiveFilter) {
                if (this.filterControlsView)
                    if (this.filterControlsView.visible) {
                        this.filterControlsView.hide(true);
                        this.activeFilter.el.removeClass("active-filter-view").css("-webkit-filter", "none");
                    } else {
                        this.activeFilter.el.addClass("active-filter-view").css("-webkit-filter", "drop-shadow(0px 0px 2px blue)");
                        this.filterControlsView.show(true, true);
                    }
                return;
            }
            if (this.activeFilter) {
                this.activeFilter.el.removeClass("active-filter-view").css("-webkit-filter", "none");
                this.activeFilter = null;
                if (this.filterControlsView) {
                    this.filterControlsView.hide(true);
                    this.filterControlsView = null;
                }
            }
            if (newActiveFilter) {
                this.activeFilter = newActiveFilter;
                this.activeFilter.el.addClass("active-filter-view").css("-webkit-filter", "drop-shadow(0px 0px 2px blue)");
                this.filterControlsView = new Global.FilterControlsView(this.parentView(), this, newActiveFilter.filter);
                this.filterControlsView.show(true);
            }
        }
    });

    Global.ActiveFilterListView = ActiveFilterListView;

})();