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
        this.el.addClass("code-view");
        this.animation = animation;
        this.codeEl = $("<div />").addClass("code-view-content").appendTo(this.el);
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
            var code = "<div class='css-property-name'>-webkit-filter:</div><div class='css-property-value'>" + filterHtml.join("<br />") + ";</div>";
            this.codeEl.html(code);
        }
    });

    Global.CodeView = CodeView;

})();
