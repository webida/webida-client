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
 * @fileoverview This file could get value for workspace preference
 * @version: 0.1.0
 * @since: 2014.01.22
 * @author minsung.jin@samsung.com
 */

define([
    'dojo/i18n!./nls/resource'
], function (
    i18n
) {
    'use strict';
    return {
        /**
         * Get default value of workspace.
         * @return {Object} - default value of workspace.
         */
        getDefault: function () {
            return {
                'workspace:filter:.*': false,
                'workspace:filter:.w.p': true
            };
        },
        /**
         * Get schema of workspace for preference.
         * @return {Array} - schema of workspace for preference.
         */
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
        /**
         * Set field of workspace for preference.
         * @param {Object} fieldCreator - field of workspace for preference.
         */
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

