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
 * @file Manage actions for workbench commands
 * @since 1.6.0
 * @author minsung.jin@samsung.com
 */

define([
    'dojo/i18n!./nls/resource',
    'dojo/topic',
    'require',
    'webida-lib/app',
    'webida-lib/plugins/command-system/system/command-system',
    'webida-lib/util/genetic',
    './command-system/top-menu',
    './views-controller',
    './workspaceSelectionDialog'
], function (
    i18n,
    topic,
    require,
    ide,
    commandSystem,
    genetic,
    menubar,
    viewController,
    workspaceSelection
) {
    'use strict';

    var Command = commandSystem.Command;

    function showViableShortcutKeys() {
        /*
        if (document.activeElement) {
            $(document.activeElement).trigger('bubble');
        } else {
            alert(i18n.alertNoFocusedElementToReceiveKeyboardInput);
        }*/
        alert('need dialog for shocut-list');
    }

    function showCmdList() {
        require(['./plugin',
                 './command-system/command-list/cl-commands'],
                function (workbench, clCmds) {
            clCmds.show(workbench.getMenuItemTrees());
        });
    }

    function focusTopMenubar() {
        menubar.menubar.focus();
    }

    function SwitchWorkspaceCommand(id) {
        SwitchWorkspaceCommand.id = id;
    }
    genetic.inherits(SwitchWorkspaceCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                workspaceSelection.show();
                resolve();
            });
        }
    });

    function SaveStatusCommand(id) {
        SaveStatusCommand.id = id;
    }
    genetic.inherits(SaveStatusCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                ide.saveStatus();
                resolve();
            });
        }
    });

    function QuitCommand(id) {
        QuitCommand.id = id;
    }
    genetic.inherits(QuitCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                topic.publish('workbench/exit');
                resolve();
            });
        }
    });

    function SelectViewFromListCommand(id) {
        SelectViewFromListCommand.id = id;
    }
    genetic.inherits(SelectViewFromListCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                viewController.showViewList();
                resolve();
            });
        }
    });

    function ToggleMenuCommand(id) {
        ToggleMenuCommand.id = id;
    }
    genetic.inherits(ToggleMenuCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                viewController.toggleMenubar();
                resolve();
            });
        }
    });

    function ToggleToolbarCommand(id) {
        ToggleToolbarCommand.id = id;
    }
    genetic.inherits(ToggleToolbarCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                viewController.toggleToolbar();
                resolve();
            });
        }
    });

    function ToggleFullScreenCommand(id) {
        ToggleFullScreenCommand.id = id;
    }
    genetic.inherits(ToggleFullScreenCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                viewController.toggleFullScreen();
                resolve();
            });
        }
    });

    function ShortcutListCommand(id) {
        ShortcutListCommand.id = id;
    }
    genetic.inherits(ShortcutListCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                showViableShortcutKeys();
                resolve();
            });
        }
    });

    function CommandListCommand(id) {
        CommandListCommand.id = id;
    }
    genetic.inherits(CommandListCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                showCmdList();
                resolve();
            });
        }
    });

    function FocusMenuBarCommand(id) {
        FocusMenuBarCommand.id = id;
    }
    genetic.inherits(FocusMenuBarCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                focusTopMenubar();
                resolve();
            });
        }
    });

    return {
        SwitchWorkspaceCommand: SwitchWorkspaceCommand,
        SaveStatusCommand: SaveStatusCommand,
        QuitCommand: QuitCommand,
        SelectViewFromListCommand: SelectViewFromListCommand,
        ToggleMenuCommand: ToggleMenuCommand,
        ToggleToolbarCommand: ToggleToolbarCommand,
        ToggleFullScreenCommand: ToggleFullScreenCommand,
        ShortcutListCommand: ShortcutListCommand,
        CommandListCommand: CommandListCommand,
        FocusMenuBarCommand: FocusMenuBarCommand
    };
});
