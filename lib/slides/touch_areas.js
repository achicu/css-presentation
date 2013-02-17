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


    function TapTouchAreaView() {
        TapTouchAreaView.$super.call(this);
        this.tapCount = 0;
        this.longHoldCount = 0;
        this.on("tap", this.onAreaTap.bind(this));
        this.on("longtaptimer", this.onAreaLongTap.bind(this));
    }
    Global.Utils.extend(TapTouchAreaView).from(Global.HighlightTouchView);

    $.extend(TapTouchAreaView.prototype, {
        onAreaTap: function() {
            this.longHoldCount = 0;
            this.tapCount++;
            if (this.tapCount == 1)
                this.logView.el.text("Tap");
            else    
                this.logView.el.text("Tap (" + this.tapCount + ")");
        },
        onAreaLongTap: function() {
            this.tapCount = 0;
            this.longHoldCount++;
            if (this.longHoldCount == 1)
                this.logView.el.text("Long hold");
            else    
                this.logView.el.text("Long hold (" + this.longHoldCount + ")");
        }
    });

    function DragTouchAreaView() {
        DragTouchAreaView.$super.call(this);
    }
    Global.Utils.extend(DragTouchAreaView).from(Global.PanView);

    $.extend(DragTouchAreaView.prototype, {
    });

    function TransformTouchAreaView() {
        TransformTouchAreaView.$super.call(this);
    }
    Global.Utils.extend(TransformTouchAreaView).from(Global.TransformView);

    $.extend(TransformTouchAreaView.prototype, {
    });

    Global.TapTouchAreaView = TapTouchAreaView;
    Global.DragTouchAreaView = DragTouchAreaView;
    Global.TransformTouchAreaView = TransformTouchAreaView;

})();
