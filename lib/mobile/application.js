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
    function Application() {
        this.checkFeatures();

        this.body = $("#app-body");

        $("#loading").remove();

        this.browserPopupCloseEl = $("#browser-popup-close");
        this.browserPopupCloseEl.click(this.onBrowserPopupCloseClicked.bind(this));
        this.browserPopupEl = $("#browser-popup").detach();

        this.config = new Global.Config();
        this.config.load(filterConfigs);
        this.github = new Global.GitHub();

        this.fileSystem = new Global.LocalStorage();
        this.filterStore = new Global.FilterStore(this.config, this.fileSystem, this.github);
        this.filterList = new Global.FilterList(this.filterStore);
        this.animation = new Global.Animation(this.filterList, this.filterStore);
        this.presets = new Global.PresetStore(this.fileSystem, this.filterStore, this.animation);

        this.initPlugins();

        this.unsupportedPopupEl = $("#filters-not-supported-popup").detach();
        this.helpView = new Global.HelpView(this);

        this.targetEl = $("#container");

        this.activeFilterListView = new Global.ActiveFilterListView(this.filterList);
        this.leftSideDockPanel = new Global.DockPanel("left");
        var builtinFilters = $("<div />").append("<h1 class='filters-header'>Builtin filters</h1>");
        this.leftSideDockPanel.el.append(builtinFilters);
        this.builtinFilterStoreView = new Global.FilterStoreView(this.filterStore, this.filterList, null, null, "builtins", builtinFilters);

        if (this.supportsCustomFilters && this.supportsWebGL) {
            var customFilters = $("<div />").append("<h1 class='filters-header'>Custom filters</h1>");
            this.leftSideDockPanel.el.append(customFilters);
            this.customFilterStoreView = new Global.FilterStoreView(this.filterStore, this.filterList, null, null, "custom", customFilters);
        }

        // this.renderSurfaceView = new Global.RenderSurfaceView(this);
        // this.renderSurfaceView.installLeftDock(this.leftSideDockPanel);
        // this.renderSurfaceView.installRightDock(this.activeFilterListView.dockPanel);

        // this.mainViewEl = this.renderSurfaceView.transformLayerEl;

        // At this point we are finished with loading HTML snippets, so we can remove the components element.
        $("#components").remove();

        this.init();


        var touchLayerTest = new Global.GestureView();
        touchLayerTest.el.css({
            "width": "100%",
            "height": "100%",
            "position": "absolute",
            "left": "0px",
            "top": "0px",
            "background-color": "white"
        }).appendTo(document.body);

        var rotEl = $("<img src='http://html.adobe.com/_/img/slides/edgeinspect/slides_edgeinspect_video.png' />")
        .css({
            "position": "absolute",
            "left": "0px",
            "top": "0px",
            "background-color": "green"
        }).appendTo(touchLayerTest.el);

        var elTransform = {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1
        }, startTransform = null;

        function generateTransform(transform) {
            return "translate(" + transform.x + "px, " + transform.y + "px) rotate(" + transform.rotation + "deg) scale(" + transform.scale + ") translateZ(1px)";
        }

        function dist(x1, y1, x2, y2) {
            return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
        }

        function cloneTransform(el) {
            var transformValue = el.css("-webkit-transform");
            if (transformValue == "none") {
                return {
                    x: 0,
                    y: 0,
                    rotation: 0,
                    scale: 1
                };
            }
            transformValue = transformValue.substring(9, transformValue.length - 2).split(",");
            var a = parseFloat(transformValue[0]);
            var b = parseFloat(transformValue[1]);
            return {
                x: parseFloat(transformValue[12]),
                y: parseFloat(transformValue[13]),
                rotation: Math.atan2(b, a) * 180 / Math.PI,
                scale: dist(0, 0, a, b)
            };
        }

        touchLayerTest.on("touchtransformstart", function() {
            startTransform = cloneTransform(rotEl);
            rotEl.css("background-color", "blue");
        });

        touchLayerTest.on("touchtransformend", function() {
            startTransform = null;
            rotEl.css("background-color", "green");
        });

        touchLayerTest.on("touchtransform", function(transform) {
            elTransform.x = startTransform.x + transform.dragX;
            elTransform.y = startTransform.y + transform.dragY;
            elTransform.scale = startTransform.scale * transform.scale;
            elTransform.rotation = startTransform.rotation + transform.rotation;
            rotEl.css("-webkit-transform", generateTransform(elTransform));
        });

        touchLayerTest.on("touchdragstart", function() {
            rotEl.css("background-color", "red");
            startTransform = cloneTransform(rotEl);
        });

        touchLayerTest.on("touchdragend", function() {
            startTransform = null;
            rotEl.css("background-color", "green");
        });

        touchLayerTest.on("touchdragmove", function(transform, touch) {
            elTransform.x = startTransform.x + transform.dragX;
            elTransform.y = startTransform.y + transform.dragY;
            rotEl.css("-webkit-transform", generateTransform(elTransform));
        });

    }

    Application.prototype = {
        init: function() {
            // Force a 3d layer in order to run filters in GPU.
            this.targetEl.css("-webkit-transform", "translate3d(0,0,0)");
            this.animation.on("filtersUpdated", this.onFiltersUpdated.bind(this));

            // Make sure the filters are up to date after all the events are set up.
            this.animation.update();
            this.filterStore.loadFilterConfigurations();

            this.checkMinimumFeatures();
        },

        setTargetEl: function(el) {
            var oldFilters = this.targetEl.css("-webkit-filter");
            this.targetEl = el;
            // Force a 3d layer in order to run filters in GPU.
            this.targetEl.css("-webkit-transform", "translate3d(0,0,0)");
            this.targetEl.css("-webkit-filter", oldFilters);
        },

        onFiltersUpdated: function(cssFilters, filterCodeHtml, animationCodeHtml) {
            this.targetEl.css("-webkit-filter", cssFilters);
        },

        initPlugins: function() {
            var self = this;
            $.each(Application.plugins, function(i, pluginCallback) {
                pluginCallback(self);
            });
        },

        //
        // Feature detection:
        //

        prefixes: ["", "-webkit-", "-moz-", "-ms-", "-o-"],

        checkFeatureWithPropertyPrefix: function(property, value) {
            var div = $("<div />");
            for (var i = 0; i < this.prefixes.length; ++i) {
                var prefixedProperty = this.prefixes[i] + property;
                if (div.css(prefixedProperty, value).css(prefixedProperty) == value)
                    return true;
            }
            return false;
        },

        checkFeatureWithValuePrefix: function(property, value) {
            var div = $("<div />");
            for (var i = 0; i < this.prefixes.length; ++i) {
                var prefixedValue = this.prefixes[i] + value;
                if (div.css(property, prefixedValue).css(property) == prefixedValue)
                    return true;
            }
            return false;
        },

        checkWebGLSupport: function(property, value) {
            var isCanvasSupported = true;
            var isWebGlSupported = true;
            var canvas, context;
            try {
                canvas = document.createElement('canvas');
            }
            catch(err) {
                isCanvasSupported = false;
            }
            try {
                context = canvas.getContext("experimental-webgl");
            }
            catch(err) {
                isWebGlSupported = false;
            }
            if (!(isCanvasSupported && isWebGlSupported))
                return null;
            return !!context;
        },

        checkFeatures: function() {
            this.supportsFlex = this.checkFeatureWithValuePrefix("display", "flex") || this.checkFeatureWithValuePrefix("display", "box");
            this.supportsFilters = this.checkFeatureWithPropertyPrefix("filter", "sepia(100%)");
            this.supportsCustomFilters = this.checkFeatureWithPropertyPrefix("filter", "custom(none mix(url(http://www.example.com/)))");
            this.supportsWebGL = this.checkWebGLSupport();
        },

        checkMinimumFeatures: function() {
            if (!this.supportsFlex || !this.supportsFilters)
                this.showBrowserCheckPopup();
            // FIXME: Implement the first run dialog.
            // else
            //     this.checkFirstTimeLoad();

            if (!this.supportsCustomFilters || !this.supportsWebGL) {
                var message;
                if (!this.supportsCustomFilters)
                    message = "Your browser does not support custom filters.";
                else if (!this.supportsWebGL) {
                    // Supports custom filters, but WebGL isn't enabled.
                    message = "You need to enable WebGL to use custom filters.";
                }

                this.unsupportedPopupEl.find(".message").html(message);
                this.unsupportedPopupEl.find(".filters-not-supported-help").click(this.showCustomFilterCheckPopup.bind(this));
                // FIXME: Add this back when we will have the list of filters.
                // this.customFilterStoreView.filterStockListEl.replaceWith(this.unsupportedPopupEl.clone(true));

                // hide tabs for unavailable features
                //this.importFilterView.dockPanel.tabEl.hide();
                //this.forkedFilterStoreView.dockPanel.tabEl.hide();
            }
        },

        showBrowserCheckPopup: function() {
            this.mainViewEl.hide();
            this.browserPopupCloseEl.hide();
            this.browserPopupEl.appendTo(this.body).show();
        },

        showCustomFilterCheckPopup: function() {
            this.browserPopupCloseEl.show();
            this.browserPopupEl.appendTo(this.body).show();
        },

        onBrowserPopupCloseClicked: function() {
            this.browserPopupEl.detach();
            return false;
        },

        showFirstRunPopup: function() {
            this.firstRun = true;
            this.helpView.show();
        },

        checkFirstTimeLoad: function() {
            var self = this;
            this.firstRun = false;
            this.fileSystem.get("first_run", function(err, data) {
                if (data != "no")
                    self.showFirstRunPopup();
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
