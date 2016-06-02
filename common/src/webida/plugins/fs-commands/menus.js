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
 * @file This file manages dynamic menus.
 * @since 1.7.0
 * @author minsung.jin@samsung.com
 */

define([
    'external/lodash/lodash.min',
    'webida-lib/plugins/command-system/system/command-system',
    'webida-lib/plugins/editors/ExtensionManager',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/path'
], function (
    _,
    commandSystem,
    ExtensionManager,
    workspace,
    pathUtil
) {
    'use strict';

    var commandService = commandSystem.service;

    function isDirPath(selPath) {
        return selPath.every(function (path) {
            return pathUtil.isDirPath(path);
        });
    }

    function isFilePath(selPath) {
        return selPath.every(function (path) {
            return !pathUtil.isDirPath(path);
        });
    }

    function getLevel(selPath) {
        return selPath.every(function (path) {
            return pathUtil.getLevel(path) !== 1;
        });
    }

    function getEditorNames() {
        var extensionManager = ExtensionManager.getInstance();
        var paths = workspace.getSelectedPaths();
        var i = 0;
        var ext;
        var openWithEditorNames = [];
        var openWithParts = [];
        if (paths && paths.length > 0 &&
            paths.every(function (n) {
                return !pathUtil.isDirPath(n);
            })) {
            var availableExtensions =
                extensionManager.getExtensionsForType(pathUtil.getFileExt(paths[0]));
            for (i = 0; i < paths.length; i++) {
                if (availableExtensions) {
                    var availableExtensions2 =
                        extensionManager.getExtensionsForType(pathUtil.getFileExt(paths[i]));
                    if (availableExtensions2) {
                        availableExtensions =
                            _.intersection(availableExtensions, availableExtensions2);
                    } else {
                        availableExtensions = null;
                    }
                }
            }
            if (availableExtensions) {
                for (i = 0; i < availableExtensions.length; i++) {
                    ext = availableExtensions[i];
                    openWithEditorNames.push(ext.name);
                    openWithParts.push(ext.__plugin__.loc + '/' + ext.editorPart);
                }
            }
        }
        return openWithEditorNames;
    }

    function updateOpenWithContextMenuItem() {
        var menuItem = {};
        var commandItem = {};
        var id;
        var names = getEditorNames();
        var plugin = 'webida-lib/plugins/fs-commands';
        var openWithMenuItem = commandService.getContextMenuModel('open-with-editor');
        openWithMenuItem.items = [];
        _.each(names, function (item, index) {
            id = openWithMenuItem.id + ':' + index;
            menuItem.plugin = plugin;
            menuItem.id = id;
            menuItem.name = item;
            menuItem.commandId = id;
            commandService.addMenuModel(menuItem, openWithMenuItem);
            commandItem.id = id;
            commandItem.plugin = plugin;
            commandService.setCommandRegistry(commandItem);
        });
    }

    function updateTopMenu() {
        var openFileMenuItem = commandService.getTopMenuModel('open-file');
        var refreshMenuItem = commandService.getTopMenuModel('refresh');
        var renameMenuItem = commandService.getTopMenuModel('rename');
        var newFileMenuItem = commandService.getTopMenuModel('new-file');
        var newDirectoryMenuItem = commandService.getTopMenuModel('new-directory');
        var findInFilesMenuItem = commandService.getTopMenuModel('find-in-files');
        var goToFileMenuItem = commandService.getTopMenuModel('go-to-file');
        var selPaths = workspace.getSelectedPaths();
        if (selPaths && selPaths.length > 0) {
            if (isDirPath(selPaths)) {
                refreshMenuItem.invisible = false;
            } else {
                refreshMenuItem.invisible = true;
            }
            if (isFilePath(selPaths)) {
                openFileMenuItem.invisible = false;
            } else {
                openFileMenuItem.invisible = true;
            }
            if (selPaths.length === 1) {
                renameMenuItem.invisible = false;
            } else {
                renameMenuItem.invisible = true;
            }
            if (pathUtil.isDirPath(selPaths[0])) {
                newFileMenuItem.disabled = false;
                newDirectoryMenuItem.disabled = false;
                findInFilesMenuItem.disabled = false;
                goToFileMenuItem.disabled = false;
            } else {
                newFileMenuItem.disabled = true;
                newDirectoryMenuItem.disabled = true;
                findInFilesMenuItem.disabled = true;
                goToFileMenuItem.disabled = true;
            }
        } else {
            newFileMenuItem.disabled = true;
            newDirectoryMenuItem.disabled = true;
            findInFilesMenuItem.disabled = true;
            goToFileMenuItem.disabled = true;
        }
    }

    function updateContextMenu() {
        var openMenuItem = commandService.getContextMenuModel('open');
        var newFileMenuItem = commandService.getContextMenuModel('new-file');
        var newDirectoryMenuItem = commandService.getContextMenuModel('new-directory');
        var copyMenuItem = commandService.getContextMenuModel('copy');
        var cutMenuItem = commandService.getContextMenuModel('cut');
        var pasteMenuItem = commandService.getContextMenuModel('paste');
        var deleteMenuItem = commandService.getContextMenuModel('delete-file');
        var renameMenuItem = commandService.getContextMenuModel('rename');
        var findInFilesDelimiterMenuItem = commandService.getContextMenuModel('find-in-files-delimiter');
        var findInFilesMenuItem = commandService.getContextMenuModel('find-in-files');
        var goToFileMenuItem = commandService.getContextMenuModel('go-to-file');
        var selPaths = workspace.getSelectedPaths();
        if (selPaths && selPaths.length > 0) {
            if (selPaths.length === 1) {
                if (workspace.isCopiedOrCut()) {
                    pasteMenuItem.invisible = false;
                } else {
                    pasteMenuItem.invisible = true;
                }
                if (pathUtil.isDirPath(selPaths[0])) {
                    if (pathUtil.getLevel(selPaths[0]) !== 1) {
                        deleteMenuItem.invisible = false;
                        renameMenuItem.invisible = false;
                    } else {
                        deleteMenuItem.invisible = true;
                        renameMenuItem.invisible = true;
                    }
                    newFileMenuItem.disabled = false;
                    newDirectoryMenuItem.disabled = false;
                    findInFilesDelimiterMenuItem.invisible = false;
                    findInFilesMenuItem.invisible = false;
                    goToFileMenuItem.invisible = false;
                } else {
                    newFileMenuItem.disabled = true;
                    newDirectoryMenuItem.disabled = true;
                    findInFilesDelimiterMenuItem.invisible = true;
                    findInFilesMenuItem.invisible = true;
                    goToFileMenuItem.invisible = true;
                }
            } else {
                if (isDirPath(selPaths)) {
                    newFileMenuItem.disabled = false;
                    newDirectoryMenuItem.disabled = false;
                    openMenuItem.invisible = true;
                } else {
                    newFileMenuItem.disabled = true;
                    newDirectoryMenuItem.disabled = true;
                    openMenuItem.invisible = false;
                }
                if (getLevel(selPaths)) {
                    copyMenuItem.invisible = false;
                    cutMenuItem.invisible = false;
                    deleteMenuItem.invisible = false;
                    renameMenuItem.invisible = false;
                } else {
                    copyMenuItem.invisible = true;
                    cutMenuItem.invisible = true;
                    deleteMenuItem.invisible = true;
                    renameMenuItem.invisible = false;
                }
            }
        }
        updateOpenWithContextMenuItem();
    }

    return {
        updateTopMenu: updateTopMenu,
        updateContextMenu: updateContextMenu
    };
});
