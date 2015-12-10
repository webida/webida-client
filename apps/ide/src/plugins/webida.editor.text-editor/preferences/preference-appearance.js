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
    'dojo/i18n!../nls/resource',
    '../TextEditorViewer'
], function (
    i18n,
    TextEditorViewer
) {
    'use strict';

    return {
        getDefault: function () {
            return {
                'webida.editor.text-editor:cm-theme': 'webida-dark',
                'webida.editor.text-editor:fontSize': 13,
                'webida.editor.text-editor:font': 'Nanum Gothic Coding',
                'webida.editor.text-editor:editorconfig': false
            };
        },
        getSchema: function () {
            return [
                {
                    type: 'group',
                    title: i18n.preferenceGroupTheme
                },
                {
                    key: 'webida.editor.text-editor:cm-theme',
                    type: 'select',
                    opt: {
                        name: i18n.preferenceItemEditorTheme,
                        items: TextEditorViewer.getAvailableThemes()
                    }
                },
                {
                    type: 'group',
                    title: i18n.preferenceGroupFont
                },
                {
                    key: 'webida.editor.text-editor:fontSize',
                    type: 'slider',
                    opt: {
                        name: i18n.preferenceItemEditorFontSize,
                        min: 7,
                        max: 21,
                        step: 1,
                        labels: ['7', '9', '11', '13', '15', '17', '19', '21']
                    }
                },
                {
                    key: 'webida.editor.text-editor:font',
                    type: 'select',
                    opt: {
                        name: i18n.preferenceItemEditorFont,
                        items: [
                            { label: 'Nanum Gothic Coding', value: 'Nanum Gothic Coding'},
                            { label: 'Arial', value: 'Arial, Helvetica, sans-serif'},
                            { label: 'Arial Black', value: 'Arial Black, Gadget, sans-serif'},
                            { label: 'Comic Sans MS', value: 'Comic Sans MS, cursive'},
                            { label: 'Courier New', value: 'Courier New, monospace'},
                            { label: 'Georgia', value: 'Georgia, serif'},
                            { label: 'Impact', value: 'Impact, Charcoal, sans-serif'},
                            { label: 'Lucida Console (Monaco)', value: 'Lucida Console, Monaco, monospace'},
                            { label: 'Lucida Sans Unicode (Lucida Grande)',
                                value: 'Lucida Sans Unicode, Lucida Grande, sans-serif'},
                            { label: 'Palatino Linotype (Book Antiqua)',
                                value: 'Palatino Linotype, Book Antiqua, Palatino, serif'},
                            { label: 'Tahoma (Geneva)', value: 'Tahoma, Geneva, sans-serif'},
                            { label: 'Times New Roman', value: 'Times New Roman, Times, serif'},
                            { label: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif'},
                            { label: 'Verdana', value: 'Verdana, Geneva, sans-serif'},
                            { label: 'MS Serif (New York)', value: 'MS Serif, New York, serif'},
                            { label: 'Consolas', value: 'Consolas'}
                        ]
                    }
                },
                {
                    type: 'group',
                    title: i18n.preferenceGroupEditorConfig
                },
                {
                    key: 'webida.editor.text-editor:editorconfig',
                    type: 'checkbox',
                    opt: {
                        name: i18n.preferenceItemUseEditorconfigFiles
                    }
                }
            ];
        }
    };
});
