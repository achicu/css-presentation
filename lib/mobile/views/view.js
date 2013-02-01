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

    function View() {
        View.$super.call(this);
        this.el = $("<div />").data("view", this);
    }
    Global.Utils.extend(View).from(Global.EventDispatcher);
    
    $.extend(View.prototype, {
        setParent: function(parent) {
            this.parent = parent;
        },

        append: function(child) {
            this.el.append(child);
        },

        forEachChild: function(fn) {
            var parentView = this;
            this.el.children().each(function(i, el) {
                var childView = $(el).data("view");
                if (!childView)
                    return;
                fn.call(parentView, childView);
            });
        },

        propagateResizedEvent: function() {
            this.fire("resize");
            this.forEachChild(function(childView) {
                childView.propagateResizedEvent();
            });
            this.fire("didresize");
        },

        installResizeEvent: function() {
            $(window).bind("resize", this.propagateResizedEvent.bind(this));
            setTimeout(this.propagateResizedEvent.bind(this), 0);
        }
    });

    Global.View = View;

})();