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

define([
    'dojo/topic',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/path'
], function (
    topic,
    wv,
    pathUtil
) {
    'use strict';

    var module = {};
    var bEnable = false;

    var item = {
        'Deplo&y': [ 'cmnd', 'plugins/webida.ide.project.deploy/deploy-commands', 'openDialog' ]
    };

    function isProjectPath(path) {
        var splitPath = path.split('/');
        var projectName = splitPath[2];
        var viable;
        if (projectName && (projectName[0] !== '.')) {
            viable = true;
            require(['plugins/project-configurator/projectConfigurator'], function (projectConfigurator) {
                projectConfigurator.getConfigurationObjectByProjectName(projectName, function (obj) {
                    if (!obj) {
                        viable = false; // not a project directory
                    }
                });
            });
        } else {
            viable = false;
        }
        return viable;
    }

    function isEnableContext(context) {
        if (!context) {
            return false;
        }
        if (context.paths.length !== 1) {
            return false;
        }
        // Enable "Project > Deploy" workbench menu even when a file is selected
        /*
        if (context.paths[0] !== context.projectPath) {
            return false;
        }
        */

        return isProjectPath(context.projectPath);
    }

    module.onContextChanged = function (context) {
        bEnable = isEnableContext(context);
        if (bEnable) {
            topic.publish('toolbar.deploy.enable');
        } else {
            topic.publish('toolbar.deploy.disable');
        }
    };

    module.getViableItemsForWorkbench = function () {
        return bEnable ? item : null;
    };

    module.getViableItemsForWorkspace = function () {
        var selectedPaths = wv.getSelectedPaths();
        if (!selectedPaths || selectedPaths.length !== 1) {
            return null;
        }

        var path = selectedPaths[0];
        if (!pathUtil.isDirPath(path) || path.split('/').length !== 4) {
            return null;
        }

        var viable = isProjectPath(path);
        return viable ? item : null;
    };

    return module;
});
