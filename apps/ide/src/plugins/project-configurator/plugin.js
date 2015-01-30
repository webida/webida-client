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
 * webida - project configurator
 *
 * Src:
 *   plugins/project-configurator/plugin.js
 */
define([
    './projectConfigurator',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/util/path',
], function (projectConfigurator, workspace, workbench, pathUtil) {

    'use strict';

    //console.log('loading project configurator module...');

    var module = {};
    var contextMenuItems = [];


    var workbenchWholeItems = {
        '&Run': ['cmnd', 'plugins/project-configurator/projectConfigurator-commands',
                 'workbenchRunBinded'
                ],
        'Run &with': ['enum', 'plugins/project-configurator/projectConfigurator-commands',
                      'workbenchRunListBinded'
                     ]
    };

    var workspaceWholeItems = {
        '&Run': ['cmnd', 'plugins/project-configurator/projectConfigurator-commands',
                 'workspaceRunBinded'
                ],
        'Run &with': ['enum', 'plugins/project-configurator/projectConfigurator-commands',
                      'workspaceRunListBinded'
                     ],
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

    function getRunList(obj, projectName) {
        var ret = [];

        if (!obj || !obj.run || !obj.run.list) {
            return ret;
        }

        var runList = obj.run.list;
        var selectedName = obj.run.selectedId;

        for (var i = 0; i < runList.length; i++) {
            if (runList[i].name === selectedName) {
                ret.unshift(projectName + ' : ' + runList[i].name +
                            ' [latest run]');
            } else {
                ret.push(projectName + ' : ' + runList[i].name);
            }
        }
        return ret;
    }

    function isContextProject(contextList, projectName) {
        if (!contextList || !contextList.length || !projectName) {
            return false;
        }

        var contextProjectName;
        for (var i = 0; i < contextList.length; i++) {
            contextProjectName = parseProjectNameFromPath(contextList[i]);
            if (projectName === contextProjectName) {
                return true;
            }
        }

        return false;
    }

    function isRunnableProjectPath(projectLevelPath) {
        if (!projectLevelPath || !pathUtil.isDirPath(projectLevelPath)) {
            return false;
        }

        var projectName = pathUtil.getName(projectLevelPath);
        if (!projectName || projectName[0] === '.') {
            return false;
        }
        // no project.json
        if (!projectConfigurator.getConfigurationObjectByProjectName(projectName)) {
            return false;
        }

        return true;
    }

    function isRunnablePath(path) {
        var projectPath = projectConfigurator.getProjectRootPath(path);

        return isRunnableProjectPath(projectPath);
    }

    module.getViableItemsForWorkbench = function () {

        var items = {};
        contextMenuItems = [];

        var contextPaths = [];
        var context = workbench.getContext();
        if (context && context.paths) {
            contextPaths = context.paths;
            if (contextPaths.length === 1) {
                var bRunnable = isRunnablePath(contextPaths[0]);

                if (bRunnable === true) {
                    items['&Run'] = workbenchWholeItems['&Run'];
                }
            }
        }

        var selectedRunLists = [];
        var unSelectedRunLists = [];
        var runList;

        var projectProperties = projectConfigurator.getRunAsList();
        var property;

        for (var i = 0; i < projectProperties.length; i++) {
            property = projectProperties[i];

            runList = getRunList(property, property.name);
            runList.push(property.name + ' : Run configurations');

            //is selected?
            if (isContextProject(contextPaths, property.name) === true) {
                if (selectedRunLists.length !== 0) {
                    selectedRunLists.push('---');
                }
                selectedRunLists = selectedRunLists.concat(runList);
            } else {
                if (unSelectedRunLists.length !== 0) {
                    unSelectedRunLists.push('---');
                }
                unSelectedRunLists = unSelectedRunLists.concat(runList);
            }
        }

        if (selectedRunLists.length !== 0) {
            selectedRunLists.push('---');
        }

        contextMenuItems = selectedRunLists.concat(unSelectedRunLists);

        items['Run &with'] = workbenchWholeItems['Run &with'];
        items['Run &with'][3] = contextMenuItems;

        return items;
    };

    module.getViableItemsForWorkspaceView = function () {
        var items = {};

        contextMenuItems = [];

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

        var projectName = parseProjectNameFromPath(selectedPath);

        if (!projectName) {
            return items;
        }

        var projectProperty = projectConfigurator.getConfigurationObjectByProjectName(projectName);

        var disableList = [];

        if (projectProperty) {
            contextMenuItems = getRunList(projectProperty, projectName);
            if (!contextMenuItems || contextMenuItems.length === 0) {
                contextMenuItems.push('No project index');
                disableList.push(0);
            }
        } else {
            contextMenuItems.push('No project index');
            disableList.push(0);
        }

        contextMenuItems.push('---');
        contextMenuItems.push(projectName + ' : Run configurations');

        items['&Run'] = workspaceWholeItems['&Run'];
        items['Run &with'] = workspaceWholeItems['Run &with'];
        items['Run &with'][3] = contextMenuItems;
        items['Run &with'][4] = disableList;


        return items;
    };

    module.getContextItem = function (index) {
        if (!contextMenuItems || contextMenuItems.length <= index) {
            return null;
        }
        return contextMenuItems[index];
    };

    return module;

});
