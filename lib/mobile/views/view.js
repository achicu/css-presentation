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

    function ViewUpdater() {
        ViewUpdater.$super.call(this);
        this.timer = null;
        this.timerCallback = this.onTimerFired.bind(this);
        this.changes = [];
    }

    Global.Utils.extend(ViewUpdater).from(Global.EventDispatcher);

    $.extend(ViewUpdater.prototype, {
        register: function(view) {
            this.installTimer();
            this.changes.push(view);
        },
        update: function() {
            this.removeTimer();
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
            this.update();
        },
        installTimer: function() {
            if (this.timer !== null)
                return;
            this.timer = setTimeout(this.timerCallback, 0);
        },
        removeTimer: function() {
            if (this.timer === null)
                return;
            clearTimeout(this.timer);
            this.timer = null;
        }
    });

    ViewUpdater.instance = new ViewUpdater();

    function View() {
        View.$super.call(this);
        this.el = $("<div />").css("z-index", 0).data("view", this);
        this.layout = null;
        this.pendingProperties = null;
        this.fillWidth = null;
        this.fillHeight = null;
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

        parentView: function() {
            for (var node = this.el.parent(); node.length; node = node.parent()) {
                var view = node.data("view");
                if (view)
                    return view;
            }
            return null;
        },

        forEachChild: function(fn) {
            var parentView = this;
            this.el.children().each(function(i, el) {
                var childView = $(el).data("view");
                if (!childView)
                    return;
                return fn.call(parentView, childView);
            });
        },

        setLayout: function(newLayout) {
            if (this.layout) {
                this.layout.unregister(this);
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

        onWindowResize: function() {
            this.propagateResizedEvent();
            this.propagateLayoutEvent();
        },

        installResizeEvent: function() {
            var fn = this.onWindowResize.bind(this);
            $(window).bind("resize", fn);
            setTimeout(fn, 0);
        },

        css: function(property, value) {
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
        },

        margin: function(side) {
            return parseFloat(this.el.css("margin-" + side));
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
                left: parseFloat(this.css("left")),
                top: parseFloat(this.css("top")),
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

        fillParent: function() {
            this.fillWidth = this.fillHeight = 1;
            this.el.css({
                "position": "absolute",
                "width": "100%",
                "height": "100%"
            });
        },

        relayout: function() {
            this.forEachChild(function(childView) {
                childView.relayout();
            });
            if (this.layout)
                this.layout.layout();
        }
    });

    Global.View = View;

})();
