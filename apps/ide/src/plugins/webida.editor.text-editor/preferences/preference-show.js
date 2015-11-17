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
                'webida.editor.text-editor:invisibles': false,
                'webida.editor.text-editor:lineNumbers': false
            };
        },
        getSchema: function () {
            return [
                {
                    key: 'webida.editor.text-editor:invisibles',
                    type: 'checkbox',
                    opt: {
                        name: i18n.preferenceItemShowWhitespaceCharacters
                    }
                },
                {
                    key: 'webida.editor.text-editor:lineNumbers',
                    type: 'checkbox',
                    opt: {
                        name: i18n.preferenceItemShowLineNumbers
                    }
                }
            ];
        },
        editor: function (fieldCreator) {
            fieldCreator.addField('webida.editor.text-editor:invisibles', 'checkbox', {
                title: 'Show or Hide',
                name: 'Show whitespace characters',
                'default': false
            });
            /*
            // FIXME : function does not work
            fieldCreator.addField('webida.editor.text-editor:activeline', 'checkbox', {
                title: '<br>Highlight',
                name: 'Enable show highlight active line',
                'default': true
            });
            fieldCreator.addField('webida.editor.text-editor:highlightselection', 'checkbox', {
                name: 'Enable show highlight selection',
                'default': true
            });
            */
            fieldCreator.addField('webida.editor.text-editor:lineNumbers', 'checkbox', {
                //title: '<br>Line number',
                name: 'Show line numbers',
                'default': true
            });
        }
    };
});
