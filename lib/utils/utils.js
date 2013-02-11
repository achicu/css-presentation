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
