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
 * @author kyungmi.k@samsung.com
 */

define([
    'dojo/i18n!./nls/resource',
    'plugins/project-configurator/project-info-service',
    'webida-lib/plugins/command-system/system/command-system',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/path',
    './preference-manager'
], function (
    i18n,
    projectInfo,
    commandSystem,
    workspace,
    pathUtil,
    manager
) {
    'use strict';

    var commandService = commandSystem.service;

    function getContextInfo(paths) {
        var info = {
            multi: false,
            nodeType: 'file'
        };
        var pathSplit;
        if (paths) {
            if (paths.length === 1 && pathUtil.isDirPath(paths[0])) {
                info.nodeType = 'directory';
                pathSplit = paths[0].split('/');
                if (pathSplit.length === 3) {
                    info.nodeType = 'workspace';
                } else if (pathSplit.length === 4) {
                    if (projectInfo.getByName(pathSplit[2])) {
                        info.projectName = pathSplit[2];
                        info.nodeType = 'project';
                    }
                }
            } else if (paths.length > 1) {
                info.multi = true;
            }
        }
        return info;
    }

    function updateTopMenu() {
        var preferenceMenuItem = commandService.getTopMenuModel('preferences');
        var preferenceTypes = manager.getAllPreferenceTypes(manager.SCOPE.WORKSPACE);
        if (preferenceTypes.length > 0) {
            preferenceMenuItem.invisible = false;
        } else {
            preferenceMenuItem.invisible = true;
        }
        preferenceMenuItem.name = i18n.menuPreferences;
    }

    function updateContextMenu() {
        var preferenceMenuItem = commandService.getContextMenuModel('preferences-context');
        var context = getContextInfo(workspace.getSelectedPaths());
        var viable = !context.multi && (context.nodeType === 'workspace' || context.nodeType === 'project');
        var preferenceTypes = manager.getAllPreferenceTypes(manager.SCOPE[context.nodeType.toUpperCase()]);
        if (viable && preferenceTypes.length > 0) {
            preferenceMenuItem.invisible = false;
        } else {
            preferenceMenuItem.invisible = true;
        }
        preferenceMenuItem.name = i18n.menuPreferences;
    }

    return {
        updateTopMenu: updateTopMenu,
        updateContextMenu: updateContextMenu
    };
});
