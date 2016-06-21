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
 * @file The registry is meta for the command framework.
 * @since 1.7.0
 * @author minsung.jin@samsung.com
 */

define([
], function (
) {
    'use strict';

    var registry = {
        'Ctrl+A': 'selectAll',
        'Esc': 'singleSelection',
        'Ctrl+D': 'deleteLine',
        'Ctrl+L': 'gotoLine',
        'Ctrl+Z': 'undo',
        'Ctrl+Y': 'redo',
        'Ctrl+U': 'undoSelection',
        'Alt+U': 'redoSelection',
        'Ctrl+Home': 'goDocStart',
        'Ctrl+End': 'goDocEnd',
        'Alt+Left': 'goLineStart',
        'Home': 'goLineStartSmart',
        'Alt+Right': 'goLineEnd',
        'Up': 'goLineUp',
        'Down': 'goLineDown',
        'PageUp': 'goPageUp',
        'PageDown': 'goPageDown',
        'Left': 'goCharLeft',
        'Right': 'goCharRight',
        'Ctrl+Left': 'goGroupLeft',
        'Ctrl+Right': 'goGroupRight',
        'Delete': 'delCharAfter',
        'Ctrl+Backspace': 'delWordBefore',
        'Ctrl+Delete': 'delGroupAfter',
        'Shift+Tab': 'indentAuto',
        'Ctrl+]': 'indentMore',
        'Ctrl+[': 'indentLess',
        'Tab': 'defaultTab',
        'Enter': 'newlineAndIndent',
        'Insert': 'toggleOverwrite',
        'Ctrl+S': 'save',
        'Ctrl+C': 'copy',
        'Ctrl+V': 'paste',
        'Ctrl+F': 'find',
        'Shift+Ctrl+F': 'replace'
    };

    /**
     * A module is shortcut that is meta for the command system.
     */
    var module = {
        getShortcut: function (id) {
            return registry[id];
        }
    };

    return module;
});
