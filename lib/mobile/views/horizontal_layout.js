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

    function HorizontalLayout() {
        HorizontalLayout.$super.call(this);
    }
    Global.Utils.extend(HorizontalLayout).from(Global.ViewLayout);
    
    $.extend(HorizontalLayout.prototype, {
        updateChild: function(childView) {
            childView.el.css("position", "absolute");
        },

        layout: function() {
            var left = 0, height = 0;
            this.view.forEachChild(function(childView) {
                childView.css("left", left + "px");
                left += childView.width();
                height = Math.max(childView.height());
            });
            this.view.css("width", left + "px");
            this.view.css("height", height + "px");
        }

    });

    Global.HorizontalLayout = HorizontalLayout;

})();