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

    function dist(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }

    function StepScrollView(type) {
        StepScrollView.$super.call(this, type);
        this.stepPoints = null;
        this.selectedIndex = 0;
    }
    Global.Utils.extend(StepScrollView).from(Global.ScrollView);

    $.extend(StepScrollView.prototype, {
        updateStepPoints: function() {
            if (this.stepPoints)
                return;
            var stepPoints = this.stepPoints = [];
            var parentRect = this.contentEl.get(0).getBoundingClientRect();
            var maxRight = 0, maxBottom = 0;
            this.contentEl.children().each(function(i, child) {
                // Collect all the mid points.
                var rect = child.getBoundingClientRect();
                stepPoints.push({
                    x: rect.left + rect.width / 2 - parentRect.left, 
                    y: rect.top + rect.height / 2 - parentRect.top
                });
                maxRight = Math.max(maxRight, rect.left + rect.width);
                maxBottom = Math.max(maxBottom, rect.top + rect.height);
            });
        },
        
        setScrollIndex: function(index, useAnimation) {
            if (useAnimation === undefined)
                useAnimation = true;
            this.updateStepPoints();
            var stepPoints = this.stepPoints;
            if (index < 0 || index >= stepPoints.length)
                return;
            var stepPoint = stepPoints[index];
            var delta = { x: 0, y: 0, oldTransform: this.cloneTransform(this.contentEl) };
            var transformDrag = this.readTransformDrag(delta.oldTransform);
            if (this.type != Global.ScrollView.VERTICAL)
                delta.x = transformDrag.x - stepPoint.x + this.el.get(0).clientWidth / 2;
            if (this.type != Global.ScrollView.HORIZONTAL)
                delta.y = transformDrag.y - stepPoint.y + this.el.get(0).clientHeight / 2;
            this.contentEl.css("-webkit-transition", useAnimation ? "-webkit-transform " + (this.time / 1000) + "s ease-out" : "none");
            this.contentEl.css("-webkit-transform", "translate(" + delta.x + "px, " + delta.y + "px) " + delta.oldTransform);
        },

        updateScrollDrag: function(delta, newPosition) {
            var middPointX = this.el.get(0).clientWidth / 2 - newPosition.x,
                middPointY = this.el.get(0).clientHeight / 2 - newPosition.y;
            var index = this.lookupNearest({ x: middPointX, y: middPointY });
            if (index == -1)
                return;
            this.selectedIndex = index;
            var stepPoint = this.stepPoints[index];
            delta.x -= stepPoint.x - middPointX;
            delta.y -= stepPoint.y - middPointY;
        },

        lookupNearest: function(point) {
            this.updateStepPoints();
            var stepPoints = this.stepPoints;
            var minDistance = Number.MAX_VALUE, minDistancePoint = -1;
            for (var i = 0; i < stepPoints.length; ++i) {
                var stepPoint = stepPoints[i];
                var distance = dist(point.x, point.y, stepPoint.x, stepPoint.y);
                if (minDistance > distance) {
                    minDistance = distance;
                    minDistancePoint = i;
                }
            }
            return minDistancePoint;
        }
    });

    Global.StepScrollView = StepScrollView;

})();