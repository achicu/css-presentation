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

(function(){

    function PresetStore(fileSystem, filterStore, animation) {
        PresetStore.$super.call(this);

        this.fileSystem = fileSystem;
        this.filterStore = filterStore;
        this.animation = animation;
        animation.store = this;

        this.currentPreset = null;
        this.loaded = false;
        this.init();
    }

    Global.Utils.extend(PresetStore).from(Global.EventDispatcher);

    $.extend(PresetStore.prototype, {
        defaultPresetName: "Default",
        presetsFolder: "animations",

        presetFileName: function(preset) {
            return this.presetsFolder + "/" + encodeURIComponent(preset);
        },

        decodePresetName: function(fileName) {
            return decodeURIComponent(fileName);
        },

        init: function() {
            var self = this;
            this.filterStore.on("filtersLoaded", this.onFiltersLoaded.bind(this));
            this.fileSystem.register(this.onFileSystemCreated.bind(this));
        },

        onFileSystemCreated: function(fileSystem) {
            var self = this;
            this.fileSystem = fileSystem;

            this.fileSystemLoaded = true;
            this.loadPresetsIfPossible();

            $(window).bind("hashchange", function() {
                var animation = self.getPresetFromHash();
                if (!animation || animation == self.currentPreset)
                    return;
                self.loadAnimation(animation);
            });
        },

        onFiltersLoaded: function() {
            this.filtersLoaded = true;
            this.loadPresetsIfPossible();
        },

        getPresetFromHash: function() {
            var animation = window.location.hash;
            if (animation.length <= 1)
                return null;
            return decodeURIComponent(animation.substr(1));
        },

        loadPresetsIfPossible: function() {
            if (!this.fileSystemLoaded || !this.filtersLoaded)
                return;
            var self = this;
            this.loadPresets(function() {
                self.loadPreset(self.getPresetFromHash() || self.defaultPresetName);
                self.loaded = true;
                self.fire("presetsLoaded");
            });
        },

        loadPresets: function(callback) {
            var self = this;
            this.fileSystem.list(this.presetsFolder, function(err, list) {
                if (err) {
                    console.error(err);
                    return;
                }
                $.each(list, function(i, entry) {
                    self.fire("presetAdded", [self.decodePresetName(entry.name)]);
                });
                callback();
            });
        },

        setActivePreset: function(preset) {
            if (this.currentPreset == preset)
                return;
            var oldPreset = this.currentPreset;
            this.currentPreset = preset;
            this.updateHash();
            this.fire("activePresetChanged", [this.currentPreset, oldPreset]);
        },

        updateHash: function() {
            var animation = this.currentPreset;
            if (animation == this.defaultPresetName) {
                if (window.location.hash && window.location.hash.length)
                    window.location.hash = "";
                return;
            }
            var lastHash = encodeURIComponent(animation);
            window.location.hash = lastHash;
        },

        loadPresetPreview: function(preset, callback) {
            var self = this;
            this.fileSystem.get(this.presetFileName(preset), function(err, result) {
                if (err) {
                    callback(null);
                    return;
                }
                var parsedAnimation = null;
                try {
                    parsedAnimation = JSON.parse(result);
                } catch (e) {
                    console.error("Error while parsing stored animation", result, e);
                }
                if (!parsedAnimation) {
                    callback(null);
                    return;
                }
                var filterList = new Global.FilterList(self.filterStore);
                var animation = new Global.Animation(filterList, self.filterStore);
                animation.loadAnimation(parsedAnimation);
                callback(animation);
            });
        },

        loadPreset: function(animation, callback) {
            this.setActivePreset(animation);
            if (!this.fileSystem)
                return;
            var self = this;
            this.fileSystem.get(this.presetFileName(animation), function(err, result) {
                if (err) {
                    // File doesn't exist yet.
                    if (animation == self.defaultPresetName)
                        self.saveAnimation();
                    else
                        self.animation.loadEmptyAnimation();
                    if (callback)
                        callback();
                    return;
                }
                if (animation != self.currentPreset) {
                    // If the animation changed since we loaded it last time,
                    // avoid overwritting with some old values.
                    if (callback)
                        callback();
                    return;
                }
                var parsedAnimation = null;
                try {
                    parsedAnimation = JSON.parse(result);
                } catch (e) {
                    console.error("Error while parsing stored animation", result, e);
                }
                if (!parsedAnimation) {
                    if (callback)
                        callback();
                    return;
                }
                self.animation.loadAnimation(parsedAnimation);
                self.fire("activePresetLoaded");
                if (callback)
                    callback();
            });
        },

        loadNewPresetWithName: function(name, parsedAnimation) {
            this.setActivePreset(name);
            this.animation.loadAnimation(parsedAnimation);
            this.saveAnimation();
            this.fire("activePresetLoaded");
        },

        loadNewPreset: function(parsedAnimation, proposedName) {
            var newName = prompt("New preset name:", proposedName);
            if (!newName)
                return;
            this.loadNewPresetWithName(newName, parsedAnimation);
        },

        saveAnimation: function() {
            if (!this.loaded)
                return;
            var self = this,
                data = this.animation.dumpAnimation(),
                animation = this.currentPreset;
            this.fileSystem.save(this.presetFileName(animation), JSON.stringify(data), function(err) {
                if (err)
                    console.error("Error saving file " + animation, err);
            });
        },

        savePresetAs: function() {
            var newName = prompt("New preset name:");
            if (!newName)
                return;
            this.setActivePreset(newName);
            this.fire("updateDuplicatedPresetMetadata");
            this.saveAnimation();
            this.fire("activePresetLoaded");
            return newName;
        },

        deletePreset: function(preset) {
            if (preset == this.defaultPresetName) {
                this.animation.loadEmptyAnimation();
                this.saveAnimation();
                return;
            }
            var self = this;
            this.loadPreset(this.defaultPresetName);
            this.fileSystem.deleteFile(this.presetFileName(preset), function(err) {
                // Done.
                self.fire("presetRemoved", [preset]);
            });
        }
    });

    Global.PresetStore = PresetStore;

})();
