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
* Thie file is for adding a menu about Locale in Preference
*
* @see support local-sensitive languages
* @since: 2015.10.20
* @author: minsung.jin
*/

define([
    './locale-handler'
], function (
    locale
) {
    'use strict';

    locale.addLocaleChangeListener();

    return {
        getDefault: function () {
            return {
                'webida.locale:code': 'default'
            };
        },
        getSchema: function () {
            return [
                {
                    key: 'webida.locale:code',
                    type: 'select',
                    opt: {
                        name: 'Locale',
                        items: [
                            { label: 'default', value: 'default'},
                            { label: 'united states', value: 'en-us'},
                            { label: 'china', value: 'zh-cn'}
                        ]
                    }
                }
            ];
        },
        locale: function (fieldCreator) {
            fieldCreator.addField('webida.locale:code', 'select', {
                name: 'Locale',
                items: [
                    { label: 'default', value: 'default'},
                    { label: 'united states', value: 'en-us'},
                    { label: 'china', value: 'zh-cn'}
                ],
                'default': 'default'
            });
        }
    };
});
