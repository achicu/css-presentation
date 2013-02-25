/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
        this.el.addClass("scroll-view");
        if (type === undefined)
            type = this.el.attr("data-type");

        this.scrollToCenter = this.el.attr("data-scroll-to-center") !== undefined;

        if (!this.contentView)
            this.contentView = new Global.View();
        this.contentEl = this.contentView.el.addClass("scroll-view-content-view").css(Global.Utils.prefix({
            "transform-origin": "0 0",
            "transform": "translateZ(0px)"
        }));
        this.append(this.contentView);

        if (type != ScrollView.NONE) {
            this.on("touchdragstart", this.onTouchDragStart.bind(this));
            this.on("touchdragmove", this.onTouchDragMove.bind(this));
            this.on("touchdragend", this.onTouchDragEnd.bind(this));
        }

        this.startTransform = null;

        this.type = type;

        this.time = 300;
        this.minAcceleration = 1 / 100;
        this.friction = 0.01;
        this.needsToFitInViewport = true;

        this.requestedAnimationFrame = false;
        this.moveTransform = null;
        this.onAnimationFrameCallback = this.onAnimationFrame.bind(this);

        this.resetScrollSpeed();
        this.on("afterlayout", this.onScrollViewLayoutDone.bind(this));

        this._scrollWidth = 0;
        this._scrollHeight = 0;
        this._contentWidth = 0;
        this._contentHeight = 0;
    }
    Global.Utils.extend(ScrollView).from(Global.GestureView);

    ScrollView.NONE = "none";
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
                var result = this.updateScrollDrag(delta);
                if (this.type != ScrollView.VERTICAL)
                    delta.x -= result.x;
                if (this.type != ScrollView.HORIZONTAL)
                    delta.y -= result.y;
            }
            this.fitDeltaInViewport(delta);
        },

        fitDeltaInViewport: function(delta) {
            if (!this.needsToFitInViewport)
                return;
            var transformDrag = delta.transformDrag;
            var newDragX = transformDrag.x + delta.x;
            var newDragY = transformDrag.y + delta.y;
            if (this.type != ScrollView.VERTICAL) {
                var clientWidth = this._scrollWidth;
                var contentWidth = this._contentWidth;
                if (newDragX > 0)
                    delta.x -= newDragX;
                else {
                    var minPositionX = Math.min(0, clientWidth - contentWidth);
                    if (newDragX < minPositionX)
                        delta.x -= newDragX - minPositionX;
                }
                if (this.scrollToCenter && contentWidth < clientWidth) {
                    // Center the content.
                    delta.x += (clientWidth - contentWidth) / 2;
                }
            } else {
                delta.x = -newDragX;
            }
            if (this.type != ScrollView.HORIZONTAL) {
                var clientHeight = this._scrollHeight;
                var contentHeight = this._contentHeight;
                if (newDragY > 0)
                    delta.y -= newDragY;
                else {
                    var minPositionY = Math.min(0, clientHeight - contentHeight);
                    if (newDragY < minPositionY)
                        delta.y -= newDragY - minPositionY;
                }
                if (this.scrollToCenter && contentHeight < clientHeight) {
                    // Center the content.
                    delta.y += (clientHeight - contentHeight) / 2;
                }
            } else {
                delta.y = -newDragY;
            }
        },

        createDeltaValue: function(transform) {
            var oldTransform = transform || this.cloneTransform(this.contentEl);
            return {
                x: 0,
                y: 0,
                oldTransform: oldTransform,
                transformDrag: this.readTransformDrag(oldTransform)
            };
        },

        restoreTransformWithAnimation: function() {
            var delta = this.createDeltaValue();
            this.injectAnimationDelta(delta);
            this.fixDeltaValue(delta);
            this.contentEl.css(Global.Utils.prefix({
                "transition": Global.Utils.prefixValue("transform " + (this.time / 1000) + "s ease-out"),
                "transform": "translate3d(" + delta.x + "px, " + delta.y + "px, 0px) " + delta.oldTransform
            }));
            this.fire("scrollend", [delta, true]);
        },

        restoreTransformWithNoAnimation: function() {
            this.contentEl.css(Global.Utils.prefixOne("transition"), "none");
            var delta = this.createDeltaValue();
            this.fixDeltaValue(delta);
            this.contentEl.css(Global.Utils.prefixOne("transform"), "translate3d(" + delta.x + "px, " + delta.y + "px, 0px) " + delta.oldTransform);
            this.fire("scrollend", [delta, false]);
        },

        cloneTransform: function(el) {
            this.contentEl.css(Global.Utils.prefixOne("transition"), "none");
            var transform = el.css(Global.Utils.prefixOne("transform"));
            return (transform == "none") ? "" : transform + " ";
        },

        readTransformDrag: function(transform) {
            if (!transform.length)
                return { x: 0, y: 0 };
            if (transform.substring(0, 8) == "matrix3d") {
                var values3d = transform.substring(9, transform.length - 2).split(",");
                return { 
                    x: parseFloat(values3d[12]),
                    y: parseFloat(values3d[13])
                };
            } else {
                var values2d = transform.substring(7, transform.length - 2).split(",");
                return { 
                    x: parseFloat(values2d[4]),
                    y: parseFloat(values2d[5])
                };
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

        onAnimationFrame: function() {
            this.requestedAnimationFrame = false;
            if (!this.moveTransform)
                return;
            var delta = this.createDeltaValue(this.startTransform);
            delta.x = this.moveTransform.dragX;
            delta.y = this.moveTransform.dragY;
            if (this.fire("scroll", [delta]))
                return;
            this.contentEl.css(Global.Utils.prefixOne("transform"), "translate3d(" + this.moveTransform.dragX + "px, " + this.moveTransform.dragY + "px, 0px) " + this.startTransform);
            this.moveTransform = null;
        },

        onTouchDragMove: function(transform, touch) {
            this.computeTransformVelocity(transform);
            this.moveTransform = transform;
            if (this.requestedAnimationFrame)
                return;
            this.requestedAnimationFrame = true;
            this.requestAnimationFrame(this.onAnimationFrameCallback);
        },

        onTouchDragEnd: function(transform, touch) {
            this.moveTransform = null;
            this.restoreTransformWithAnimation();
        },

        respondsToTouchGesture: function(gesture) {
            if (this.type == Global.ScrollView.NONE)
                return false;
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
        },

        internalRelayout: function() {
            ScrollView.prototype.$super.internalRelayout.call(this);
            this._scrollWidth = this.width();
            this._scrollHeight = this.height();
            this._contentWidth = this.contentView.width();
            this._contentHeight = this.contentView.height();
        },

        relayoutParent: function() {
            this.relayout();
        }

    });

    Global.ScrollView = ScrollView;

})();
