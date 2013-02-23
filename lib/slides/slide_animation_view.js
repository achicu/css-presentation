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

    function SlideAnimationView() {
        SlideAnimationView.$super.call(this);
        this.characterViews = this.el.find(".animation-view").map(function(i, dom) { return $(dom).data("view"); });
        this.transformViews = this.el.find(".transform-touch-area-view").map(function(i, dom) { return $(dom).data("view"); });
        this.playButtonView.on("tap", this.onToggleButtonTap.bind(this));
        this.playButtonTitleView = this.playButtonView.el.find(".title-view");
        this.resetButtonView.on("tap", this.resetAnimation.bind(this));
        this.on("reset", this.onSlideReset.bind(this));
        this.playing = false;
    }
    Global.Utils.extend(SlideAnimationView).from(Global.SlideView);

    $.extend(SlideAnimationView.prototype, {
        playAnimation: function() {
            this.playButtonTitleView.text("Pause");
            this.playing = true;
            this.characterViews.each(function(i, view) {
                view.play();
            });
        },

        pauseAnimation: function() {
            this.playButtonTitleView.text("Play");
            this.playing = false;
            this.characterViews.each(function(i, view) {
                view.pause();
            });
        },

        onToggleButtonTap: function() {
            if (this.playing)
                this.pauseAnimation();
            else
                this.playAnimation();
        },

        resetAnimation: function() {
            this.pauseAnimation();
            this.transformViews.each(function(i, view) {
                view.resetTransform();
            });
        },

        onSlideReset: function() {
            this.pauseAnimation();
        }
    });

    Global.SlideAnimationView = SlideAnimationView;

})();
