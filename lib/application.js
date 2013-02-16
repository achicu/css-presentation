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
