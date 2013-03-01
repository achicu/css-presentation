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

    function ViewLayout() {
        ViewLayout.$super.call(this);
        this.view = null;
    }
    Global.Utils.extend(ViewLayout).from(Global.EventDispatcher);

    $.extend(ViewLayout.prototype, {
        register: function(view) {
            this.view = view;
            this.view.el.addClass("view-layout");
            this.updateChildren();
        },

        updateChildren: function() {
            var parentViewLayout = this;
            this.view.forEachChild(function(childView) {
                parentViewLayout.updateChild(childView);
            });
        },

        childAdded: function(childView) {
            this.updateChild(childView);
        },

        layout: function() { },

        remove: function() {
            this.view.el.css("position", "");
            this.view = null;
        }
    });

    Global.ViewLayout = ViewLayout;

})();
