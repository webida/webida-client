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
 *
 * @module RunConfiguration
 */
define([
    'dojo/i18n!./nls/resource',
    'external/lodash/lodash.min',
    'webida-lib/app',
    'webida-lib/plugin-manager-0.1',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/locale',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/notify',
    'webida-lib/util/path',
    './delegator',
    './run-configuration-manager'
], function (
    i18n,
    _,
    ide,
    pluginManager,
    workbench,
    workspace,
    Locale,
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

    /**
     * module object
     * @type {Object}
     */
    var module = {};

    /**
     * @type {Locale}
     */
    var locale = new Locale(i18n);

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
     * Context menu items for run
     * @type {Array}
     */
    var contextRunMenuItems = [];

    /**
     * Context menu items for debug
     * @type {Array}
     */
    var contextDebugMenuItems = [];

    /**
     * Workbench whole menu items
     * @type {Object}
     */
    var workbenchWholeItems = {
        '&Run': [
            'cmnd',
            'plugins/webida.ide.project-management.run/plugin',
            'workbenchRunBound'
        ],
        'Run &with': [
            'enum',
            'plugins/webida.ide.project-management.run/plugin',
            'workbenchRunListBound'
        ],
        Debug: [
            'cmnd',
            'plugins/webida.ide.project-management.run/plugin',
            'workbenchDebugBound'
        ],
        'Debug with': [
            'enum',
            'plugins/webida.ide.project-management.run/plugin',
            'workbenchDebugListBound'
        ]
    };

    /**
     * Workspace whole context menu items
     * @type {Object}
     */
    var workspaceWholeItems = {
        '&Run': [
            'cmnd',
            'plugins/webida.ide.project-management.run/plugin',
            'workspaceRunBound'
        ],
        'Run &with': [
            'enum',
            'plugins/webida.ide.project-management.run/plugin',
            'workspaceRunListBound'
        ],
        Debug: [
            'cmnd',
            'plugins/webida.ide.project-management.run/plugin',
            'workspaceDebugBound'
        ],
        'Debug with': [
            'enum',
            'plugins/webida.ide.project-management.run/plugin',
            'workspaceDebugListBound'
        ]
    };

    /**
     * @constant {string}
     */
    var RUN_CONFIGURATIONS = i18n.labelMoreRunConfigurations;
    /**
     * @constant {string}
     */
    var DEBUG_CONFIGURATIONS = i18n.labelMoreDebugConfigurations;

    /**
     * Convert and apply locale to menu
     */
    (function _convertMenuLocale() {
        locale.convertMenuItem(workbenchWholeItems, 'menu');
        locale.convertMenuItem(workspaceWholeItems, 'menu');
    })();

    function _parseProjectNameFromPath(path) {
        if (!path) {
            return '';
        }
        var splitPath = path.split('/');
        return (splitPath.length < 3) ? '' : splitPath[2];
    }

    function _isRunnableProjectPath(projectLevelPath) {
        if (!projectLevelPath || !pathUtil.isDirPath(projectLevelPath)) {
            return false;
        }

        var projectName = pathUtil.getName(projectLevelPath);
        return projectName && projectName.charAt(0) !== '.';
    }

    function _isRunnablePath(path) {
        var projectPath = pathUtil.getProjectRootPath(path);
        return _isRunnableProjectPath(projectPath);
    }

    /**
     * Open the configuration dialog
     * @memberOf module:RunConfiguration
     * @private
     */
    function _openRunConfigurationDialog(defaultRun, mode) {
        require(['plugins/webida.ide.project-management.run/view-controller'], function (viewController) {
            viewController.openWindow(defaultRun, mode);
        });
    }

    /**
     * Refresh for configuration list
     * @method refreshRunConfigurationTree
     */
    function _refreshRunConfigurationTree() {
        require(['plugins/webida.ide.project-management.run/view-controller'], function (viewController) {
            viewController.refreshTree();
        });
    }

    /**
     * Apply changed states on current run configuration object
     * @param runConf
     * @param state
     * @private
     */
    function _changeCurrentState(runConf, state) {
        require(['plugins/webida.ide.project-management.run/view-controller'], function (viewController) {
            viewController.changeCurrentState(runConf, state);
        });
    }

    /**
     *
     * @param projectName
     * @param mode
     * @param callback
     * @private
     */
    function _beforeLaunchHook(projectName, mode, callback) {
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

    /**
     *
     * @param index
     * @param mode
     * @returns {*}
     * @private
     */
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

    /**
     *
     * @param index
     * @param mode
     * @returns {*}
     * @private
     */
    function _runListBound(index, mode) {
        var runStirngSplit;
        var runConfName;
        var runConfNameSplit;
        var name;
        var runConf;
        var runString;
        if (index === -1) {
            return _workbenchRunBound(mode);
        }
        runString = _getContextItem(index, mode);
        if (!runString) {
            return null;
        }

        if (runString.trim() === RUN_CONFIGURATIONS ||
            runString.trim() === DEBUG_CONFIGURATIONS) {
            _openRunConfigurationDialog(null, mode);
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

    function _workbenchRunBound(mode) {
        var context = workbench.getContext();
        var contextPaths;

        if (context && context.paths) {
            contextPaths = context.paths;
            if (contextPaths.length === 1) {
                var bRunnable = _isRunnablePath(contextPaths[0]);
                if (bRunnable !== true) {
                    return;
                }
            } else {
                return;
            }
        }

        if (!contextPaths) {
            logger.error(i18n.validationNoContextPath);
            return;
        }
        var contextPath = contextPaths[0];
        if (contextPath === workspace.getRootPath()) {
            notify.warning(i18n.validationPreventWorkspaceRun);
        }

        var projectName = _parseProjectNameFromPath(contextPath);

        _beforeLaunchHook(projectName, mode, function (err) {
            if (err) {
                notify.error(err);
            } else {
                var runConfigurations = runConfigurationManager.getByProjectName(projectName);
                if (_.isEmpty(runConfigurations)) {
                    _openRunConfigurationDialog(null, mode);
                } else {
                    var latestRuns = _.where(runConfigurations, {latestRun: true});
                    _runBound(_.isEmpty(latestRuns) ? runConfigurations[0] : latestRuns[0], mode);
                }
            }
        });
    }

    function _workspaceRunBound(mode) {
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
                notify.error(err);
            } else {
                var runConfigurations = runConfigurationManager.getByProjectName(projectName);
                if (_.isEmpty(runConfigurations)) {
                    _openRunConfigurationDialog(null, mode);
                } else {
                    var latestRuns = _.where(runConfigurations, {latestRun: true});
                    _runBound(_.isEmpty(latestRuns) ? runConfigurations[0] : latestRuns[0], mode);
                }
            }
        });
    }

    /**
     * Action for run menu
     * @param {module:RunConfiguration/manager.runConfigurationInfo} runConf - run configuration object to run
     * @param {module:RunConfiguration/manager.runMode} mode
     * @private
     */
    function _runBound(runConf, mode) {
        switch (mode) {
            case runConfigurationManager.MODE.RUN_MODE:
                if (!runConf) {
                    notify.info(i18n.messageNoRunConfiguration);
                    _openRunConfigurationDialog(null, mode);
                } else {
                    delegator.run(runConf);
                }
                break;
            case runConfigurationManager.MODE.DEBUG_MODE:
                if (!runConf) {
                    notify.info(i18n.messageNoDebugConfiguration);
                    _openRunConfigurationDialog(null, mode);
                } else {
                    delegator.debug(runConf);
                }
                break;
            default:
                break;
        }
    }

    /**
     * Implementation of webida.common.workbench:menu extension
     * @see {@link ./plugin.json|Plugin descriptor}
     * @memberOf module:RunConfiguration
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
                var bRunnable = _isRunnablePath(contextPaths[0]);

                /*jshint -W069 */
                if (bRunnable === true) {
                    items['&Run'] = workbenchWholeItems['&Run'];
                    items['Debug'] = workbenchWholeItems['Debug'];
                }
                /*jshint +W069 */
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
            var menuName = run.project + ' : ' + run.name + ((run.latestRun) ? i18n.labelLatestRun : '');
            contextMenuItems.push(menuName);
        });
        if (!_.isEmpty(allRunConfigurations)) {
            contextMenuItems.push('---');
        }

        contextRunMenuItems = _.clone(contextMenuItems);
        contextRunMenuItems.push(RUN_CONFIGURATIONS);
        items['Run &with'] = workbenchWholeItems['Run &with'];
        items['Run &with'][3] = contextRunMenuItems;

        contextDebugMenuItems = _.clone(contextMenuItems);
        contextDebugMenuItems.push(DEBUG_CONFIGURATIONS);
        items['Debug with'] = workbenchWholeItems['Debug with'];
        items['Debug with'][3] = contextDebugMenuItems;

        return items;
    };

    /**
     * Implementation of webida.common.workspace:menu extension
     * @see {@link ./plugin.json|Plugin descriptor}
     * @memberOf module:RunConfiguration
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

        if (_isRunnablePath(selectedPath) !== true) {
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
                contextMenuItems.unshift(runConf.project + ' : ' + runConf.name + i18n.labelLatestRun);
            } else {
                contextMenuItems.push(runConf.project + ' : ' + runConf.name);
            }
        });

        if (_.isEmpty(contextMenuItems)) {
            contextMenuItems.push(i18n.labelNoProjectIndex);
            disableList.push(0);
        }

        contextMenuItems.push('---');

        /*jshint -W069 */
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
        /*jshint +W069 */
        return items;
    };

    /**
     * Implementation for subscriptions of "project/run/config/changed"
     * @method runObjectChanged
     * @memberOf module:RunConfiguration
     */
    module.runObjectChanged = function (action) {
        if (action === 'save' && arguments[1]) {
            var runConf = arguments[1];
            delegator.saveConf(runConf, function (err) {
                if (!err) {
                    _refreshRunConfigurationTree();
                }
            });
        } else if (action === 'state' && arguments[1] && arguments[2]) {
            _changeCurrentState(arguments[1], arguments[2]);
            if (arguments[2].isDirty !== undefined) {
                _refreshRunConfigurationTree();
            }
        }
    };

    /**
     * Handler for run menu item in workbench
     * @memberof module:RunConfiguration
     */
    module.workbenchRunBound = function () {
        _workbenchRunBound(runConfigurationManager.MODE.RUN_MODE);
    };

    /**
     * Handler for debug menu item in workbench
     * @memberof module:RunConfiguration
     */
    module.workbenchDebugBound = function () {
        _workbenchRunBound(runConfigurationManager.MODE.DEBUG_MODE);
    };

    /**
     * Handler for run menu list items in workbench
     * @param {number} index - the index of the menu item
     * @memberof module:RunConfiguration
     */
    module.workbenchRunListBound = function (index) {
        _runListBound(index, runConfigurationManager.MODE.RUN_MODE);
    };

    /**
     * Handler for debug menu list items in workbench
     * @param {number} index - the index of the menu item
     * @memberof module:RunConfiguration
     */
    module.workbenchDebugListBound = function (index) {
        _runListBound(index, runConfigurationManager.MODE.DEBUG_MODE);
    };

    /**
     * Handler for run context menu item in workspace view
     * @memberof module:RunConfiguration
     */
    module.workspaceRunBound = function () {
        _workspaceRunBound(runConfigurationManager.MODE.RUN_MODE);
    };

    /**
     * Handler for debug context menu item in workspace view
     * @memberof module:RunConfiguration
     */
    module.workspaceDebugBound = function () {
        _workspaceRunBound(runConfigurationManager.MODE.DEBUG_MODE);
    };

    /**
     * Handler for run context menu list items in workspace view
     * @param {number} index - the index of the menu item
     * @memberof module:RunConfiguration
     */
    module.workspaceRunListBound = function (index) {
        _runListBound(index, runConfigurationManager.MODE.RUN_MODE);
    };

    /**
     * Handler for debug context menu list items in workspace view
     * @param {number} index - the index of the menu item
     * @memberof module:RunConfiguration
     */
    module.workspaceDebugListBound = function (index) {
        _runListBound(index, runConfigurationManager.MODE.DEBUG_MODE);
    };

    return module;
});
