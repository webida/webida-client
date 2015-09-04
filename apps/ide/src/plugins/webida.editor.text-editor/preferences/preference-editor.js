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

define([], function () {
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
                'webida.editor.text-editor:indentOnPaste': true
            };
        },
        getSchema: function () {
            return [
                {
                    type: 'group',
                    title: 'Common'
                },
                {
                    key: 'webida.editor.text-editor:trimTrailing',
                    type: 'checkbox',
                    opt: {
                        name: 'Trim trailing white-space before saving'
                    }
                },
                {
                    key: 'webida.editor.text-editor:insertFinal',
                    type: 'checkbox',
                    opt: {
                        name: 'Insert final new-line before saving'
                    }
                },
                {
                    key: 'webida.editor.text-editor:retabIndentations',
                    type: 'checkbox',
                    opt: {
                        name: 'Replace tabs in indentations before saving'
                    }
                },
                {
                    key: 'webida.editor.text-editor:wordWrap',
                    type: 'checkbox',
                    opt: {
                        name: 'Wrap lines'
                    }
                },
                {
                    type: 'group',
                    title: 'Indent'
                },
                {
                    key: 'webida.editor.text-editor:tabsize',
                    type: 'slider',
                    opt: {
                        name: 'Tab size',
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
                        name: 'Indent unit',
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
                        name: 'Use indents with tabs'
                    }
                },
                {
                    key: 'webida.editor.text-editor:indentOnPaste',
                    type: 'checkbox',
                    opt: {
                        name: 'Indent lines on paste'
                    }
                }
            ];
        },
        editor: function (fieldCreator) {
            fieldCreator.addField('webida.editor.text-editor:trimTrailing', 'checkbox', {
                name: 'Trim trailing white-space before saving',
                'default': false
            });
            fieldCreator.addField('webida.editor.text-editor:insertFinal', 'checkbox', {
                name: 'Insert final new-line before saving',
                'default': false
            });
            fieldCreator.addField('webida.editor.text-editor:retabIndentations', 'checkbox', {
                name: 'Replace tabs in indentations before saving',
                'default': false
            });
            fieldCreator.addField('webida.editor.text-editor:wordWrap', 'checkbox', {
                name: 'Wrap lines',
                'default': false
            });

            fieldCreator.addField('webida.editor.text-editor:tabsize', 'slider', {
                title: '<br>Indent',
                name: 'Tab size',
                min: 1,
                max: 8,
                step: 1,
                labels: ['1', '2', '3', '4', '5', '6', '7', '8'],
                'default': 4
            });
            fieldCreator.addField('webida.editor.text-editor:indentunit', 'slider', {
                name: 'Indent unit',
                min: 1,
                max: 8,
                step: 1,
                labels: ['1', '2', '3', '4', '5', '6', '7', '8'],
                'default': 4
            });
            fieldCreator.addField('webida.editor.text-editor:indentWithTabs', 'checkbox', {
                name: 'Use indents with tabs',
                'default': false
            });
            fieldCreator.addField('webida.editor.text-editor:indentOnPaste', 'checkbox', {
                name: 'Indent lines on paste',
                'default': true
            });
        }
    };
});
