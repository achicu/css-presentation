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
        convert: function(el) {
            var typeName = el.attr("data-role");
            if (!typeName)
                return false;
            var type = Global[Global.Utils.upperCaseFirstLetter(typeName) + "View"];
            if (!type)
                return false;
            var newObject = Global.Utils.objectCreateShim(type.prototype);
            newObject.el = el;
            type.call(newObject);
            el.children().each(function(i, grandchildEl) {
                TemplateView.convert($(grandchildEl));
            });
            return newObject;
        }
    });

    Global.TemplateView = TemplateView;

})();
