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
], function (
) {
    'use strict';

    var registry = {};

    /**
     * A module is shortcut that is meta for the command system.
     */
    var module = {
        /**
         * @param {String} id
         */
        getShortcut: function (id) {
            if (id) {
                return registry[id];
            }
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
                        keepDefault: item.shortcut.keepDefault,
                        propagate: item.shortcut.propagate
                    };
                    registry[item.shortcut.defaultKey] = propertys;
                }
            }
        }
    };

    return module;
});
