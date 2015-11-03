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

define([
    'dojo/i18n!./nls/resource',
], function (
    i18n
) {
    'use strict';
    return {
        getDefault: function () {
            return {
                'preview:autoContentsChange': false,
                'preview:liveReload': true
            };
        },
        getSchema: function () {
            return [
                {
                    key: 'preview:autoContentsChange',
                    type: 'checkbox',
                    opt: {
                        name: i18n.previewRespond
                    }
                },
                {
                    key: 'preview:liveReload',
                    type: 'checkbox',
                    opt: {
                        name: i18n.previewReload
                    }
                }
            ];
        },
        view: function (fieldCreator) {
            fieldCreator.addField('preview:autoContentsChange', 'checkbox', {
                title: i18n.preview,
                name: i18n.previewRespond,
                'default': false
            });

            fieldCreator.addField('preview:liveReload', 'checkbox', {
                name: i18n.previewReload,
                'default': true
            });
        }
    };
});

