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
            // reinstall timer to change refresh rate.
            if (this.started) {
                this.clearTimer();
                this.installTimer();
            }
            this.updateInfoBarMinute();
        },

        slideChanged: function(oldName, newName) {
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
            var timeOnSlide = this.timeElapsed - this.slideStartTime;
            this.slideStartTime = 0;
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
                this.updateAccumulatedTimes();
                this.updateLocalStorage();
            }
            this.updateInfoBarMinute();
        },

        updateLocalStorage: function() {
            Global.Utils.writeStorage(Presenter.TimeElapsedStorageKey, this.timeElapsed);
            Global.Utils.writeStorage(Presenter.LastCheckTimeStorageKey, this.lastCheckTime);
            Global.Utils.writeStorage(Presenter.SlideStartTimeStorageKey, this.slideStartTime);
            Global.Utils.writeStorageBool(Presenter.StartedStorageKey, this.started);
        },

        updateInfoBarMinute: function() {
            if (this.slidesListView.infoView.visible) {
                var minute = Math.floor(this.timeElapsed / 1000 / 60),
                    second = Math.floor(this.timeElapsed / 1000 - minute * 60);
                this.slidesListView.infoBarView.minuteView.el
                    .toggleClass("started", this.started)
                    .text(minute + ":" + ((second < 10) ? "0" : "") + second);
            }
        },

        stop: function() {
            if (!this.started)
                return;
            this.clearTimer();
            this.updateTimeElapsed();
            this.updateAccumulatedTimes();
            this.started = false;
            this.updateInfoBarMinute();
            this.updateLocalStorage();
        },

        start: function() {
            if (this.started)
                return;
            this.clearTimer();
            this.updateTimeElapsed();
            this.started = true;
            this.lastCheckTime = Date.now();
            this.slideStartTime = this.timeElapsed;
            this.installTimer();
            this.updateInfoBarMinute();
            this.updateLocalStorage();
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
