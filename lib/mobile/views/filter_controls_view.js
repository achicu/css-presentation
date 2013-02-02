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

    function FilterControlsView(containerView, filterListView, filter) {
        FilterControlsView.$super.call(this, Global.ScrollView.HORIZONTAL);
        this.containerView = containerView;
        this.filterListView = filterListView;
        this.layoutIgnore = true;
        this.el.css({
            "z-index": 100,
            "-webkit-transform-origin": "0 0"
        });
        this.filterListView.el.css({
            "z-index": 200,
            "-webkit-transform": "translateZ(2px)"
        });
        this.needsToFitInViewport = false;
        this.contentView.setLayout(new Global.HorizontalLayout());
        this.el.css({
            "width": "100%",
            "height": "150px"
        });
        this.on("afterresize", this.onAfterResize.bind(this));
        this.createControl();
        this.createControl();
    }
    Global.Utils.extend(FilterControlsView).from(Global.StepScrollView);
    
    $.extend(FilterControlsView.prototype, {
        createControl: function() {
            var controlView = new Global.View();
            controlView.el.css({
                "position": "absolute",
                "top": "0px",
                "height": "150px"
            });
            controlView.setLayout(new Global.VerticalLayout());

            var parameterView = new Global.View();
            parameterView.el.css({
                "width": "100%",
                "background": "-webkit-linear-gradient(bottom, rgba(255,255,255,1) 0%,rgba(255,255,255,0) 30%)"
            });
            parameterView.fillWidth = 1;
            parameterView.fillHeight = 1;
            var labelView = new Global.View();
            labelView.fillWidth = 1;
            labelView.el.css({
                "width": "100%",
                "height": "40px",
                "text-align": "center",
                "padding": "10px",
                "background": "gray",
                "color": "white"
            });
            labelView.el.append("Value label");

            controlView.append(parameterView);
            controlView.append(labelView);
            this.contentView.append(controlView);
        },

        updateTransform: function() {
            console.log(this.containerView.height(), this.filterListView.innerHeight(), this.innerHeight());
            this.el.css({
                "-webkit-transform": "translate3d(0, " + (this.containerView.height() - this.filterListView.innerHeight() - this.innerHeight()) + "px, 1px)"
            });
        },

        show: function() {
            this.el.css({
                "-webkit-transition": "-webkit-transform 0.3s linear",
                "-webkit-transform": "translate3d(0, " + this.containerView.height() + "px, 1px)"
            });
            this.containerView.el.append(this.el);
            this.relayout();
            var self = this;
            setTimeout(function() {
                self.updateTransform();
            }, 0);
        },

        hide: function() {
            this.css({
                "-webkit-transition": "-webkit-transform 0.3s linear",
                "-webkit-transform": "translate3d(0, " + this.containerView.height() + "px, 1px)"
            });
            var self = this;
            setTimeout(function() {
                self.el.remove();
            }, 300);
        },

        onAfterResize: function() {
            if (this.el.parent().length) {
                this.el.css("-webkit-transition", "none");
                this.updateTransform();
                this.relayout();
            }
        },

        relayout: function() {
            var width = this.width();
            this.contentView.forEachChild(function(childView){
                childView.css("width", width);
            });
            FilterControlsView.prototype.$super.relayout.call(this);
        }
    });

    Global.FilterControlsView = FilterControlsView;

})();