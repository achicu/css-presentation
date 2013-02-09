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

        this.installUpdateListener();
        this.checkForUpdates();

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

        Global.ContentView.loadSource();
        this.mainView = new Global.MainView(this, this.filterStore, this.presets, this.filterList, this.animation);
        this.mainView.el.appendTo(this.body);

        // At this point we are finished with loading HTML snippets, so we can remove the components element.
        $("#components").remove();
        this.init();

        var self = this;
        this.mainView.on("firstlayout", function() {
            setTimeout(function() {
                self.mainView.init();
                $("#loading").remove();
            }, 0);
        });
    }

    Application.prototype = {
        init: function() {
            // Make sure the filters are up to date after all the events are set up.
            this.animation.update();
            this.filterStore.loadFilterConfigurations();

            this.checkMinimumFeatures();
        },

        installUpdateListener: function() {
            var cache = window.applicationCache;
            cache.addEventListener("updateready", this.onCacheUpdateReady.bind());
        },

        checkForUpdates: function() {
            var cache = window.applicationCache;
            cache.update();
        },

        onCacheUpdateReady: function() {
            var cache = window.applicationCache;
            if (cache.status != cache.UPDATEREADY) {
                console.log("No cache update.");
                return;
            }
            console.log("Swapping cache.");
            console.log("Reloading app.");
            if (confirm("New application version is available. Would you like to load the new version now?")) {
                cache.swapCache();
                window.location.reload();
            }
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
