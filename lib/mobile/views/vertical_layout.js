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
            var fillers = [], fillSum = 0, canResizeWidth = true;
            this.view.forEachChild(function(childView) {
                if (childView.layoutIgnore)
                    return;
                if (childView.fillWidth)
                    canResizeWidth = false;
                if (childView.fillHeight) {
                    fillSum += childView.fillHeight;
                    fillers.push(childView);
                    top += childView.margin("top") + childView.margin("bottom");
                    return;
                }
                childView.css("top", top + "px");
                top += childView.height();
                width = Math.max(width, childView.width());
            });
            if (fillers.length) {
                // We got to distribute the remaining height to the blocks.
                var height = this.view.elementHeight();
                var remainingHeight = height - top;
                var heightUnit = remainingHeight / fillSum;
                top = 0;
                this.view.forEachChild(function(childView) {
                    childView.css("top", top + "px");
                    var height;
                    if (childView.fillHeight) {
                        height = childView.fillHeight * heightUnit;
                        childView.css("height", height);
                        height += childView.margin("top") + childView.margin("bottom");
                    } else {
                        height = childView.height();
                    }
                    top += height;
                    width = Math.max(width, childView.width());
                });
            } else {
                this.view.css("height", top + "px");
            }
            if (canResizeWidth)
                this.view.css("width", width + "px");
        }
    });

    Global.VerticalLayout = VerticalLayout;

})();