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
        searchChildren: function(parentView, parentEl, state) {
            var indirect = parentView.el.get(0) !== parentEl.get(0);
            parentEl.children().each(function(i, grandchildEl) {
                var el = $(grandchildEl),
                    childViews = TemplateView.convertInternal(el, state);
                if (childViews) {
                    for (var j = 0; j < childViews.length; ++j) {
                        var childView = childViews[j];
                        if (indirect)
                            parentView.addIndirectChild(childView);
                        var roleName = el.attr("data-role");
                        if (roleName)
                            parentView[roleName + "View"] = childView;
                    }
                    
                } else {
                    TemplateView.searchChildren(parentView, el, state);
                }
            });
        },
        convert: function(el) {
            return TemplateView.convertOne(el, { index: 0 });
        },

        convertOne: function(el, state) {
            var content = el.attr("data-content");
            if (content !== undefined) {
                var items = content.split(",");
                el.text(items[state.index]);
            }
            var isControl = false,
                typeName = el.attr("data-view");
            if (typeName === undefined) {
                typeName = el.attr("data-control");
                if (typeName !== undefined) {
                    isControl = true;
                } else {
                    if (el.attr("data-role") === undefined &&
                        el.attr("data-repeat") === undefined)
                        return false;
                    typeName = ""; // Default to base "View" class.
                }
            }
            var type = isControl ? Global.Controls.get(typeName) : Global[TemplateView.className(typeName)];
            if (!type)
                return false;
            var newObject = Global.Utils.objectCreateShim(type.prototype);
            newObject.el = el;
            TemplateView.searchChildren(newObject, el, state);
            type.call(newObject);
            if (isControl)
                newObject.initFromTemplate();
            TemplateView.installEvents(newObject, el);
            return newObject;
        },

        EventAttributePrefix: "data-on-",
        installEvents: function(childView, el) {
            $.each(el.get(0).attributes, function(i, attrib) {
                if (attrib.name.substr(0, TemplateView.EventAttributePrefix.length) != TemplateView.EventAttributePrefix)
                    return;
                var eventName = attrib.name.substr(TemplateView.EventAttributePrefix.length);
                var fn = new window.Function(attrib.value);
                childView.on(eventName, fn.bind(childView));
            });
        },

        convertInternal: function(el, state) {
            var count = el.attr("data-repeat");
            if (count === undefined) {
                var result = TemplateView.convertOne(el, state);
                if (!result)
                    return null;
                return [result];
            }
            var list = [];
            count = parseInt(count, 10);
            state = { index: 0 };
            var last = el;
            for (var i = 1; i < count; ++i) {
                var clonedEl = el.clone();
                last.after(clonedEl);
                state.index = i;
                clonedEl.addClass("repeated-item-" + i);
                list.push(TemplateView.convertOne(clonedEl, state));
                last = clonedEl;
            }
            state.index = 0;
            el.addClass("repeated-item-0");
            list.push(TemplateView.convertOne(el, state));
            return list;
        }
    });

    Global.TemplateView = TemplateView;

})();
