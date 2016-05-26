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
 * @file This file is defining method for execution of command.
 * @since 1.7.0
 * @author minsung.jin@samsung.com
 */

define([
    'dojo/i18n!./nls/resource',
    'external/lodash/lodash.min',
    'require',
    'webida-lib/app',
    'webida-lib/plugin-manager-0.1',
    'webida-lib/plugins/command-system/command/Command',
    'webida-lib/plugins/command-system/system/command-system',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/notify',
    'webida-lib/util/path',
    './delegator',
    './run-configuration-manager'
], function (
    i18n,
    _,
    require,
    ide,
    pluginManager,
    Command,
    commandSystem,
    workbench,
    workspace,
    genetic,
    Logger,
    notify,
    pathUtil,
    delegator,
    runConfigurationManager
) {
    'use strict';

    /**
     * @type {Logger}
     */
    var logger = new Logger();
    logger.off();

    var commandService = commandSystem.service;

    /**
     * @constant {string}
     */
    var RUN_CONFIGURATIONS = i18n.labelMoreRunConfigurations;

    /**
     * @constant {string}
     */
    var DEBUG_CONFIGURATIONS = i18n.labelMoreDebugConfigurations;

    /**
     * @constant {object}
     */
    var extensionPoints = {
        RUN_CONFIGURATION_HOOK: 'webida.ide.project-management.run:hook'
    };

    /**
     * Extension objects for run configuration hook
     * @type {Array.<Object>}
     */
    var extensions = pluginManager.getExtensions(extensionPoints.RUN_CONFIGURATION_HOOK);

    /**
     * Open the configuration dialog
     * @memberOf module:RunConfiguration
     * @private
     */
    function openRunConfigurationDialog(defaultRun, mode) {
        require(['plugins/webida.ide.project-management.run/view-controller'], function (viewController) {
            viewController.openWindow(defaultRun, mode);
        });
    }

    /**
     * Action for run menu
     * @param {module:RunConfiguration/manager.runConfigurationInfo} runConf - run configuration object to run
     * @param {module:RunConfiguration/manager.runMode} mode
     * @private
     */
    function runBound(runConf, mode) {
        switch (mode) {
            case runConfigurationManager.MODE.RUN_MODE:
                if (!runConf) {
                    notify.info(i18n.messageNoRunConfiguration);
                    openRunConfigurationDialog(null, mode);
                } else {
                    delegator.run(runConf);
                }
                break;
            case runConfigurationManager.MODE.DEBUG_MODE:
                if (!runConf) {
                    notify.info(i18n.messageNoDebugConfiguration);
                    openRunConfigurationDialog(null, mode);
                } else {
                    delegator.debug(runConf);
                }
                break;
            default:
                break;
        }
    }

    /**
     * @param projectName
     * @param mode
     * @param callback
     * @private
     */
    function beforeLaunchHook(projectName, mode, callback) {
        ide.getProjectInfo(projectName, function (err, projectInfo) {
            var ext;
            if (err) {
                logger.log(err);
                callback(err);
            } else {
                ext = _.find(extensions, function (ext) {
                    return ext.type === projectInfo.type;
                });
                if (ext) {
                    require([ext.module], function (mod) {
                        if (mod[ext.beforeLaunch]) {
                            mod[ext.beforeLaunch].call(mod, projectInfo, mode, callback);
                        }
                    });
                } else {
                    callback();
                }
            }
        });
    }

    function workspaceRunBound(mode) {
        var selectedPaths = workspace.getSelectedPaths();
        if (!selectedPaths || selectedPaths.length !== 1) {
            return null;
        }

        var selectedPath = selectedPaths[0];
        if (!selectedPath) {
            return;
        }
        var nodeSplit = selectedPath.split('/');
        var projectName = nodeSplit[2];

        beforeLaunchHook(projectName, mode, function (err) {
            if (err) {
                notify.error(err);
            } else {
                var runConfigurations = runConfigurationManager.getByProjectName(projectName);
                if (_.isEmpty(runConfigurations)) {
                    openRunConfigurationDialog(null, mode);
                } else {
                    var latestRuns = _.where(runConfigurations, {latestRun: true});
                    runBound(_.isEmpty(latestRuns) ? runConfigurations[0] : latestRuns[0], mode);
                }
            }
        });
    }

    /**
     *
     * @param index
     * @param mode
     * @return {*}
     * @private
     */
    function runListBound(runString, mode) {
        var runStirngSplit;
        var runConfName;
        var runConfNameSplit;
        var name;
        var runConf;

        if (!runString) {
            return null;
        }

        if (runString.trim() === RUN_CONFIGURATIONS ||
            runString.trim() === DEBUG_CONFIGURATIONS) {
            openRunConfigurationDialog(null, mode);
        } else {
            runStirngSplit = runString.split(' : ');
            runConfName = runStirngSplit[1];
            runConfNameSplit = runConfName.split(' [');
            name = runConfNameSplit[0];
            runConf = runConfigurationManager.getByName(name);
            switch (mode) {
                case runConfigurationManager.MODE.RUN_MODE:
                    delegator.run(runConf);
                    break;
                case runConfigurationManager.MODE.DEBUG_MODE:
                    delegator.debug(runConf);
                    break;
                default:
                    break;
            }
        }
    }

    function RunCommand(id) {
        RunCommand.id = id;
    }
    genetic.inherits(RunCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                workspaceRunBound(runConfigurationManager.MODE.RUN_MODE);
                resolve();
            });
        }
    });

    function DebugCommand(id) {
        DebugCommand.id = id;
    }
    genetic.inherits(DebugCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                workspaceRunBound(runConfigurationManager.MODE.DEBUG_MODE);
                resolve();
            });
        }
    });

    function RunConfigurationCommand(id) {
        RunConfigurationCommand.id = id;
    }
    genetic.inherits(RunConfigurationCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                var menu = commandService.getMenuModel('run-configuration');
                runListBound(menu.name, runConfigurationManager.MODE.RUN_MODE);
                resolve();
            });
        }
    });

    function DebugConfigurationCommand(id) {
        DebugConfigurationCommand.id = id;
    }
    genetic.inherits(DebugConfigurationCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                var menu = commandService.getMenuModel('debug-configuration');
                runListBound(menu.name, runConfigurationManager.MODE.DEBUG_MODE);
                resolve();
            });
        }
    });

    function RunWithCommand(id, option) {
        RunWithCommand.id = id;
        RunWithCommand.option = option;
    }
    genetic.inherits(RunWithCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                var id = commandService.getMenuModel('run-with').id + ':' + RunWithCommand.option;
                var menu = commandService.getMenuModel(id);
                runListBound(menu.name, runConfigurationManager.MODE.RUN_MODE);
                resolve();
            });
        }
    });

    function DebugWithCommand(id, option) {
        DebugWithCommand.id = id;
        DebugWithCommand.option = option;
    }
    genetic.inherits(DebugWithCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                var id = commandService.getMenuModel('debug-with').id + ':' + DebugWithCommand.option;
                var menu = commandService.getMenuModel(id);
                runListBound(menu.name, runConfigurationManager.MODE.DEBUG_MODE);
                resolve();
            });
        }
    });

    return {
        RunCommand: RunCommand,
        DebugCommand: DebugCommand,
        RunConfigurationCommand: RunConfigurationCommand,
        DebugConfigurationCommand: DebugConfigurationCommand,
        RunWithCommand: RunWithCommand,
        DebugWithCommand: DebugWithCommand,
    };
});
