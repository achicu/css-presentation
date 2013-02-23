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

    function Touch(identifier) {
        this.identifier = identifier;
        this.startPosition = null;
        this.currentPosition = null;
        this.state = null;
        this.type = Touch.TOUCH;
        this.dragSurface = null;
        this.previewBox = null;
        this.animationFrameRequested = false;
    }

    Touch.preview = Global.Utils.readStorageBool(Touch.previewStorageKey, true);

    Touch.togglePreview = function() {
        Touch.preview = !Touch.preview;
        Global.Utils.writeStorageBool(Touch.previewStorageKey, Touch.preview);
    };

    Touch.previewBoxesPool = [];
    Touch.popPreviewBox = function() {
        var item = Touch.previewBoxesPool.pop();
        if (!item)
            item = $("<div />").addClass("touch-preview").appendTo(document.body);
        return item;
    };

    Touch.pushPreviewBox = function(view) {
        Touch.previewBoxesPool.push(view);
    };

    $.extend(Touch.prototype, {
        attachToSurface: function(view) {
            this.dragSurface = view;
            Touch.injectLocalPoints(view, this.startPosition);
            Touch.injectLocalPoints(view, this.currentPosition);
        },

        update: function(currentPosition) {
            this.currentPosition = currentPosition;
            var surface = this.dragSurface || this.view;
            if (surface)
                Touch.injectLocalPoints(surface, this.currentPosition);
            this.updatePreviewBox();
        },

        createPreviewBox: function() {
            if (this.previewBox)
                return;
            this.previewBox = Touch.popPreviewBox();
            this.previewBox.css("opacity", 1);
        },

        updatePreviewBox: function() {
            if (!Touch.preview)
                return;
            if (this.animationFrameRequested)
                return;
            var self = this;
            Global.ViewUpdater.instance.requestAnimationFrame(function() {
                self.animationFrameRequested = false;
                if (self.state == Touch.END || self.state == Touch.CANCELED)
                    return self.removePreviewBox();
                self.createPreviewBox();
                self.previewBox.css(Global.Utils.prefixOne("transform"),
                    "translate3d(" + self.currentPosition.pageX + "px, " + self.currentPosition.pageY + "px, 0px)");
            });
        },

        removePreviewBox: function() {
            if (!this.previewBox)
                return;
            this.previewBox.css("opacity", 0);
            Touch.pushPreviewBox(this.previewBox);
            this.previewBox = null;
        }
    });

    Touch.Point = Global.Utils.lookupUpperCasePrefix(window, "Point");
    Touch.convertPointFromPageToNode = Global.Utils.lookupPrefix(window, "convertPointFromPageToNode");

    Touch.getPosition = function(touch) {
        var touchPos = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            pageX: touch.pageX,
            pageY: touch.pageY,
            screenX: touch.screenX,
            screenY: touch.screenY,
            localX: touch.pageX,
            localY: touch.pageY,
            parentX: touch.pageX,
            parentY: touch.pageY,
            time: Date.now()
        };
        return touchPos;
    };

    Touch.injectLocalPoints = function(view, touch) {
        if (Touch.Point) {
            var point = new Touch.Point();
            point.x = touch.pageX;
            point.y = touch.pageY;
            var localPoint = Touch.convertPointFromPageToNode.call(window, view.el.get(0), point);
            var parentPoint = Touch.convertPointFromPageToNode.call(window, view.el.get(0).parentNode, point);
            touch.localX = localPoint.x;
            touch.localY = localPoint.y;
            touch.parentX = parentPoint.x;
            touch.parentY = parentPoint.y;
        }
        return touch;
    };

    Touch.START = "start";
    Touch.MOVE = "move";
    Touch.END = "end";
    Touch.CANCELED = "canceled";

    Touch.TOUCH = "touch";
    Touch.MOUSE = "mouse";

    Global.Touch = Touch;

})();
