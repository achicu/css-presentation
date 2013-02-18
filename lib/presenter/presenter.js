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
    function Presenter(app) {
        Presenter.$super.call(this);
        this.app = app;
        this.initSlides();

        app.mainView.presenter = this;

        this.slidesListView = new Global.SlidesListView(this, this.slides);
        app.mainView.append(this.slidesListView);

        this.timer = null;

        this.timeElapsed = Global.Utils.readStorageInt(Presenter.TimeElapsedStorageKey, 0);
        this.lastCheckTime = Global.Utils.readStorageInt(Presenter.LastCheckTimeStorageKey, 0);
        this.started = Global.Utils.readStorageBool(Presenter.StartedStorageKey, false);

        if (this.started) {
            this.updateTimeElapsed();
            this.lastCheckTime = Date.now();
            this.installTimer();
        }

    }
    Global.Utils.extend(Presenter).from(Global.EventDispatcher);

    Presenter.TimeElapsedStorageKey = "TimeElapsed";
    Presenter.LastCheckTimeStorageKey = "LastCheckTime";
    Presenter.StartedStorageKey = "Started";

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
            this.timer = setInterval(this.updateTimeElapsed.bind(this), 1000);
        },

        updateTimeElapsed: function() {
            if (this.started) {
                var time = Date.now();
                this.timeElapsed += time - this.lastCheckTime;
                this.lastCheckTime = time;
                this.updateLocalStorage();
            }
            this.updateInfoBarMinute();
        },

        updateLocalStorage: function() {
            Global.Utils.writeStorage(Presenter.TimeElapsedStorageKey, this.timeElapsed);
            Global.Utils.writeStorage(Presenter.LastCheckTimeStorageKey, this.lastCheckTime);
            Global.Utils.writeStorageBool(Presenter.StartedStorageKey, this.started);
        },

        updateInfoBarMinute: function() {
            if (this.slidesListView.infoView.visible) {
                var minute = Math.floor(this.timeElapsed / 1000 / 60),
                    second = Math.floor(this.timeElapsed / 1000 - minute * 60);
                this.slidesListView.infoBarView.minuteView.el
                    .toggleClass("started", this.started)
                    .text(minute + ":" + second);
            }
        },

        startStopTimer: function() {
            this.clearTimer();
            this.updateTimeElapsed();
            this.started = !this.started;
            if (this.started) {
                this.lastCheckTime = Date.now();
                this.installTimer();
            }
            this.updateInfoBarMinute();
            this.updateLocalStorage();
        },

        resetTimer: function() {
            this.clearTimer();
            this.timeElapsed = 0;
            this.started = false;
            this.updateInfoBarMinute();
            this.updateLocalStorage();
        }
    });

    Global.Presenter = Presenter;
    Global.Application.plugins.push(function(app) {
        app.presenter = new Presenter(app);
    });

})();
