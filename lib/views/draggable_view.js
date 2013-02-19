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

    function DraggableView() {
        DraggableView.$super.call(this);
        this.el.addClass("draggable-view");
        if (!this.contentView) {
            this.contentView = new Global.View();
            this.prepend(this.contentView);
        }

        this.on("touchdragstart", this.onTouchDragStart.bind(this));
        this.on("touchdragmove", this.onTouchDragMove.bind(this));
        this.on("touchdragend", this.onTouchDragEnd.bind(this));

        this.on("longtaptimer", this.onLongTapTimer.bind(this));

        this.draggingEl = null;
        this.removalTimer = null;
        this.boundingBoxScale = "";
        this.translateOffset = "";
    }
    Global.Utils.extend(DraggableView).from(Global.HighlightTouchView);

    $.extend(DraggableView.prototype, {
        getTransform: function(left, top, scale) {
            var transform =
                this.translateOffset +
                " translate3d(" + (left) + "px, " + (top) + "px, 50px)" +
                " scale(" + scale + ")" +
                this.boundingBoxScale;
            return transform;
        },

        onTouchDragStart: function(touch) {
            this.clearRemovalTimer();
            this.startPosition = this.contentView.el.offset();
            var width = this.contentView.width(),
                height = this.contentView.height();
            this.el.addClass("draggable-view-dragging");

            var boundingBox = this.contentView.el.get(0).getBoundingClientRect();
            this.boundingBoxScaleX = boundingBox.width / width;
            this.boundingBoxScaleY = boundingBox.height / height;
            this.boundingBoxScale = " scale(" +
                (this.boundingBoxScaleX) + ", " +
                (this.boundingBoxScaleY) + ")";
            this.translateOffset = " translate(" +
                ((boundingBox.width - width) / 2) + "px, " +
                ((boundingBox.height - height) / 2) + "px)";

            this.draggingEl = $("<div />")
                .addClass("draggable-view-clone")
                .css(Global.Utils.prefix({
                    "width": width,
                    "height": height,
                    "transition": Global.Utils.prefixValue("transform 0.3s linear"),
                    "transform": this.getTransform(this.startPosition.left, this.startPosition.top, 1.0)
                }))
                .append(this.contentView.el.clone())
                .appendTo(document.body);

            var self = this;
            setTimeout(function() {
                self.draggingEl.css(Global.Utils.prefix({
                    "transform": self.getTransform(self.startPosition.left, self.startPosition.top, 1.2)
                }));
            }, 0);

            this.fire("draggingstart");
        },

        clearRemovalTimer: function() {
            if (!this.removalTimer)
                return;
            clearTimeout(this.removalTimer);
            this.removalTimer = null;
            this.el.removeClass("draggable-view-dragging");
            if (this.draggingEl) {
                this.draggingEl.remove();
                this.draggingEl = null;
            }
        },

        onTouchDragMove: function(transform) {
            if (!this.draggingEl)
                return;
            this.draggingEl.css(Global.Utils.prefix({
                "transition": "none",
                "transform": this.getTransform(this.startPosition.left + transform.dragX * this.boundingBoxScaleX,
                    this.startPosition.top + transform.dragY * this.boundingBoxScaleY, 1.2)
            }));
            this.fire("draggingmove", [{
                x: (this.startPosition.left + transform.dragX * this.boundingBoxScaleX),
                y: (this.startPosition.top + transform.dragY * this.boundingBoxScaleY)
            }]);
        },

        onTouchDragEnd: function(transform, touch, endOfGesture) {
            if (!this.draggingEl) {
                this.el.removeClass("draggable-view-dragging");
                return;
            }
            if (this.fire("draggingend", [{
                x: (this.startPosition.left + transform.dragX * this.boundingBoxScaleX),
                y: (this.startPosition.top + transform.dragY * this.boundingBoxScaleY)
            }])) {
                // draggingEl was destroyed in the event call.
                return;
            }
            this.animateAndRemove(this.startPosition.left, this.startPosition.top, 1);
        },

        animateAndRemove: function(x, y, scale, callback) {
            this.draggingEl.css(Global.Utils.prefix({
                "transition": Global.Utils.prefixValue("transform 0.3s linear"),
                "transform": this.getTransform(x, y, scale)
            }));
            var self = this;
            this.removalTimer = setTimeout(function() {
                self.el.removeClass("draggable-view-dragging");
                self.draggingEl.remove();
                if (callback)
                    callback();
            }, 300);
        },

        onLongTapTimer: function() {
            this.startDraggingFromLongTap();
        }
    });

    Global.DraggableView = DraggableView;

})();
