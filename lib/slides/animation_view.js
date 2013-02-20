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
    
    function parseFloatRect(frameRect) {
        frameRect.x = parseFloat(frameRect.x);
        frameRect.y = parseFloat(frameRect.y);
        frameRect.w = parseFloat(frameRect.w);
        frameRect.h = parseFloat(frameRect.h);
        return frameRect;
    }

    function AnimationView() {
        AnimationView.$super.call(this);
        this.frameNumber = 0;
        this.visibleFrameNumber = -1;
        this.contentWidth = 0;
        this.contentHeight = 0;
        this.initialFrameNumber = 0;
        this.animationFrameRequested = false;
        this.animationTimer = null;
        this.direction = 1;

        this.el.addClass("animation-view");
        this.viewportEl = $("<div />").addClass("animation-viewport").prependTo(this.el);
        this.imgEl = $("<div />").addClass("animation-image").appendTo(this.viewportEl);
        if (this.frameDataView) {
            var text = this.frameDataView.el.text();
            this.frameDataView.el.remove();
            try {
                this.frameData = JSON.parse(text);
            } catch (e) {
                console.error("Error parsing frame data.", this.frameDataView.el);
            }
            this.computeFrames();
            this.frameDataView = null;
        }
        this.on("tap", this.onTap.bind(this));

        this.on("touchdragstart", this.onRangeTouchDragStart.bind(this));
        this.on("touchdragmove", this.onTouchDragMove.bind(this));
    }
    Global.Utils.extend(AnimationView).from(Global.HighlightTouchView);

    $.extend(AnimationView.prototype, {
        computeFrames: function() {
            if (!this.frameData)
                return;
            var frames = this.frameData.frames,
                frameViews = [];
            this.contentWidth = parseFloat(frames[0].sourceSize.w);
            this.contentHeight = parseFloat(frames[0].sourceSize.h);
            for (var i = 0; i < frames.length; ++i) {
                var frame = frames[i],
                    frameRect = parseFloatRect(frame.frame),
                    frameTrim = parseFloatRect(frame.spriteSourceSize);
                
                var frameViewEl = $("<div />").addClass("animation-image-view").css({
                    "background-position": (-frameRect.x) + "px " + (-frameRect.y) +"px",
                    "left": frameTrim.x,
                    "top": frameTrim.y,
                    "width": frameRect.w,
                    "height": frameRect.h
                });
                if (frame.rotated) {
                    frameViewEl.css(Global.Utils.prefixOne("transform"), "rotate(-90deg) translateZ(0px)");
                    frameViewEl.css("top", frameTrim.y + frameRect.w);
                }
                frameViewEl.append($("<div />").addClass("debug-view-indicator").text(i));
                this.imgEl.append(frameViewEl);

                var view = {
                    number: i,
                    el: frameViewEl
                };
                frameViews.push(view);
            }

            this.frameViews = frameViews;
            this.gotoFrame(frameViews[this.frameNumber]);
        },

        gotoFrame: function(frame) {
            if (this.visibleFrameNumber == frame.number)
                return;
            if (this.visibleFrameNumber != -1)
                this.frameViews[this.visibleFrameNumber].el.css("opacity", 0);
            this.visibleFrameNumber = frame.number;
            frame.el.css("opacity", 1);
        },

        updateUI: function() {
            if (this.animationFrameRequested)
                return;
            this.animationFrameRequested = true;
            this.requestAnimationFrame(this.updateUIInternal.bind(this));
        },

        updateUIInternal: function() {
            this.animationFrameRequested = false;
            this.gotoFrame(this.frameViews[this.frameNumber]);
        },

        onTap: function() {
            if (!this.frameViews)
                return;
            this.el.toggleClass("debug-view");
        },

        internalRelayout: function() {
            this.css("width", this.contentWidth).css("height", this.contentHeight);
            AnimationView.prototype.$super.internalRelayout.call(this);
        },

        onRangeTouchDragStart: function() {
            this.initialFrameNumber = this.frameNumber;
        },

        onTouchDragMove: function(transform) {
            var length = this.frameViews.length;
            var value = Math.round(this.initialFrameNumber + (transform.dragX / (this.contentWidth * 3) * length));
            this.frameNumber = Math.max(0, Math.min(length - 1, value));
            this.updateUI();
        },

        respondsToTouchGesture: function(gesture) {
            return gesture.type == Global.GestureStart.DRAG;
        },

        nextFrame: function() {
            if (!this.frameViews)
                return;
            this.frameNumber += this.direction;
            if (this.frameNumber < 0 || this.frameNumber >= this.frameViews.length) {
                this.direction *= -1;
                this.frameNumber = Math.max(0, Math.min(this.frameViews.length - 1, this.frameNumber));
            }
            this.updateUI();
        },

        installTimer: function() {
            if (this.animationTimer)
                return;
            this.animationTimer = setInterval(this.nextFrame.bind(this), 1000 / 30);
        },

        clearTimer: function() {
            if (!this.animationTimer)
                return;
            clearInterval(this.animationTimer);
            this.animationTimer = null;
        },

        play: function() {
            this.installTimer();
        },

        pause: function() {
            this.clearTimer();
        },

        playing: function() {
            return this.animationTimer !== null;
        }
    });

    Global.AnimationView = AnimationView;

})();
