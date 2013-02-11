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

    function HorizontalLayout() {
        HorizontalLayout.$super.call(this);
    }
    Global.Utils.extend(HorizontalLayout).from(Global.ViewLayout);

    $.extend(HorizontalLayout.prototype, {
        updateChild: function(childView) {
            childView.el.css("position", "absolute");
        },

        layout: function() {
            var left = 0, height = 0;
            var fillers = [], fillSum = 0, canResizeHeight = true, prevSibilingMargin = 0;
            this.view.forEachChild(function(childView) {
                if (childView.layoutIgnore)
                    return;
                if (childView.fillHeight)
                    canResizeHeight = false;
                if (childView.fillWidth) {
                    fillSum += childView.fillWidth;
                    fillers.push(childView);
                    left += Math.max(prevSibilingMargin, childView.margin("left")) - prevSibilingMargin + childView.margin("right");
                    prevSibilingMargin = childView.margin("right");
                    return;
                }
                childView.css("left", (left - prevSibilingMargin) + "px");
                childView.relayout();
                left += childView.widthWithMarginCollapsing(prevSibilingMargin);
                prevSibilingMargin = childView.margin("right");
                height = Math.max(height, childView.height());
            });
            if (fillers.length) {
                // We got to distribute the remaining width to the blocks.
                var remainingWidth = this.view.elementWidth() - left;
                var widthUnit = remainingWidth / fillSum;
                left = 0;
                prevSibilingMargin = 0;
                this.view.forEachChild(function(childView) {
                    if (childView.layoutIgnore)
                        return;
                    childView.css("left", (left - prevSibilingMargin) + "px");
                    var width;
                    if (childView.fillWidth) {
                        width = childView.fillWidth * widthUnit;
                        childView.css("width", width);
                        width += Math.max(prevSibilingMargin, childView.margin("left")) - prevSibilingMargin + childView.margin("right");
                        childView.relayout();
                    } else {
                        width = childView.widthWithMarginCollapsing(prevSibilingMargin);
                    }
                    left += width;
                    prevSibilingMargin = childView.margin("right");
                    height = Math.max(height, childView.height());
                });
            } else
                this.view.css("width", left + "px");

            if (canResizeHeight)
                this.view.css("height", height + "px");
        }
    });

    Global.HorizontalLayout = HorizontalLayout;

})();
