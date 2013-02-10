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

    function InfoView(documentView) {
        InfoView.$super.call(this);
        this.documentView = documentView;
        this.el.addClass("info-view");
        this.visible = false;
        this.wasVisible = false;
        this.removalTimer = null;
    }
    Global.Utils.extend(InfoView).from(Global.View);

    $.extend(InfoView.prototype, {
        attach: function() {
            if (this.visible)
                return;
            this.clearRemovalTimer();
            this.visible = true;
            this.documentView.append(this);
            this.relayout();
            this.documentView.el.css(Global.Utils.prefix({
                "transition": "none",
                "transform": "translate3d(0px, 0px, 0px)"
            }));
        },

        clearRemovalTimer: function() {
            if (!this.removalTimer)
                return;
            clearTimeout(this.removalTimer);
            this.removalTimer = null;
        },

        show: function() {
            this.clearRemovalTimer();
            this.documentView.el.css(Global.Utils.prefix({
                "transition": Global.Utils.prefixValue("transform 0.3s linear"),
                "transform": "translate3d(0px, " + (-this.height()) + "px, 0px)"
            }));
            this.wasVisible = true;
            this.documentView.disabled = true;
        },

        hide: function() {
            if (!this.visible)
                return;
            this.visible = false;
            this.wasVisible = false;
            this.documentView.el.css(Global.Utils.prefix({
                "transition": Global.Utils.prefixValue("transform 0.3s linear"),
                "transform": "translateZ(0px)"
            }));
            var self = this;
            this.clearRemovalTimer();
            this.removalTimer = setTimeout(function() {
                self.documentView.el.css(Global.Utils.prefix({
                    "transition": "none"
                }));
                self.el.detach();
                self.documentView.disabled = false;
            }, 300);
        },

        cancel: function() {
            if (!this.visible)
                return;
            this.visible = false;
            this.wasVisible = false;
            this.documentView.el.css(Global.Utils.prefix({
                "transition": "none",
                "transform": "translateZ(0px)"
            }));
            this.el.detach();
        },

        end: function(transform) {
            var minDrag = this.height() * 0.4;
            if ((!this.wasVisible && transform.dragY < - minDrag) || 
                (this.wasVisible && transform.dragY < minDrag)) 
                this.show();
            else
                this.hide();
        },

        update: function(transform) {
            var infoViewHeight = this.height();
            if ((this.wasVisible && (transform.dragY < 0 || transform.dragY > infoViewHeight)) ||
                (!this.wasVisible && (transform.dragY > 0 || transform.dragY < - infoViewHeight)))
                return;
            this.documentView.disabled = true;
            if (this.wasVisible)
                transform.dragY -= infoViewHeight;
            this.documentView.el.css(Global.Utils.prefix({
                "transition": "none",
                "transform": "translate3d(0, " + (transform.dragY) + "px, 0px)"
            }));
        },

        relayout: function() {
            InfoView.$super.prototype.relayout.call(this);
            this.documentView.el.css(Global.Utils.prefix({
                "transition": "none",
                "transform": "translate3d(0px, " + (-this.height()) + "px, 0px)"
            }));
        }
    });

    Global.InfoView = InfoView;

})();
