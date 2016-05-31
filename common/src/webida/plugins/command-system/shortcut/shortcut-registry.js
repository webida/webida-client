/*
 * Copyright (c) 2012-2015 S-Core Co., Ltd.
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

/**
 * @file The registry is meta for the command framework.
 * @since 1.7.0
 * @author minsung.jin@samsung.com
 */

define([
    'external/lodash/lodash.min',
    'plugins/webida.preference/preference-service-factory',
], function (
    _,
    preference
) {
    'use strict';

    var registry = {
        default: {},
        custom: {}
    };

    var PREFERENCE_ID = 'webidaShortcut';
    var PREFERENCE_KEY = 'webida.shortcut:type';

    var shortcutType;
    var isShortcutTypeChanged;

    /**
     * A module is shortcut that is meta for the command system.
     */
    var module = {
        /**
         * @param {String} id
         */
        getShortcut: function (id) {
            var shortcutRegistry;
            if (id) {
                shortcutRegistry = registry[shortcutType][id];
            } else {
                shortcutRegistry = registry[shortcutType];
            }
            return shortcutRegistry;
        },
        /**
         *
         * @param {Object} meta data.
         */
        setShortcut: function (item) {
            if (item.hasOwnProperty('shortcut')) {
                if (item.shortcut.hasOwnProperty('defaultKey')) {
                    var propertys = {
                        commandId: item.id,
                        description: item.shortcut.description,
                        keepDefault: item.shortcut.keepDefault,
                        propagate: item.shortcut.propagate
                    };
                    registry.default[item.shortcut.defaultKey] = propertys;
                }
            }
        },
        addShortcutChangeListener: function () {
            var preferenceService = preference.get('WORKSPACE');
            preferenceService.getValue(
                PREFERENCE_ID, PREFERENCE_KEY, function (value) {
                    shortcutType = value;
                });
            preferenceService.addFieldChangeListener(
                PREFERENCE_ID, function (value) {
                    if (shortcutType !== value[PREFERENCE_KEY]) {
                        isShortcutTypeChanged = true;
                        shortcutType = value[PREFERENCE_KEY];
                    }
                });
        },
        setCustomShortcut: function () {
            if (registry.default) {
                registry.custom = _.clone(registry.default);
            }
        }
    };

    return module;
});
