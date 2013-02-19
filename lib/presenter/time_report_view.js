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
