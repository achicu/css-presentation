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

    function FilterControlsView(filterListView, filter) {
        FilterControlsView.$super.call(this, Global.ScrollView.HORIZONTAL);
        this.el.addClass("filter-controls-view");
        this.filter = filter;
        this.filterListView = filterListView;

        this.labelsView = new Global.View();
        this.labelsView.el.addClass("filter-controls-labels-view");
        this.labelsView.setLayout(new Global.HorizontalLayout());

        this.valuesView = new Global.StepScrollView(Global.ScrollView.NONE);
        this.valuesView.el.addClass("filter-controls-values-view");
        this.valuesView.contentView.setLayout(new Global.HorizontalLayout());
        this.valuesView.needsToFitInViewport = false;

        var self = this;
        this.controls = [];
        $.each(filter.config.params, function (name) {
            var filterParam = filter.config.config[name],
                type = filterParam.type || 'range';
            if (type == 'hidden' || type == "unknown")
                return;
            self.createControl(name, type, filterParam);
        });

        if (this.controls.length != 1) {
            // We only show the labels for filters that need more than 1.
            this.append(this.labelsView);
        }
        this.append(this.valuesView);

        this.el.addClass(this.controls.length == 1 ? "single-control-view" : "multiple-control-view");
        filter.on("filterSourceChanged", this.onFilterSourceChanged.bind(this));
        this.onFilterSourceChanged();

        this.visible = false;
    }
    Global.Utils.extend(FilterControlsView).from(Global.View);

    $.extend(FilterControlsView.prototype, {
        createControl: function(name, type, filterParam, hasSingleValue) {
            var EditorClass = Global.Controls.get(type);
            if (!EditorClass)
                return;

            var controlView = new Global.View();
            controlView.fillHeight = 1;
            controlView.el.addClass("control-view");
            controlView.setLayout(new Global.VerticalLayout());

            var parameterView = new EditorClass();
            controlView.parameterView = parameterView;
            parameterView.name = name;
            parameterView.el.addClass("control-editor-view");
            parameterView.filterParam = filterParam;
            parameterView.field = filterParam.hasOwnProperty("field") ? filterParam.field : name;
            parameterView.on("valuechanged", this.onValueChanged.bind(this, parameterView));
            parameterView.fillWidth = 1;
            parameterView.init();
            this.controls.push(parameterView);
            controlView.append(parameterView);

            this.valuesView.contentView.append(controlView);

            var labelView = new Global.HighlightTouchView();
            labelView.el.addClass("control-label-view");
            labelView.el.append($("<div />").text(name));
            var self = this;
            labelView.on("tap", function() {
                self.valuesView.setSelectedItem(controlView);
            });
            this.labelsView.append(labelView);
        },

        onValueChanged: function(control) {
            if (!this.source)
                return;
            this.source[control.field] = control.getValue();
            this.filter.valuesUpdated(control.name);
        },

        onFilterSourceChanged: function() {
            this.source = this.filter.source;
            if (!this.source)
                return;
            var controls = this.controls;
            for (var i = 0; i < controls.length; ++i) {
                var control = controls[i];
                var value = this.source[control.field];
                control.setValue(value);
            }
        },

        show: function() {
            if (this.visible)
                return;
            this.clearRemovalTimer();
            this.visible = true;
            this.relayout();
            this.el.addClass("visible");
        },

        clearRemovalTimer: function() {
            if (!this.removalTimer)
                return;
            clearTimeout(this.removalTimer);
            this.removalTimer = null;
        },

        destroy: function() {
            this.hide(true);
        },

        hide: function(destroy) {
            if (!this.visible)
                return;
            this.clearRemovalTimer();
            this.visible = false;
            this.el.removeClass("visible");
            var self = this;
            if (destroy) {
                this.removalTimer = setTimeout(function() {
                    self.el.remove();
                }, 300);
            }
        },

        relayout: function() {
            var width = this.width();
            this.valuesView.contentView.forEachChild(function(childView) {
                childView.css("width", width);
                childView.parameterView.css("width", width);
            });
            FilterControlsView.prototype.$super.relayout.call(this);
        }
    });

    Global.FilterControlsView = FilterControlsView;

})();
