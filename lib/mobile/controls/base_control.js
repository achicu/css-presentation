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

    function BaseControl() {
        BaseControl.$super.call(this);
        this.value = null;
    }
    Global.Utils.extend(BaseControl).from(Global.GestureView);

    $.extend(BaseControl.prototype, {
        getValue: function() { return this.value; },
        setValue: function(value) { 
            this.value = value; 
            this.updateUI(); 
        },
        notifyValueChange: function() {
            this.fire("valuechanged");
        },
        init: function() { },
        updateUI: function() { },
        relayout: function() {
            this.updateUI();
            BaseControl.prototype.$super.relayout.call(this);
        }
    });

    var Controls = {
        _registeredControls: {},
        register: function(name, control) {
            this._registeredControls[name] = control;
        },

        get: function(typeName) {
            return this._registeredControls[typeName];
        }
    };

    Global.BaseControl = BaseControl;
    Global.Controls = Controls;

})();