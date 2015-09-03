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
                'webida.editor.text-editor:keymap': 'default'
            };
        },
        getSchema: function () {
            return [
                {
                    key: 'webida.editor.text-editor:keymap',
                    type: 'select',
                    opt: {
                        name: 'Editor key map',
                        items: ['default', 'vim']
                    }
                }
            ];
        },
        editor: function (fieldCreator) {
            fieldCreator.addField('webida.editor.text-editor:keymap', 'select', {
                name: 'Editor key map',
                items: ['default', 'vim'],
                'default': 'default'
            });
        }
    };
});

