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
        this.selectedView = null;
        this.maxScrollCount = null;
    }
    Global.Utils.extend(StepScrollView).from(Global.ScrollView);

    StepScrollView.nullPoint = {
        x: 0,
        y: 0
    };

    $.extend(StepScrollView.prototype, {
        internalRelayout: function() {
            this.stepPoints = null;
            StepScrollView.prototype.$super.internalRelayout.call(this);
        },

        updateStepPoints: function() {
            if (this.stepPoints)
                return;
            var stepPoints = this.stepPoints = [];
            var collectX = this.type != Global.ScrollView.VERTICAL;
            var collectY = this.type != Global.ScrollView.HORIZONTAL;
            var hasValidStepPoints = false;
            this.contentView.forEachChild(function(view) {
                if (!view.stepPointIgnore)
                    hasValidStepPoints = true;
                // Collect all the mid points.
                var rect = view.getBoundingRect();
                stepPoints.push({
                    view: view,
                    x: collectX ? (rect.left + rect.width / 2) : 0,
                    y: collectY ? (rect.top + rect.height / 2) : 0
                });
            });
            this.hasValidStepPoints = hasValidStepPoints;
        },

        updateSelectedView: function() {
            this.updateStepPoints();
            var newItem = this.stepPoints.length ? this.stepPoints[this.selectedIndex].view : null;
            if (newItem === this.selectedView)
                return;
            var oldView = this.selectedView;
            this.selectedView = newItem;
            this.fire("viewselected", [newItem, oldView]);
        },

        prev: function() {
            this.setSelectedIndex(this.selectedIndex - 1);
        },

        next: function() {
            this.setSelectedIndex(this.selectedIndex + 1);
        },

        setSelectedItem: function(item, useAnimation) {
            this.updateStepPoints();
            var stepPoints = this.stepPoints;
            for (var i = 0; i < stepPoints.length; ++i) {
                if (stepPoints[i].view === item) {
                    this.setSelectedIndex(i);
                    return;
                }
            }
        },

        setSelectedIndex: function(index, useAnimation) {
            if (useAnimation === undefined)
                useAnimation = true;
            this.updateStepPoints();
            var stepPoints = this.stepPoints;
            var stepPoint;
            if (!stepPoints.length) {
                // Just recenter.
                stepPoint = StepScrollView.nullPoint;
            } else {
                if (index < 0 || index >= stepPoints.length)
                    return;
                stepPoint = stepPoints[index];
            }
            var delta = this.createDeltaValue();
            var transformDrag = delta.transformDrag;
            if (this.type != Global.ScrollView.VERTICAL)
                delta.x = (this.width() / 2 - stepPoint.x) - transformDrag.x;
            if (this.type != Global.ScrollView.HORIZONTAL)
                delta.y = (this.height() / 2 - stepPoint.y) - transformDrag.y;
            this.fitDeltaInViewport(delta);
            this.contentEl.css(Global.Utils.prefix({
                "transition": useAnimation ? Global.Utils.prefixValue("transform ") + (this.time / 1000) + "s ease-out" : "none",
                "transform": "translate(" + delta.x + "px, " + delta.y + "px) " + delta.oldTransform
            }));
            this.selectedIndex = index;
            this.updateSelectedView();
            this.fire("scrollend", [delta, true]);
        },

        updateScrollDrag: function(delta, newPosition) {
            var middPointX = this.width() / 2 - newPosition.x,
                middPointY = this.height() / 2 - newPosition.y;
            var index = this.lookupNearest({ x: middPointX, y: middPointY });
            var stepPoint;
            if (index == -1) {
                // No step point. Just center the thing, by reverting any change.
                stepPoint = StepScrollView.nullPoint;
            } else {
                this.selectedIndex = index;
                if (this.maxScrollCount !== null)
                index = Math.max(this.selectedIndex - this.maxScrollCount, Math.min(this.selectedIndex + this.maxScrollCount, index));
                stepPoint = this.stepPoints[index];
            }
            delta.x -= stepPoint.x - middPointX;
            delta.y -= stepPoint.y - middPointY;
            this.updateSelectedView();
        },

        lookupNearest: function(point) {
            this.updateStepPoints();
            var stepPoints = this.stepPoints;
            var minDistance = Number.MAX_VALUE, minDistancePoint = -1;
            for (var i = 0; i < stepPoints.length; ++i) {
                var stepPoint = stepPoints[i];
                if (this.hasValidStepPoints && stepPoint.view.stepPointIgnore)
                    continue;
                var distance = dist(point.x, point.y, stepPoint.x, stepPoint.y);
                if (minDistance > distance) {
                    minDistance = distance;
                    minDistancePoint = i;
                }
            }
            return minDistancePoint;
        },

        onScrollViewLayoutDone: function() {
            this.setSelectedIndex(this.selectedIndex, false);
        }
    });

    Global.StepScrollView = StepScrollView;

})();
