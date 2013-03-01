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

    function ProgressView() {
        ProgressView.$super.call(this);
        this.el.addClass("progress-view");
        this.innerView = new Global.View();
        this.innerView.el.addClass("progress-inner-view");
        this.append(this.innerView);
    }
    Global.Utils.extend(ProgressView).from(Global.View);

    $.extend(ProgressView.prototype, {
        setValue: function(value) {
            this.value = value;
            this.update();
        },

        update: function() {
            this.innerView.css(Global.Utils.prefixOne("transform"),
                "scaleX(" + this.value + ") translateZ(0px)");
        }
    });

    Global.ProgressView = ProgressView;

})();
