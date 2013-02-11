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

    function ActiveFilterListView(mainView, documentView, filterList, controlsPlaceholderView) {
        ActiveFilterListView.$super.call(this);
        this.el.addClass("active-filters-view");

        this.mainView = mainView;
        this.documentView = documentView;

        this.setLayout(new Global.HorizontalLayout());
        this.controlsPlaceholderView = controlsPlaceholderView;

        this.filterList = filterList;
        this.filterList.on("filterAdded", this.onFilterAdded.bind(this));
        this.filterList.on("filterRemoved", this.onFilterRemoved.bind(this));
        this.filterList.on("filtersReloaded", this.onFiltersReloaded.bind(this));

        this.listView = new Global.StepScrollView(Global.ScrollView.HORIZONTAL);
        this.listView.el.addClass("active-filters-list-view");
        this.listView.fillParent();
        this.listView.needsToFitInViewport = false;
        this.listView.contentView.el.css("height", "100%");
        this.listView.contentView.setLayout(new Global.HorizontalLayout());
        this.listView.on("scrollend", this.onListViewScroll.bind(this));
        this.listView.on("scroll", this.onListViewScroll.bind(this));
        this.append(this.listView);

        this.dragView = new Global.DragView(documentView.infoView);
        this.dragView.layoutIgnore = true;
        this.listView.append(this.dragView);

        this.addFilterButtonView = new Global.HighlightTouchView();
        this.addFilterButtonView.fillHeight = 1;
        this.listView.contentView.append(this.addFilterButtonView);
        this.addFilterButtonView.el.addClass("add-filter-button-view");
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
        addFilterBox: function(filter, fromPreset) {
            var self = this;
            var filterView = new Global.DraggableView();
            filterView.filter = filter;

            filterView.el.addClass("filter-box-view-container");
            filterView.contentView.el.addClass("filter-box-view").addClass("inside-active-filters-view");

            filterView.on("tap", function() {
                self.setActiveFilterItem(filterView);
            });

            filterView.on("draggingstart", this.onFilterDraggingStart.bind(this, filterView));
            filterView.on("draggingmove", this.onFilterDraggingMove.bind(this, filterView));
            filterView.on("draggingend", this.onFilterDraggingEnd.bind(this, filterView));

            filterView.contentView.el.prepend($("<div />").addClass("filter-label").text(filter.name));
            filterView.contentView.el.prepend($("<div />").addClass("filter-preview").css(Global.Utils.prefix({
                "filter": filter.config.generatePreviewCode()
            })));

            this.listView.contentView.before(filterView, this.addFilterButtonView);

            if (!fromPreset) {
                this.listView.relayout();
                this.listView.setSelectedItem(filterView);
            }

            return filterView;
        },

        onFilterDraggingStart: function(filterView) {
            this.documentView.showTrashBag();
        },

        onFilterDraggingMove: function(filterView, transform) {
            var rect = this.documentView.trashBagRect();
            transform.x += filterView.width() / 2;
            transform.y += filterView.height() / 2;
            var inside = Global.Utils.insideRect(rect, transform);
            var hadInsideClass = this.documentView.trashBagView.el.hasClass("inside");
            if (hadInsideClass != inside)
                this.documentView.trashBagView.el.toggleClass("inside", inside);
        },

        onFilterDraggingEnd: function(filterView, transform) {
            var rect = this.documentView.trashBagRect();
            transform.x += filterView.width() / 2;
            transform.y += filterView.height() / 2;
            var inside = Global.Utils.insideRect(rect, transform);
            if (inside) {
                var self = this;
                filterView.filter.removeFilter();
                filterView.animateAndRemove(
                    (rect.left + rect.right - filterView.draggingEl.width()) / 2,
                    (rect.top + rect.bottom - filterView.draggingEl.height()) / 2, 0, function() {
                        self.documentView.hideTrashBag();
                    });
                return false;
            }
            this.documentView.hideTrashBag();
        },

        onFilterAdded: function(filter, fromPreset) {
            var itemView = this.addFilterBox(filter, fromPreset);
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

        onFiltersReloaded: function() {
            this.listView.relayout();
            this.listView.setSelectedIndex(0);
        },

        setActiveFilterItem: function(newActiveFilter) {
            if (this.activeFilter === newActiveFilter) {
                if (!this.filterControlsView)
                    return;
                if (this.filterControlsView.visible) {
                    this.filterControlsView.hide();
                    this.activeFilter.contentView.el.removeClass("active-filter-box-view");
                } else {
                    this.activeFilter.contentView.el.addClass("active-filter-box-view");
                    this.filterControlsView.show();
                }
                return;
            }
            if (this.activeFilter) {
                this.activeFilter.contentView.el.removeClass("active-filter-box-view");
                this.activeFilter = null;
                if (this.filterControlsView) {
                    this.filterControlsView.destroy();
                    this.filterControlsView = null;
                }
            }
            if (newActiveFilter) {
                this.listView.setSelectedItem(newActiveFilter);
                this.activeFilter = newActiveFilter;
                this.activeFilter.contentView.el.addClass("active-filter-box-view");
                this.filterControlsView = new Global.FilterControlsView(this, newActiveFilter.filter);
                this.controlsPlaceholderView.append(this.filterControlsView);
                this.filterControlsView.show();
            }
        },

        onListViewScroll: function(delta) {
            var x = delta.x + delta.transformDrag.x;
            this.dragView.el.toggleClass("covered",  x < this.dragView.width());
        }
    });

    Global.ActiveFilterListView = ActiveFilterListView;

})();
