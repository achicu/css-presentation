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

    function DragView(infoView) {
        DragView.$super.call(this);
        this.infoView = infoView;
        this.el.addClass("drag-view");

        this.iconEl = $("<div />").addClass("drag-view-icon").prependTo(this.el);

        this.infoView.on("slidemove", this.onSlideMove.bind(this));
        this.infoView.on("slideend", this.onSlideEnd.bind(this));

        this.on("touchdragstart", this.onTouchDragStart.bind(this));
        this.on("touchdragmove", this.onTouchDragMove.bind(this));
        this.on("touchdragend", this.onTouchDragEnd.bind(this));

        this.on("tap", this.onTap.bind(this));
    }
    Global.Utils.extend(DragView).from(Global.HighlightTouchView);

    $.extend(DragView.prototype, {
        respondsToTouchGesture: function(gesture) {
            if (DragView.$super.prototype.respondsToTouchGesture.call(this, gesture))
                return true;
            return (gesture.type == Global.GestureStart.DRAG) && gesture.scrollY;
        },

        onTouchDragStart: function() {
            this.infoView.attach();
        },

        onTouchDragMove: function(transform) {
            this.infoView.update(transform);
        },

        onTouchDragEnd: function(transform, touch, endOfGesture) {
            if (!endOfGesture)
                this.infoView.cancel();
            else
                this.infoView.end(transform);
        },

        onTap: function() {
            this.infoView.toggle();
        },

        rotation: function(progress) {
            return -180 * progress;
        },

        onSlideMove: function(progress) {
            console.log("move progres", progress);
            this.iconEl.css(Global.Utils.prefix({
                "transition": "none",
                "transform": "rotate(" + this.rotation(progress) + "deg) translateZ(0px)"
            }));
        },

        onSlideEnd: function(progress) {
            console.log("end progres", progress);
            this.iconEl.css(Global.Utils.prefix({
                "transition": Global.Utils.prefixValue("transform 0.3s linear"),
                "transform": "rotate(" + this.rotation(progress) + "deg) translateZ(0px)"
            }));
        }


    });

    Global.DragView = DragView;

})();
