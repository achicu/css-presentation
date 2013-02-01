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

    function VerticalLayout() {
        VerticalLayout.$super.call(this);
        this.width = 0;
        this.height = 0;
    }
    Global.Utils.extend(VerticalLayout).from(Global.ViewLayout);
    
    $.extend(VerticalLayout.prototype, {
        updateChild: function(childView) {
            childView.el.css("position", "absolute");
        },

        layout: function() {
            var top = 0, width = 0;
            this.view.forEachChild(function(childView) {
                childView.css("top", top + "px");
                top += childView.height();
                width = Math.max(width, childView.width());
            });
            this.width = width;
            this.height = top;
            this.view.css("width", this.width + "px");
            this.view.css("height", this.height + "px");
        },

        viewWidth: function() {
            return this.width;
        },

        viewHeight: function() {
            return this.height;
        }
    });

    Global.VerticalLayout = VerticalLayout;

})();