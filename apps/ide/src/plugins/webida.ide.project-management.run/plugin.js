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
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/util/path',
    'other-lib/underscore/lodash.min',
    'other-lib/toastr/toastr'
], function (runConfigurationManager, delegator, workspace, workbench, pathUtil, _, toastr) {
    'use strict';

    var module = {};
    var contextMenuItems = [];

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
        ]
    };

    function _parseProjectNameFromPath(path) {
        if (!path) {
            return '';
        }
        var splitPath = path.split('/');
        return (splitPath.length < 3) ? '' : splitPath[2];
    }

    module.getViableItemsForWorkbench = function () {
        contextMenuItems = [];

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
                }
                contextProjectName = _parseProjectNameFromPath(contextPaths[0]);
            }
        }

        var allRunConfigurations = _.toArray(runConfigurationManager.getAll());
        if(!_.isEmpty(allRunConfigurations)){
            allRunConfigurations.sort(function(a, b){
                if(a.project === b.project){
                    if(a.latestRun){
                        return 1;
                    } else if (b.latestRun){
                        return -1;
                    } else {
                        if (a.name > b.name) {
                            return 1;
                        } else {
                            return -1;
                        }
                    }
                }
                if (a.project === contextProjectName) {
                    return -1;
                }
                if (b.project === contextProjectName) {
                    return 1;
                }
            });
        }

        _.each(allRunConfigurations, function(run){
            var menuName = run.project + ' : ' + run.name + ((run.selected) ? ' [latest run]' : '');
            contextMenuItems.push(menuName);
        });
        if(!_.isEmpty(allRunConfigurations)) {
            contextMenuItems.push('---');
        }
        contextMenuItems.push('Run configurations');

        items['Run &with'] = workbenchWholeItems['Run &with'];
        items['Run &with'][3] = contextMenuItems;

        return items;
    };

    module.getViableItemsForWorkspaceView = function () {
        contextMenuItems = [];
        var items = {};

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

        var disableList = [];

        _.each(runConfigurations, function(runConf){
            if(runConf.latestRun){
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
        contextMenuItems.push('Run configurations');

        items['&Run'] = workspaceWholeItems['&Run'];
        items['Run &with'] = workspaceWholeItems['Run &with'];
        items['Run &with'][3] = contextMenuItems;
        items['Run &with'][4] = disableList;

        return items;
    };

    function _getContextItem(index) {
        if (!contextMenuItems || contextMenuItems.length <= index) {
            return null;
        }
        return contextMenuItems[index];
    }

    function openRunConfigurationDialog(defaultRun){
        require(['plugins/webida.ide.project-management.run/view-controller'], function(viewController){
            viewController.openWindow(defaultRun);
        });
    }

    function refreshRunConfigurationTree(){
        require(['plugins/webida.ide.project-management.run/view-controller'], function(viewController){
            viewController.refreshTree();
        });
    }

    function getRunConfigurationByName(projectProperty, name) {
        if (!projectProperty || !name) {
            return null;
        }

        var runObj = projectProperty.run;
        if (!runObj) {
            return null;
        }

        var runObjList = runObj.list;
        if (!runObjList) {
            return null;
        }

        for (var i = 0; i < runObjList.length; i++) {
            if (runObjList[i].name === name) {
                return runObjList[i];
            }
        }
        return null;
    }
    function _runBinded(projectProperty, mode) {
        var runConf;

        if (!projectProperty.run || !projectProperty.run.list || projectProperty.run.list.length === 0) {
            toastr.info('Cannot find a run configuration. Add a new one.');
            openRunConfigurationDialog();
        } else if (projectProperty.run.list.length === 1) {
            runConf = getRunConfigurationByName(projectProperty,
                projectProperty.run.list[0].name);
            if (runConf) {
                projectProperty.run.selectedId = runConf.name;
                delegator.run(runConf);
                //runProject(projectProperty, runConf);
            } else {
                toastr.warning('Cannot find a run configuration. Add a new one.');
                openRunConfigurationDialog();
            }
            return;
        } else if (!projectProperty.run.selectedId) {
            toastr.warning('Cannot find the latest run. Choose a run configuration and click run button');
            openRunConfigurationDialog();
        } else {
            runConf = getRunConfigurationByName(projectProperty,
                projectProperty.run.selectedId);
            if (runConf) {
                delegator.run(runConf);//runProject(projectProperty, runConf, mode);
            } else {
                toastr.warning('Cannot find the latest run. Choose a run configuration and click run button');
                openRunConfigurationDialog(projectProperty);
            }
        }
    }

    module.workspaceRunBinded = function () {
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
        var projectProperty = runConfigurationManager.getByProjectName(projectName);
        if (!projectProperty) {
            runConfigurationManager.createProjectProperty(
                workspace.getRootPath() + projectName + '/', function () {
                    projectProperty = runConfigurationManager.getByProjectName(projectName);
                    _runBinded(projectProperty);
                });
        } else {
            _runBinded(projectProperty);
        }
    };

    module.workbenchDebugBinded = function () { //FIXME remove
        this._workbenchRunBinded(runConfigurationManager.DEBUG_MODE);
    };

    module.workbenchRunBinded = function () {   // FIXME remove
        this._workbenchRunBinded(runConfigurationManager.RUN_MODE);
    };

    module._workbenchRunBinded = function (mode) {
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
        var runConf = runConfigurationManager.getByProjectName(projectName);
        if (!runConf) {
            openRunConfigurationDialog();
        } else {
            _runBinded(runConf, mode);
        }
    };

    function _runListBinded(index) {
        var runString = _getContextItem(index);
        if (!runString) {
            return null;
        }

        if (runString.trim() === 'Run configurations') {
            openRunConfigurationDialog();
        } else {
            var runStirngSplit = runString.split(' : ');
            var projectName = runStirngSplit[0];
            var runConfName = runStirngSplit[1];

            var runConfNameSplit = runConfName.split(' [');
            var name = runConfNameSplit[0];
            var runConf = runConfigurationManager.getByName(name);
            delegator.run(runConf/*, runConfigurationManager.RUN_MODE*/ );
        }
    }

    function isRunnableProjectPath(projectLevelPath) {
        if (!projectLevelPath || !pathUtil.isDirPath(projectLevelPath)) {
            return false;
        }

        var projectName = pathUtil.getName(projectLevelPath);
        if (!projectName || projectName[0] === '.') {
            return false;
        }

        return true;
    }

    function isRunnablePath(path) {
        var projectPath = pathUtil.getProjectRootPath(path);
        return isRunnableProjectPath(projectPath);
    }

    module.workspaceRunListBinded = function (index) {
        _runListBinded(index);
    };

    module.workbenchRunListBinded = function (index) {
        _runListBinded(index);
    };

    module.runObjectChanged = function(action, runObject) {
        console.log('webida.ide.project-management.run:configuration.changed', action, runObject);
        if(action === 'save'){
            runConfigurationManager.save(runObject);
            refreshRunConfigurationTree();
        }
    };

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
