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

    function direction(x) { return x >= 0 ? 1 : -1; }

    function ScrollView(type) {
        ScrollView.$super.call(this);

        this.el.css({
            "overflow": "hidden"
        });

        this.contentView = new Global.View();
        this.contentEl = this.contentView.el.css({
            "-webkit-transform-origin": "0 0",
            "-webkit-transform": "translateZ(0px)"
        });
        this.append(this.contentView);

        this.on("touchdragstart", this.onTouchDragStart.bind(this));
        this.on("touchdragmove", this.onTouchDragMove.bind(this));
        this.on("touchdragend", this.onTouchDragEnd.bind(this));

        this.startTransform = null;

        this.type = type;

        this.time = 300;
        this.minAcceleration = 1 / 100;
        this.friction = 0.01;
        this.needsToFitInViewport = true;

        this.resetScrollSpeed();

        this.on("afterlayout", this.onScrollViewLayoutDone.bind(this));
    }
    Global.Utils.extend(ScrollView).from(Global.GestureView);

    ScrollView.VERTICAL = "vertical";
    ScrollView.HORIZONTAL = "horizontal";
    ScrollView.BOTH = "both";

    $.extend(ScrollView.prototype, {
        resetScrollSpeed: function() {
            this.scrollDirection = { x: 0, y: 0 };
            this.scrollVelocity = { x: 0, y: 0 };
            this.scrollAcceleration = { x: 0, y: 0 };
            this.lastTouchPosition = { x: 0, y: 0 };
            this.lastTouchTime = null;
        },

        injectAnimationDelta: function(delta) {
            if (Math.abs(this.scrollAcceleration.x) > this.minAcceleration ||
                Math.abs(this.scrollAcceleration.y) > this.minAcceleration) {
                delta.x = this.scrollVelocity.x * this.time + this.scrollAcceleration.x * this.friction * this.time * this.time;
                delta.y = this.scrollVelocity.y * this.time + this.scrollAcceleration.y * this.friction * this.time * this.time;
            }
        },

        fixDeltaValue: function(delta) {
            if (this.updateScrollDrag) {
                var transformDrag = this.readTransformDrag(delta.oldTransform);
                var newDragX = transformDrag.x + delta.x;
                var newDragY = transformDrag.y + delta.y;
                var inputDelta = { x: delta.x, y: delta.y };
                var newPosition = { x: newDragX, y: newDragY };
                this.updateScrollDrag(inputDelta, newPosition);
                if (this.type != ScrollView.VERTICAL)
                    delta.x = inputDelta.x;
                if (this.type != ScrollView.HORIZONTAL)
                    delta.y = inputDelta.y;
            }
            this.fitDeltaInViewport(delta);
        },

        fitDeltaInViewport: function(delta) {
            if (!this.needsToFitInViewport)
                return;
            var transformDrag = this.readTransformDrag(delta.oldTransform);
            var newDragX = transformDrag.x + delta.x;
            var newDragY = transformDrag.y + delta.y;
            if (this.type != ScrollView.VERTICAL) {
                if (newDragX > 0)
                    delta.x -= newDragX;
                else {
                    var clientWidth = this.el.get(0).clientWidth;
                    var contentWidth = this.contentView.width();
                    var minPositionX = Math.min(0, clientWidth - contentWidth);
                    if (newDragX < minPositionX)
                        delta.x -= newDragX - minPositionX;
                }
            }
            if (this.type != ScrollView.HORIZONTAL) {
                if (newDragY > 0)
                    delta.y -= newDragY;
                else {
                    var clientHeight = this.el.get(0).clientHeight;
                    var contentHeight = this.contentView.height();
                    var minPositionY = Math.min(0, clientHeight - contentHeight);
                    if (newDragY < minPositionY)
                        delta.y -= newDragY - minPositionY;
                }
            }
        },

        restoreTransformWithAnimation: function() {
            var delta = { x: 0, y: 0, oldTransform: this.cloneTransform(this.contentEl) };
            this.injectAnimationDelta(delta);
            this.fixDeltaValue(delta);
            this.contentEl.css("-webkit-transition", "-webkit-transform " + (this.time / 1000) + "s ease-out");
            this.contentEl.css("-webkit-transform", "translate3d(" + delta.x + "px, " + delta.y + "px, 0px) " + delta.oldTransform);
        },

        restoreTransformWithNoAnimation: function() {
            this.contentEl.css("-webkit-transition", "none");
            var delta = { x: 0, y: 0, oldTransform: this.cloneTransform(this.contentEl) };
            this.fixDeltaValue(delta);
            this.contentEl.css("-webkit-transform", "translate3d(" + delta.x + "px, " + delta.y + "px, 0px) " + delta.oldTransform);
        },

        cloneTransform: function(el) {
            this.contentEl.css("-webkit-transition", "none");
            var transform = el.css("-webkit-transform");
            return (transform == "none") ? "" : transform + " ";
        },

        readTransformDrag: function(transform) {
            if (!transform.length)
                return { x: 0, y: 0 };
            if (transform.substring(0, 8) == "matrix3d") {
                var values3d = transform.substring(9, transform.length - 2).split(",");
                return { x: parseFloat(values3d[12]), y: parseFloat(values3d[13]) };
            } else {
                var values2d = transform.substring(7, transform.length - 2).split(",");
                return { x: parseFloat(values2d[4]), y: parseFloat(values2d[5]) };
            }
        },

        onTouchDragStart: function() {
            this.startTransform = this.cloneTransform(this.contentEl);
            this.resetScrollSpeed();
        },

        computeTransformVelocity: function(transform) {
            switch (this.type) {
            case ScrollView.HORIZONTAL:
                transform.dragY = 0;
                break;
            case ScrollView.VERTICAL:
                transform.dragX = 0;
                break;
            }
            var scrollDirectionX = direction(transform.dragX),
                scrollDirectionY = direction(transform.dragY);
            if (scrollDirectionX != this.scrollDirection.x)
                this.scrollVelocity.x = 0;
            if (scrollDirectionY != this.scrollDirection.y)
                this.scrollVelocity.y = 0;
            var time = Date.now();
            if (this.lastTouchTime !== null) {
                var deltaTime = time - this.lastTouchTime;
                if (deltaTime) {
                    var velocityX = (transform.dragX - this.lastTouchPosition.x) / deltaTime,
                        velocityY = (transform.dragY - this.lastTouchPosition.y) / deltaTime;
                    this.scrollAcceleration.x = (velocityX - this.scrollVelocity.x) / deltaTime;
                    this.scrollAcceleration.y = (velocityY - this.scrollVelocity.y) / deltaTime;
                    this.scrollVelocity.x = velocityX;
                    this.scrollVelocity.y = velocityY;
                }
            }
            this.lastTouchPosition.x = transform.dragX;
            this.lastTouchPosition.y = transform.dragY;
            this.lastTouchTime = time;
        },

        onTouchDragMove: function(transform, touch) {
            this.computeTransformVelocity(transform);
            this.contentEl.css("-webkit-transform", "translate3d(" + transform.dragX + "px, " + transform.dragY + "px, 1px) " + this.startTransform);
        },

        onTouchDragEnd: function(transform, touch) {
            this.restoreTransformWithAnimation();
        },

        respondsToTouchGesture: function(gesture) {
            return (gesture.type == Global.GestureStart.DRAG) && ((this.type != Global.ScrollView.VERTICAL && gesture.scrollX) || (this.type != Global.ScrollView.HORIZONTAL && gesture.scrollY));
        },

        onScrollViewLayoutDone: function() {
            this.restoreTransformWithNoAnimation();
        },

        width: function() {
            if (this.type == ScrollView.VERTICAL && this.css("width") == "auto")
                return this.contentView.width() + this.margin("left") + this.margin("right");
            return this.elementWidth();
        },

        height: function() {
            if (this.type == ScrollView.HORIZONTAL && this.css("height") == "auto")
                return this.contentView.height() + this.margin("top") + this.margin("bottom");
            return this.elementHeight();
        }

    });

    Global.ScrollView = ScrollView;

})();
