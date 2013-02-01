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

    function DocumentView() {
        DocumentView.$super.call(this);
        this.el.addClass("document-view");
        this.fillParent();
        this.setLayout(new Global.VerticalLayout());
        this.contentView = new Global.ContentView();
        this.append(this.contentView);
        this.filterListView = new Global.ActiveFilterListView();
        this.append(this.filterListView);
    }
    Global.Utils.extend(DocumentView).from(Global.ImageView);
    
    $.extend(DocumentView.prototype, {
        
    });

    Global.DocumentView = DocumentView;

})();