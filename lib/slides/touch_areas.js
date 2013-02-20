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

    function TouchTapMixinConstructor() {
        this.tapCount = 0;
        this.longHoldCount = 0;
        this.on("tap", this.onAreaTap.bind(this));
        this.on("longtaptimer", this.onAreaLongTap.bind(this));
    }

    var TouchTapMixin = {
        onAreaTap: function() {
            this.longHoldCount = 0;
            this.tapCount++;
            if (this.tapCount == 1)
                this.getLogView().el.text("Tap");
            else
                this.getLogView().el.text("Tap (" + this.tapCount + ")");
        },
        onAreaLongTap: function() {
            this.tapCount = 0;
            this.longHoldCount++;
            if (this.longHoldCount == 1)
                this.getLogView().el.text("Long hold");
            else
                this.getLogView().el.text("Long hold (" + this.longHoldCount + ")");
        }
    };

    function TapTouchAreaView() {
        TapTouchAreaView.$super.call(this);
        TouchTapMixinConstructor.call(this);
    }
    Global.Utils.extend(TapTouchAreaView).from(Global.HighlightTouchView);
    $.extend(TapTouchAreaView.prototype, {
        getLogView: function() {
            return this.logView;
        }
    }, TouchTapMixin);

    function TapDragTouchAreaView() {
        TapDragTouchAreaView.$super.call(this);
        TouchTapMixinConstructor.call(this);
    }
    Global.Utils.extend(TapDragTouchAreaView).from(Global.DraggableView);
    $.extend(TapDragTouchAreaView.prototype, {
        getLogView: function() {
            return this.contentView.logView;
        }
    }, TouchTapMixin);

    function DragTouchAreaView() {
        DragTouchAreaView.$super.call(this);
        this.shouldRestoreTransform = this.el.attr("data-no-restore") === undefined;
    }
    Global.Utils.extend(DragTouchAreaView).from(Global.PanView);

    function TransformTouchAreaView() {
        TransformTouchAreaView.$super.call(this);
        this.shouldRestoreTransform = this.el.attr("data-no-restore") === undefined;
        this.noTouchCapture = this.el.attr("data-no-touch-capture") !== undefined;
    }
    Global.Utils.extend(TransformTouchAreaView).from(Global.TransformView);

    Global.TapTouchAreaView = TapTouchAreaView;
    Global.TapDragTouchAreaView = TapDragTouchAreaView;
    Global.DragTouchAreaView = DragTouchAreaView;
    Global.TransformTouchAreaView = TransformTouchAreaView;

})();
