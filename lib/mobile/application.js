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
        this.body = $("#app-body");

        this.installUpdateListener();
        this.checkForUpdates();

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
        },

        installUpdateListener: function() {
            var cache = window.applicationCache;
            if (!cache)
                return;
            cache.addEventListener("updateready", this.onCacheUpdateReady.bind());
        },

        checkForUpdates: function() {
            var cache = window.applicationCache;
            if (!cache)
                return;
            try {
                cache.update();
            } catch (e) {
                // FIXME: Opera throws an INVALID_STATE_ERR.
            }
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
