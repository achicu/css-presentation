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

    function VerticalLayout() {
        VerticalLayout.$super.call(this);
    }
    Global.Utils.extend(VerticalLayout).from(Global.ViewLayout);

    $.extend(VerticalLayout.prototype, {
        updateChild: function(childView) {
            childView.el.css("position", "absolute");
        },

        layout: function() {
            var top = 0, width = 0;
            var fillers = [], fillSum = 0, prevSibilingMargin = 0;
            this.view.forEachChild(function(childView) {
                if (childView.layoutIgnore)
                    return;
                if (childView.fillHeight) {
                    fillSum += childView.fillHeight;
                    fillers.push(childView);
                    top += Math.max(prevSibilingMargin, childView.margin("top")) - prevSibilingMargin + childView.margin("bottom");
                    return;
                }
                childView.css("top", (top - prevSibilingMargin) + "px");
                childView.relayout();
                top += childView.heightWithMarginCollapsing(prevSibilingMargin);
                prevSibilingMargin = childView.margin("bottom");
                width = Math.max(width, childView.width());
            });
            if (fillers.length) {
                // We got to distribute the remaining height to the blocks.
                var height = this.view.elementHeight();
                var remainingHeight = height - top;
                var heightUnit = remainingHeight / fillSum;
                top = 0;
                prevSibilingMargin = 0;
                this.view.forEachChild(function(childView) {
                    if (childView.layoutIgnore)
                        return;
                    childView.css("top", (top - prevSibilingMargin) + "px");
                    var height;
                    if (childView.fillHeight) {
                        height = childView.fillHeight * heightUnit;
                        childView.css("height", height);
                        height += Math.max(prevSibilingMargin, childView.margin("top")) - prevSibilingMargin + childView.margin("bottom");
                        childView.relayout();
                    } else {
                        height = childView.heightWithMarginCollapsing(prevSibilingMargin);
                    }
                    top += height;
                    prevSibilingMargin = childView.margin("bottom");
                    width = Math.max(width, childView.width());
                });
            } else {
                this.view.css("height", top + "px");
            }
            if (this.view.takesHeightFromChildren)
                this.view.css("width", width + "px");
        }
    });

    Global.VerticalLayout = VerticalLayout;

})();
