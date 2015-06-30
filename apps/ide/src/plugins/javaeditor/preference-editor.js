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
        javaeditor: function (fieldCreator) {
            fieldCreator.addField('javaeditor:trimTrailing', 'checkbox', {
                name: 'Trim trailing white-space before saving',
                'default': false
            });
            fieldCreator.addField('javaeditor:insertFinal', 'checkbox', {
                name: 'Insert final new-line before saving',
                'default': false
            });
            fieldCreator.addField('javaeditor:retabIndentations', 'checkbox', {
                name: 'Replace tabs in indentations before saving',
                'default': false
            });
            fieldCreator.addField('javaeditor:wordWrap', 'checkbox', {
                name: 'Wrap lines',
                'default': false
            });

            fieldCreator.addField('javaeditor:tabsize', 'slider', {
                title: '<br>Indent',
                name: 'Tab size',
                min: 1,
                max: 8,
                step: 1,
                labels: ['1', '2', '3', '4', '5', '6', '7', '8'],
                'default': 4
            });
            fieldCreator.addField('javaeditor:indentunit', 'slider', {
                name: 'Indent unit',
                min: 1,
                max: 8,
                step: 1,
                labels: ['1', '2', '3', '4', '5', '6', '7', '8'],
                'default': 4
            });
            fieldCreator.addField('javaeditor:indentWithTabs', 'checkbox', {
                name: 'Use indents with tabs',
                'default': false
            });
            fieldCreator.addField('javaeditor:indentOnPaste', 'checkbox', {
                name: 'Indent lines on paste',
                'default': true
            });
        }
    };
});
