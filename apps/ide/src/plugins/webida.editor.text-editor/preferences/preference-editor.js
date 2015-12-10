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
    'dojo/i18n!../nls/resource'
], function (
    i18n
) {
    'use strict';

    return {
        getDefault: function () {
            return {
                'webida.editor.text-editor:trimTrailing': false,
                'webida.editor.text-editor:insertFinal': false,
                'webida.editor.text-editor:retabIndentations': false,
                'webida.editor.text-editor:wordWrap': false,
                'webida.editor.text-editor:tabsize': 4,
                'webida.editor.text-editor:indentunit': 4,
                'webida.editor.text-editor:indentWithTabs': false,
                'webida.editor.text-editor:indentOnPaste': true,
                'webida.editor.text-editor:highlightselection': true,
                'webida.editor.text-editor:activeline': true
            };
        },
        getSchema: function () {
            return [
                {
                    type: 'group',
                    title: i18n.preferenceGroupCommon
                },
                {
                    key: 'webida.editor.text-editor:trimTrailing',
                    type: 'checkbox',
                    opt: {
                        name: i18n.preferenceItemTrimTrailingWhiteSpaceBeforeSaving
                    }
                },
                {
                    key: 'webida.editor.text-editor:insertFinal',
                    type: 'checkbox',
                    opt: {
                        name: i18n.preferenceItemInsertFinalNewLineBeforeSaving
                    }
                },
                {
                    key: 'webida.editor.text-editor:retabIndentations',
                    type: 'checkbox',
                    opt: {
                        name: i18n.preferenceItemReplaceTabsInIndentaionsBeforeSaving
                    }
                },
                {
                    key: 'webida.editor.text-editor:wordWrap',
                    type: 'checkbox',
                    opt: {
                        name: i18n.preferenceItemWrapLines
                    }
                },
                {
                    type: 'group',
                    title: i18n.preferenceGroupIndent
                },
                {
                    key: 'webida.editor.text-editor:tabsize',
                    type: 'slider',
                    opt: {
                        name: i18n.preferenceItemTabSize,
                        min: 1,
                        max: 8,
                        step: 1,
                        labels: ['1', '2', '3', '4', '5', '6', '7', '8']
                    }
                },
                {
                    key: 'webida.editor.text-editor:indentunit',
                    type: 'slider',
                    opt: {
                        name: i18n.preferenceItemIndentUnit,
                        min: 1,
                        max: 8,
                        step: 1,
                        labels: ['1', '2', '3', '4', '5', '6', '7', '8']
                    }
                },
                {
                    key: 'webida.editor.text-editor:indentWithTabs',
                    type: 'checkbox',
                    opt: {
                        name: i18n.preferenceItemUseIndentsWithTabs
                    }
                },
                {
                    key: 'webida.editor.text-editor:indentOnPaste',
                    type: 'checkbox',
                    opt: {
                        name: i18n.preferenceItemIndentLinesOnPaste
                    }
                }
            ];
        }
    };
});
