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
 * @file
 * Content assists related preferences
 *
 * @since 1.2.0
 * @author hw.shim@samsung.com
 * @author kyungmi.k@samsung.com
 * @author h.m.kwon@samsung.com
 *
 */

define([
    'dojo/i18n!../nls/resource'
], function (
    i18n
) {
    'use strict';

    return {
        /**
         * Implements getDefault of webida.preference:pages extension point.
         * @return {Object} - Object containing deault prefernce setting.
         */        
        getDefault: function () {
            return {
                'webida.editor.text-editor:autoCompletion': true,
                'webida.editor.text-editor:autoCompletionDelay': '0.3',
                'webida.editor.text-editor:jshintrc': true,
                'webida.editor.text-editor:autoClose': true,
                'webida.editor.text-editor:enableSnippet': true,
                'webida.editor.text-editor:folding': true,
                'webida.editor.text-editor:anywordHint': false
            };
        },
        
        /**
         * Implements pageData of webida.preference:pages extension point.
         * @return {Object} - Object containing prefernce configurations.
         */
        getSchema: function () {
            return [
                {
                    type: 'group',
                    title: i18n.preferenceGroupCommon
                },
                {
                    key: 'webida.editor.text-editor:enableSnippet',
                    type: 'checkbox',
                    opt: {
                        name: i18n.preferenceItemUseSnippets
                    }
                },
                {
                    key: 'webida.editor.text-editor:folding',
                    type: 'checkbox',
                    opt: {
                        name: i18n.preferenceItemUseCodeFolding
                    }
                },
                {
                    type: 'group',
                    title: i18n.preferenceGroupHint
                },
                {
                    key: 'webida.editor.text-editor:jshintrc',
                    type: 'checkbox',
                    opt: {
                        name: i18n.preferenceItemUseJshintrcFile
                    }
                },
                {
                    key: 'webida.editor.text-editor:anywordHint',
                    type: 'checkbox',
                    opt: {
                        name: i18n.preferenceItemAnywordHint
                    }
                },
                {
                    type: 'group',
                    title: i18n.preferenceGroupAutomation
                },
                {
                    key: 'webida.editor.text-editor:autoCompletion',
                    type: 'checkbox',
                    opt: {
                        name: i18n.preferenceItemAutoActivation
                    }
                },
                {
                    key: 'webida.editor.text-editor:autoCompletionDelay',
                    type: 'select',
                    opt: {
                        name: i18n.preferenceItemAutoActivationDelay,
                        items: ['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1', '1.5', '2'],
                        enabledOn: 'webida.editor.text-editor:autoCompletion'
                    }
                },
                {
                    key: 'webida.editor.text-editor:autoClose',
                    type: 'checkbox',
                    opt: {
                        name: i18n.preferenceItemAutoClose
                    }
                }
            ];
        }
    };
});
