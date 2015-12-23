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
 * webida.preference plugin main
 *
 * @since: 15. 8. 18
 * @author: Koong Kyungmi (kyungmi.k@samsung.com)
 * @module webida.preference
 */

/* jshint unused:false */

define([
    'dojo/i18n!./nls/resource',
    'dojo/topic',
    'external/lodash/lodash.min',
    'plugins/project-configurator/project-info-service',
    'webida-lib/plugins/workbench/ui/promiseMap',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/locale',
    'webida-lib/util/path',
    './preference-manager'
], function (
    i18n,
    topic,
    _,
    projectInfo,
    promiseMap,
    workspace,
    Locale,
    pathUtil,
    manager
) {
    'use strict';

    var locale = new Locale(i18n);
    var MODULE_PATH_VIEW_CTRL = 'plugins/webida.preference/view-controller';
    var module = {};

    var workbenchItems = {
        '&Preferences': ['cmnd', 'plugins/webida.preference/plugin', 'openDialogByWorkspaceScope']
    };

    var workspaceItems = {
        Preferences: ['cmnd', 'plugins/webida.preference/plugin', 'openDialogByContext']
    };

    var managerInitialized = promiseMap.get('preference/load');

    // for i18n
    (function _convertMenuLocale() {
        locale.convertMenuItem(workbenchItems, 'menu');
        locale.convertMenuItem(workspaceItems, 'menu');
    })();

    function _getContextInfo(paths) {
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

    function _openDialog(scope, info) {
        require([MODULE_PATH_VIEW_CTRL], function (viewController) {
            managerInitialized.then(function () {
                viewController.openDialog(scope, info);
            });
        });
    }

    module.getViableItemsForWorkbench = function () {
        var preferenceTypes = manager.getAllPreferenceTypes(manager.SCOPE.WORKSPACE);
        return preferenceTypes.length > 0 ? workbenchItems : null;
    };

    module.getViableItemsForWorkspace = function () {
        var context = _getContextInfo(workspace.getSelectedPaths());
        var viable = !context.multi && (context.nodeType === 'workspace' || context.nodeType === 'project');
        var preferenceTypes = manager.getAllPreferenceTypes(manager.SCOPE[context.nodeType.toUpperCase()]);
        return (viable && preferenceTypes.length > 0) ? workspaceItems : null;
    };

    module.openDialogByWorkspaceScope = function () {
        _openDialog(manager.SCOPE.WORKSPACE);
    };

    module.openDialogByContext = function () {
        var context = _getContextInfo(workspace.getSelectedPaths());
        var scope = manager.SCOPE.WORKSPACE;
        var info = {};
        if (context.nodeType) {
            if (context.nodeType === 'project') {
                scope = manager.SCOPE.PROJECT;
                info = {projectName: context.projectName};
            }
            _openDialog(scope, info);
        }
    };

    return module;
});
