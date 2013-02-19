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
    
    function InfoBarView(documentView) {
        InfoBarView.$super.call(this, documentView);

        this.infoBarEl = $("#info-bar").detach();
        this.el.addClass("presenter-info-bar").append(this.infoBarEl);
        
        this.infoBarView = Global.TemplateView.convert(this.infoBarEl);

        documentView.on("slidechanged", this.onSlideChanged.bind(this));
        documentView.presenter.on("timeupdated", this.onTimeUpdated.bind(this));

        this.on("visibilitychanged", this.onInfoViewSlideVisiblityChanged.bind(this));
    }
    Global.Utils.extend(InfoBarView).from(Global.InfoView);

    $.extend(InfoBarView.prototype, {
        onSlideChanged: function() {
            if (!this.visible)
                return;
            this.infoBarView.slideNumberView.el.text(this.documentView.currentSlideNumber() + 1);
        },

        onTimeUpdated: function() {
            if (!this.visible)
                return;
            var presenter = this.documentView.presenter;
            this.infoBarView.minuteParentView.el
                .toggleClass("started", presenter.started);
            this.infoBarView.minuteView.el
                .text(Global.Utils.floorTimeToString(presenter.timeElapsed));
        },

        onInfoViewSlideVisiblityChanged: function() {
            this.onSlideChanged();
            this.onTimeUpdated();
        }
    });

    Global.InfoBarView = InfoBarView;

})();
