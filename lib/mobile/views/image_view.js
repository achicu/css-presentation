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
            "-webkit-transform-origin": "0 0"
        });
        
        this.on("touchtransformstart", this.onImageViewTouchStart.bind(this));
        this.on("touchdragstart", this.onImageViewTouchStart.bind(this));
        this.on("touchtransform", this.onTouchTransformMove.bind(this));
        this.on("touchdragmove", this.onTouchDragMove.bind(this));
        this.on("gestureend", this.onGestureEnd.bind(this));

        this.startTransform = null;

    }
    Global.Utils.extend(ImageView).from(Global.GestureView);
    
    $.extend(ImageView.prototype, {
        
        restoreTransform: function(el) {
            this.el.css("-webkit-transition", "-webkit-transform 0.5s ease-out");
            this.el.css("-webkit-transform", "translateZ(1px)");
        },

        cloneTransform: function(el) {
            this.el.css("-webkit-transition", "none");
            var transform = el.css("-webkit-transform");
            return (transform == "none") ? "" : transform + " ";
        },

        onImageViewTouchStart: function() {
            this.startTransform = this.cloneTransform(this.el);
        },

        onTouchTransformMove: function(transform) {
            this.el.css("-webkit-transform",
                "translate(" + (transform.originX) + "px, " + (transform.originY) + "px) " +
                "translate(" + transform.dragX + "px, " + transform.dragY + "px) " + 
                "rotate(" + transform.rotation + "deg) " + 
                "scale(" + transform.scale + ") " +
                "translate(" + (-transform.originX) + "px, " + (-transform.originY) + "px) " +
                "translateZ(1px) " +
                this.startTransform
            );
        },

        onTouchDragMove: function(transform, touch) {
            this.el.css("-webkit-transform", "translate(" + transform.dragX + "px, " + transform.dragY + "px) translateZ(1px) " + this.startTransform);
        },

        onGestureEnd: function() {
            this.restoreTransform(this.el);
        }

    });

    Global.ImageView = ImageView;

})();