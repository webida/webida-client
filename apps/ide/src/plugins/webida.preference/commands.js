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
 * @file Manage actions for preference commands
 * @since 1.6.0
 * @author kyungmi.k@samsung.com
 * @module Preference/command
 */

define([
    'plugins/project-configurator/project-info-service',
    'webida-lib/plugins/command-system/command/Command',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/path',
    './preference-manager'
], function (
    projectInfo,
    Command,
    workspace,
    genetic,
    Logger,
    pathUtil,
    manager
) {
    'use strict';

    /**
     * @type {Logger}
     */
    var logger = new Logger();
    logger.off();

    var MODULE_PATH_VIEW_CTRL = 'plugins/webida.preference/view-controller';

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

    function openDialog(scope, info) {
        require([MODULE_PATH_VIEW_CTRL], function (viewController) {
            manager.initialize().then(function () {
                viewController.openDialog(scope, info);
            });
        });
    }
    /**
     * Open deploy dialog with the context
     */
    function openDialogByContext() {
        var context = getContextInfo(workspace.getSelectedPaths());
        var scope = manager.SCOPE.WORKSPACE;
        var info = {};
        if (context.nodeType) {
            if (context.nodeType === 'project') {
                scope = manager.SCOPE.PROJECT;
                info = {projectName: context.projectName};
            }
            openDialog(scope, info);
        }
    }

    function PreferencesCommand(id) {
        PreferencesCommand.id = id;
    }
    genetic.inherits(PreferencesCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                openDialog(manager.SCOPE.WORKSPACE);
                resolve();
            });
        }
    });

    function PreferencesContextCommand(id) {
        PreferencesContextCommand.id = id;
    }
    genetic.inherits(PreferencesContextCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                openDialogByContext();
                resolve();
            });
        }
    });

    return {
        PreferencesCommand: PreferencesCommand,
        PreferencesContextCommand: PreferencesContextCommand
    };
});
