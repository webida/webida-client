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
* Thie file is for adding a menu about shortcut in Preference
*
* @see support shortcut binding
* @since 1.7.0
* @author minsung.jin@samsung.com
*/

define([
    './shortcut-registry'
], function (
    registry
) {
    'use strict';

    registry.addShortcutChangeListener();

    return {
        /**
         * Get default value of shortcut.
         * @return {Object} - default value of shortcut.
         */
        getDefault: function () {
            return {
                'webida.shortcut:type': 'default'
            };
        },
        /**
         * Get schema of shortcut for preference.
         * @return {Object} - schema of shortcut for preference.
         */
        getSchema: function () {
            return [
                {
                    key: 'webida.shortcut:type',
                    type: 'select',
                    opt: {
                        name: 'Shortcut',
                        items: [
                            { label: 'default', value: 'default'},
                            { label: 'custom', value: 'custom'}
                        ]
                    }
                }
            ];
        },
        /**
         * Set field of shortcut for preference.
         * @param {Object} fieldCreator - field of locale for preference.
         */
        shortcut: function (fieldCreator) {
            fieldCreator.addField('webida.shortcut:type', 'select', {
                name: 'Shortcut',
                items: [
                    { label: 'default', value: 'default'},
                    { label: 'custom', value: 'custom'},
                ],
                'default': 'default'
            });
        }
    };
});

