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
    'dojo/i18n!./nls/resource'
], function (
    i18n
) {
    'use strict';
    return {
        getDefault: function () {
            return {
                'workspace:filter:.*': false,
                'workspace:filter:.w.p': true
            };
        },
        getSchema: function () {
            return [
                {
                    type: 'group',
                    title: i18n.preferenceGroupFilter
                },
                {
                    key: 'workspace:filter:.*',
                    type: 'checkbox',
                    opt: {
                        name: i18n.preferenceItemFilterResources
                    }
                },
                {
                    key: 'workspace:filter:.w.p',
                    type: 'checkbox',
                    opt: {
                        name: i18n.preferenceItemFilterProjectAndWorkspaceDirectories
                    }
                }
            ];
        },
        view: function (fieldCreator) {
            fieldCreator.addField('workspace:filter:.*', 'checkbox', {
                title: 'Filter',
                name: 'Filter .* resources',
                'default': false
            });
            fieldCreator.addField('workspace:filter:.w.p', 'checkbox', {
                name: 'Filter .project and .workspace directories',
                'default': true
            });
        }
    };
});

