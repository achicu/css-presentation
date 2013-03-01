/*! CSSFilterLab - v0.1.0 - 2013-03-01
* http://html.adobe.com/webstandards/csscustomfilters/cssfilterlab/
* Copyright (c) 2013 Adobe Systems Inc.; Licensed Apache License 2.0 */

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

    var Global = window.Global = {};

    function objectCreateShim(proto) {
        if (Object.create)
            return Object.create(proto);
        function EmptyConstructor() {
        }
        EmptyConstructor.prototype = proto;
        return new EmptyConstructor();
    }

    if (!Function.prototype.bind) {
        Function.prototype.bind = function(thisObj) {
            var fn = this,
                argsToBind = Array.prototype.slice.call(arguments, 1);
            return function() {
                var fnArgs = Array.prototype.concat.call(argsToBind,
                    Array.prototype.slice.call(arguments, 0));
                fn.apply(thisObj, fnArgs);
            };
        };
    }

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(obj) {
            for (var i = 0; i < this.length; ++i)
                if (this[i] == obj)
                    return i;
            return -1;
        };
    }

    if (!window.console) {
        window.console = {
            error: function() { },
            log: function() { }
        };
    }

    var browserPrefix = null;
    var mappedBrowserProperties = ((function checkBrowserSupportedProperties(properties) {
        var style = window.getComputedStyle(document.body),
            pattern = /^-(webkit|moz|ms|o)-(.*)$/,
            result = {}, i, name;
        for (i = 0; i < style.length; ++i) {
            name = style[i];
            if (pattern.test(name)) {
                var match = name.match(pattern);
                result[match[2]] = name;
                if (!browserPrefix)
                    browserPrefix = match[1];
            }
        }
        if (browserPrefix) {
            for (i = 0; i < properties.length; ++i) {
                name = properties[i];
                result[name] = "-" + browserPrefix + "-" + name;
            }
        }
        return result;
    })(["transition"]));

    var UpperCasePrefixMap = {
        "webkit": "WebKit",
        "moz": "Moz",
        "ms": "Ms"
    };

    /*
     * Helper function to extend the prototype of a class from another base class
     * Global.Utils.extend(Cat).from(Animal);
     */
    Global.Utils = {

        extend: function(newClass) {
            return {
                from: function(baseClass) {
                    newClass.prototype = objectCreateShim(baseClass.prototype);
                    newClass.$super = baseClass;
                    newClass.prototype.$super = baseClass.prototype;
                }
            };
        },

        objectCreateShim: objectCreateShim,

        identity: function(a) { return a; },

        clone: function(a) {
            return $.extend(true, {}, a);
        },

        upperCaseFirstLetter: function(str) {
            if (!str.length)
                return str;
            return str.charAt(0).toUpperCase() + str.substr(1);
        },

        checkDefaultNumber: function(value, defaultValue) {
            value = parseFloat(value);
            return isNaN(value) ? defaultValue : value;
        },

        generateBase64Alphabet: function() {
            var a = {},
                charCodeUpperA = "A".charCodeAt(0),
                charCodeLowerA = "a".charCodeAt(0) - 26,
                charCode0 = "0".charCodeAt(0) - 52,
                i;
            for (i = 0; i < 26; ++i)
                a[i] = String.fromCharCode(charCodeUpperA + i);
            for (i = 26; i < 52; ++i)
                a[i] = String.fromCharCode(charCodeLowerA + i);
            for (i = 52; i < 62; ++i)
                a[i] = String.fromCharCode(charCode0 + i);
            a[62] = "+";
            a[63] = "/";
            return a;
        },

        encodeBase64: function(val) {
            if (!this._base64Alphabet)
                this._base64Alphabet = this.generateBase64Alphabet();
            var result = "",
                alphabet = this._base64Alphabet;
            for (var i = 0; i < val.length; i += 3) {
                // 1111 11 | 11 2222 | 22 22 33 | 33 3333
                // 1111 11 | 22 2222 | 33 33 33 | 44 4444
                var remaining = val.length - i,
                    a = val.charCodeAt(i),
                    b = (remaining > 1) ? val.charCodeAt(i + 1) : 0,
                    c = (remaining > 2) ? val.charCodeAt(i + 2) : 0,
                    x1 = (a & 0xFC) >> 2,
                    x2 = ((a & 0x3) << 4) | ((b & 0xF0) >> 4),
                    x3 = ((b & 0xF) << 2) | ((c & 0xC0) >> 6),
                    x4 = c & 0x3F;

                switch (remaining) {
                    case 1:
                        result += alphabet[x1] + alphabet[x2] + "==";
                        break;
                    case 2:
                        result += alphabet[x1] + alphabet[x2] + alphabet[x3] + "=";
                        break;
                    default:
                        result += alphabet[x1] + alphabet[x2] + alphabet[x3] + alphabet[x4];
                }
            }
            return result;
        },

        lookupPrefix: function(obj, name) {
            return obj[name] || obj[browserPrefix + Global.Utils.upperCaseFirstLetter(name)];
        },

        lookupUpperCasePrefix: function(obj, name) {
            return obj[name] || obj[UpperCasePrefixMap[browserPrefix] + name];
        },

        prefixValue: function(value) {
            return browserPrefix ? "-" + browserPrefix + "-" + value : value;
        },

        prefixOne: function(property) {
            var name = mappedBrowserProperties[property];
            return name ? name : property;
        },

        prefix: function(obj) {
            var newObj = {};
            $.each(obj, function(name, value) {
                newObj[Global.Utils.prefixOne(name)] = value;
            });
            return newObj;
        },

        applyFilterWithDropShadowWorkaround: function(el, newValue) {
            // Workaround for Safar bug when drop-shadow is not removed from the CoreAnimation layers.
            var dropShadowDetector = /drop\-shadow\((?:[^()]|\([^()]*\))*\)\s*$/;
            var filterProperty = Global.Utils.prefixOne("filter");
            var oldValue = el.css(filterProperty);
            var hadDropShadow = (oldValue !== null) && dropShadowDetector.test(oldValue);
            var hasDropShadow = (newValue !== null) && dropShadowDetector.test(newValue);
            if (hadDropShadow && !hasDropShadow)
                newValue += (newValue.length ? " " : "sepia(0) ") + "drop-shadow(0px 0px 0px transparent)";
            el.css(filterProperty, newValue);
        },

        insideRect: function(rect, point) {
            return (rect.left <= point.x) && (rect.right >= point.x) &&
                    (rect.top <= point.y) && (rect.bottom >= point.y);
        },

        readStorage: function(keyName, defaultValue) {
            if (!window.localStorage)
                return defaultValue;
            var value = window.localStorage.getItem(keyName);
            return (value === null) ? defaultValue : value;
        },

        readStorageInt: function(keyName, defaultValue) {
            return parseInt(Global.Utils.readStorage(keyName, defaultValue), 10);
        },

        readStorageBool: function(keyName, defaultValue) {
            return Global.Utils.readStorage(keyName, defaultValue ? "yes" : "no") == "yes";
        },

        readStorageJSON: function(keyName, defaultValue) {
            var value = Global.Utils.readStorage(keyName, defaultValue);
            if (typeof(value) == "string") {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    console.error("Error parsing JSON storage for ", keyName, e);
                    value = defaultValue;
                }
            }
            return value;
        },

        writeStorage: function(keyName, value) {
            if (!window.localStorage)
                return;
            window.localStorage.setItem(keyName, value);
        },

        writeStorageJSON: function(keyName, value) {
            this.writeStorage(keyName, JSON.stringify(value));
        },

        writeStorageBool: function(keyName, value) {
            Global.Utils.writeStorage(keyName, value ? "yes" : "no");
        },

        timeToString: function(time, floor) {
            var minute = Math.floor(time / 1000 / 60),
                second = time / 1000 - minute * 60;
            second = floor ? Math.floor(second) : Math.ceil(second);
            return minute + ":" + ((second < 10) ? "0" : "") + second;
        },

        floorTimeToString: function(time) {
            return Global.Utils.timeToString(time, true);
        }

    };

    if (!Function.prototype.bind) {
        Function.prototype.bind = function(thisObj) {
            var args = Array.prototype.slice.call(arguments, 1),
                fn = this;
            return function() {
                return fn.apply(thisObj, args.concat(Array.prototype.slice.call(arguments, 0)));
            };
        };
    }

})();

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

    function EventDispatcher() {
        this._events = {};
    }

    EventDispatcher.prototype = {
        fire: function(name, data) {
            var listeners = this.getListenersList(name),
                self = this;
            if (!listeners)
                return;
            listeners = $.map(listeners, function(fn) { return fn; });
            var prevented = false;
            $.each(listeners, function(i, fn) {
                var value = data ? fn.apply(this, data) : fn.call(this);
                if (value === false)
                    prevented = true;
            });
            return prevented;
        },

        fireLater: function(name, data) {
            var self = this;
            setTimeout(function() {
                self.fire(name, data);
            }, 0);
        },

        getListenersList: function(name, create) {
            if (create && !this._events[name])
                this._events[name] = [];
            return this._events[name];
        },

        on: function(name, fn) {
            var listeners = this.getListenersList(name, true);
            if (listeners.indexOf(fn) != -1)
                return;
            listeners.push(fn);
            return fn;
        },

        off: function(name, fn) {
            var listeners = this.getListenersList(name),
                index = listeners.indexOf(fn);
            if (index == -1)
                return;
            listeners.splice(index, 1);
            return fn;
        }
    };

    Global.EventDispatcher = EventDispatcher;

})();

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

    function ViewUpdater() {
        ViewUpdater.$super.call(this);
        this.requestedUpdateFrame = false;
        this.timerCallback = this.onTimerFired.bind(this);
        this.changes = [];
        this.animationCallbacks = [];
        this.animationFrameRequest = null;
        this.requestAnimationFrameCallback = this.onAnimationFrame.bind(this);
    }
    Global.Utils.extend(ViewUpdater).from(Global.EventDispatcher);

    ViewUpdater.requestAnimationFrame = Global.Utils.lookupPrefix(window, "requestAnimationFrame");
    if (!ViewUpdater.requestAnimationFrame) {
        ViewUpdater.requestAnimationFrame = function(fn) {
            return setTimeout(fn, 0);
        };
    }

    $.extend(ViewUpdater.prototype, {
        register: function(view) {
            this.installTimer();
            this.changes.push(view);
        },

        update: function() {
            var changes = this.changes;
            this.changes = [];
            for (var i = 0; i < changes.length; ++i) {
                var view = changes[i];
                var pendingProperties = view.pendingProperties;
                if (!pendingProperties)
                    continue;
                view.pendingProperties = null;
                for (var property in pendingProperties) {
                    if (!pendingProperties.hasOwnProperty(property))
                        continue;
                    view.el.css(property, pendingProperties[property]);
                }
            }
        },

        onTimerFired: function() {
            this.requestedUpdateFrame = false;
            this.update();
        },

        installTimer: function() {
            if (this.requestedUpdateFrame)
                return;
            this.requestedUpdateFrame = true;
            this.requestAnimationFrame(this.timerCallback);
        },

        onAnimationFrame: function() {
            var callbacks = this.animationCallbacks;
            this.animationCallbacks = [];
            this.animationFrameRequest = null;
            for (var i = 0; i < callbacks.length; ++i)
                callbacks[i]();
        },

        requestAnimationFrame: function(callback) {
            if (!this.animationFrameRequest)
                this.animationFrameRequest = ViewUpdater.requestAnimationFrame.call(window, this.requestAnimationFrameCallback);
            this.animationCallbacks.push(callback);
        }
    });

    ViewUpdater.instance = new ViewUpdater();

    function fixFloatValue(value) {
        if (!value || value === "" || value === "auto")
            return 0;
        return parseFloat(value);
    }

    function View() {
        View.$super.call(this);
        if (!this.el)
            this.el = $("<div />");
        this.el.addClass("view").data("view", this);
        this.layout = null;
        this.pendingProperties = null;
    }
    Global.Utils.extend(View).from(Global.EventDispatcher);

    $.extend(View.prototype, {
        setParent: function(parent) {
            this.parent = parent;
        },

        append: function(childView) {
            this.el.append(childView.el);
            if (this.layout)
                this.layout.childAdded(childView);
        },

        prepend: function(childView) {
            this.el.prepend(childView.el);
            if (this.layout)
                this.layout.childAdded(childView);
        },

        before: function(childView, otherChild) {
            otherChild.el.before(childView.el);
            if (this.layout)
                this.layout.childAdded(childView);
        },

        addIndirectChild: function(child) {
            if (!this.indirectChildren)
                this.indirectChildren = [];
            this.indirectChildren.push(child);
        },

        parentView: function() {
            for (var node = this.el.parent(); node.length; node = node.parent()) {
                var view = node.data("view");
                if (view)
                    return view;
            }
            return null;
        },

        mainView: function() {
            var mainView = this;
            do {
                var newParent = mainView.parentView();
                if (!newParent)
                    return mainView;
                mainView = newParent;
            } while (true);
        },

        forEachChild: function(fn) {
            var parentView = this, index = 0;
            this.el.children().each(function(i, el) {
                var childView = $(el).data("view");
                if (!childView)
                    return;
                return fn.call(parentView, childView, index++);
            });
            if (this.indirectChildren) {
                $.each(this.indirectChildren, function(i, childView) {
                    return fn.call(parentView, childView, index++);
                });
            }
        },

        setLayout: function(newLayout) {
            if (this.layout) {
                this.oldLayout = this.layout;
                this.layout = null;
            }
            if (newLayout) {
                this.layout = newLayout;
                this.layout.register(this);
            }
        },

        propagateResizedEvent: function() {
            this.fire("resize");
            this.forEachChild(function(childView) {
                childView.propagateResizedEvent();
            });
            this.fire("afterresize");
        },

        propagateLayoutEvent: function() {
            this.fire("afterlayout");
            this.forEachChild(function(childView) {
                childView.propagateLayoutEvent();
            });
        },

        propagateEvent: function(eventName, eventObject) {
            if (this.fire(eventName, eventObject))
                return false;
            this.forEachChild(function(childView) {
                return childView.propagateEvent(eventName, eventObject);
            });
        },

        css: function(property, value) {
            property = Global.Utils.prefixOne(property);
            if (value === undefined) {
                return this.pendingProperties && this.pendingProperties.hasOwnProperty(property) ?
                            this.pendingProperties[property] :
                            this.el.css(property);
            }
            if (!this.pendingProperties) {
                this.pendingProperties = {};
                ViewUpdater.instance.register(this);
            }
            // Stack changes and execute them all at once, to avoid intermediate layouts.
            this.pendingProperties[property] = value;
            return this;
        },

        margin: function(side) {
            return fixFloatValue(this.el.css("margin-" + side));
        },

        elementWidth: function() {
            return this.innerWidth() + this.margin("left") + this.margin("right");
        },

        innerWidth: function() {
            var width = this.css("width");
            return (width == "auto" || /\\%$"/.test(width)) ? this.el.get(0).offsetWidth : parseFloat(width);
        },

        elementHeight: function() {
            return this.innerHeight() + this.margin("top") + this.margin("bottom");
        },

        innerHeight: function() {
            var height = this.css("height");
            return (height == "auto" || /\\%$"/.test(height)) ? this.el.get(0).offsetHeight : parseFloat(height);
        },

        getBoundingRect: function() {
            return {
                left: fixFloatValue(this.css("left")),
                top: fixFloatValue(this.css("top")),
                width: this.width(),
                height: this.height()
            };
        },

        width: function() {
            return this.elementWidth();
        },

        height: function() {
            return this.elementHeight();
        },

        widthWithMarginCollapsing: function(prevMargin) {
            // prevMargin + currentMargin -> collapsedMargin
            var currentMargin = this.margin("left");
            var collapsedMargin = Math.max(prevMargin, currentMargin);
            return this.width() + (collapsedMargin - currentMargin - prevMargin);
        },

        heightWithMarginCollapsing: function(prevMargin) {
            // prevMargin + currentMargin -> collapsedMargin
            var currentMargin = this.margin("top");
            var collapsedMargin = Math.max(prevMargin, currentMargin);
            return this.height() + (collapsedMargin - currentMargin - prevMargin);
        },

        fillParent: function() {
            this.fillWidth = this.fillHeight = 1;
            this.el.css(Global.Utils.prefix({
                "position": "absolute",
                "width": "100%",
                "height": "100%"
            }));
        },

        internalRelayout: function() {
            if (this.oldLayout) {
                this.oldLayout.remove();
                this.oldLayout = null;
            }
            if (this.layout) {
                this.layout.layout();
                return;
            }
            this.forEachChild(function(childView) {
                childView.internalRelayout();
            });
        },

        relayout: function() {
            this.internalRelayout();
            ViewUpdater.instance.update();
            this.propagateLayoutEvent();
        },

        relayoutParent: function() {
            var parent = this.parentView();
            if (parent)
                parent.relayoutParent();
            else
                this.relayout();
        },

        requestAnimationFrame: function(callback) {
            ViewUpdater.instance.requestAnimationFrame(callback);
        }
    });

    Global.ViewUpdater = ViewUpdater;
    Global.View = View;

})();

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

    function HorizontalLayout() {
        HorizontalLayout.$super.call(this);
    }
    Global.Utils.extend(HorizontalLayout).from(Global.ViewLayout);

    $.extend(HorizontalLayout.prototype, {
        updateChild: function(childView) {
            childView.el.css("position", "absolute");
        },

        remove: function() {
            this.view.forEachChild(function(childView) {
                if (childView.layoutIgnore)
                    return;
                if (childView.fillWidth)
                    childView.css("width", "");
                childView.css("left", "");
            });
            this.view.css("width", "");
            if (this.view.takesHeightFromChildren)
                this.view.css("height", "");
            HorizontalLayout.prototype.$super.remove.call(this);
        },

        layout: function() {
            var left = 0, height = 0;
            var fillers = [], fillSum = 0, prevSibilingMargin = 0;
            this.view.forEachChild(function(childView) {
                if (childView.layoutIgnore)
                    return;
                if (childView.fillWidth) {
                    fillSum += childView.fillWidth;
                    fillers.push(childView);
                    left += Math.max(prevSibilingMargin, childView.margin("left")) - prevSibilingMargin + childView.margin("right");
                    prevSibilingMargin = childView.margin("right");
                    return;
                }
                childView.css("left", (left - prevSibilingMargin) + "px");
                childView.internalRelayout();
                left += childView.widthWithMarginCollapsing(prevSibilingMargin);
                prevSibilingMargin = childView.margin("right");
                height = Math.max(height, childView.height());
            });
            if (fillers.length) {
                // We got to distribute the remaining width to the blocks.
                var remainingWidth = this.view.elementWidth() - left;
                var widthUnit = remainingWidth / fillSum;
                left = 0;
                prevSibilingMargin = 0;
                this.view.forEachChild(function(childView) {
                    if (childView.layoutIgnore)
                        return;
                    childView.css("left", (left - prevSibilingMargin) + "px");
                    var width;
                    if (childView.fillWidth) {
                        width = childView.fillWidth * widthUnit;
                        childView.css("width", width);
                        width += Math.max(prevSibilingMargin, childView.margin("left")) - prevSibilingMargin + childView.margin("right");
                        childView.internalRelayout();
                    } else {
                        width = childView.widthWithMarginCollapsing(prevSibilingMargin);
                    }
                    left += width;
                    prevSibilingMargin = childView.margin("right");
                    height = Math.max(height, childView.height());
                });
            } else
                this.view.css("width", left + "px");

            if (this.view.takesHeightFromChildren)
                this.view.css("height", height + "px");
        }
    });

    Global.HorizontalLayout = HorizontalLayout;

})();

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

    function VerticalLayout() {
        VerticalLayout.$super.call(this);
    }
    Global.Utils.extend(VerticalLayout).from(Global.ViewLayout);

    $.extend(VerticalLayout.prototype, {
        updateChild: function(childView) {
            childView.el.css("position", "absolute");
        },

        remove: function() {
            this.view.forEachChild(function(childView) {
                if (childView.layoutIgnore)
                    return;
                if (childView.fillHeight)
                    childView.css("height", "");
                childView.css("top", "");
            });
            this.view.css("height", "");
            if (this.view.takesWidthFromChildren)
                this.view.css("width", "");
            VerticalLayout.prototype.$super.remove.call(this);
        },

        layout: function() {
            var top = 0, width = 0;
            var fillers = [], fillSum = 0, prevSibilingMargin = 0;
            this.view.forEachChild(function(childView) {
                if (childView.layoutIgnore)
                    return;
                if (childView.fillHeight) {
                    fillSum += childView.fillHeight;
                    fillers.push(childView);
                    top += Math.max(prevSibilingMargin, childView.margin("top")) - prevSibilingMargin + childView.margin("bottom");
                    return;
                }
                childView.css("top", (top - prevSibilingMargin) + "px");
                childView.internalRelayout();
                top += childView.heightWithMarginCollapsing(prevSibilingMargin);
                prevSibilingMargin = childView.margin("bottom");
                width = Math.max(width, childView.width());
            });
            if (fillers.length) {
                // We got to distribute the remaining height to the blocks.
                var height = this.view.elementHeight();
                var remainingHeight = height - top;
                var heightUnit = remainingHeight / fillSum;
                top = 0;
                prevSibilingMargin = 0;
                this.view.forEachChild(function(childView) {
                    if (childView.layoutIgnore)
                        return;
                    childView.css("top", (top - prevSibilingMargin) + "px");
                    var height;
                    if (childView.fillHeight) {
                        height = childView.fillHeight * heightUnit;
                        childView.css("height", height);
                        height += Math.max(prevSibilingMargin, childView.margin("top")) - prevSibilingMargin + childView.margin("bottom");
                        childView.internalRelayout();
                    } else {
                        height = childView.heightWithMarginCollapsing(prevSibilingMargin);
                    }
                    top += height;
                    prevSibilingMargin = childView.margin("bottom");
                    width = Math.max(width, childView.width());
                });
            } else {
                this.view.css("height", top + "px");
            }
            if (this.view.takesWidthFromChildren)
                this.view.css("width", width + "px");
        }
    });

    Global.VerticalLayout = VerticalLayout;

})();

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

    function Touch(identifier) {
        this.identifier = identifier;
        this.startPosition = null;
        this.currentPosition = null;
        this.state = null;
        this.type = Touch.TOUCH;
        this.dragSurface = null;
        this.previewBox = null;
        this.animationFrameRequested = false;
    }

    Touch.preview = Global.Utils.readStorageBool(Touch.previewStorageKey, true);

    Touch.togglePreview = function() {
        Touch.preview = !Touch.preview;
        Global.Utils.writeStorageBool(Touch.previewStorageKey, Touch.preview);
    };

    Touch.previewBoxesPool = [];
    Touch.popPreviewBox = function() {
        var item = Touch.previewBoxesPool.pop();
        if (!item)
            item = $("<div />").addClass("touch-preview").appendTo(document.body);
        return item;
    };

    Touch.pushPreviewBox = function(view) {
        Touch.previewBoxesPool.push(view);
    };

    $.extend(Touch.prototype, {
        attachToSurface: function(view) {
            this.dragSurface = view;
            Touch.injectLocalPoints(view, this.startPosition);
            Touch.injectLocalPoints(view, this.currentPosition);
        },

        update: function(currentPosition) {
            this.currentPosition = currentPosition;
            var surface = this.dragSurface || this.view;
            if (surface)
                Touch.injectLocalPoints(surface, this.currentPosition);
            this.updatePreviewBox();
        },

        createPreviewBox: function() {
            if (this.previewBox)
                return;
            this.previewBox = Touch.popPreviewBox();
            this.previewBox.css("opacity", 1);
        },

        updatePreviewBox: function() {
            if (!Touch.preview)
                return;
            if (this.animationFrameRequested)
                return;
            var self = this;
            Global.ViewUpdater.instance.requestAnimationFrame(function() {
                self.animationFrameRequested = false;
                if (self.state == Touch.END || self.state == Touch.CANCELED)
                    return self.removePreviewBox();
                self.createPreviewBox();
                self.previewBox.css(Global.Utils.prefixOne("transform"),
                    "translate3d(" + self.currentPosition.pageX + "px, " + self.currentPosition.pageY + "px, 0px)");
            });
        },

        removePreviewBox: function() {
            if (!this.previewBox)
                return;
            this.previewBox.css("opacity", 0);
            Touch.pushPreviewBox(this.previewBox);
            this.previewBox = null;
        }
    });

    Touch.Point = Global.Utils.lookupUpperCasePrefix(window, "Point");
    Touch.convertPointFromPageToNode = Global.Utils.lookupPrefix(window, "convertPointFromPageToNode");

    Touch.getPosition = function(touch) {
        var touchPos = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            pageX: touch.pageX,
            pageY: touch.pageY,
            screenX: touch.screenX,
            screenY: touch.screenY,
            localX: touch.pageX,
            localY: touch.pageY,
            parentX: touch.pageX,
            parentY: touch.pageY,
            time: Date.now()
        };
        return touchPos;
    };

    Touch.getPointerPosition = function(touch) {
        var touchPos = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            pageX: touch.pageX,
            pageY: touch.pageY,
            screenX: touch.screenX,
            screenY: touch.screenY,
            localX: touch.offsetX,
            localY: touch.offsetY,
            parentX: touch.pageX,
            parentY: touch.pageY,
            time: Date.now()
        };
        return touchPos;
    };

    Touch.injectLocalPoints = function(view, touch) {
        if (Touch.Point) {
            var point = new Touch.Point();
            point.x = touch.pageX;
            point.y = touch.pageY;
            var localPoint = Touch.convertPointFromPageToNode.call(window, view.el.get(0), point);
            var parentPoint = Touch.convertPointFromPageToNode.call(window, view.el.get(0).parentNode, point);
            touch.localX = localPoint.x;
            touch.localY = localPoint.y;
            touch.parentX = parentPoint.x;
            touch.parentY = parentPoint.y;
        }
        return touch;
    };

    Touch.START = "start";
    Touch.MOVE = "move";
    Touch.END = "end";
    Touch.CANCELED = "canceled";

    Touch.TOUCH = "touch";
    Touch.MOUSE = "mouse";

    Global.Touch = Touch;

})();

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

    function TouchViewManager() {
        this.touchEvents = {
            onPointerDown: this.onPointerDown.bind(this),
            onPointerMove: this.onPointerMove.bind(this),
            onPointerUp: this.onPointerUp.bind(this),
            onPointerCancel: this.onPointerCancel.bind(this),

            onTouchStart: this.onTouchStart.bind(this),
            onTouchMove: this.onTouchMove.bind(this),
            onTouchEnd: this.onTouchEnd.bind(this),
            onTouchCancel: this.onTouchCancel.bind(this),

            onMouseDown: this.onMouseDown.bind(this),
            onMouseMove: this.onMouseMove.bind(this),
            onMouseUp: this.onMouseUp.bind(this)
        };
        this.mouseEvent = null;
        this.touchPointsSet = {};
        this.touchPoints = [];
        this.pointerEventsInstalled = false;
        this.touchEventsInstalled = false;
        this.mouseEventsInstalled = false;
        this.captureTouchSurface = null;

        this.installPointerTrackingEvents();
        this.installTouchTrackingEvents();
        this.installMouseTrackingEvents();
    }
    Global.Utils.extend(TouchViewManager).from(Global.EventDispatcher);

    $.extend(TouchViewManager.prototype, {

        findTouch: function(identifier) {
            return this.touchPointsSet[identifier];
        },

        setTouch: function(touch) {
            this.touchPointsSet[touch.identifier] = touch;
            this.touchPoints.push(touch);
        },

        cancelTouch: function(identifier) {
            var touch = this.findTouch(identifier);
            if (!touch)
                return;
            if (touch.view) {
                touch.view.removeTouch(touch);
                touch.view.fire("touchcanceled", [touch]);
            }
            this.removeTouch(touch);
            touch.state = Global.Touch.CANCELED;
            touch.updatePreviewBox();
        },

        removeTouch: function(touch) {
            this.touchPointsSet[touch.identifier] = null;
            var index = this.touchPoints.indexOf(touch);
            if (index != -1)
                this.touchPoints.splice(index, 1);
        },

        installPointerTrackingEvents: function() {
            if (this.pointerEventsInstalled)
                return;
            this.pointerEventsInstalled = true;
            window.addEventListener("MSPointerDown", this.touchEvents.onPointerDown, true);
            window.addEventListener("MSPointerMove", this.touchEvents.onPointerMove, true);
            window.addEventListener("MSPointerUp", this.touchEvents.onPointerUp, true);
            window.addEventListener("MSPointerCancel", this.touchEvents.onPointerCancel, true);
        },

        removePointerTrackingEvents: function() {
            if (!this.pointerEventsInstalled)
                return;
            this.pointerEventsInstalled = false;
            window.removeEventListener("MSPointerDown", this.touchEvents.onPointerDown, true);
            window.removeEventListener("MSPointerMove", this.touchEvents.onPointerMove, true);
            window.removeEventListener("MSPointerUp", this.touchEvents.onPointerUp, true);
            window.removeEventListener("MSPointerCancel", this.touchEvents.onPointerCancel, true);
        },

        installTouchTrackingEvents: function() {
            if (this.touchEventsInstalled)
                return;
            this.touchEventsInstalled = true;
            window.addEventListener("touchstart", this.touchEvents.onTouchStart, true);
            window.addEventListener("touchmove", this.touchEvents.onTouchMove, true);
            window.addEventListener("touchend", this.touchEvents.onTouchEnd, true);
            window.addEventListener("touchcancel", this.touchEvents.onTouchCancel, true);
        },

        removeTouchTrackingEvents: function() {
            if (!this.touchEventsInstalled)
                return;
            this.touchEventsInstalled = false;
            window.removeEventListener("touchstart", this.touchEvents.onTouchStart, true);
            window.removeEventListener("touchmove", this.touchEvents.onTouchMove, true);
            window.removeEventListener("touchend", this.touchEvents.onTouchEnd, true);
            window.removeEventListener("touchcancel", this.touchEvents.onTouchCancel, true);
        },

        installMouseTrackingEvents: function() {
            if (this.mouseEventsInstalled)
                return;
            this.mouseEventsInstalled = true;
            window.addEventListener("mousedown", this.touchEvents.onMouseDown, true);
            window.addEventListener("mousemove", this.touchEvents.onMouseMove, true);
            window.addEventListener("mouseup", this.touchEvents.onMouseUp, true);
        },

        removeMouseTrackingEvents: function() {
            if (!this.mouseEventsInstalled)
                return;
            this.mouseEventsInstalled = false;
            window.removeEventListener("mousedown", this.touchEvents.onMouseDown, true);
            window.removeEventListener("mousemove", this.touchEvents.onMouseMove, true);
            window.removeEventListener("mouseup", this.touchEvents.onMouseUp, true);
        },

        needsNativeTouch: function(event) {
            return (!this.captureTouchSurface && $(event.target).attr("data-native-touch") !== undefined);
        },

        removeFocus: function() {
            if (document.activeElement)
                $(document.activeElement).blur();
        },

        onPointerDown: function(event) {
            if (this.needsNativeTouch(event))
                return;
            this.removeFocus();
            
            if (this.findTouch(event.pointerId)) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
            var internalTouch = new Global.Touch(event.pointerId);
            internalTouch.view = null;
            internalTouch.state = Global.Touch.START;
            internalTouch.startPosition = internalTouch.currentPosition = Global.Touch.getPointerPosition(event);
            internalTouch.updatePreviewBox();
            this.setTouch(internalTouch);
        
            if (this.captureTouchSurface)
                this.captureTouchSurface.onPointerDownInternal(event);
        },

        onPointerMove: function(event) {
            var internalTouch = this.findTouch(event.pointerId);
            if (!internalTouch) {
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            internalTouch.state = Global.Touch.MOVE;
            internalTouch.update(Global.Touch.getPointerPosition(event));
            if (internalTouch.view)
                internalTouch.view.fire("touchmove", [internalTouch]);
        },

        onPointerUp: function(event) {
            var internalTouch = this.findTouch(event.pointerId);
            if (!internalTouch) {
                console.log("Unregister touch identifier detected for pointerup event", event);
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            internalTouch.state = Global.Touch.END;
            internalTouch.update(Global.Touch.getPointerPosition(event));
            this.removeTouch(internalTouch);
            if (internalTouch.view) {
                internalTouch.view.removeTouch(internalTouch);
                internalTouch.view.fire("touchend", [internalTouch]);
            }
        },

        onPointerCancel: function(event) {
            var internalTouch = this.findTouch(event.pointerId);
            if (!internalTouch) {
                console.log("Unregister touch identifier detected for pointercancel event", event);
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            internalTouch.state = Global.Touch.CANCELED;
            internalTouch.update(Global.Touch.getPointerPosition(event));
            this.removeTouch(internalTouch);
            if (internalTouch.view) {
                internalTouch.view.removeTouch(internalTouch);
                internalTouch.view.fire("touchcanceled", [internalTouch]);
            }
        },

        onTouchStart: function(event) {
            if (this.needsNativeTouch(event))
                return;
            this.removeFocus();
            var touches = event.changedTouches;
            for (var i = 0; i < touches.length; ++i) {
                var touch = touches[i];
                if (this.findTouch(touches[i].identifier)) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    continue;
                }
                var internalTouch = new Global.Touch(touches[i].identifier);
                internalTouch.view = null;
                internalTouch.state = Global.Touch.START;
                internalTouch.startPosition = internalTouch.currentPosition = Global.Touch.getPosition(touch);
                internalTouch.updatePreviewBox();
                this.setTouch(internalTouch);
            }
            if (this.captureTouchSurface)
                this.captureTouchSurface.onTouchStartInternal(event);
        },

        onTouchMove: function(event) {
            var touches = event.changedTouches;
            for (var i = 0; i < touches.length; ++i) {
                var touch = touches[i];
                var internalTouch = this.findTouch(touch.identifier);
                if (!internalTouch) {
                    console.log("Unregister touch identifier detected for touchmove event", touch);
                    continue;
                }
                event.preventDefault();
                event.stopImmediatePropagation();
                internalTouch.state = Global.Touch.MOVE;
                internalTouch.update(Global.Touch.getPosition(touch));
                if (internalTouch.view)
                    internalTouch.view.fire("touchmove", [internalTouch]);
            }
        },

        onTouchEnd: function(event) {
            var touches = event.changedTouches;
            for (var i = 0; i < touches.length; ++i) {
                var touch = touches[i];
                var internalTouch = this.findTouch(touch.identifier);
                if (!internalTouch) {
                    console.log("Unregister touch identifier detected for touchend event", touch);
                    continue;
                }
                event.preventDefault();
                event.stopImmediatePropagation();
                internalTouch.state = Global.Touch.END;
                internalTouch.update(Global.Touch.getPosition(touch));
                this.removeTouch(internalTouch);
                if (internalTouch.view) {
                    internalTouch.view.removeTouch(internalTouch);
                    internalTouch.view.fire("touchend", [internalTouch]);
                }
            }
        },

        onTouchCancel: function(event) {
            var touches = event.changedTouches;
            for (var i = 0; i < touches.length; ++i) {
                var touch = touches[i];
                var internalTouch = this.findTouch(touch.identifier);
                if (!internalTouch) {
                    console.log("Unregister touch identifier detected for touchcanceled event", touch);
                    continue;
                }
                event.preventDefault();
                event.stopImmediatePropagation();
                internalTouch.state = Global.Touch.CANCELED;
                internalTouch.update(Global.Touch.getPosition(touch));
                this.removeTouch(internalTouch);
                if (internalTouch.view) {
                    internalTouch.view.removeTouch(internalTouch);
                    internalTouch.view.fire("touchcanceled", [internalTouch]);
                }
            }
        },

        onMouseDown: function(event) {
            if (event.button)
                return;
            if (this.touchPoints.length) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
            if (this.needsNativeTouch(event))
                return;
            this.removeFocus();
            this.cancelTouch(Global.Touch.MOUSE);
            var internalTouch = new Global.Touch(Global.Touch.MOUSE);
            internalTouch.type = Global.Touch.MOUSE;
            internalTouch.view = null;
            this.mouseEvent = internalTouch;
            this.setTouch(internalTouch);
            internalTouch.startPosition = internalTouch.currentPosition = Global.Touch.getPosition(event);
            internalTouch.state = Global.Touch.START;
            internalTouch.updatePreviewBox();
            if (this.captureTouchSurface)
                this.captureTouchSurface.onMouseDown(event);
        },

        onMouseMove: function(event) {
            var internalTouch = this.findTouch(Global.Touch.MOUSE);
            if (!internalTouch) {
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            internalTouch.state = Global.Touch.MOVE;
            internalTouch.update(Global.Touch.getPosition(event));
            if (internalTouch.view)
                internalTouch.view.fire("touchmove", [internalTouch]);
        },

        onMouseUp: function(event) {
            this.mouseEvent = null;
            var internalTouch = this.findTouch(Global.Touch.MOUSE);
            if (!internalTouch) {
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            internalTouch.state = Global.Touch.END;
            internalTouch.update(Global.Touch.getPosition(event));
            this.removeTouch(internalTouch);
            if (internalTouch.view) {
                internalTouch.view.removeTouch(internalTouch);
                internalTouch.view.fire("touchend", [internalTouch]);
            }
        }

    });

    TouchViewManager.instance = new TouchViewManager();
    Global.TouchViewManager = TouchViewManager;

})();

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

    function TouchView(name) {
        TouchView.$super.call(this);
        this.el.addClass("touch-view");
        this.touchEvents = {
            onPointerDown: this.onPointerDown.bind(this),
            onTouchStart: this.onTouchStart.bind(this),
            onMouseDown: this.onMouseDown.bind(this),
            onClick: this.onClick.bind(this)
        };
        this.installTouchEvents();
        this.touchPointsSet = {};
        this.touchPoints = [];
    }
    Global.Utils.extend(TouchView).from(Global.View);

    $.extend(TouchView.prototype, {
        installTouchEvents: function() {
            this.el
                .bind("MSPointerDown", this.touchEvents.onPointerDown)
                .bind("touchstart", this.touchEvents.onTouchStart)
                .bind("mousedown", this.touchEvents.onMouseDown)
                .bind("click", this.touchEvents.onClick);
        },

        removeTouchEvents: function() {
            this.el
                .unbind("MSPointerDown", this.touchEvents.onPointerDown)
                .unbind("touchstart", this.touchEvents.onTouchStart)
                .unbind("mousedown", this.touchEvents.onMouseDown)
                .unbind("click", this.touchEvents.onClick);
        },

        removeTouch: function(touch) {
            this.touchPointsSet[touch.identifier] = null;
            var index = this.touchPoints.indexOf(touch);
            if (index != -1)
                this.touchPoints.splice(index, 1);
        },

        setTouch: function(touch) {
            this.touchPointsSet[touch.identifier] = touch;
            this.touchPoints.push(touch);
        },

        onPointerDownInternal: function(event) {
            event.preventDefault();
            event.stopImmediatePropagation();
            var internalTouch = Global.TouchViewManager.instance.findTouch(event.pointerId);
            if (!internalTouch) {
                console.log("Current view could not attach to pointer event.", event, this);
                return;
            }
            internalTouch.view = this;
            this.setTouch(internalTouch);
            this.fire("touchstart", [internalTouch]);
        },

        onPointerDown: function(event) {
            if ($(event.target).attr("data-native-touch") !== undefined)
                return;
            this.onPointerDownInternal(event.originalEvent);
        },

        onTouchStartInternal: function(event) {
            event.preventDefault();
            event.stopImmediatePropagation();

            var touches = event.changedTouches;
            for (var i = 0; i < touches.length; ++i) {
                var touch = touches[i];
                var internalTouch = Global.TouchViewManager.instance.findTouch(touch.identifier);
                if (!internalTouch) {
                    console.log("Current view could not attach to touch event.", touch, this);
                    continue;
                }
                internalTouch.view = this;
                this.setTouch(internalTouch);
                this.fire("touchstart", [internalTouch]);
            }
        },

        onTouchStart: function(event) {
            if ($(event.target).attr("data-native-touch") !== undefined)
                return;
            this.onTouchStartInternal(event.originalEvent);
        },

        onMouseDown: function(event) {
            if ($(event.target).attr("data-native-touch") !== undefined)
                return;
            event.preventDefault();
            event.stopImmediatePropagation();

            var internalTouch = Global.TouchViewManager.instance.findTouch(Global.Touch.MOUSE);
            if (!internalTouch) {
                console.log("Current view could not attach to mouse event.", event, this);
                return;
            }
            internalTouch.view = this;
            this.setTouch(internalTouch);
            this.fire("touchstart", [internalTouch]);
        },

        onClick: function(event) {
            if ($(event.target).attr("data-native-touch") !== undefined)
                return;
            event.preventDefault();
            event.stopImmediatePropagation();
        }

    });

    Global.TouchView = TouchView;

})();

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

    function dist(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }

    function angle(x1, y1, x2, y2) {
        var cos = (x1 * x2 + y1 * y2) / (dist(0, 0, x1, y1) * dist(0, 0, x2, y2));
        return Math.acos(cos) * 180 / Math.PI;
    }

    function rotation(x1, y1, x2, y2) {
        var angle1 = angle(1, 0, x1, y1);
        var angle2 = angle(1, 0, x2, y2);
        if (y1 > 0)
            angle1 = - angle1;
        if (y2 > 0)
            angle2 = - angle2;
        return angle1 - angle2;
    }

    function GestureStart(type, scrollX, scrollY) {
        this.type = type;
        this.scrollX = scrollX;
        this.scrollY = scrollY;
    }

    GestureStart.DRAG = "drag";
    GestureStart.TRANSFORM = "transform";

    /*
    Gesture types detected:
    1. Tap
    2. Long-tap
    3. Drag - Swipe
    4. Transform (move, scale, rotate)
    */
    function GestureView() {
        GestureView.$super.call(this);
        this.on("touchstart", this.onGestureTouchStart.bind(this));
        this.on("touchmove", this.onGestureTouchMove.bind(this));
        this.on("touchend", this.onGestureTouchEnd.bind(this));
        this.on("touchcanceled", this.onGestureTouchCanceled.bind(this));
        this.touchesStarted = 0;
        this.didStartDragging = false;
        this.didStartTransform = false;
        this.canTap = true;
        this.longTapDuration = 500;
        this.minDragLength = 10;
        this.longTapTimer = null;
        this.longTapTimerCallback = this.onLongTapTimer.bind(this);
        this.longTapTouch = null;
        this.touchParent = null;
        this.dragSurface = null;
        this.draggingTouch = null;
    }
    Global.Utils.extend(GestureView).from(Global.TouchView);

    $.extend(GestureView.prototype, {
        installGestureTimers: function(touch) {
            this.clearGestureTimers();
            this.longTapTouch = touch;
            this.longTapTimer = setTimeout(this.longTapTimerCallback, this.longTapDuration);
        },

        clearGestureTimers: function() {
            if (!this.longTapTimer)
                return;
            this.longTapTouch = null;
            clearTimeout(this.longTapTimer);
            this.longTapTimer = null;
        },

        installTransformCapture: function() {
            var parentTransformSurface = this.findParentTouchSurface(new GestureStart(GestureStart.TRANSFORM));
            if (parentTransformSurface && !parentTransformSurface.noTouchCapture)
                Global.TouchViewManager.instance.captureTouchSurface = this;
        },

        clearTransformCapture: function() {
            if (Global.TouchViewManager.instance.captureTouchSurface === this)
                Global.TouchViewManager.instance.captureTouchSurface = null;
        },

        computeGestureTransform: function() {
            var pointA = this.touchPoints[0];
            var pointB = this.touchPoints[1];

            var originX = (pointA.startPosition.localX + pointB.startPosition.localX) / 2;
            var originY = (pointA.startPosition.localY + pointB.startPosition.localY) / 2;

            var centerStartX = (pointA.startPosition.parentX + pointB.startPosition.parentX) / 2;
            var centerStartY = (pointA.startPosition.parentY + pointB.startPosition.parentY) / 2;
            var distanceStart = dist(pointA.startPosition.parentX, pointA.startPosition.parentY, pointB.startPosition.parentX, pointB.startPosition.parentY);

            var centerEndX = (pointA.currentPosition.parentX + pointB.currentPosition.parentX) / 2;
            var centerEndY = (pointA.currentPosition.parentY + pointB.currentPosition.parentY) / 2;
            var distanceEnd = dist(pointA.currentPosition.parentX, pointA.currentPosition.parentY, pointB.currentPosition.parentX, pointB.currentPosition.parentY);

            var vectorRotation = rotation(
                    pointB.startPosition.parentX - pointA.startPosition.parentX,
                    pointB.startPosition.parentY - pointA.startPosition.parentY,
                    pointB.currentPosition.parentX - pointA.currentPosition.parentX,
                    pointB.currentPosition.parentY - pointA.currentPosition.parentY
                );

            return {
                scale: (distanceStart > 0) ? (distanceEnd / distanceStart) : 0,
                dragX: centerEndX - centerStartX,
                dragY: centerEndY - centerStartY,
                originX: originX,
                originY: originY,
                rotation: vectorRotation
            };
        },

        computeDragTransform: function(touch) {
            return {
                dragX: touch.currentPosition.parentX - touch.startPosition.parentX,
                dragY: touch.currentPosition.parentY - touch.startPosition.parentY
            };
        },

        onGestureTouchStart: function(touch) {
            this.touchesStarted = (this.touchPoints.length == 1) ? 1 : (this.touchesStarted + 1);
            if (this.touchesStarted == 1) {
                this.installGestureTimers(touch);
                this.installTransformCapture();
                this.fire("tapstart", [touch]);
            } else if (!this.didStartTransform) {
                // Two finger gesture.
                if (this.didStartDragging) {
                    var oldDragTouch = this.touchPoints[0];
                    this.dragSurface.fire("touchdragend", [this.computeDragTransform(oldDragTouch), oldDragTouch, false]);
                    this.dragSurface = null;
                    this.didStartDragging = false;
                    oldDragTouch.startPosition = oldDragTouch.currentPosition;
                } else {
                    this.canTap = false;
                    this.fire("tapend", [touch]);
                }
                this.clearGestureTimers();
                this.dragSurface = this.findParentTouchSurface(new GestureStart(GestureStart.TRANSFORM));
                if (this.dragSurface) {
                    this.didStartTransform = true;
                    this.touchPoints[0].attachToSurface(this.dragSurface);
                    this.touchPoints[1].attachToSurface(this.dragSurface);
                    this.dragSurface.fire("touchtransformstart", [touch]);
                    this.clearTransformCapture();
                }
            }
        },

        cancelTransform: function() {
            if (!this.didStartTransform)
                return;
            this.didStartTransform = false;
            this.dragSurface = null;
        },

        onGestureTouchMove: function(touch) {
            if (this.didStartTransform) {
                // Interpret the tranform out of the first two touches.
                this.dragSurface.fire("touchtransform", [this.computeGestureTransform()]);
                return;
            }
            if (!this.didStartDragging && this.touchesStarted == 1) {
                var distanceX = Math.abs(touch.startPosition.pageX - touch.currentPosition.pageX);
                var distanceY = Math.abs(touch.startPosition.pageY - touch.currentPosition.pageY);
                if (distanceX > distanceY)
                    distanceY = 0;
                else
                    distanceX = 0;
                var scrollX = distanceX > this.minDragLength;
                var scrollY = distanceY > this.minDragLength;
                if (scrollX || scrollY) {
                    this.canTap = false;
                    this.fire("tapend", [touch]);
                    this.clearGestureTimers();
                    this.dragSurface = this.findParentTouchSurface(new GestureStart(GestureStart.DRAG, scrollX, scrollY));
                    if (this.dragSurface) {
                        touch.attachToSurface(this.dragSurface);
                        touch.dragStartTime = touch.currentPosition.time - touch.startPosition.time;
                        this.didStartDragging = true;
                        this.dragSurface.draggingTouch = touch;
                        this.dragSurface.fire("touchdragstart", [touch]);
                    }
                }
            }
            if (this.didStartDragging && touch === this.dragSurface.draggingTouch)
                this.dragSurface.fire("touchdragmove", [this.computeDragTransform(touch), touch]);
        },

        startDraggingFromLongTap: function() {
            var touch = this.touchPoints[0];
            if (!touch)
                return;
            this.canTap = false;
            this.fire("tapend", [touch]);
            this.clearGestureTimers();
            this.dragSurface = this;
            this.didStartDragging = true;
            touch.attachToSurface(this.dragSurface);
            touch.dragStartTime = touch.currentPosition.time - touch.startPosition.time;
            this.dragSurface.draggingTouch = touch;
            this.dragSurface.fire("touchdragstart", [touch]);
        },

        onLongTapTimer: function() {
            this.clearGestureTimers();
            this.fire("longtaptimer", [this.longTapTouch]);
            if (!this.el.parent().length)
                this.clearTransformCapture();
        },

        onGestureTouchEnd: function(touch) {
            this.clearGestureTimers();
            if (this.didStartTransform) {
                if (this.touchPoints.length == 1) {
                    this.dragSurface.fire("touchtransformend", [touch]);
                    // One touch remaining, go back to dragging.
                    this.didStartTransform = false;
                    this.didStartDragging = false;
                    this.dragSurface = null;
                    this.installTransformCapture();
                }
            } else if (this.canTap) {
                this.fire("tapend", [touch]);
                // We only had one touch during this interval. Figure out if it's a tap or
                // a long-tap and fire the event.
                var touchDuration = touch.currentPosition.time - touch.startPosition.time;
                this.fireLater((touchDuration < this.longTapDuration) ? "tap" : "longtap", [touch]);
            }
            if (!this.touchPoints.length) {
                if (this.didStartDragging)
                    this.dragSurface.fire("touchdragend", [this.computeDragTransform(touch), touch, true]);
                else if (this.didStartTransform)
                    this.dragSurface.fire("touchtransformend", [touch]);
                this.finishGesture(touch);
            }
        },

        finishGesture: function(touch) {
            if (this.dragSurface) {
                this.dragSurface.draggingTouch = null;
                this.dragSurface.fire("gestureend", [touch]);
                this.dragSurface = null;
            }
            this.didStartTransform = false;
            this.didStartDragging = false;
            this.touchesStarted = 0;
            this.canTap = true;
            this.clearTransformCapture();
        },

        onGestureTouchCanceled: function(touch) {
            this.onGestureTouchEnd(touch);
        },

        respondsToTouchGesture: function(gesture) {
            return false;
        },

        findParentTouchSurface: function(gesture) {
            //console.log("looking for ", gesture, gesture.type);
            for (var node = this; node; node = node.parentView()) {
                //console.log("asking node ", node.el.get(0));
                if (node.respondsToTouchGesture && node.respondsToTouchGesture(gesture))
                    return node;
            }
            return null;
        }
    });

    Global.GestureView = GestureView;
    Global.GestureStart = GestureStart;

})();

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

    function PanView() {
        PanView.$super.call(this);

        this.shouldRestoreTransform = true;

        this.el.css(Global.Utils.prefix({
            "transform-origin": "0 0",
            "transform": "translateZ(0px)"
        }));

        this.on("touchdragstart", this.onPanViewTouchTransformStart.bind(this));
        this.on("touchdragend", this.onPanViewTouchTransformEnd.bind(this));
        this.on("touchdragmove", this.onTouchTransformMove.bind(this));
        this.on("gestureend", this.onGestureEnd.bind(this));

        this.startTransform = null;
        this.lastTransform = null;

        this.requestedAnimationFrame = false;
        this.moveTransform = null;
        this.onAnimationFrameCallback = this.onAnimationFrame.bind(this);

        this.disabled = false;
    }
    Global.Utils.extend(PanView).from(Global.GestureView);

    $.extend(PanView.prototype, {

        restoreTransform: function(el) {
            if (this.fire("transformend", [this.lastTransform]))
                return;
            if (this.shouldRestoreTransform) {
                this.el.css(Global.Utils.prefix({
                    "transition": Global.Utils.prefixValue("transform 0.5s ease-out"),
                    "transform": "translateZ(0px)"
                }));
            }
        },

        cloneTransform: function(el) {
            this.el.css(Global.Utils.prefixOne("transition"), "none");
            var transform = el.css(Global.Utils.prefixOne("transform"));
            return (transform == "none") ? "" : transform + " ";
        },

        onPanViewTouchTransformStart: function() {
            this.lastTransform = null;
            this.startTransform = this.cloneTransform(this.el);
        },

        onAnimationFrame: function() {
            this.requestedAnimationFrame = false;
            if (!this.moveTransform)
                return;
            var transform = this.moveTransform;
            this.moveTransform = null;
            this.lastTransform = transform;
            if (this.fire("transformchange", [transform]))
                return;
            this.el.css(Global.Utils.prefixOne("transform"),
                "translate(" + transform.dragX + "px, " + transform.dragY + "px) " +
                "translateZ(0px) " +
                this.startTransform
            );
        },

        onTouchTransformMove: function(transform) {
            this.moveTransform = transform;
            if (this.requestedAnimationFrame)
                return;
            this.requestedAnimationFrame = true;
            this.requestAnimationFrame(this.onAnimationFrameCallback);
        },

        onPanViewTouchTransformEnd: function() {
            this.moveTransform = null;
            this.restoreTransform(this.el);
        },

        onGestureEnd: function() {
            this.moveTransform = null;
        },

        respondsToTouchGesture: function(gesture) {
            if (this.disabled)
                return false;
            return (gesture.type == Global.GestureStart.DRAG);
        }

    });

    Global.PanView = PanView;

})();

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

    function TransformView() {
        TransformView.$super.call(this);

        this.shouldRestoreTransform = true;

        this.el.css(Global.Utils.prefix({
            "transform-origin": "0 0",
            "transform": "translateZ(0px)"
        }));

        this.on("touchtransformstart", this.onTransformViewTouchTransformStart.bind(this));
        this.on("touchtransformend", this.onTransformViewTouchTransformEnd.bind(this));
        this.on("touchtransform", this.onTouchTransformMove.bind(this));
        this.on("gestureend", this.onGestureEnd.bind(this));

        this.startTransform = null;
        this.lastTransform = null;

        this.requestedAnimationFrame = false;
        this.moveTransform = null;
        this.onAnimationFrameCallback = this.onAnimationFrame.bind(this);

        this.disabled = false;
    }
    Global.Utils.extend(TransformView).from(Global.GestureView);

    $.extend(TransformView.prototype, {

        restoreTransform: function(el) {
            if (this.fire("transformend", [this.lastTransform]))
                return;
            if (this.shouldRestoreTransform)
                this.resetTransform();
        },

        resetTransform: function() {
            this.el.css(Global.Utils.prefix({
                "transition": Global.Utils.prefixValue("transform 0.5s ease-out"),
                "transform": "translateZ(0px)"
            }));
        },

        cloneTransform: function(el) {
            this.el.css(Global.Utils.prefixOne("transition"), "none");
            var transform = el.css(Global.Utils.prefixOne("transform"));
            return (transform == "none") ? "" : transform + " ";
        },

        onTransformViewTouchTransformStart: function() {
            this.lastTransform = null;
            this.startTransform = this.cloneTransform(this.el);
        },

        onAnimationFrame: function() {
            this.requestedAnimationFrame = false;
            if (!this.moveTransform)
                return;
            var transform = this.moveTransform;
            this.moveTransform = null;
            this.lastTransform = transform;
            if (this.fire("transformchange", [transform]))
                return;
            this.el.css(Global.Utils.prefixOne("transform"),
                "translate(" + transform.dragX + "px, " + transform.dragY + "px) " +
                this.startTransform +
                "translate(" + (transform.originX) + "px, " + (transform.originY) + "px) " +
                "rotate(" + transform.rotation + "deg) " +
                "scale(" + transform.scale + ") " +
                "translate(" + (-transform.originX) + "px, " + (-transform.originY) + "px) " +
                "translateZ(0px) "
            );
        },

        onTouchTransformMove: function(transform) {
            this.moveTransform = transform;
            if (this.requestedAnimationFrame)
                return;
            this.requestedAnimationFrame = true;
            this.requestAnimationFrame(this.onAnimationFrameCallback);
        },

        onTransformViewTouchTransformEnd: function() {
            this.moveTransform = null;
            this.restoreTransform(this.el);
        },

        onGestureEnd: function() {
            this.moveTransform = null;
        },

        respondsToTouchGesture: function(gesture) {
            if (this.disabled)
                return false;
            return (gesture.type == Global.GestureStart.TRANSFORM);
        }

    });

    Global.TransformView = TransformView;

})();

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

    function direction(x) { return x >= 0 ? 1 : -1; }

    function ScrollView(type, canZoom) {
        ScrollView.$super.call(this);
        this.el.addClass("scroll-view");
        if (type === undefined)
            type = this.el.attr("data-type");
        if (canZoom === undefined)
            canZoom = this.el.attr("data-can-zoom") !== undefined;

        this.zoomFactor = 1;
        this.minZoomFactor = 0.5;
        this.maxZoomFactor = 1;
        this.transformX = 0;
        this.transformY = 0;

        this.canZoom = canZoom;
        this.scrollToCenter = this.el.attr("data-scroll-to-center") !== undefined;

        if (!this.contentView)
            this.contentView = new Global.View();
        this.contentEl = this.contentView.el.addClass("scroll-view-content-view").css(Global.Utils.prefix({
            "transform-origin": "0 50%",
            "transform": "translateZ(0px)"
        }));
        this.append(this.contentView);

        if (type != ScrollView.NONE) {
            this.on("touchdragstart", this.onTouchDragStart.bind(this));
            this.on("touchdragmove", this.onTouchDragMove.bind(this));
            this.on("touchdragend", this.onTouchDragEnd.bind(this));
        }

        if (canZoom) {
            this.on("touchtransformstart", this.onTouchTransformStart.bind(this));
            this.on("touchtransform", this.onTouchTransform.bind(this));
            this.on("touchtransformend", this.onTouchTransformEnd.bind(this));
        }

        this.startTransform = null;

        this.type = type;

        this.time = 300;
        this.minAcceleration = 1 / 100;
        this.friction = 0.01;
        this.needsToFitInViewport = true;

        this.requestedAnimationFrame = false;
        this.moveTransform = null;
        this.onAnimationFrameCallback = this.onAnimationFrame.bind(this);

        this.resetScrollSpeed();
        this.on("afterlayout", this.onScrollViewLayoutDone.bind(this));

        this._scrollWidth = 0;
        this._scrollHeight = 0;
        this._contentWidth = 0;
        this._contentHeight = 0;
    }
    Global.Utils.extend(ScrollView).from(Global.GestureView);

    ScrollView.NONE = "none";
    ScrollView.VERTICAL = "vertical";
    ScrollView.HORIZONTAL = "horizontal";
    ScrollView.BOTH = "both";

    $.extend(ScrollView.prototype, {
        resetScrollSpeed: function() {
            this.scrollDirection = { x: 0, y: 0 };
            this.scrollVelocity = { x: 0, y: 0 };
            this.scrollAcceleration = { x: 0, y: 0 };
            this.lastTouchPosition = { x: 0, y: 0 };
            this.lastTouchTime = null;
        },

        injectAnimationDelta: function(delta) {
            if (Math.abs(this.scrollAcceleration.x) > this.minAcceleration ||
                Math.abs(this.scrollAcceleration.y) > this.minAcceleration) {
                delta.x = this.scrollVelocity.x * this.time + this.scrollAcceleration.x * this.friction * this.time * this.time;
                delta.y = this.scrollVelocity.y * this.time + this.scrollAcceleration.y * this.friction * this.time * this.time;
            }
        },

        fixDeltaValue: function(delta) {
            if (this.updateScrollDrag) {
                var result = this.updateScrollDrag(delta);
                if (this.type != ScrollView.VERTICAL)
                    delta.x -= result.x;
                if (this.type != ScrollView.HORIZONTAL)
                    delta.y -= result.y;
            }
            this.fitDeltaInViewport(delta);
            if (this.zoomFactor < 0.7)
                delta.zoomFactor = 0.1;
            else
                delta.zoomFactor = 1000;
        },

        fitDeltaInViewport: function(delta) {
            if (!this.needsToFitInViewport)
                return;
            var transformDrag = delta.transformDrag;
            var newDragX = transformDrag.x + delta.x;
            var newDragY = transformDrag.y + delta.y;
            if (this.type != ScrollView.VERTICAL) {
                var clientWidth = this._scrollWidth;
                var contentWidth = this._contentWidth;
                if (newDragX > 0)
                    delta.x -= newDragX;
                else {
                    var minPositionX = Math.min(0, clientWidth - contentWidth);
                    if (newDragX < minPositionX)
                        delta.x -= newDragX - minPositionX;
                }
                if (this.scrollToCenter && contentWidth < clientWidth) {
                    // Center the content.
                    delta.x += (clientWidth - contentWidth) / 2;
                }
            } else {
                delta.x = -newDragX;
            }
            if (this.type != ScrollView.HORIZONTAL) {
                var clientHeight = this._scrollHeight;
                var contentHeight = this._contentHeight;
                if (newDragY > 0)
                    delta.y -= newDragY;
                else {
                    var minPositionY = Math.min(0, clientHeight - contentHeight);
                    if (newDragY < minPositionY)
                        delta.y -= newDragY - minPositionY;
                }
                if (this.scrollToCenter && contentHeight < clientHeight) {
                    // Center the content.
                    delta.y += (clientHeight - contentHeight) / 2;
                }
            } else {
                delta.y = -newDragY;
            }
        },

        createDeltaValue: function(startTransform) {
            return {
                x: 0,
                y: 0,
                zoomFactor: 1,
                transformDrag: startTransform || this.cloneTransform()
            };
        },

        updateTransform: function(delta) {
            this.transformX = delta.x + delta.transformDrag.x;
            this.transformY = delta.y + delta.transformDrag.y;
            this.zoomFactor = Math.max(this.minZoomFactor,
                Math.min(this.maxZoomFactor, delta.zoomFactor * delta.transformDrag.zoomFactor));
            var zoom = this.canZoom ? "scale(" + this.zoomFactor + ") ": "";
            var transform = zoom + "translate3d(" + this.transformX.toFixed(5) + "px, " +
                this.transformY.toFixed(5) + "px, 0px)";
            this.contentEl.css(Global.Utils.prefixOne("transform"), transform);
        },

        restoreTransformWithAnimation: function() {
            this.moveTransform = null;
            var delta = this.createDeltaValue();
            this.injectAnimationDelta(delta);
            this.fixDeltaValue(delta);
            this.contentEl.css(Global.Utils.prefix({
                "transition": Global.Utils.prefixValue("transform " + (this.time / 1000) + "s ease-out")
            }));
            this.updateTransform(delta);
            this.fire("scrollend", [delta, true]);
        },

        restoreTransformWithNoAnimation: function() {
            this.moveTransform = null;
            this.contentEl.css(Global.Utils.prefixOne("transition"), "none");
            var delta = this.createDeltaValue();
            this.fixDeltaValue(delta);
            this.updateTransform(delta);
            this.fire("scrollend", [delta, false]);
        },

        cloneTransform: function() {
            return {
                x: this.transformX,
                y: this.transformY,
                zoomFactor: this.zoomFactor
            };
        },

        onTouchDragStart: function() {
            this.startTransform = this.cloneTransform();
            this.resetScrollSpeed();
        },

        computeTransformVelocity: function(transform) {
            switch (this.type) {
            case ScrollView.HORIZONTAL:
                transform.dragY = 0;
                break;
            case ScrollView.VERTICAL:
                transform.dragX = 0;
                break;
            }
            var scrollDirectionX = direction(transform.dragX),
                scrollDirectionY = direction(transform.dragY);
            if (scrollDirectionX != this.scrollDirection.x)
                this.scrollVelocity.x = 0;
            if (scrollDirectionY != this.scrollDirection.y)
                this.scrollVelocity.y = 0;
            var time = Date.now();
            if (this.lastTouchTime !== null) {
                var deltaTime = time - this.lastTouchTime;
                if (deltaTime) {
                    var velocityX = (transform.dragX - this.lastTouchPosition.x) / deltaTime,
                        velocityY = (transform.dragY - this.lastTouchPosition.y) / deltaTime;
                    this.scrollAcceleration.x = (velocityX - this.scrollVelocity.x) / deltaTime;
                    this.scrollAcceleration.y = (velocityY - this.scrollVelocity.y) / deltaTime;
                    this.scrollVelocity.x = velocityX;
                    this.scrollVelocity.y = velocityY;
                }
            }
            this.lastTouchPosition.x = transform.dragX;
            this.lastTouchPosition.y = transform.dragY;
            this.lastTouchTime = time;
        },

        onAnimationFrame: function() {
            this.requestedAnimationFrame = false;
            if (!this.moveTransform)
                return;
            var delta = this.createDeltaValue(this.startTransform);
            delta.x = this.moveTransform.dragX;
            delta.y = this.moveTransform.dragY;
            delta.zoomFactor = this.moveTransform.zoomFactor;
            if (this.fire("scroll", [delta]))
                return;
            this.contentEl.css(Global.Utils.prefixOne("transition"), "none");
            this.updateTransform(delta);
            this.moveTransform = null;
        },

        onTouchDragMove: function(transform, touch) {
            this.computeTransformVelocity(transform);
            this.moveTransform = transform;
            this.moveTransform.zoomFactor = 1;
            this.moveTransform.dragX /= this.zoomFactor;
            this.moveTransform.dragY /= this.zoomFactor;
            this.update();
        },

        update: function() {
            if (this.requestedAnimationFrame)
                return;
            this.requestedAnimationFrame = true;
            this.requestAnimationFrame(this.onAnimationFrameCallback);
        },

        onTouchDragEnd: function(transform, touch) {
            this.moveTransform = null;
            this.restoreTransformWithAnimation();
        },

        respondsToTouchGesture: function(gesture) {
            if (this.type == Global.ScrollView.NONE)
                return false;
            if (this.canZoom && gesture.type == Global.GestureStart.TRANSFORM)
                return true;
            return (gesture.type == Global.GestureStart.DRAG) &&
                ((this.type != Global.ScrollView.VERTICAL && gesture.scrollX) ||
                    (this.type != Global.ScrollView.HORIZONTAL && gesture.scrollY));
        },

        onScrollViewLayoutDone: function() {
            this.restoreTransformWithNoAnimation();
        },

        width: function() {
            if (this.type == ScrollView.VERTICAL && this.css("width") == "auto")
                return this.contentView.width() + this.margin("left") + this.margin("right");
            return this.elementWidth();
        },

        height: function() {
            if (this.type == ScrollView.HORIZONTAL && this.css("height") == "auto")
                return this.contentView.height() + this.margin("top") + this.margin("bottom");
            return this.elementHeight();
        },

        internalRelayout: function() {
            ScrollView.prototype.$super.internalRelayout.call(this);
            this._scrollWidth = this.width();
            this._scrollHeight = this.height();
            this._contentWidth = this.contentView.width();
            this._contentHeight = this.contentView.height();
        },

        relayoutParent: function() {
            this.relayout();
        },

        onTouchTransformStart: function(touch) {
            this.fire("touchdragstart", [touch]);
        },

        onTouchTransform: function(transform) {
            this.computeTransformVelocity(transform);
            this.moveTransform = transform;
            this.moveTransform.zoomFactor = transform.scale;
            this.moveTransform.dragX /= transform.scale;
            this.moveTransform.dragY /= transform.scale;
            this.update();
        },

        onTouchTransformEnd: function(touch) {
            this.fire("touchdragend", [touch]);
        }

    });

    Global.ScrollView = ScrollView;

})();

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

    function dist(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }

    function StepScrollView(type, canZoom) {
        StepScrollView.$super.call(this, type, canZoom);
        this.stepPoints = null;
        this.selectedIndex = 0;
        this.selectedView = null;
        this.maxScrollCount = null;
        this.afterSelectionEndTimer = null;
        this.afterSelectionEndData = null;
        this.onAfterSelectionEndCallback = this.onAfterSelectionEnd.bind(this);
    }
    Global.Utils.extend(StepScrollView).from(Global.ScrollView);

    StepScrollView.nullPoint = {
        x: 0,
        y: 0
    };

    $.extend(StepScrollView.prototype, {
        internalRelayout: function() {
            this.stepPoints = null;
            StepScrollView.prototype.$super.internalRelayout.call(this);
        },

        updateStepPoints: function() {
            if (this.stepPoints)
                return;
            var stepPoints = this.stepPoints = [];
            var collectX = this.type != Global.ScrollView.VERTICAL;
            var collectY = this.type != Global.ScrollView.HORIZONTAL;
            var hasValidStepPoints = false;
            this.contentView.forEachChild(function(view) {
                if (!view.stepPointIgnore)
                    hasValidStepPoints = true;
                // Collect all the mid points.
                var rect = view.getBoundingRect();
                stepPoints.push({
                    view: view,
                    x: collectX ? (rect.left + rect.width / 2) : 0,
                    y: collectY ? (rect.top + rect.height / 2) : 0
                });
            });
            this.hasValidStepPoints = hasValidStepPoints;
        },

        count: function() {
            this.updateStepPoints();
            return this.stepPoints.length;
        },

        updateSelectedView: function() {
            this.updateStepPoints();
            var newItem = this.stepPoints.length ? this.stepPoints[this.selectedIndex].view : null;
            if (newItem === this.selectedView)
                return;
            this.clearAfterSelectionEndTimer();
            var oldView = this.selectedView;
            this.selectedView = newItem;
            this.afterSelectionEndData = [newItem, oldView];
            this.fire("viewselected", this.afterSelectionEndData);
            this.afterSelectionEndTimer = setTimeout(this.onAfterSelectionEndCallback, this.time);
        },

        clearAfterSelectionEndTimer: function() {
            if (!this.afterSelectionEndTimer)
                return;
            clearTimeout(this.afterSelectionEndTimer);
            this.afterSelectionEndTimer = null;
            if (this.afterSelectionEndData) {
                var data = this.afterSelectionEndData;
                this.afterSelectionEndData = null;
                this.fire("afterviewselected", data);
            }
        },

        onAfterSelectionEnd: function() {
            this.clearAfterSelectionEndTimer();
        },

        prev: function() {
            this.setSelectedIndex(this.selectedIndex - 1);
        },

        next: function() {
            this.setSelectedIndex(this.selectedIndex + 1);
        },

        setSelectedItem: function(item, useAnimation) {
            this.updateStepPoints();
            var stepPoints = this.stepPoints;
            for (var i = 0; i < stepPoints.length; ++i) {
                if (stepPoints[i].view === item) {
                    this.setSelectedIndex(i);
                    return;
                }
            }
        },

        setSelectedIndex: function(index, useAnimation) {
            if (useAnimation === undefined)
                useAnimation = true;
            this.updateStepPoints();
            var stepPoints = this.stepPoints;
            var stepPoint;
            if (!stepPoints.length) {
                // Just recenter.
                stepPoint = StepScrollView.nullPoint;
            } else {
                if (index < 0 || index >= stepPoints.length)
                    return;
                stepPoint = stepPoints[index];
            }
            var delta = this.createDeltaValue();
            var transformDrag = delta.transformDrag;
            if (this.type != Global.ScrollView.VERTICAL)
                delta.x = (this._scrollWidth / 2 - stepPoint.x) - transformDrag.x;
            if (this.type != Global.ScrollView.HORIZONTAL)
                delta.y = (this._scrollHeight / 2 - stepPoint.y) - transformDrag.y;
            this.fitDeltaInViewport(delta);
            this.contentEl.css(Global.Utils.prefix({
                "transition": useAnimation ? Global.Utils.prefixValue("transform ") + (this.time / 1000) + "s ease-out" : "none"
            }));
            this.updateTransform(delta);
            this.selectedIndex = index;
            this.updateSelectedView(useAnimation);
            this.fire("scrollend", [delta, useAnimation]);
        },

        deltaToIndex: function(delta) {
            var transformDrag = delta.transformDrag,
                middPointX = this._scrollWidth / 2 - (transformDrag.x + delta.x),
                middPointY = this._scrollHeight / 2 - (transformDrag.y + delta.y);
            return this.lookupNearest({ x: middPointX, y: middPointY });
        },

        deltaToFloatIndex: function(delta) {
            var index = this.deltaToIndex(delta);
            if (index == -1)
                return -1;

            var collectX = this.type != Global.ScrollView.VERTICAL;
            var collectY = this.type != Global.ScrollView.HORIZONTAL;

            var transformDrag = delta.transformDrag,
                middPointX = collectX ? (this._scrollWidth / 2 - (transformDrag.x + delta.x)) : 0,
                middPointY = collectY ? (this._scrollHeight / 2 - (transformDrag.y + delta.y)) : 0;

            var stepPointBefore = index > 0 ? this.stepPoints[index - 1] : null,
                stepPoint = this.stepPoints[index],
                stepPointAfter = (index + 1 <= this.stepPoints.length - 1) ? this.stepPoints[index + 1] : null;

            var nextPoint = null,
                nextPointDistance = 0,
                nextPointDirection = 0;

            if (stepPointBefore) {
                nextPointDistance = dist(middPointX, middPointY, stepPointBefore.x, stepPointBefore.y);
                nextPointDirection = -1;
            } else if ((collectX && stepPoint.x > middPointX) ||
                    (collectY && stepPoint.y > middPointY)) {
                // Special case when scrolling towards -1.
                return index;
            }
            if (stepPointAfter) {
                var distance = dist(middPointX, middPointY, stepPointAfter.x, stepPointAfter.y);
                if (!stepPointBefore || distance < nextPointDistance) {
                    nextPointDistance = distance;
                    nextPointDirection = 1;
                }
            } else if ((collectX && stepPoint.x < middPointX) || 
                    (collectY && stepPoint.y < middPointY)) {
                // Special case when scrolling past the last slide.
                return index;
            }

            var stepPointDistance = dist(middPointX, middPointY, stepPoint.x, stepPoint.y);
            var totalDistance = nextPointDistance + stepPointDistance;

            return index + (totalDistance ? (stepPointDistance / totalDistance) * nextPointDirection : 0);
        },

        updateScrollDrag: function(delta) {
            var transformDrag = delta.transformDrag,
                middPointX = this._scrollWidth / 2 - (transformDrag.x + delta.x),
                middPointY = this._scrollHeight / 2 - (transformDrag.y + delta.y);
            var index = this.lookupNearest({ x: middPointX, y: middPointY });
            var stepPoint;
            if (index == -1) {
                // No step point. Just center the thing, by reverting any change.
                stepPoint = StepScrollView.nullPoint;
            } else {
                if (this.maxScrollCount !== null) {
                    var maxScrollCount = Math.ceil(this.maxScrollCount / this.zoomFactor);
                    index = Math.max(this.selectedIndex - maxScrollCount, Math.min(this.selectedIndex + maxScrollCount, index));
                }
                this.selectedIndex = index;
                stepPoint = this.stepPoints[index];
            }
            this.updateSelectedView(true);
            return {
                x: stepPoint.x - middPointX,
                y: stepPoint.y - middPointY
            };
        },

        lookupNearest: function(point) {
            this.updateStepPoints();
            var stepPoints = this.stepPoints;
            var minDistance = Number.MAX_VALUE, minDistancePoint = -1;
            for (var i = 0; i < stepPoints.length; ++i) {
                var stepPoint = stepPoints[i];
                if (this.hasValidStepPoints && stepPoint.view.stepPointIgnore)
                    continue;
                var distance = dist(point.x, point.y, stepPoint.x, stepPoint.y);
                if (minDistance > distance) {
                    minDistance = distance;
                    minDistancePoint = i;
                }
            }
            return minDistancePoint;
        },

        onScrollViewLayoutDone: function() {
            this.setSelectedIndex(this.selectedIndex, false);
        },

        relayoutParent: function() {
            this.stepPoints = null;
            this.relayout();
        }
    });

    Global.StepScrollView = StepScrollView;

})();

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

    function ListItemView(type) {
        ListItemView.$super.call(this, Global.ScrollView.VERTICAL);
    }
    Global.Utils.extend(ListItemView).from(Global.StepScrollView);

    $.extend(ListItemView.prototype, {

    });

    Global.ListItemView = ListItemView;

})();

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

    function HighlightTouchView() {
        HighlightTouchView.$super.call(this);
        this.on("tapstart", this.onTapStart.bind(this));
        this.on("longtaptimer", this.onLongTap.bind(this));
        this.on("tapend", this.onTapEnd.bind(this));
        this.el.addClass("highlight-touch-view");
        this.hightlightEl = $("<div />").addClass("highlight-touch-view-cover");
        this.el.append(this.hightlightEl);
        this.touchTimer = null;
    }
    Global.Utils.extend(HighlightTouchView).from(Global.GestureView);

    $.extend(HighlightTouchView.prototype, {
        onTapStart: function(touch) {
            if (this.touchTimer)
                return;
            var self = this;
            this.touchTimer = setTimeout(function() {
                self.hightlightEl.css("visibility", "visible");
            }, 50);
        },
        onTapEnd: function(touch) {
            if (this.touchTimer) {
                clearTimeout(this.touchTimer);
                this.touchTimer = null;
            }
            this.hightlightEl.css("visibility", "hidden");
        },
        onLongTap: function(touch) {
            this.onTapEnd(touch);
        }
    });

    Global.HighlightTouchView = HighlightTouchView;

})();

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

    function DragView(infoView) {
        DragView.$super.call(this);
        this.infoView = infoView;
        this.el.addClass("drag-view");

        this.iconEl = $("<div />").addClass("drag-view-icon").prependTo(this.el);

        this.infoView.on("slidemove", this.onSlideMove.bind(this));
        this.infoView.on("slideend", this.onSlideEnd.bind(this));

        this.on("touchdragstart", this.onTouchDragStart.bind(this));
        this.on("touchdragmove", this.onTouchDragMove.bind(this));
        this.on("touchdragend", this.onTouchDragEnd.bind(this));

        this.on("tap", this.onTap.bind(this));
    }
    Global.Utils.extend(DragView).from(Global.HighlightTouchView);

    $.extend(DragView.prototype, {
        respondsToTouchGesture: function(gesture) {
            if (DragView.$super.prototype.respondsToTouchGesture.call(this, gesture))
                return true;
            return (gesture.type == Global.GestureStart.DRAG) && gesture.scrollY;
        },

        onTouchDragStart: function() {
            this.infoView.attach();
        },

        onTouchDragMove: function(transform) {
            this.infoView.update(transform);
        },

        onTouchDragEnd: function(transform, touch, endOfGesture) {
            if (!endOfGesture)
                this.infoView.cancel();
            else
                this.infoView.end(transform);
        },

        onTap: function() {
            this.infoView.toggle();
        },

        rotation: function(progress) {
            return -180 * progress;
        },

        onSlideMove: function(progress) {
            this.iconEl.css(Global.Utils.prefix({
                "transition": "none",
                "transform": "rotate(" + this.rotation(progress) + "deg) translateZ(0px)"
            }));
        },

        onSlideEnd: function(progress) {
            this.iconEl.css(Global.Utils.prefix({
                "transition": Global.Utils.prefixValue("transform 0.3s linear"),
                "transform": "rotate(" + this.rotation(progress) + "deg) translateZ(0px)"
            }));
        }


    });

    Global.DragView = DragView;

})();

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

    function DraggableView() {
        DraggableView.$super.call(this);
        this.el.addClass("draggable-view");
        if (!this.contentView) {
            this.contentView = new Global.View();
            this.prepend(this.contentView);
        }

        this.on("touchdragstart", this.onTouchDragStart.bind(this));
        this.on("touchdragmove", this.onTouchDragMove.bind(this));
        this.on("touchdragend", this.onTouchDragEnd.bind(this));

        this.on("longtaptimer", this.onLongTapTimer.bind(this));

        this.draggingEl = null;
        this.removalTimer = null;
        this.boundingBoxScale = "";
        this.translateOffset = "";
    }
    Global.Utils.extend(DraggableView).from(Global.HighlightTouchView);

    $.extend(DraggableView.prototype, {
        getTransform: function(left, top, scale) {
            var transform =
                this.translateOffset +
                " translate3d(" + (left) + "px, " + (top) + "px, 50px)" +
                " scale(" + scale + ")" +
                this.boundingBoxScale;
            return transform;
        },

        onTouchDragStart: function(touch) {
            this.clearRemovalTimer();
            this.startPosition = this.contentView.el.offset();
            var width = this.contentView.width(),
                height = this.contentView.height();
            this.el.addClass("draggable-view-dragging");

            var boundingBox = this.contentView.el.get(0).getBoundingClientRect();
            this.boundingBoxScaleX = boundingBox.width / width;
            this.boundingBoxScaleY = boundingBox.height / height;
            this.boundingBoxScale = " scale(" +
                (this.boundingBoxScaleX) + ", " +
                (this.boundingBoxScaleY) + ")";
            this.translateOffset = " translate(" +
                ((boundingBox.width - width) / 2) + "px, " +
                ((boundingBox.height - height) / 2) + "px)";

            this.draggingEl = $("<div />")
                .addClass("draggable-view-clone")
                .css(Global.Utils.prefix({
                    "width": width,
                    "height": height,
                    "transition": Global.Utils.prefixValue("transform 0.3s linear"),
                    "transform": this.getTransform(this.startPosition.left, this.startPosition.top, 1.0)
                }))
                .append(this.contentView.el.clone())
                .appendTo(document.body);

            var self = this;
            setTimeout(function() {
                self.draggingEl.css(Global.Utils.prefix({
                    "transform": self.getTransform(self.startPosition.left, self.startPosition.top, 1.2)
                }));
            }, 0);

            this.fire("draggingstart");
        },

        clearRemovalTimer: function() {
            if (!this.removalTimer)
                return;
            clearTimeout(this.removalTimer);
            this.removalTimer = null;
            this.el.removeClass("draggable-view-dragging");
            if (this.draggingEl) {
                this.draggingEl.remove();
                this.draggingEl = null;
            }
        },

        onTouchDragMove: function(transform) {
            if (!this.draggingEl)
                return;
            this.draggingEl.css(Global.Utils.prefix({
                "transition": "none",
                "transform": this.getTransform(this.startPosition.left + transform.dragX * this.boundingBoxScaleX,
                    this.startPosition.top + transform.dragY * this.boundingBoxScaleY, 1.2)
            }));
            this.fire("draggingmove", [{
                x: (this.startPosition.left + transform.dragX * this.boundingBoxScaleX),
                y: (this.startPosition.top + transform.dragY * this.boundingBoxScaleY)
            }]);
        },

        onTouchDragEnd: function(transform, touch, endOfGesture) {
            if (!this.draggingEl) {
                this.el.removeClass("draggable-view-dragging");
                return;
            }
            if (this.fire("draggingend", [{
                x: (this.startPosition.left + transform.dragX * this.boundingBoxScaleX),
                y: (this.startPosition.top + transform.dragY * this.boundingBoxScaleY)
            }])) {
                // draggingEl was destroyed in the event call.
                return;
            }
            this.animateAndRemove(this.startPosition.left, this.startPosition.top, 1);
        },

        animateAndRemove: function(x, y, scale, callback) {
            this.draggingEl.css(Global.Utils.prefix({
                "transition": Global.Utils.prefixValue("transform 0.3s linear"),
                "transform": this.getTransform(x, y, scale)
            }));
            var self = this;
            this.removalTimer = setTimeout(function() {
                self.el.removeClass("draggable-view-dragging");
                self.draggingEl.remove();
                if (callback)
                    callback();
            }, 300);
        },

        onLongTapTimer: function() {
            this.startDraggingFromLongTap();
        }
    });

    Global.DraggableView = DraggableView;

})();

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
            this.fire("visibilitychanged");
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
            this.fire("slideend", [1]);
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
            this.fire("slideend", [0]);
            var self = this;
            this.clearRemovalTimer();
            this.removalTimer = setTimeout(function() {
                self.documentView.el.css(Global.Utils.prefix({
                    "transition": "none"
                }));
                self.el.detach();
                self.documentView.disabled = false;
                self.fire("visibilitychanged");
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
            this.fire("visibilitychanged");
        },

        end: function(transform) {
            var minDrag = this.height() * 0.4;
            if ((!this.wasVisible && transform.dragY < - minDrag) ||
                (this.wasVisible && transform.dragY < minDrag))
                this.show();
            else
                this.hide();
        },

        toggle: function() {
            if (this.visible)
                this.hide();
            else {
                this.attach();
                this.show();
            }
        },

        update: function(transform) {
            var infoViewHeight = this.height();
            var min, max;
            if (this.wasVisible) {
                min = 0;
                max = infoViewHeight;
            } else {
                min = -infoViewHeight;
                max = 0;
            }
            var dragY = Math.max(min, Math.min(max, transform.dragY));
            this.documentView.disabled = true;
            this.fire("slidemove", [ 1 - (dragY - min) / (max - min) ]);
            if (this.wasVisible)
                dragY -= infoViewHeight;
            this.documentView.el.css(Global.Utils.prefix({
                "transition": "none",
                "transform": "translate3d(0, " + (dragY) + "px, 0px)"
            }));
        },

        internalRelayout: function() {
            InfoView.$super.prototype.internalRelayout.call(this);
            this.documentView.el.css(Global.Utils.prefix({
                "transition": "none",
                "transform": "translate3d(0px, " + (-this.height()) + "px, 0px)"
            }));
        }
    });

    Global.InfoView = InfoView;

})();

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

    function PopupView(mainView) {
        PopupView.$super.call(this);
        this.mainView = mainView;
        if (!this.contentView)
            this.contentView = new Global.View();
        this.append(this.contentView);
        this.el.addClass("popup-view-background");
        this.contentView.el.addClass("popup-view");
        this.on("tap", this.hide.bind(this));
        this.visible = false;
    }
    Global.Utils.extend(PopupView).from(Global.GestureView);

    $.extend(PopupView.prototype, {
        show: function() {
            if (this.visible)
                return;
            this.visible = true;
            this.mainView.append(this);
            this.relayout();
            var self = this;
            // Wait until the css properties are applied.
            this.requestAnimationFrame(function() {
                setTimeout(function() {
                    self.el.addClass("open");
                }, 0);
            });
        },

        hide: function() {
            if (!this.visible)
                return;
            this.visible = false;
            this.el.removeClass("open");
            var self = this;
            setTimeout(function() {
                self.el.detach();
            }, 300);
        }
    });

    Global.PopupView = PopupView;

})();

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

    function DialogView(mainView) {
        DialogView.$super.call(this);
        this.el.addClass("dialog-view");
        this.mainView = mainView;
        this.visible = false;
    }
    Global.Utils.extend(DialogView).from(Global.View);

    $.extend(DialogView.prototype, {
        show: function() {
            if (this.visible)
                return;
            this.visible = true;
            this.el.css(Global.Utils.prefix({
                "transition": Global.Utils.prefixValue("transform 0.3s linear"),
                "transform": "translate3d(0, " + this.mainView.height() + "px, 0px)"
            }));
            this.mainView.append(this);
            this.relayout();
            var self = this;
            setTimeout(function() {
                self.el.css(Global.Utils.prefix({
                    "transform": "translate3d(0, 0, 20px)"
                }));
            }, 0);
        },

        hide: function() {
            if (!this.visible)
                return;
            this.visible = false;
            this.css(Global.Utils.prefix({
                "transition": Global.Utils.prefixValue("transform 0.3s linear"),
                "transform": "translate3d(0, " + this.mainView.height() + "px, 0px)"
            }));
            var self = this;
            setTimeout(function() {
                self.el.detach();
            }, 300);
        }
    });

    Global.DialogView = DialogView;

})();

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

    function MainView(app) {
        MainView.$super.call(this);
        this.app = app;
        this.fillParent();

        this.el.css(Global.Utils.prefix({
            "opacity": 0,
            "transform": "translateZ(0px)"
        }));

        this.on("afterresize", this.onAfterViewResize.bind(this));
        this.installResizeEvent();
        this.installKeyboardEvents();
    }
    Global.Utils.extend(MainView).from(Global.View);

    $.extend(MainView.prototype, {
        onAfterViewResize: function() {
            this._width = this.el.width();
            this._height = this.el.height();
            this.relayout();
        },

        onWindowResize: function() {
            this.propagateResizedEvent();
        },

        installResizeEvent: function() {
            $(window).bind("resize", this.onWindowResize.bind(this));
            var self = this;
            this.requestAnimationFrame(function() {
                self.propagateResizedEvent();
                self.fire("firstlayout");
            });
        },

        installKeyboardEvents: function() {
            $(window).bind("keydown", this.onKeyEvent.bind(this, "keydown"));
            $(window).bind("keypress", this.onKeyEvent.bind(this, "keypress"));
            $(window).bind("keyup", this.onKeyEvent.bind(this, "keyup"));
        },

        onKeyEvent: function(type, event) {
            if (event.target.localName == "input")
                return;
            this.propagateEvent(type, [event]);
        },

        width: function() {
            return this._width;
        },

        height: function() {
            return this._height;
        },

        init: function() {
            this.fire("init");
            this.el.css("opacity", 1);
        }
    });

    Global.MainView = MainView;

})();

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
    function Application() {
        this.body = $("#app-body");

        this.installUpdateListener();
        this.checkForUpdates();

        this.mainView = new Global.MainView(this);
        this.mainView.el.appendTo(this.body);

        this.initPlugins();

        // At this point we are finished with loading HTML snippets, so we can remove the components element.
        $("#components").remove();
        this.init();
    }

    Application.prototype = {
        init: function() {
            var self = this;
            this.mainView.on("firstlayout", function() {
                setTimeout(function() {
                    self.mainView.init();
                    $("#loading").remove();
                }, 0);
            });
        },

        installUpdateListener: function() {
            this.cache = Global.Utils.lookupPrefix(window, "applicationCache");
            if (!this.cache)
                return;
            this.cache.addEventListener("updateready", this.onCacheUpdateReady.bind(this));
        },

        checkForUpdates: function() {
            if (!this.cache)
                return;
            try {
                this.cache.update();
            } catch (e) {
                // FIXME: Opera throws an INVALID_STATE_ERR.
            }
        },

        onCacheUpdateReady: function() {
            if (this.cache.status != this.cache.UPDATEREADY) {
                console.log("No cache update.");
                return;
            }
            console.log("Swapping cache.");
            console.log("Reloading app.");
            if (confirm("New application version is available. Would you like to load the new version now?")) {
                this.cache.swapCache();
                window.location.reload();
            }
        },

        initPlugins: function() {
            var self = this;
            $.each(Application.plugins, function(i, pluginCallback) {
                pluginCallback(self);
            });
        }

    };

    Application.plugins = [];

    if (!window.QUnit) {
        // Start the application only when QUnit is not loaded.
        $(function() {
            var app = window.app = new Application();
        });
    }

    Global.Application = Application;

})();

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

    function BaseControl() {
        BaseControl.$super.call(this);
        this.value = null;
        this.el.addClass("control-view");
    }
    Global.Utils.extend(BaseControl).from(Global.GestureView);

    BaseControl.AttributePrefix = "data-param-";

    $.extend(BaseControl.prototype, {
        getValue: function() { return this.value; },
        setValue: function(value) {
            this.value = value;
            this.updateUI();
        },
        notifyValueChange: function() {
            this.fire("valuechanged");
        },
        init: function() { },
        updateUI: function() { },
        internalRelayout: function() {
            this.updateUI();
            BaseControl.prototype.$super.internalRelayout.call(this);
        },
        initFromTemplate: function() {
            var filterParam = this.filterParam = {};
            $.each(this.el.get(0).attributes, function(i, attrib) {
                if (attrib.name.substr(0, BaseControl.AttributePrefix.length) != BaseControl.AttributePrefix)
                    return;
                filterParam[attrib.name.substr(BaseControl.AttributePrefix.length)] = attrib.value;
            });
            this.init();
        },

        floatParam: function(name, defaultValue) {
            if (!this.filterParam || !this.filterParam.hasOwnProperty(name))
                return defaultValue;
            return parseFloat(this.filterParam[name]);
        }
    });

    var Controls = {
        _registeredControls: {},
        register: function(name, control) {
            this._registeredControls[name] = control;
        },

        get: function(typeName) {
            return this._registeredControls[typeName];
        }
    };

    Global.BaseControl = BaseControl;
    Global.Controls = Controls;

})();

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

    function RangeControl() {
        RangeControl.$super.call(this);
        this.el.addClass("range-control-view");
        this.on("touchdragstart", this.onRangeTouchDragStart.bind(this));
        this.on("touchdragmove", this.onTouchDragMove.bind(this));

        this.animationFrameRequested = false;
    }
    Global.Utils.extend(RangeControl).from(Global.BaseControl);

    $.extend(RangeControl.prototype, {
        init: function() {
            this.min = this.floatParam("min", 0);
            this.max = this.floatParam("max", 100);
            this.step = this.floatParam("step", 0.0001);
            this.ticksBarWidth = this.floatParam("ticks-bar-width", 500);
            this.length = this.max - this.min;
            this.ticks = Math.min(20, this.length / this.step);
            this.tickStep = this.ticksBarWidth / (this.ticks - 1);

            this.ticksBarEl = $("<div />").addClass("range-ticks-bar").css(Global.Utils.prefix({
                "width": this.ticksBarWidth + "px"
            })).appendTo(this.el);
            this.createTicks();

            this.labelViewEl = $("<div />").addClass("range-label-view").appendTo(this.el);
            this.labelEl = $("<div />").addClass("range-label").appendTo(this.labelViewEl);
            this.setValue(this.min);
        },

        updateUI: function() {
            if (this.animationFrameRequested)
                return;
            this.animationFrameRequested = true;
            this.requestAnimationFrame(this.updateUIInternal.bind(this));
        },

        updateUIInternal: function() {
            this.animationFrameRequested = false;
            var value = this.getValue();
            var midpoint = this.width() / 2;
            var position = midpoint - ((value - this.min) / this.length * this.ticksBarWidth);
            this.ticksBarEl.css(Global.Utils.prefix({
                "transform": "translate3d(" + position + "px, 0, 0px)"
            }));
            this.labelEl.text(Math.round(value));
        },

        createTicks: function() {
            for (var i = 0; i < this.ticks; ++i) {
                var tick = $("<div />").addClass("range-tick").css(Global.Utils.prefix({
                    "left": (i * this.tickStep) + "px"
                }));
                if (!i)
                    tick.addClass("first-range-tick");
                if ((i + 1) == this.ticks)
                    tick.addClass("last-range-tick");
                this.ticksBarEl.append(tick);
            }
        },

        onRangeTouchDragStart: function() {
            this.initialValue = this.getValue();
        },

        onTouchDragMove: function(transform) {
            var value = this.initialValue - (transform.dragX / this.ticksBarWidth * this.length);
            value = Math.max(this.min, Math.min(this.max, value));
            this.setValue(value);
            this.notifyValueChange();
        },

        respondsToTouchGesture: function(gesture) {
            return gesture.type == Global.GestureStart.DRAG && gesture.scrollX;
        },

        internalRelayout: function() {
            RangeControl.prototype.$super.internalRelayout.call(this);
            this.updateUI();
        }
    });

    Global.Controls.register("range", RangeControl);

})();

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

    function FileEntry(storage, path, name) {
        this.storage = storage;
        this.path = path;
        this.name = name;
    }

    FileEntry.prototype = {
        toURL: function(value) {
            return "data:text/plain;base64," + Global.Utils.encodeBase64(value || "");
        }
    };

    function LocalStorage() {
        this.storage = window.localStorage;
        this.files = this.readFileSystem();
    }

    LocalStorage.prototype = {
        descriptor: "filesystem",

        register: function(callback) {
            callback(this);
        },

        saveFileSystem: function() {
            if (!this.storage)
                return;
            this.storage.setItem(this.descriptor, JSON.stringify(this.files));
        },

        readFileSystem: function() {
            if (!this.storage)
                return null;
            var fileSystem = this.storage.getItem(this.descriptor);
            if (!fileSystem)
                return {
                    root: {},
                    filesCount: 0
                };
            return JSON.parse(fileSystem);
        },

        getDirectoryEntry: function(path, create) {
            if (!this.files)
                return;
            var entry = this.files.root;
            for (var i = 0; i < path.length; ++i) {
                var folderName = path[i];
                if (entry.hasOwnProperty(folderName)) {
                    entry = entry[folderName];
                    continue;
                }
                if (!create)
                    return null;
                entry = entry[folderName] = {};
            }
            return entry;
        },

        splitPath: function(path) {
            return path.split("/");
        },

        saveFileEntry: function(entry, value) {
            if (!this.storage)
                return;
            var filePath = entry.path,
                fileName = entry.name,
                dirEntry = this.getDirectoryEntry(filePath, true);
            var key = dirEntry[fileName];
            if (!key) {
                var fileId = "file" + (++this.files.filesCount);
                key = dirEntry[fileName] = {
                    fileId: fileId,
                    name: fileName
                };
                this.saveFileSystem();
            }
            this.storage.setItem(key.fileId, value);
        },

        removeFileEntry: function(entry, value) {
            if (!this.storage)
                return;
            var filePath = entry.path,
                fileName = entry.name,
                dirEntry = this.getDirectoryEntry(filePath, true);
            var key = dirEntry[fileName];
            if (!key)
                return;
            delete dirEntry[fileName];
            this.saveFileSystem();
            this.storage.removeItem(key);
        },

        loadFileEntry: function(entry) {
            if (!this.storage)
                return null;
            var filePath = entry.path,
                fileName = entry.name,
                dirEntry = this.getDirectoryEntry(filePath, false);
            if (!dirEntry)
                return null;
            var key = dirEntry[fileName];
            if (!key)
                return null;
            return this.storage.getItem(key.fileId);
        },

        get: function(path, callback) {
            var self = this;
            this.getEntry(path,
                function(err, entry) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    self.readFile(entry, callback);
                });
        },

        getEntry: function(path, callback) {
            var filePath = this.splitPath(path),
                fileName = filePath.pop();
            callback(null, new FileEntry(this, filePath, fileName));
        },

        readFile: function(entry, callback) {
            callback(null, this.loadFileEntry(entry));
        },

        save: function(path, data, callback) {
            var self = this;
            this.getEntry(path, function(err, entry) {
                self.saveFileEntry(entry, data);
                if (callback)
                    callback(null, entry);
            });
        },

        list: function(path, callback) {
            var filePath = this.splitPath(path),
                dirEntry = this.getDirectoryEntry(filePath, true),
                list = [],
                self = this;
            if (!dirEntry)
                return callback(null, []);
            $.each(dirEntry, function(i, entry) {
                list.push(new FileEntry(self, filePath, entry.name));
            });
            callback(null, list);
        },

        createDirectory: function(path, callback) {
            var filePath = this.splitPath(path),
                dirEntry = this.getDirectoryEntry(filePath, true);
            callback(null, path);
        },

        deleteFile: function(path, callback) {
            var self = this;
            this.getEntry(path, function(err, entry) {
                self.removeFileEntry(entry);
                callback(null);
            });
        }
    };

    Global.LocalStorage = LocalStorage;
})();

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

    function Timer(timeout) {
        Timer.$super.call(this);
        this.timeout = timeout;
        this.args = null;
        this.timer = null;
        this.timerCallback = this.onTimerFired.bind(this);
    }

    Global.Utils.extend(Timer).from(Global.EventDispatcher);

    $.extend(Timer.prototype, {
        invoke: function(args) {
            this.args = args;
            this.clearTimer();
            this.installTimer();
        },

        clearTimer: function() {
            clearTimeout(this.timer);
            this.timer = null;
        },

        installTimer: function() {
            this.timer = setTimeout(this.timerCallback, this.timeout);
        },

        onTimerFired: function() {
            this.timer = null;
            this.fire("timerFired", this.args);
        }
    });

    Global.Timer = Timer;

})();

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
    function Presenter(app) {
        Presenter.$super.call(this);
        this.app = app;
        this.initSlides();

        app.mainView.presenter = this;

        this.slidesListView = new Global.SlidesListView(this, this.slides);
        this.slidesListView.on("slidechanged", this.onSlideChanged.bind(this));
        this.slidesListView.infoView.on("visibilitychanged", this.infoBarVisibilityChanged.bind(this));
        app.mainView.append(this.slidesListView);

        this.timeReportView = null;

        this.timer = null;

        this.timeElapsed = Global.Utils.readStorageInt(Presenter.TimeElapsedStorageKey, 0);
        this.slideStartTime = Global.Utils.readStorageInt(Presenter.SlideStartTimeStorageKey, 0);
        this.lastCheckTime = Global.Utils.readStorageInt(Presenter.LastCheckTimeStorageKey, 0);
        this.started = Global.Utils.readStorageBool(Presenter.StartedStorageKey, false);
        this.accumulatedTimes = Global.Utils.readStorageJSON(Presenter.AccumulatedTimesStorageKey, {});

        if (this.started) {
            this.updateTimeElapsed();
            this.lastCheckTime = Date.now();
            this.installTimer();
        }

        $(window).unload(this.onUnload.bind(this));
    }
    Global.Utils.extend(Presenter).from(Global.EventDispatcher);

    Presenter.TimeElapsedStorageKey = "TimeElapsed";
    Presenter.LastCheckTimeStorageKey = "LastCheckTime";
    Presenter.SlideStartTimeStorageKey = "SlideStartTime";
    Presenter.StartedStorageKey = "Started";
    Presenter.AccumulatedTimesStorageKey = "AccumulatedTimes";

    $.extend(Presenter.prototype, {
        initSlides: function() {
            var slides = $("#slides");
            this.slides = slides.children().detach();
            slides.remove();
        },

        clearTimer: function() {
            if (!this.timer)
                return;
            clearInterval(this.timer);
            this.timer = null;
        },

        installTimer: function() {
            if (this.timer)
                return;
            this.timer = setInterval(this.updateTimeElapsed.bind(this), this.timerRate());
        },

        timerRate: function() {
            return this.slidesListView.infoView.visible ? 1000 : 30000;
        },

        infoBarVisibilityChanged: function() {
            if (!this.started)
                return;
            // Reinstall timer to change refresh rate.
            this.clearTimer();
            this.installTimer();
        },

        onSlideChanged: function(oldName, newName) {
            if (!oldName || !this.started)
                return;
            this.updateSlideAccumulatedTime(oldName);
        },

        updateAccumulatedTimes: function() {
            if (!this.slidesListView.currentSlideName)
                return;
            this.updateSlideAccumulatedTime(this.slidesListView.currentSlideName);
        },

        updateSlideAccumulatedTime: function(slideName) {
            this.updateTimeElapsed();
            var timeOnSlide = this.timeElapsed - this.slideStartTime;
            this.slideStartTime = this.timeElapsed;
            this.updateLocalStorage();
            if (!this.accumulatedTimes.hasOwnProperty(slideName))
                this.accumulatedTimes[slideName] = timeOnSlide;
            else
                this.accumulatedTimes[slideName] += timeOnSlide;
            this.updateAccumulatedTimesLocalStorage();
        },

        updateAccumulatedTimesLocalStorage: function() {
            Global.Utils.writeStorageJSON(Presenter.AccumulatedTimesStorageKey, this.accumulatedTimes);
        },

        updateTimeElapsed: function() {
            if (this.started) {
                var time = Date.now();
                this.timeElapsed += time - this.lastCheckTime;
                this.lastCheckTime = time;
                this.updateLocalStorage();
                this.updateInfoBarMinute();
            }
        },

        onUnload: function() {
            this.updateLocalStorage();
            this.updateAccumulatedTimes();
        },

        updateLocalStorage: function() {
            Global.Utils.writeStorage(Presenter.TimeElapsedStorageKey, this.timeElapsed);
            Global.Utils.writeStorage(Presenter.LastCheckTimeStorageKey, this.lastCheckTime);
            Global.Utils.writeStorage(Presenter.SlideStartTimeStorageKey, this.slideStartTime);
            Global.Utils.writeStorageBool(Presenter.StartedStorageKey, this.started);
        },

        updateInfoBarMinute: function() {
            this.fire("timeupdated");
        },

        stop: function() {
            if (!this.started)
                return;
            this.clearTimer();
            this.updateTimeElapsed();
            this.updateAccumulatedTimes();
            this.started = false;
            this.updateLocalStorage();
            this.updateInfoBarMinute();
        },

        start: function() {
            if (this.started)
                return;
            this.clearTimer();
            this.started = true;
            this.lastCheckTime = Date.now();
            this.slideStartTime = this.timeElapsed;
            this.installTimer();
            this.updateLocalStorage();
            this.updateInfoBarMinute();
        },

        startStopTimer: function() {
            if (this.started)
                this.stop();
            else
                this.start();
        },

        resetTimer: function() {
            this.clearTimer();
            this.timeElapsed = 0;
            this.slideStartTime = 0;
            this.started = false;
            this.accumulatedTimes = {};
            this.updateLocalStorage();
            this.updateAccumulatedTimesLocalStorage();
            this.updateInfoBarMinute();
        },

        showTimeReport: function() {
            this.stop();
            if (!this.timeReportView)
                this.timeReportView = new Global.TimeReportView(this.app.mainView);
            this.timeReportView.showWithData(this.slidesListView, this.accumulatedTimes);
        }
    });

    Global.Presenter = Presenter;
    Global.Application.plugins.push(function(app) {
        app.presenter = new Presenter(app);
    });

})();

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
                        var templateRoleName = el.attr("data-template-role");
                        if (templateRoleName && state.templateView)
                            state.templateView[templateRoleName + "View"] = childView;
                    }

                } else {
                    TemplateView.searchChildren(parentView, el, state);
                }
            });
        },
        convert: function(el) {
            return TemplateView.convertOne(el, { index: 0, templateView: null });
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
                        el.attr("data-template-role") === undefined &&
                        el.attr("data-repeat") === undefined)
                        return false;
                    typeName = ""; // Default to base "View" class.
                }
            }
            var type = isControl ? Global.Controls.get(typeName) : Global[TemplateView.className(typeName)];
            if (!type)
                return false;
            var newObject = Global.Utils.objectCreateShim(type.prototype);
            if (!state.templateView)
                state.templateView = newObject;
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
            state = { index: 0, templateView: state.templateView };
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

    function State(slideView, number) {
        this.slideView = slideView;
        this.number = number;
        this.elements = $([]);
        this.time = 0;
        this.advance = "none";
        this.started = false;
        this.advanceTimer = null;
        this.isReset = false;
    }

    Global.Utils.extend(State).from(Global.EventDispatcher);

    $.extend(State.prototype, {
        push: function(el) {
            this.elements = this.elements.add(el);
            var time = el.attr("data-time");
            if (time !== undefined)
                this.time = Math.max(this.time, parseFloat(time));
            var advance = el.attr("data-advance");
            if (advance !== undefined)
                this.advance = advance;
            el.addClass("state-view");
        },

        toggle: function(started) {
            if (started)
                this.open();
            else
                this.close();
        },

        open: function() {
            this.clearAdvanceTimer();
            if (this.started)
                return;
            this.started = true;
            this.updateClass();
        },

        prepare: function(oldState) {
            this.clearAdvanceTimer();
            if (this.isAutoAdvance())
                this.advanceTimer = setTimeout(this.onAdvanceTimerCallback.bind(this), oldState ? oldState.time * 1000 : 0);
        },

        onAdvanceTimerCallback: function() {
            this.clearAdvanceTimer();
            this.slideView.advanceTo(this.number);
        },

        clearAdvanceTimer: function() {
            if (!this.advanceTimer)
                return;
            clearTimeout(this.advanceTimer);
            this.advanceTimer = null;
        },

        updateClass: function() {
            var self = this;
            setTimeout(function() {
                self.unreset();
                self.elements.toggleClass("state-open", self.started);
            }, 0);
        },

        close: function() {
            this.clearAdvanceTimer();
            if (!this.started)
                return;
            this.started = false;
            this.updateClass();
        },

        unreset: function() {
            if (!this.isReset)
                return;
            this.isReset = false;
            this.elements.css(Global.Utils.prefixOne("transition"), "");
        },

        reset: function() {
            this.clearAdvanceTimer();
            if (this.isReset)
                return;
            this.started = false;
            this.isReset = true;
            this.elements.css(Global.Utils.prefixOne("transition"), "none");
            this.elements.removeClass("state-open");
        },

        isAutoAdvance: function() {
            return this.advance == "auto";
        }
    });

    function SlideView() {
        SlideView.$super.call(this);
        this.el.addClass("slide-view");
        this.name = this.el.attr("data-name");
        this.number = 0;
        this.backgroundClass = this.el.attr("data-background-class");
        this.backgroundView = null;
        this.updateBackgroundRequested = false;
        this.backgroundViewHidden = true;
        this.backgroundViewState = 0;
        this.backgroundViewTimer = null;
        if (this.backgroundClass !== undefined) {
            this.backgroundView = new Global.View();
            this.backgroundView.el
                .css("visibility", "hidden")
                .addClass("slide-background-view")
                .addClass(this.backgroundClass);
        }
        this.states = [];
        this.currentState = -1;
        this.initStates();
    }
    Global.Utils.extend(SlideView).from(Global.View);

    $.extend(SlideView.prototype, {
        getName: function() {
            return this.name ? this.name : "slide-" + this.number;
        },

        initStates: function() {
            var stateElements = this.el.find("[data-state]"),
                self = this;
            stateElements.each(function(i, el) {
                el = $(el);
                var number = parseInt(el.attr("data-state"), 10);
                if (isNaN(number)) {
                    console.log("Invalid data-state value.", el.get(0));
                    return;
                }
                var state = self.getState(number);
                state.push(el);
            });
        },

        setBackgroundState: function(state, useAnimation) {
            if (!this.backgroundView || this.backgroundViewState == state)
                return;
            this.clearBackgroundViewTimer();
            this.backgroundViewState = state;
            if (state <= 0 && !useAnimation) {
                if (this.backgroundViewHidden)
                    return;
                this.backgroundViewHidden = true;
                this.updateBackground();
                return;
            }
            this.backgroundViewHidden = false;
            this.backgroundView.el
                .css(Global.Utils.prefixOne("transition"), useAnimation ? "opacity 0.2s linear" : "");
            this.updateBackground();
            if (state <= 0 && useAnimation) {
                var self = this;
                this.backgroundViewTimer = setTimeout(function() {
                    self.backgroundViewHidden = true;
                    self.updateBackground();
                }, 300);
            }
        },

        updateBackground: function() {
            if (this.updateBackgroundRequested)
                return;
            this.updateBackgroundRequested = true;
            var self = this;
            Global.ViewUpdater.instance.requestAnimationFrame(function() {
                self.updateBackgroundRequested = false;
                self.backgroundView.el.css(Global.Utils.prefix({
                    "visibility": self.backgroundViewHidden ? "hidden" : "visible",
                    "opacity": self.backgroundViewState
                }));
            });
        },

        clearBackgroundViewTimer: function() {
            if (!this.backgroundViewTimer)
                return;
            clearTimeout(this.backgroundViewTimer);
            this.backgroundViewTimer = null;
        },

        createState: function(number) {
            var state = new State(this, number);
            this.states[number] = state;
            return state;
        },

        getState: function(number) {
            var state = this.states[number];
            return state ? state : this.createState(number);
        },

        next: function() {
            return this.setState(this.currentState + 1, 1, true);
        },

        advanceTo: function(number) {
            this.setState(number, 1, false);
        },

        prev: function() {
            return this.setState(this.currentState - 1, -1, true);
        },

        findState: function(index, direction, skipAuto) {
            if (direction === undefined)
                direction = 1;
            if (skipAuto === undefined)
                skipAuto = false;
            for (; index >= 0 && index < this.states.length; index += direction) {
                var state = this.states[index];
                if (state) {
                    if (skipAuto && state.isAutoAdvance())
                        continue;
                    return state;
                }
            }
            return null;
        },

        setState: function(number, direction, skipAuto) {
            var index = Math.max(0, Math.min(this.states.length, number));
            if (index != number)
                return false;
            var state = this.findState(index, direction, skipAuto);
            if (!state)
                return false;
            this.currentState = state.number;
            for (var i = 0; i < this.states.length; ++i) {
                var childState = this.states[i];
                if (childState)
                    childState.toggle(childState.number <= state.number);
            }
            if (direction > 0) {
                var nextState = this.findState(index + 1, direction);
                if (nextState)
                    nextState.prepare(state);
            }
            this.fire("statechanged");
            return true;
        },

        reset: function() {
            this.currentState = -1;
            for (var i = 0; i < this.states.length; ++i) {
                var childState = this.states[i];
                if (childState)
                    childState.reset();
            }
            this.fire("reset");
        },

        start: function() {
            var nextState = this.findState(Math.max(0, this.currentState), 1);
            if (nextState)
                nextState.prepare();
        },

        hasRemainingStates: function() {
            for (var i = this.currentState + 1; i < this.states.length; ++i) {
                var childState = this.states[i];
                if (childState && !childState.isAutoAdvance())
                    return true;
            }
            return false;
        }

    });

    Global.State = State;
    Global.SlideView = SlideView;

})();

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

    function SlideContentView() {
        SlideContentView.$super.call(this);
        this.el.addClass("slide-content-view");
        this.contentView = new Global.View();
        this.contentView.el.addClass("slide-content-view-transform");
        this.append(this.contentView);
        this.slideView = null;
        this.slideWidth = 0;
        this.slideHeight = 0;
        this.visible = false;
    }
    Global.Utils.extend(SlideContentView).from(Global.GestureView);

    $.extend(SlideContentView.prototype, {

        internalRelayout: function() {
            var width = this.mainView().width(),
                height = this.mainView().height();
            this.css("width", width)
                .css("height", height);
            SlideContentView.prototype.$super.internalRelayout.call(this);
            if (!this.slideView)
                return;
            this.slideWidth = this.slideView.width();
            this.slideHeight = this.slideView.height();
            var scale = Math.min(width / this.slideWidth, height / this.slideHeight),
                left = (width - this.slideWidth * scale) / 2,
                top = (height - this.slideHeight * scale) / 2;
            this.contentView.css(
                Global.Utils.prefixOne("transform"),
                "translate3d(" + left + "px, " + top + "px, 0px) " +
                "scale(" + scale + ")"
            );
        },

        toggle: function(visible) {
            if (visible == this.visible)
                return;
            this.visible = visible;
            var self = this;
            Global.ViewUpdater.instance.requestAnimationFrame(function() {
                self.el.toggleClass("visible", self.visible);
            });
        }

    });

    Global.SlideContentView = SlideContentView;

})();

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
    function SlidesListView(presenter, slides) {
        SlidesListView.$super.call(this);

        this.presenter = presenter;

        this.el.addClass("slides-list-view");

        this.maxLoadedSlides = 3;

        this.infoView = new Global.InfoBarView(this);

        this.backgroundView = new Global.View();
        this.backgroundView.el.addClass("background-view");
        this.append(this.backgroundView);

        this.progressView = new Global.ProgressView();
        this.append(this.progressView);

        this.scrollView = new Global.StepScrollView(Global.ScrollView.HORIZONTAL);
        this.scrollView.fillParent();
        this.scrollView.friction = 0.1;
        this.scrollView.maxScrollCount = 1;
        this.scrollView.contentView.el.css("height", "100%");
        this.scrollView.contentView.setLayout(new Global.HorizontalLayout());
        this.append(this.scrollView);

        this.slides = [];
        this.slidesByName = {};
        this.currentSlideName = null;

        this.logoView = new Global.View();
        this.logoView.el.addClass("logo");
        this.append(this.logoView);

        this.advanceButtonViewUpdateRequested = false;
        this.advanceButtonViewVisible = false;
        this.advanceButtonView = new Global.HighlightTouchView();
        this.advanceButtonView.el.addClass("advance-button-view");
        this.append(this.advanceButtonView);
        this.advanceButtonView.on("tap", this.onAdvanceButtonViewTap.bind(this));

        var self = this;
        slides.each(function(i, child) {
            var slideContentView = new Global.SlideContentView();
            var slideView = slideContentView.slideView = new Global.TemplateView.convert($(child).detach());
            slideView.number = i;
            slideContentView.contentView.append(slideView);
            self.scrollView.contentView.append(slideContentView);
            self.slides.push(slideView);
            self.slidesByName[slideView.getName()] = slideContentView;
            slideContentView.slideView.on("statechanged", self.onSlideStateChanged.bind(self, slideContentView.slideView));
            if (slideView.backgroundView)
                self.backgroundView.append(slideView.backgroundView);
        });

        this.scrollView.on("scroll", this.onScroll.bind(this));
        this.scrollView.on("scrollend", this.onScrollEnd.bind(this));
        this.scrollView.on("viewselected", this.onSelectedItemChanged.bind(this));
        this.scrollView.on("afterviewselected", this.onAfterSelectedItemChanged.bind(this));

        this.on("keyup", this.onKeyUp.bind(this));
        this.readSlideFromHash(true);
        $(window).on('hashchange', this.onHashChange.bind(this));

        this.on("touchdragstart", this.onTouchDragStart.bind(this));
        this.on("touchdragmove", this.onTouchDragMove.bind(this));
        this.on("touchdragend", this.onTouchDragEnd.bind(this));
    }
    Global.Utils.extend(SlidesListView).from(Global.GestureView);

    SlidesListView.SlideNameStorageKey = "CurrentSlideName";

    $.extend(SlidesListView.prototype, {
        onKeyUp: function(event) {
            switch (event.keyCode) {
                case 37: // left arrow
                    this.prevSlide();
                    return false;
                case 39: // right arrow
                    this.nextSlide();
                    return false;
            }
        },

        currentSlideNumber: function() {
            return this.scrollView.selectedIndex;
        },

        prevSlide: function() {
            if (this.scrollView.selectedView.slideView.prev())
                return;
            this.scrollView.prev();
        },

        nextSlide: function() {
            if (this.scrollView.selectedView.slideView.next())
                return;
            this.scrollView.next();
        },

        onSelectedItemChanged: function(selectedContentView, previousSelectedContentView) {
            if (selectedContentView) {
                var slideView = selectedContentView.slideView;
                slideView.reset();
                this.updateSlidesVisibility(false);
                this.updateHash(slideView.getName());
                this.progressView.setValue(this.scrollView.selectedIndex / (this.scrollView.count() - 1));
                var self = this;
                this.requestAnimationFrame(function() {
                    var selectedView = self.scrollView.selectedView;
                    var shouldBeVisible = selectedView && selectedView.slideView.hasRemainingStates();
                    if (self.advanceButtonViewVisible != shouldBeVisible) {
                        this.advanceButtonViewVisible = shouldBeVisible;
                        self.advanceButtonView.el.toggleClass("visible", shouldBeVisible);
                    }
                });
            }
        },

        updateAdvanceSlideViewButton: function() {
            if (this.advanceButtonViewUpdateRequested)
                return;
            this.advanceButtonViewUpdateRequested = true;
            var self = this;
            this.requestAnimationFrame(function() {
                this.advanceButtonViewUpdateRequested = false;
                var selectedView = self.scrollView.selectedView;
                var shouldBeVisible = selectedView && selectedView.slideView.hasRemainingStates();
                if (self.advanceButtonViewVisible != shouldBeVisible) {
                    this.advanceButtonViewVisible = shouldBeVisible;
                    self.advanceButtonView.el.toggleClass("visible", shouldBeVisible);
                }
            });
        },

        onSlideStateChanged: function(slideView) {
            if (slideView !== this.scrollView.selectedView.slideView)
                return;
            this.updateAdvanceSlideViewButton();
        },

        onAfterSelectedItemChanged: function(selectedContentView, previousSelectedContentView) {
            if (previousSelectedContentView)
                previousSelectedContentView.slideView.reset();
            this.updateSlidesVisibility(true);
            if (selectedContentView)
                selectedContentView.slideView.start();
        },

        updateHash: function(name) {
            var oldName = this.currentSlideName;
            this.currentSlideName = name;
            Global.Utils.writeStorage(SlidesListView.SlideNameStorageKey, name);
            window.location.hash = encodeURIComponent(name);
            this.fire("slidechanged", [oldName, name]);
        },

        readHash: function() {
            var hash = window.location.hash;
            if (!hash || hash.length <= 1)
                return null;
            return decodeURIComponent(hash.substr(1));
        },

        readSlideFromHash: function(firstRun) {
            var loadFirstSlide = true;
            var name = ((!firstRun || !window.navigator.standalone) && this.readHash()) ||
                        (firstRun && Global.Utils.readStorage(SlidesListView.SlideNameStorageKey, null));
            if (name &&  (name == this.currentSlideName || this.gotoSlide(name, !firstRun)))
                return;
            this.gotoSlideNumber(0);
        },

        onHashChange: function() {
            this.readSlideFromHash(false);
        },

        gotoSlide: function(name, useAnimation) {
            if (useAnimation === undefined)
                useAnimation = true;
            var slideContentView = this.slidesByName[name];
            if (slideContentView) {
                this.scrollView.setSelectedItem(slideContentView, useAnimation);
                return true;
            }
            return false;
        },

        gotoSlideNumber: function(number, useAnimation) {
            if (useAnimation === undefined)
                useAnimation = true;
            this.scrollView.setSelectedIndex(number, useAnimation);
        },

        onAdvanceButtonViewTap: function() {
            this.nextSlide();
        },

        updateSlidesVisibility: function(canHideContent) {
            var index = this.scrollView.selectedIndex,
                min = index - this.maxLoadedSlides,
                max = index + this.maxLoadedSlides;
            this.scrollView.contentView.forEachChild(function(childView, slideIndex) {
                var visible = slideIndex >= min && slideIndex <= max;
                if (childView.visible && !canHideContent)
                    return;
                childView.toggle(visible);
            });
        },

        onScroll: function(delta) {
            var result = this.scrollView.deltaToFloatIndex(delta),
                from = Math.floor(result),
                to = Math.ceil(result),
                frameDelta = result - from;
            this.scrollView.contentView.forEachChild(function(childView, slideIndex) {
                var state = 0;
                if (from == slideIndex)
                    state = (1 - frameDelta);
                else if (to == slideIndex)
                    state = frameDelta;
                childView.slideView.setBackgroundState(state, false);
            });
        },

        onScrollEnd: function(delta, useAnimation) {
            var index = this.scrollView.selectedIndex;
            this.scrollView.contentView.forEachChild(function(childView, slideIndex) {
                var state = slideIndex == index ? 1 : 0;
                childView.slideView.setBackgroundState(state, useAnimation);
            });
        },

        respondsToTouchGesture: function(gesture) {
            if (SlidesListView.$super.prototype.respondsToTouchGesture.call(this, gesture))
                return true;
            return ((gesture.type == Global.GestureStart.DRAG) && gesture.scrollY) ||
                (gesture.type == Global.GestureStart.TRANSFORM);
        },

        onTouchDragStart: function() {
            this.infoView.attach();
        },

        onTouchDragMove: function(transform) {
            this.infoView.update(transform);
        },

        onTouchDragEnd: function(transform, touch, endOfGesture) {
            if (!endOfGesture)
                this.infoView.cancel();
            else
                this.infoView.end(transform);
        }
    });

    Global.SlidesListView = SlidesListView;

})();

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

    function ListView() {
        ListView.$super.call(this);
        var layoutType = this.el.attr("data-layout");
        if (layoutType)
            this.setLayout(new Global[Global.Utils.upperCaseFirstLetter(layoutType) + "Layout"]());
        this.el.addClass("list-view");
    }
    Global.Utils.extend(ListView).from(Global.View);

    $.extend(ListView.prototype, {

    });

    Global.ListView = ListView;

})();

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

    function LinkView() {
        LinkView.$super.call(this);
        this.href = this.el.attr("href");
        this.remote = this.href && this.href.length ? this.href.charAt(0) != "#" : false;
        this.el.addClass("link-view");
        this.on("tap", this.onLinkTap.bind(this));
    }
    Global.Utils.extend(LinkView).from(Global.HighlightTouchView);

    $.extend(LinkView.prototype, {
        onLinkTap: function() {
            if (this.remote)
                window.open(this.href);
            else
                window.location = this.href;
        }
    });

    Global.LinkView = LinkView;

})();

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

    function ProgressView() {
        ProgressView.$super.call(this);
        this.el.addClass("progress-view");
        this.innerView = new Global.View();
        this.innerView.el.addClass("progress-inner-view");
        this.append(this.innerView);
    }
    Global.Utils.extend(ProgressView).from(Global.View);

    $.extend(ProgressView.prototype, {
        setValue: function(value) {
            this.value = value;
            this.update();
        },

        update: function() {
            this.innerView.css(Global.Utils.prefixOne("transform"),
                "scaleX(" + this.value + ") translateZ(0px)");
        }
    });

    Global.ProgressView = ProgressView;

})();

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

    function ExpandableView() {
        ExpandableView.$super.call(this);
        this.el.addClass("expandable-view");
        this.open = false;
        this.titleView.on("tap", this.onTitleTap.bind(this));
        this.titleView.el.addClass("label-view");
    }
    Global.Utils.extend(ExpandableView).from(Global.View);

    $.extend(ExpandableView.prototype, {
        onTitleTap: function() {
            this.toggle();
        },

        toggle: function() {
            this.open = !this.open;
            this.update();
            this.relayoutParent();
        },

        update: function() {
            this.el.toggleClass("open", this.open);
            this.el.css("height", this.open ? "" : this.titleView.height());
        },

        internalRelayout: function() {
            ExpandableView.prototype.$super.internalRelayout.call(this);
            this.update();
        }

    });

    Global.ExpandableView = ExpandableView;

})();

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

    function TimeReportView(mainView) {
        TimeReportView.$super.call(this, mainView);
        this.el.addClass("timing-view");
        this.setLayout(new Global.VerticalLayout());

        this.scrollView = new Global.ScrollView(Global.ScrollView.VERTICAL);
        this.scrollView.fillHeight = 1;
        this.scrollView.el.addClass("timing-content-view");
        this.append(this.scrollView);

        this.buttonsView = new Global.ScrollView(Global.ScrollView.HORIZONTAL);
        this.buttonsView.el.addClass("timing-content-buttons-view");
        this.buttonsView.scrollToCenter = true;
        this.buttonsView.contentView.setLayout(new Global.HorizontalLayout());
        this.append(this.buttonsView);

        this.cancelButtonView = new Global.HighlightTouchView();
        this.cancelButtonView.el.addClass("timing-content-button-view").prepend("Ok");
        this.cancelButtonView.on("tap", this.onCancelButtonViewTap.bind(this));
        this.buttonsView.contentView.append(this.cancelButtonView);

        this.emailButtonView = new Global.HighlightTouchView();
        this.emailButtonView.el.addClass("timing-content-button-view").prepend("Email");
        this.emailButtonView.on("tap", this.onEmailButtonTap.bind(this));
        this.buttonsView.contentView.append(this.emailButtonView);

        this.report = null;
    }
    Global.Utils.extend(TimeReportView).from(Global.DialogView);

    $.extend(TimeReportView.prototype, {
        newViewWithClassAndText: function(className, text) {
            var view = new Global.View();
            view.el.addClass(className).text(text);
            return view;
        },
        showWithData: function(slideListView, data) {
            var contentView = this.scrollView.contentView,
                slides = slideListView.slides,
                items = [],
                maxTime = 0, i,
                reportLines = [];
            contentView.el.text("");
            for (i = 0; i < slides.length; ++i) {
                var slideView = slides[i],
                    name = slideView.getName(),
                    time = data.hasOwnProperty(name) ? data[name] : 0;
                maxTime = Math.max(maxTime, time);
                var itemView = new Global.HighlightTouchView();
                itemView.setLayout(new Global.HorizontalLayout());
                itemView.el.addClass("slide-item-view");
                itemView.append(this.newViewWithClassAndText("slide-number", i + 1));
                itemView.append(this.newViewWithClassAndText("slide-time", Global.Utils.timeToString(time)));
                var nameView = this.newViewWithClassAndText("slide-name", name);
                nameView.fillWidth = 1;
                itemView.append(nameView);
                itemView.on("tap", this.showSlide.bind(this, slideListView, slideView.number));
                contentView.append(itemView);
                items.push({view: itemView, time: time});
                reportLines.push([
                    i + 1, Global.Utils.timeToString(time), name
                ].join(", "));
            }
            if (maxTime > 0) {
                var transformProperty = Global.Utils.prefixOne("transform");
                for (i = 0; i < items.length; ++i) {
                    var item = items[i];
                    item.view.el.append(
                        $("<div />)")
                            .addClass("slide-scale-time")
                            .css(transformProperty, "scale(" + (item.time / maxTime) + ", 1)"));
                }
            }
            this.report = reportLines.join("\n");
            this.show();
        },

        showSlide: function(slideListView, number) {
            this.hide();
            slideListView.gotoSlideNumber(number, false);
        },

        onCancelButtonViewTap: function() {
            this.hide();
        },

        onEmailButtonTap: function() {
            var body = this.report;
            window.location = "mailto:?subject=Time Report&body=" + encodeURIComponent(body);
        }
    });

    Global.TimeReportView = TimeReportView;

})();

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

    function SlideCssDemoView() {
        SlideCssDemoView.$super.call(this);
        this.el.addClass("slide-css-demo-view");
        this.filterName = this.el.attr("data-filter-name");
        this.filterValueUnits = this.el.attr("data-filter-value-units");
        if (this.filterControlView)
            this.filterControlView.on("valuechanged", this.onValueChanged.bind(this));
        this.onValueChanged();
        this.animationFrameRequested = false;

        this.registerType(this.imagesTypeView, this.imagesPreviewView);
        this.registerType(this.formsTypeView, this.formsPreviewView);
        this.registerType(this.textTypeView, this.textPreviewView);

        this.on("reset", this.onSlideReset.bind(this));
    }
    Global.Utils.extend(SlideCssDemoView).from(Global.SlideView);

    $.extend(SlideCssDemoView.prototype, {
        onValueChanged: function() {
            this.update();
        },

        update: function() {
            if (this.animationFrameRequested)
                return;
            this.animationFrameRequested = true;
            this.requestAnimationFrame(this.updateInternal.bind(this));
        },

        updateInternal: function() {
            this.animationFrameRequested = false;
            var value = this.filterControlView.getValue();
            if (!this.filteredAreaView || !this.filterValueUnits || !this.filterName)
                return;
            var cssValue = this.filterName + "(" + Math.round(value) + this.filterValueUnits + ")";
            Global.Utils.applyFilterWithDropShadowWorkaround(this.filteredAreaView.el, cssValue);
            if (this.filterSyntaxView) {
                var cssValueHTML = "<span class='filter-name'>" + this.filterName + "</span>(" + Math.round(value) + this.filterValueUnits + ")";
                this.filterSyntaxView.el.html("<span class='prop-name'>filter</span>: " + cssValueHTML);
            }
        },

        registerType: function(typeView, preview) {
            var self = this;
            typeView.on("tap", function() {
                self.filteredAreaView.setSelectedItem(preview);
            });
        },

        onSlideReset: function() {
            var selection = document.selection || window.getSelection();
            selection.empty();
        }
    });

    Global.SlideCssDemoView = SlideCssDemoView;

})();

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

    function TouchTapMixinConstructor() {
        this.tapCount = 0;
        this.longHoldCount = 0;
        this.on("tap", this.onAreaTap.bind(this));
        this.on("longtaptimer", this.onAreaLongTap.bind(this));
    }

    var TouchTapMixin = {
        onAreaTap: function() {
            this.longHoldCount = 0;
            this.tapCount++;
            if (this.tapCount == 1)
                this.getLogView().el.text("Tap");
            else
                this.getLogView().el.text("Tap (" + this.tapCount + ")");
        },
        onAreaLongTap: function() {
            this.tapCount = 0;
            this.longHoldCount++;
            if (this.longHoldCount == 1)
                this.getLogView().el.text("Long hold");
            else
                this.getLogView().el.text("Long hold (" + this.longHoldCount + ")");
        }
    };

    function TapTouchAreaView() {
        TapTouchAreaView.$super.call(this);
        TouchTapMixinConstructor.call(this);
    }
    Global.Utils.extend(TapTouchAreaView).from(Global.HighlightTouchView);
    $.extend(TapTouchAreaView.prototype, {
        getLogView: function() {
            return this.logView;
        }
    }, TouchTapMixin);

    function TapDragTouchAreaView() {
        TapDragTouchAreaView.$super.call(this);
        TouchTapMixinConstructor.call(this);
    }
    Global.Utils.extend(TapDragTouchAreaView).from(Global.DraggableView);
    $.extend(TapDragTouchAreaView.prototype, {
        getLogView: function() {
            return this.contentView.logView;
        }
    }, TouchTapMixin);

    function DragTouchAreaView() {
        DragTouchAreaView.$super.call(this);
        this.shouldRestoreTransform = this.el.attr("data-no-restore") === undefined;
    }
    Global.Utils.extend(DragTouchAreaView).from(Global.PanView);

    function TransformTouchAreaView() {
        TransformTouchAreaView.$super.call(this);
        this.el.addClass("transform-touch-area-view");
        this.shouldRestoreTransform = this.el.attr("data-no-restore") === undefined;
        this.noTouchCapture = this.el.attr("data-no-touch-capture") !== undefined;
    }
    Global.Utils.extend(TransformTouchAreaView).from(Global.TransformView);

    Global.TapTouchAreaView = TapTouchAreaView;
    Global.TapDragTouchAreaView = TapDragTouchAreaView;
    Global.DragTouchAreaView = DragTouchAreaView;
    Global.TransformTouchAreaView = TransformTouchAreaView;

})();

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

    function parseFloatRect(frameRect) {
        frameRect.x = parseFloat(frameRect.x);
        frameRect.y = parseFloat(frameRect.y);
        frameRect.w = parseFloat(frameRect.w);
        frameRect.h = parseFloat(frameRect.h);
        return frameRect;
    }

    function AnimationView() {
        AnimationView.$super.call(this);
        this.frameNumber = 0;
        this.visibleFrameNumber = -1;
        this.contentWidth = 0;
        this.contentHeight = 0;
        this.initialFrameNumber = 0;
        this.animationFrameRequested = false;
        this.animationTimer = null;
        this.direction = 1;

        this.el.addClass("animation-view");
        this.viewportEl = $("<div />").addClass("animation-viewport").prependTo(this.el);
        this.imgEl = $("<div />").addClass("animation-image").appendTo(this.viewportEl);
        if (this.frameDataView) {
            var text = this.frameDataView.el.text();
            this.frameDataView.el.remove();
            try {
                this.frameData = JSON.parse(text);
            } catch (e) {
                console.error("Error parsing frame data.", this.frameDataView.el);
            }
            this.computeFrames();
            this.frameDataView = null;
        }
        this.on("tap", this.onTap.bind(this));

        this.on("touchdragstart", this.onRangeTouchDragStart.bind(this));
        this.on("touchdragmove", this.onTouchDragMove.bind(this));
    }
    Global.Utils.extend(AnimationView).from(Global.HighlightTouchView);

    $.extend(AnimationView.prototype, {
        computeFrames: function() {
            if (!this.frameData)
                return;
            var frames = this.frameData.frames,
                frameViews = [];
            this.contentWidth = parseFloat(frames[0].sourceSize.w);
            this.contentHeight = parseFloat(frames[0].sourceSize.h);
            for (var i = 0; i < frames.length; ++i) {
                var frame = frames[i],
                    frameRect = parseFloatRect(frame.frame),
                    frameTrim = parseFloatRect(frame.spriteSourceSize);

                var frameViewEl = $("<div />").addClass("animation-image-view").css({
                    "background-position": (-frameRect.x) + "px " + (-frameRect.y) +"px",
                    "left": frameTrim.x,
                    "top": frameTrim.y,
                    "width": frameRect.w,
                    "height": frameRect.h
                });
                if (frame.rotated) {
                    frameViewEl.css(Global.Utils.prefixOne("transform"), "rotate(-90deg) translateZ(0px)");
                    frameViewEl.css("top", frameTrim.y + frameRect.w);
                }
                frameViewEl.append($("<div />").addClass("debug-view-indicator").text(i));
                this.imgEl.append(frameViewEl);

                var view = {
                    number: i,
                    el: frameViewEl
                };
                frameViews.push(view);
            }

            this.frameViews = frameViews;
            this.gotoFrame(frameViews[this.frameNumber]);
        },

        gotoFrame: function(frame) {
            if (this.visibleFrameNumber == frame.number)
                return;
            if (this.visibleFrameNumber != -1)
                this.frameViews[this.visibleFrameNumber].el.css("opacity", 0);
            this.visibleFrameNumber = frame.number;
            frame.el.css("opacity", 1);
        },

        updateUI: function() {
            if (this.animationFrameRequested)
                return;
            this.animationFrameRequested = true;
            this.requestAnimationFrame(this.updateUIInternal.bind(this));
        },

        updateUIInternal: function() {
            this.animationFrameRequested = false;
            this.gotoFrame(this.frameViews[this.frameNumber]);
        },

        onTap: function() {
            if (!this.frameViews)
                return;
            this.el.toggleClass("debug-view");
        },

        internalRelayout: function() {
            this.css("width", this.contentWidth).css("height", this.contentHeight);
            AnimationView.prototype.$super.internalRelayout.call(this);
        },

        onRangeTouchDragStart: function() {
            this.initialFrameNumber = this.frameNumber;
        },

        onTouchDragMove: function(transform) {
            var length = this.frameViews.length;
            var value = Math.round(this.initialFrameNumber + (transform.dragX / (this.contentWidth * 3) * length));
            this.frameNumber = Math.max(0, Math.min(length - 1, value));
            this.updateUI();
        },

        respondsToTouchGesture: function(gesture) {
            return gesture.type == Global.GestureStart.DRAG;
        },

        nextFrame: function() {
            if (!this.frameViews)
                return;
            this.frameNumber += this.direction;
            if (this.frameNumber < 0 || this.frameNumber >= this.frameViews.length) {
                this.direction *= -1;
                this.frameNumber = Math.max(0, Math.min(this.frameViews.length - 1, this.frameNumber));
            }
            this.updateUI();
        },

        installTimer: function() {
            if (this.animationTimer)
                return;
            this.animationTimer = setInterval(this.nextFrame.bind(this), 1000 / 30);
        },

        clearTimer: function() {
            if (!this.animationTimer)
                return;
            clearInterval(this.animationTimer);
            this.animationTimer = null;
        },

        play: function() {
            this.installTimer();
        },

        pause: function() {
            this.clearTimer();
        },

        playing: function() {
            return this.animationTimer !== null;
        }
    });

    Global.AnimationView = AnimationView;

})();

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

    function SlideAnimationView() {
        SlideAnimationView.$super.call(this);
        this.characterViews = this.el.find(".animation-view").map(function(i, dom) { return $(dom).data("view"); });
        this.transformViews = this.el.find(".transform-touch-area-view").map(function(i, dom) { return $(dom).data("view"); });
        this.playButtonView.on("tap", this.onToggleButtonTap.bind(this));
        this.playButtonTitleView = this.playButtonView.el.find(".title-view");
        this.resetButtonView.on("tap", this.resetAnimation.bind(this));
        this.on("reset", this.onSlideReset.bind(this));
        this.playing = false;
    }
    Global.Utils.extend(SlideAnimationView).from(Global.SlideView);

    $.extend(SlideAnimationView.prototype, {
        playAnimation: function() {
            this.playButtonTitleView.text("Pause");
            this.playing = true;
            this.characterViews.each(function(i, view) {
                view.play();
            });
        },

        pauseAnimation: function() {
            this.playButtonTitleView.text("Play");
            this.playing = false;
            this.characterViews.each(function(i, view) {
                view.pause();
            });
        },

        onToggleButtonTap: function() {
            if (this.playing)
                this.pauseAnimation();
            else
                this.playAnimation();
        },

        resetAnimation: function() {
            this.pauseAnimation();
            this.transformViews.each(function(i, view) {
                view.resetTransform();
            });
        },

        onSlideReset: function() {
            this.pauseAnimation();
        }
    });

    Global.SlideAnimationView = SlideAnimationView;

})();
