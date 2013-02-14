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

    function CameraButtonsView(mainView, animation) {
        CameraButtonsView.$super.call(this, mainView);
        this.el.addClass("camera-buttons-view");

        this.animation = animation;

        this.pictureBrowserForm = $("<form />").css("display", "none").appendTo(this.el).get(0);
        this.pictureBrowser = $("<input type=\"file\" />").css("display", "none").appendTo(this.pictureBrowserForm).get(0);
        this.pictureBrowser.addEventListener("change", this.onFileSelected.bind(this), false);

        this.contentView.el.addClass("buttons-view");
        this.contentView.setLayout(new Global.VerticalLayout());

        this.changePictureButtonView = new Global.HighlightTouchView();
        this.changePictureButtonView.el.addClass("button-view").addClass("change-picture-button-view").prepend("Change image");
        this.changePictureButtonView.on("tap", this.onChangeImageClicked.bind(this));
        this.contentView.append(this.changePictureButtonView);

        this.resetPictureButtonView = new Global.HighlightTouchView();
        this.resetPictureButtonView.el.addClass("button-view").addClass("reset-picture-button-view").prepend("Reset image");
        this.resetPictureButtonView.on("tap", this.onResetImageClicked.bind(this));
        this.contentView.append(this.resetPictureButtonView);
    }
    Global.Utils.extend(CameraButtonsView).from(Global.PopupView);

    $.extend(CameraButtonsView.prototype, {
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
            this.hide();
            this.pictureBrowser.click();
        },

        onResetImageClicked:function() {
            this.animation.setImageUrl(null);
            this.hide();
        }
    });

    Global.CameraButtonsView = CameraButtonsView;

})();
