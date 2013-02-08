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

    function ImageView() {
        ImageView.$super.call(this);

        this.el.css({
            "-webkit-transform-origin": "0 0",
            "-webkit-transform": "translateZ(0px)"
        });

        this.canUseDrag = false;

        this.on("touchtransformstart", this.onImageViewTouchTransformStart.bind(this));
        this.on("touchtransformend", this.onImageViewTouchTransformEnd.bind(this));
        this.on("touchdragstart", this.onImageViewTouchDragStart.bind(this));
        this.on("touchtransform", this.onTouchTransformMove.bind(this));
        this.on("touchdragmove", this.onTouchDragMove.bind(this));
        this.on("gestureend", this.onGestureEnd.bind(this));

        this.startTransform = null;

        this.requestedAnimationFrame = false;
        this.moveTransform = null;
        this.onAnimationFrameCallback = this.onAnimationFrame.bind(this);
    }
    Global.Utils.extend(ImageView).from(Global.GestureView);

    $.extend(ImageView.prototype, {

        restoreTransform: function(el) {
            if (this.fire("transformend"))
                return;
            this.el.css("-webkit-transition", "-webkit-transform 0.5s ease-out");
            this.el.css("-webkit-transform", "translateZ(0px)");
        },

        cloneTransform: function(el) {
            this.el.css("-webkit-transition", "none");
            var transform = el.css("-webkit-transform");
            return (transform == "none") ? "" : transform + " ";
        },

        onImageViewTouchTransformStart: function() {
            this.startTransform = this.cloneTransform(this.el);
        },

        onImageViewTouchDragStart: function() {
            if (!this.canUseDrag)
                return;
            this.onImageViewTouchTransformStart();
        },

        onAnimationFrame: function() {
            this.requestedAnimationFrame = false;
            if (!this.moveTransform)
                return;
            var transform = this.moveTransform;
            this.moveTransform = null;
            if (this.fire("transformchange", [transform]))
                return;
            this.el.css("-webkit-transform",
                "translate(" + (transform.originX) + "px, " + (transform.originY) + "px) " +
                "translate(" + transform.dragX + "px, " + transform.dragY + "px) " +
                "rotate(" + transform.rotation + "deg) " +
                "scale(" + transform.scale + ") " +
                "translate(" + (-transform.originX) + "px, " + (-transform.originY) + "px) " +
                "translateZ(0px) " +
                this.startTransform
            );
        },

        onTouchTransformMove: function(transform) {
            this.moveTransform = transform;
            if (this.requestedAnimationFrame)
                return;
            this.requestedAnimationFrame = true;
            this.requestAnimationFrame(this.onAnimationFrameCallback);
        },

        onTouchDragMove: function(transform, touch) {
            if (this.canUseDrag) {
                this.fire("dragchange", [transform]);
                this.el.css("-webkit-transform", "translate(" + transform.dragX + "px, " + transform.dragY + "px) translateZ(0px) " + this.startTransform);
            }
        },

        onImageViewTouchTransformEnd: function() {
            this.moveTransform = null;
            if (!this.canUseDrag)
                this.restoreTransform(this.el);
        },

        onGestureEnd: function() {
            this.moveTransform = null;
            if (this.canUseDrag)
                this.restoreTransform(this.el);
        },

        respondsToTouchGesture: function(gesture) {
            return (gesture.type == Global.GestureStart.TRANSFORM);
        }

    });

    Global.ImageView = ImageView;

})();
