/*
 * Copyright (c) 2012-2016 S-Core Co., Ltd.
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
 * @file Introduction
 * @since 1.7.0
 * @author minsung.jin@samsung.com
 */

define([
    'webida-lib/util/keyCode',
    '../command/command-factory',
    '../command/command-stack',
    '../menu/menu-model-factory',
    './shortcut-registry'
], function (
    keyCode,
    commandFactory,
    commandStack,
    menuModel,
    shortcutRegistry
) {
    'use strict';

    var keyToCodeMap = keyCode.keyToCodeMap;
    var codeToKeyMap = keyCode.codeToKeyMap;
    var modifierKeyCodes = [ keyToCodeMap.Shift, keyToCodeMap.Ctrl, keyToCodeMap.Alt ];

    var modKeyStr = ['SHIFT', 'META', 'CTRL', 'ALT'];
    function normalizeKeysStr(str) {
        if (!str) {
            return null;
        }
        var arr = str.split('+');
        var len = arr.length;
        if (len < 1) {
            return null;
        }
        arr = arr.map(function (elmt) { return elmt.trim(); });
        var last = arr[len - 1];
        if (last.length === 1) {
            last = last.toUpperCase();
        }
        if (!keyToCodeMap[last]) {
            return null;
        }
        arr = arr.slice(0, -1).map(function (elmt) { return elmt.toUpperCase(); }).sort();
        if (arr.every(function (elmt) { return modKeyStr.indexOf(elmt) > -1; })) {
            var arr2 = [];
            // the order of following if-clauses matters
            if (arr.indexOf('CTRL') > -1) {
                arr2.push('Ctrl');
            }
            if (arr.indexOf('SHIFT') > -1) {
                arr2.push('Shift');
            }
            if (arr.indexOf('ALT') > -1) {
                arr2.push('Alt');
            }
            if (arr.indexOf('META') > -1) {
                arr2.push('Meta');
            }
            arr2.push(last);
            return arr2.join('+');
        } else {
            return null;
        }
    }

    var shortcutBind = {
        getKeys: function (event) {
            if (modifierKeyCodes.indexOf(event.keyCode) > -1) {
                return;
            }
            var mainKey = codeToKeyMap[event.keyCode];
            if (!mainKey) {
                return;
            }
            var keys = [];
            if (event.shiftKey) { keys.push('shift'); }
            if (event.metaKey) { keys.push('meta'); }
            if (event.ctrlKey) { keys.push('ctrl'); }
            if (event.altKey) { keys.push('alt'); }
            keys.push(mainKey);
            keys = keys.join('+');
            console.log('keys: ', keys);
            return normalizeKeysStr(keys);
        },

        eventListener : function (event) {
            var keys = this.getKeys(event);
            var shortcutItem = shortcutRegistry.getShortcut(keys);
            if (shortcutItem) {
                if (!shortcutItem.keepDefault) {
                    event.preventDefault();
                }
                if (!shortcutItem.propagate) {
                    event.stopPropagation();
                }
                var promise = commandFactory.createCommand(shortcutItem.commandId);
                promise.then(function (Command) {
                    if (Command && Command.canExecute()) {
                        commandStack.execute(Command);
                    }
                });
            }
        }
    };

    return shortcutBind;
});
