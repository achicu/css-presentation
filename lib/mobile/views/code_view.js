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

    function CodeView(documentView, animation) {
        CodeView.$super.call(this, documentView);
        this.setLayout(new Global.VerticalLayout());
        this.el.addClass("code-view");

        this.animation = animation;
        
        this.pictureBrowserForm = $("<form />").css("display", "none").appendTo(this.el).get(0);
        this.pictureBrowser = $("<input type=\"file\" />").css("display", "none").appendTo(this.pictureBrowserForm).get(0);
        this.pictureBrowser.addEventListener("change", this.onFileSelected.bind(this), false);

        this.buttonsView = new Global.View();
        this.buttonsView.fillWidth = 1;
        this.buttonsView.el.addClass("buttons-view");
        this.buttonsView.setLayout(new Global.HorizontalLayout());
        this.append(this.buttonsView);

        this.changePictureButtonView = new Global.HighlightTouchView();
        this.changePictureButtonView.el.addClass("button-view").addClass("change-picture-button-view").prepend("Change image");
        this.changePictureButtonView.on("tap", this.onChangeImageClicked.bind(this));
        this.changePictureButtonView.fillWidth = 1;
        this.buttonsView.append(this.changePictureButtonView);

        this.resetPictureButtonView = new Global.HighlightTouchView();
        this.resetPictureButtonView.el.addClass("button-view").addClass("reset-picture-button-view").prepend("Reset image");
        this.resetPictureButtonView.on("tap", this.onResetImageClicked.bind(this));
        this.resetPictureButtonView.fillWidth = 1;
        this.buttonsView.append(this.resetPictureButtonView);

        this.codeView = new Global.ScrollView(Global.ScrollView.BOTH);
        this.codeView.fillHeight = 1;
        this.codeView.el.addClass("code-view-content");
        this.append(this.codeView);
    }
    Global.Utils.extend(CodeView).from(Global.InfoView);

    $.extend(CodeView.prototype, {
        attach: function() {
            if (!this.visible)
                this.updateCode();
            CodeView.$super.prototype.attach.call(this);
        },

        updateCode: function() {
            var time = this.animation.currentTime();
            var filterHtml = this.animation.getFiltersAtTime(time, Global.ColorSchemes.colorTheme);
            if (!filterHtml.length)
                filterHtml.push("none");
            var code = "<div class='css-property-name'>-webkit-filter:</div><div class='css-property-value'>" + filterHtml.join("<br />") + ";</div>";
            this.codeView.contentView.el.html(code);
            this.codeView.relayout();
        },

        onFileSelected: function(event) {
            var files = this.pictureBrowser.files;
            if (!files.length)
                return;
            var reader = new FileReader(),
                self = this;
            reader.onload = function() {
                self.animation.setImageUrl(reader.result);
                self.pictureBrowserForm.reset();
            };
            reader.readAsDataURL(files[0]);
        },

        onChangeImageClicked: function() {
            this.pictureBrowser.click();
        },

        onResetImageClicked:function() {
            this.animation.setImageUrl(null);
        }
    });

    Global.CodeView = CodeView;

})();
