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
 * @fileoverview webida - workbench
 *
 * @version: 0.1.0
 * @since: 2013.09.25
 *
 * Src:
 */

define([
    'require',
    'dojo/i18n!./nls/resource',
    'dojo/topic',
    './command-system/top-level-menu'
], function (
    require,
    i18n,
    topic,
    menubar
) {
    'use strict';

    return {
        showViableShortcutKeys: function () {
            if (document.activeElement) {
                $(document.activeElement).trigger('bubble');
            } else {
                alert(i18n.alertNoFocusedElementToReceiveKeyboardInput);
            }
        },

        showCmdList: function () {
            require(['./plugin',
                     './command-system/command-list/cl-commands'],
            function (workbench, clCmds) {
                clCmds.show(workbench.getMenuItemTrees());
            });
        },

        focusTopMenubar: function () {
            menubar.menubar.focus();
        },

        quit: function () {
            topic.publish('workbench/exit');
        }
    };
});
