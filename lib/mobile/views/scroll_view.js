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

    function ScrollView(type) {
        ScrollView.$super.call(this);
        
        this.el.css({
            "overflow": "hidden"
        });

        this.contentEl = $("<div />").css({
            "-webkit-transform-origin": "0 0"
        }).appendTo(this.el);
        
        this.on("touchdragstart", this.onImageViewTouchStart.bind(this));
        this.on("touchdragmove", this.onTouchDragMove.bind(this));
        this.on("gestureend", this.onGestureEnd.bind(this));

        this.startTransform = null;

        this.type = type;
    }
    Global.Utils.extend(ScrollView).from(Global.GestureView);

    ScrollView.VERTICAL = "vertical";
    ScrollView.HORIZONTAL = "horizontal";
    ScrollView.BOTH = "both";
    
    $.extend(ScrollView.prototype, {
        
        restoreTransform: function(el) {
            //this.contentEl.css("-webkit-transition", "-webkit-transform 0.5s ease-out");
            // this.contentEl.css("-webkit-transform", "translateZ(1px)");
        },

        cloneTransform: function(el) {
            this.contentEl.css("-webkit-transition", "none");
            var transform = el.css("-webkit-transform");
            return (transform == "none") ? "" : transform + " ";
        },

        onImageViewTouchStart: function() {
            this.startTransform = this.cloneTransform(this.contentEl);
        },

        onTouchDragMove: function(transform, touch) {
            switch (this.type) {
            case ScrollView.HORIZONTAL:
                transform.dragY = 0;
                break;
            case ScrollView.VERTICAL:
                transform.dragX = 0;
                break;
            }
            this.contentEl.css("-webkit-transform", "translate(" + transform.dragX + "px, " + transform.dragY + "px) translateZ(1px) " + this.startTransform);
        },

        onGestureEnd: function() {
            this.restoreTransform(this.contentEl);
        }

    });

    Global.ScrollView = ScrollView;

})();