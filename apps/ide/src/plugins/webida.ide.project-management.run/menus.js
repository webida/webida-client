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
    'dojo/i18n!./nls/resource',
    'external/lodash/lodash.min',
    'require',
    'webida-lib/plugins/command-system/system/command-system',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/path',
    './run-configuration-manager'
], function (
    i18n,
    _,
    require,
    commandSystem,
    workspace,
    pathUtil,
    runConfiguration
) {
    'use strict';

    var commandService = commandSystem.service;

    function parseProjectNameFromPath(path) {
        if (!path) {
            return '';
        }
        var splitPath = path.split('/');
        return (splitPath.length < 3) ? '' : splitPath[2];
    }

    function isRunnableProjectPath(projectLevelPath) {
        if (!projectLevelPath || !pathUtil.isDirPath(projectLevelPath)) {
            return false;
        }

        var projectName = pathUtil.getName(projectLevelPath);
        return projectName && projectName.charAt(0) !== '.';
    }

    function isRunnablePath(path) {
        var projectPath = pathUtil.getProjectRootPath(path);
        return isRunnableProjectPath(projectPath);
    }

    function updateTopMenu() {
        var disableList = [];
        var menuItems = [];
        var menuItem = {};
        var commandItem = {};
        var itemIndex;
        var runWithItem;
        var debugWithItem;
        var selectedPaths;
        var selectedPath;
        var projectName;
        var runConfigurations;
        var id;
        selectedPaths = workspace.getSelectedPaths();
        if (!selectedPaths || selectedPaths.length !== 1) {
            return;
        }
        selectedPath = selectedPaths[0];
        if (!selectedPath) {
            return;
        }
        if (isRunnablePath(selectedPath) !== true) {
            return;
        }
        projectName = parseProjectNameFromPath(selectedPath);
        if (!projectName) {
            return;
        }
        runConfigurations = runConfiguration.getByProjectName(projectName);
        _.each(runConfigurations, function (runConf) {
            if (runConf.latestRun) {
                menuItems.unshift(runConf.project + ' : ' + runConf.name + i18n.labelLatestRun);
            } else {
                menuItems.push(runConf.project + ' : ' + runConf.name);
            }
        });
        if (_.isEmpty(menuItems)) {
            menuItems.push(i18n.labelNoProjectIndex);
            disableList.push(0);
        }
        menuItems.push('---');
        itemIndex = 0;
        runWithItem = commandService.getTopMenuModel('run-with');
        runWithItem.items = [];
        debugWithItem = commandService.getTopMenuModel('debug-with');
        debugWithItem.items = [];
        _.each(menuItems, function (item) {
            id = runWithItem.id + ':' + itemIndex;
            menuItem.name = item;
            menuItem.id = id;
            menuItem.commandId = id;
            commandService.addMenuModel(menuItem, runWithItem);
            commandItem.id = id;
            commandItem.plugin = 'plugins/webida.ide.project-management.run';
            commandService.setCommandRegistry(commandItem);
            id = debugWithItem.id + ':' + itemIndex;
            menuItem.id = id;
            menuItem.commandId = id;
            commandService.addMenuModel(menuItem, debugWithItem);
            commandItem.id = id;
            commandItem.plugin = 'plugins/webida.ide.project-management.run';
            commandService.setCommandRegistry(commandItem);
            itemIndex++;
        });
        menuItem.id = 'run-configuration';
        menuItem.name = i18n.labelMoreRunConfigurations;
        menuItem.commandId = 'run-configuration';
        commandService.addMenuModel(menuItem, runWithItem);
        commandItem.id = 'run-configuration';
        commandItem.plugin = 'plugins/webida.ide.project-management.run';
        commandService.setCommandRegistry(commandItem);
        menuItem.id = 'debug-configuration';
        menuItem.name = i18n.labelMoreDebugConfigurations;
        menuItem.commandId = 'debug-configuration';
        commandService.addMenuModel(menuItem, debugWithItem);
        commandItem.id = 'debug-configuration';
        commandItem.plugin = 'plugins/webida.ide.project-management.run';
        commandService.setCommandRegistry(commandItem);
    }

    function updateContextMenu() {
        var disableList = [];
        var menuItems = [];
        var menuItem = {};
        var commandItem = {};
        var itemIndex;
        var runWithItem;
        var debugWithItem;
        var selectedPaths;
        var selectedPath;
        var projectName;
        var runConfigurations;
        var id;
        selectedPaths = workspace.getSelectedPaths();
        if (!selectedPaths || selectedPaths.length !== 1) {
            return;
        }
        selectedPath = selectedPaths[0];
        if (!selectedPath) {
            return;
        }
        if (isRunnablePath(selectedPath) !== true) {
            return;
        }
        projectName = parseProjectNameFromPath(selectedPath);
        if (!projectName) {
            return;
        }
        runConfigurations = runConfiguration.getByProjectName(projectName);
        _.each(runConfigurations, function (runConf) {
            if (runConf.latestRun) {
                menuItems.unshift(runConf.project + ' : ' + runConf.name + i18n.labelLatestRun);
            } else {
                menuItems.push(runConf.project + ' : ' + runConf.name);
            }
        });
        if (_.isEmpty(menuItems)) {
            menuItems.push(i18n.labelNoProjectIndex);
            disableList.push(0);
        }
        menuItems.push('---');
        itemIndex = 0;
        runWithItem = commandService.getContextMenuModel('run-with');
        runWithItem.items = [];
        debugWithItem = commandService.getContextMenuModel('debug-with');
        debugWithItem.items = [];
        _.each(menuItems, function (item) {
            id = runWithItem.id + ':' + itemIndex;
            menuItem.name = item;
            menuItem.id = id;
            menuItem.commandId = id;
            commandService.addMenuModel(menuItem, runWithItem);
            commandItem.id = id;
            commandItem.plugin = 'plugins/webida.ide.project-management.run';
            commandService.setCommandRegistry(commandItem);
            id = debugWithItem.id + ':' + itemIndex;
            menuItem.id = id;
            menuItem.commandId = id;
            commandService.addMenuModel(menuItem, debugWithItem);
            commandItem.id = id;
            commandItem.plugin = 'plugins/webida.ide.project-management.run';
            commandService.setCommandRegistry(commandItem);
            itemIndex++;
        });
        menuItem.id = 'run-configuration';
        menuItem.name = i18n.labelMoreRunConfigurations;
        menuItem.commandId = 'run-configuration';
        commandService.addMenuModel(menuItem, runWithItem);
        commandItem.id = 'run-configuration';
        commandItem.plugin = 'plugins/webida.ide.project-management.run';
        commandService.setCommandRegistry(commandItem);
        menuItem.id = 'debug-configuration';
        menuItem.name = i18n.labelMoreDebugConfigurations;
        menuItem.commandId = 'debug-configuration';
        commandService.addMenuModel(menuItem, debugWithItem);
        commandItem.id = 'debug-configuration';
        commandItem.plugin = 'plugins/webida.ide.project-management.run';
        commandService.setCommandRegistry(commandItem);
    }

    return {
        updateTopMenu: updateTopMenu,
        updateContextMenu: updateContextMenu
    };
});

