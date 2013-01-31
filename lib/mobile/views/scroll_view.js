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

        this.contentEl = $("<div />").css({
            "-webkit-transform-origin": "0 0"
        }).appendTo(this.el);
        
        this.on("touchdragstart", this.onTouchDragStart.bind(this));
        this.on("touchdragmove", this.onTouchDragMove.bind(this));
        this.on("touchdragend", this.onTouchDragEnd.bind(this));

        this.startTransform = null;

        this.type = type;

        this.resetScrollSpeed();
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
        
        restoreTransform: function(el) {
            var oldTransform = this.cloneTransform(el);
            var transformDrag = this.readTransformDrag(oldTransform);
            var time = 300, minAcceleration = 1 / 100, friction = 0.01;
            var dragX = 0, dragY = 0;
            if (Math.abs(this.scrollAcceleration.x) > minAcceleration ||
                Math.abs(this.scrollAcceleration.y) > minAcceleration) {
                dragX = this.scrollVelocity.x * time + this.scrollAcceleration.x * friction * time * time;
                dragY = this.scrollVelocity.y * time + this.scrollAcceleration.y * friction * time * time;
            }
            var newDragX = transformDrag.x + dragX,
                newDragY = transformDrag.y + dragY;
            if (this.type != ScrollView.VERTICAL) {
                if (newDragX > 0)
                    dragX -= newDragX;
                else {
                    var clientWidth = this.el.get(0).clientWidth;
                    var contentWidth = this.contentEl.get(0).clientWidth;
                    var minPositionX = Math.min(0, clientWidth - contentWidth);
                    if (newDragX < minPositionX)
                        dragX -= newDragX - minPositionX;
                }
            }
            if (this.type != ScrollView.HORIZONTAL) {
                if (newDragY > 0)
                    dragY -= newDragY;
                else {
                    var clientHeight = this.el.get(0).clientHeight;
                    var contentHeight = this.contentEl.get(0).clientHeight;
                    var minPositionY = Math.min(0, clientHeight - contentHeight);
                    if (newDragY < minPositionY)
                        dragY -= newDragY - minPositionY;
                }
            }
            this.contentEl.css("-webkit-transition", "-webkit-transform " + (time / 1000) + "s ease-out");
            var newTransform = "translate(" + dragX + "px, " + dragY + "px) " + oldTransform;
            this.contentEl.css("-webkit-transform", newTransform);
        },

        cloneTransform: function(el) {
            this.contentEl.css("-webkit-transition", "none");
            var transform = el.css("-webkit-transform");
            return (transform == "none") ? "" : transform + " ";
        },

        readTransformDrag: function(transform) {
            if (!transform.length)
                return { x: 0, y: 0 };
            var values = transform.substring(9, transform.length - 2);
            values = values.split(",");
            return { x: parseFloat(values[12]), y: parseFloat(values[13]) };
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
            this.contentEl.css("-webkit-transform", "translate(" + transform.dragX + "px, " + transform.dragY + "px) translateZ(1px) " + this.startTransform);
        },

        onTouchDragEnd: function(transform, touch) {
            // this.onTouchDragMove(transform, touch);
            this.restoreTransform(this.contentEl);
        }

    });

    Global.ScrollView = ScrollView;

})();