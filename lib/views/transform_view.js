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

    function TransformView() {
        TransformView.$super.call(this);

        this.el.css(Global.Utils.prefix({
            "transform-origin": "0 0",
            "transform": "translateZ(0px)"
        }));

        this.on("touchtransformstart", this.onTransformViewTouchTransformStart.bind(this));
        this.on("touchtransformend", this.onTransformViewTouchTransformEnd.bind(this));
        this.on("touchtransform", this.onTouchTransformMove.bind(this));
        this.on("gestureend", this.onGestureEnd.bind(this));

        this.startTransform = null;
        this.lastTransform = null;

        this.requestedAnimationFrame = false;
        this.moveTransform = null;
        this.onAnimationFrameCallback = this.onAnimationFrame.bind(this);

        this.disabled = false;
    }
    Global.Utils.extend(TransformView).from(Global.GestureView);

    $.extend(TransformView.prototype, {

        restoreTransform: function(el) {
            if (this.fire("transformend", [this.lastTransform]))
                return;
            this.el.css(Global.Utils.prefix({
                "transition": Global.Utils.prefixValue("transform 0.5s ease-out"),
                "transform": "translateZ(0px)"
            }));
        },

        cloneTransform: function(el) {
            this.el.css(Global.Utils.prefixOne("transition"), "none");
            var transform = el.css(Global.Utils.prefixOne("transform"));
            return (transform == "none") ? "" : transform + " ";
        },

        onTransformViewTouchTransformStart: function() {
            this.lastTransform = null;
            this.startTransform = this.cloneTransform(this.el);
        },

        onAnimationFrame: function() {
            this.requestedAnimationFrame = false;
            if (!this.moveTransform)
                return;
            var transform = this.moveTransform;
            this.moveTransform = null;
            this.lastTransform = transform;
            if (this.fire("transformchange", [transform]))
                return;
            this.el.css(Global.Utils.prefixOne("transform"),
                "translate(" + transform.dragX + "px, " + transform.dragY + "px) " +
                "translate(" + (transform.originX) + "px, " + (transform.originY) + "px) " +
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

        onTransformViewTouchTransformEnd: function() {
            this.moveTransform = null;
            this.restoreTransform(this.el);
        },

        onGestureEnd: function() {
            this.moveTransform = null;
        },

        respondsToTouchGesture: function(gesture) {
            if (this.disabled)
                return false;
            return (gesture.type == Global.GestureStart.TRANSFORM);
        }

    });

    Global.TransformView = TransformView;

})();
