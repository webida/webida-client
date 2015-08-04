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
 * webida - project run management
 *
 * Src:
 *   plugins/webida.ide.project-management.run/plugin.js
 */
define([
    './run-configuration-manager',
    './delegator',
    'webida-lib/app',
    'webida-lib/plugin-manager-0.1',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/util/path',
    'external/lodash/lodash.min',
    'plugins/webida.notification/notification-message'
], function (runConfigurationManager, delegator, ide, pluginManager, workspace, workbench, pathUtil, _, toastr) {
    'use strict';

    var module = {};

    var extensionPoints = {
        RUN_CONFIGURATION_HOOK: 'webida.ide.project-management.run:hook'
    };
    var extensions = pluginManager.getExtensions(extensionPoints.RUN_CONFIGURATION_HOOK);

    var contextRunMenuItems = [];
    var contextDebugMenuItems = [];

    var workbenchWholeItems = {
        '&Run': [
            'cmnd',
            'plugins/webida.ide.project-management.run/plugin',
            'workbenchRunBinded'
        ],
        'Run &with': [
            'enum',
            'plugins/webida.ide.project-management.run/plugin',
            'workbenchRunListBinded'
        ],
        'Debug': [
            'cmnd',
            'plugins/webida.ide.project-management.run/plugin',
            'workbenchDebugBinded'
        ],
        'Debug with': [
            'enum',
            'plugins/webida.ide.project-management.run/plugin',
            'workbenchDebugListBinded'
        ]
    };

    var workspaceWholeItems = {
        '&Run': [
            'cmnd',
            'plugins/webida.ide.project-management.run/plugin',
            'workspaceRunBinded'
        ],
        'Run &with': [
            'enum',
            'plugins/webida.ide.project-management.run/plugin',
            'workspaceRunListBinded'
        ],
        'Debug': [
            'cmnd',
            'plugins/webida.ide.project-management.run/plugin',
            'workspaceDebugBinded'
        ],
        'Debug with': [
            'enum',
            'plugins/webida.ide.project-management.run/plugin',
            'workspaceDebugListBinded'
        ]
    };

    var RUN_CONFIGURATIONS = 'Run Configurations...';
    var DEBUG_CONFIGURATIONS = 'Debug Configurations...';

    function _parseProjectNameFromPath(path) {
        if (!path) {
            return '';
        }
        var splitPath = path.split('/');
        return (splitPath.length < 3) ? '' : splitPath[2];
    }

    /**
     * Implementation of webida.common.workbench:menu
     * @method getViableItemsForWorkbench
     * @memberOf module:webida.ide.project-management.run
     */
    module.getViableItemsForWorkbench = function () {
        var contextMenuItems = [];
        var items = {};
        var contextPaths = [];
        var context = workbench.getContext();
        var contextProjectName = '';
        if (context && context.paths) {
            contextPaths = context.paths;
            if (contextPaths.length === 1) {
                var bRunnable = isRunnablePath(contextPaths[0]);

                if (bRunnable === true) {
                    items['&Run'] = workbenchWholeItems['&Run'];
                    items['Debug'] = workbenchWholeItems['Debug'];
                }
                contextProjectName = _parseProjectNameFromPath(contextPaths[0]);
            }
        }

        var allRunConfigurations = _.toArray(runConfigurationManager.getAll());
        if (!_.isEmpty(allRunConfigurations)) {
            allRunConfigurations.sort(function (a, b) {
                if (a.project === b.project) {
                    if (a.latestRun) {
                        return -1;
                    } else if (b.latestRun) {
                        return 1;
                    } else {
                        if (a.name > b.name) {
                            return 1;
                        } else {
                            return -1;
                        }
                    }
                } else {
                    if (a.project === contextProjectName) {
                        return -1;
                    }
                    if (b.project === contextProjectName) {
                        return 1;
                    }
                }
            });
        }

        _.each(allRunConfigurations, function (run) {
            var menuName = run.project + ' : ' + run.name + ((run.latestRun) ? ' [latest run]' : '');
            contextMenuItems.push(menuName);
        });
        if (!_.isEmpty(allRunConfigurations)) {
            contextMenuItems.push('---');
        }

        contextRunMenuItems = _.clone(contextMenuItems);
        contextRunMenuItems.push(RUN_CONFIGURATIONS);
        items['Run &with'] = workbenchWholeItems['Run &with'];
        items['Run &with'][3] = contextRunMenuItems;

        contextDebugMenuItems =  _.clone(contextMenuItems);
        contextDebugMenuItems.push(DEBUG_CONFIGURATIONS);
        items['Debug with'] = workbenchWholeItems['Debug with'];
        items['Debug with'][3] = contextDebugMenuItems;

        return items;
    };

    /**
     * Implementation of webida.common.workspace:menu
     * @method getViableItemsForWorkspaceView
     * @memberOf module:webida.ide.project-management.run
     */
    module.getViableItemsForWorkspaceView = function () {
        var contextMenuItems = [];
        var items = {};
        var disableList = [];

        var selectedPaths = workspace.getSelectedPaths();
        if (!selectedPaths || selectedPaths.length !== 1) {
            return null;
        }

        var selectedPath = selectedPaths[0];
        if (!selectedPath) {
            return items;
        }

        if (isRunnablePath(selectedPath) !== true) {
            return items;
        }

        if (!selectedPath) {
            return items;
        }

        var projectName = _parseProjectNameFromPath(selectedPath);
        if (!projectName) {
            return items;
        }

        var runConfigurations = runConfigurationManager.getByProjectName(projectName);
        _.each(runConfigurations, function (runConf) {
            if (runConf.latestRun) {
                contextMenuItems.unshift(runConf.project + ' : ' + runConf.name + ' [latest run]');
            } else {
                contextMenuItems.push(runConf.project + ' : ' + runConf.name);
            }
        });

        if (_.isEmpty(contextMenuItems)) {
            contextMenuItems.push('No project index');
            disableList.push(0);
        }

        contextMenuItems.push('---');

        items['&Run'] = workspaceWholeItems['&Run'];
        contextRunMenuItems = _.clone(contextMenuItems);
        contextRunMenuItems.push(RUN_CONFIGURATIONS);
        items['Run &with'] = workspaceWholeItems['Run &with'];
        items['Run &with'][3] = contextRunMenuItems;
        items['Run &with'][4] = disableList;

        items['Debug'] = workspaceWholeItems['Debug'];
        contextDebugMenuItems = _.clone(contextMenuItems);
        contextDebugMenuItems.push(DEBUG_CONFIGURATIONS);
        items['Debug with'] = workspaceWholeItems['Debug with'];
        items['Debug with'][3] = contextDebugMenuItems;
        items['Debug with'][4] = disableList;

        return items;
    };

    /**
     * Implementation for subscriptions of "webida.ide.project-management.run:configuration.changed"
     * @method runObjectChanged
     * @memberOf module:webida.ide.project-management.run
     */
    module.runObjectChanged = function (action) {
        console.log('webida.ide.project-management.run:configuration.changed', arguments);
        if (action === 'save' && arguments[1]) {
            var runConf = arguments[1];
            delegator.saveConf(runConf, function (err) {
                if (!err) {
                    refreshRunConfigurationTree();
                }
            });
        } else if (action === 'valid' && arguments[1] !== undefined) { 
            var valid = arguments[1];
            changeValidationState(valid);
            
        }
    };

    /**
     * Open the configuration dialog
     * @method openRunConfigurationDialog
     * @memberOf module:webida.ide.project-management.run
     */
    function openRunConfigurationDialog(defaultRun, mode) {
        require(['plugins/webida.ide.project-management.run/view-controller'], function (viewController) {
            viewController.openWindow(defaultRun, mode);
        });
    }

    /**
     * Refresh for configuration list
     * @method refreshRunConfigurationTree
     * @memberOf module:webida.ide.project-management.run
     */
    function refreshRunConfigurationTree() {
        require(['plugins/webida.ide.project-management.run/view-controller'], function (viewController) {
            viewController.refreshTree();
        });
    }
    
    function changeValidationState(valid) {
        require(['plugins/webida.ide.project-management.run/view-controller'], function (viewController) {
            viewController.changeValidationState(valid);
        });
    }

    /**
     * Run menu item handler in workbench
     * @method workbenchRunBinded
     * @memberOf module:webida.ide.project-management.run
     */
    module.workbenchRunBinded = function () {
        _workbenchRunBinded(runConfigurationManager.MODE.RUN_MODE);
    };

    /**
     * Debug menu item handler in workbench
     * @method workbenchDebugBinded
     * @memberOf module:webida.ide.project-management.run
     */
    module.workbenchDebugBinded = function () {
        _workbenchRunBinded(runConfigurationManager.MODE.DEBUG_MODE);
    };

    function _beforeLaunchHook(projectName, mode, callback) {
        ide.getProjectInfo(projectName, function (err, projectInfo) {
            var ext;
            if (err) {
                console.log(err);
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

    function _workbenchRunBinded(mode) {
        var context = workbench.getContext();
        var contextPaths;

        if (context && context.paths) {
            contextPaths = context.paths;
            if (contextPaths.length === 1) {
                var bRunnable = isRunnablePath(contextPaths[0]);
                if (bRunnable !== true) {
                    return;
                }
            } else {
                return;
            }
        }

        if (!contextPaths) {
            console.error('No valid context path');
            return;
        }
        var contextPath = contextPaths[0];
        if (contextPath === workspace.getRootPath()) {
            toastr.warning('Cannot run workspace directory');
        }

        var projectName = parseProjectNameFromPath(contextPath);

        _beforeLaunchHook(projectName, mode, function (err) {
            if (err) {
                toastr.error(err);
            } else {
                var runConfigurations = runConfigurationManager.getByProjectName(projectName);
                if (_.isEmpty(runConfigurations)) {
                    openRunConfigurationDialog(null, mode);
                } else {
                    var latestRuns = _.where(runConfigurations, {latestRun: true});
                    _runBinded(_.isEmpty(latestRuns) ? runConfigurations[0] : latestRuns[0], mode);
                }
            }
        });
    }

    /**
     * Run with menu item handler in workbench
     * @method workbenchRunListBinded
     * @memberOf module:webida.ide.project-management.run
     */
    module.workbenchRunListBinded = function (index) {
        _runListBinded(index, runConfigurationManager.MODE.RUN_MODE);
    };

    /**
     * Debug with menu item handler in workbench
     * @method workbenchDebugListBinded
     * @memberOf module:webida.ide.project-management.run
     */
    module.workbenchDebugListBinded = function (index) {
        _runListBinded(index, runConfigurationManager.MODE.DEBUG_MODE);
    };

    function _getContextItem(index, mode) {
        switch (mode) {
            case runConfigurationManager.MODE.RUN_MODE:
                if (!contextRunMenuItems || contextRunMenuItems.length <= index) {
                    return null;
                } else {
                    return contextRunMenuItems[index];
                }
                break;
            case runConfigurationManager.MODE.DEBUG_MODE:
                if (!contextDebugMenuItems || contextDebugMenuItems.length <= index) {
                    return null;
                } else {
                    return contextDebugMenuItems[index];
                }
                break;
            default:
                break;
        }
        return null;
    }

    function _runListBinded(index, mode) {
        var runStirngSplit;
        var runConfName;
        var runConfNameSplit;
        var name;
        var runConf;
        var runString;
        if (index === -1) {
            return _workbenchRunBinded(mode);
        }
        runString = _getContextItem(index, mode);
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

    /**
     * Run menu item handler in workspace
     * @method workspaceRunBinded
     * @memberOf module:webida.ide.project-management.run
     */
    module.workspaceRunBinded = function () {
        _workspaceRunBinded(runConfigurationManager.MODE.RUN_MODE);
    };

    /**
     * Debug menu item handler in workspace
     * @method workspaceDebugBinded
     * @memberOf module:webida.ide.project-management.run
     */
    module.workspaceDebugBinded = function () {
        _workspaceRunBinded(runConfigurationManager.MODE.DEBUG_MODE);
    };

    function _workspaceRunBinded(mode) {
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

        _beforeLaunchHook(projectName, mode, function (err) {
            if (err) {
                toastr.error(err);
            } else {
                var runConfigurations = runConfigurationManager.getByProjectName(projectName);
                if (_.isEmpty(runConfigurations)) {
                    openRunConfigurationDialog(null, mode);
                } else {
                    var latestRuns = _.where(runConfigurations, {latestRun: true});
                    _runBinded(_.isEmpty(latestRuns) ? runConfigurations[0] : latestRuns[0], mode);
                }
            }
        });
    }

    function _runBinded(runConf, mode) {
        switch (mode) {
            case runConfigurationManager.MODE.RUN_MODE:
                if (!runConf) {
                    toastr.info('Cannot find a run configuration. Add a new one.');
                    openRunConfigurationDialog(null, mode);
                } else {
                    delegator.run(runConf);
                }
                break;
            case runConfigurationManager.MODE.DEBUG_MODE:
                if (!runConf) {
                    toastr.info('Cannot find a debug configuration. Add a new one.');
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
     * Run with menu item handler in workspace
     * @method workspaceRunListBinded
     * @memberOf module:webida.ide.project-management.run
     */
    module.workspaceRunListBinded = function (index) {
        _runListBinded(index, runConfigurationManager.MODE.RUN_MODE);
    };

    /**
     * Debug with menu item handler in workspace
     * @method workspaceDebugListBinded
     * @memberOf module:webida.ide.project-management.run
     */
    module.workspaceDebugListBinded = function (index) {
        _runListBinded(index, runConfigurationManager.MODE.DEBUG_MODE);
    };

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

    function parseProjectNameFromPath(path) {
        if (!path) {
            return '';
        }
        var splitPath = path.split('/');
        if (!splitPath || splitPath.length < 3) {
            return '';
        }
        return splitPath[2];
    }

    return module;

});
