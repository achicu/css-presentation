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
