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
    
    var TemplateView = {};

    $.extend(TemplateView, {
        className: function(typeName) {
            var parts = typeName.split("-");
            return $.map(parts, Global.Utils.upperCaseFirstLetter).join("") + "View";
        },
        convert: function(el) {
            var typeName = el.attr("data-role");
            if (!typeName)
                return false;
            var type = Global[TemplateView.className(typeName)];
            if (!type)
                return false;
            var newObject = Global.Utils.objectCreateShim(type.prototype);
            newObject.el = el;
            el.children().each(function(i, grandchildEl) {
                var el = $(grandchildEl);
                var childView = TemplateView.convert(el);
                if (!childView)
                    return;
                var viewName = el.attr("data-view");
                if (viewName)
                    newObject[viewName + "View"] = childView;
            });
            type.call(newObject);
            return newObject;
        }
    });

    Global.TemplateView = TemplateView;

})();
