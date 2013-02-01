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

    function ActiveFilterListView() {
        ActiveFilterListView.$super.call(this);
        this.el.addClass("active-filters-list-view").css({
            "width": "100%",
            "height": "150px",
            "background-color": "white"
        });
    }
    Global.Utils.extend(ActiveFilterListView).from(Global.StepScrollView);
    
    $.extend(ActiveFilterListView.prototype, {
        
    });

    Global.ActiveFilterListView = ActiveFilterListView;

})();