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

    function MainView(filterStore, filterList) {
        MainView.$super.call(this);
        this.fillParent();
        
        this.documentListView = new Global.DocumentListView(this);
        this.append(this.documentListView);

        this.documentView = new Global.DocumentView(this, filterList);
        this.append(this.documentView);

        this.filterDialogView = new Global.FilterListView(this, filterList, filterStore);

        this.installResizeEvent();
    }
    Global.Utils.extend(MainView).from(Global.View);
    
    $.extend(MainView.prototype, {
        
    });

    Global.MainView = MainView;

})();