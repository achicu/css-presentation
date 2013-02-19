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
    
    function SlideCssDemoView() {
        SlideCssDemoView.$super.call(this);
        this.el.addClass("slide-css-demo-view");
        this.filterName = this.el.attr("data-filter-name");
        this.filterValueUnits = this.el.attr("data-filter-value-units");
        if (this.filterControlView)
            this.filterControlView.on("valuechanged", this.onValueChanged.bind(this));
        this.onValueChanged();
        this.animationFrameRequested = false;
    }
    Global.Utils.extend(SlideCssDemoView).from(Global.SlideView);

    $.extend(SlideCssDemoView.prototype, {
        onValueChanged: function() {
            this.update();
        },

        update: function() {
            if (this.animationFrameRequested)
                return;
            this.animationFrameRequested = true;
            this.requestAnimationFrame(this.updateInternal.bind(this));
        },

        updateInternal: function() {
            this.animationFrameRequested = false;
            var value = this.filterControlView.getValue();
            if (!this.filteredAreaView || !this.filterValueUnits || !this.filterName)
                return;
            var cssValue = this.filterName + "(" + Math.round(value) + this.filterValueUnits + ")";
            Global.Utils.applyFilterWithDropShadowWorkaround(this.filteredAreaView.el, cssValue);
            if (this.filterSyntaxView) {
                var cssValueHTML = "<span class='filter-name'>" + this.filterName + "</span>(" + Math.round(value) + this.filterValueUnits + ")";
                this.filterSyntaxView.el.html("<span class='prop-name'>filter</span>: " + cssValueHTML);
            }
        }
    });

    Global.SlideCssDemoView = SlideCssDemoView;

})();
