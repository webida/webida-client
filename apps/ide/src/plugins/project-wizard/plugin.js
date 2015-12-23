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
 * @fileoverview webida - project wizard
 *
 * @version: 0.1.0
 * @since: 2013.10.01
 *
 * Src:
 *   plugins/project-wizard/plugin.js
 */

define([
        'dojo/i18n!./nls/resource',
        'webida-lib/app',            // ide
        'webida-lib/webida-0.3',     // webida
        'webida-lib/util/locale',   // webida util
        'webida-lib/util/path',     // webida util
        'webida-lib/plugins/workbench/plugin',
        'plugins/webida.ide.project-management.run/run-configuration-manager',     //FIXME remove
        'webida-lib/plugins/workspace/plugin',
        'dojo/topic',
        './lib/util'
       ],
function (i18n, ide, webida, Locale, pathUtil, workbench, runConfigurationManager, wv, topic, Util) {
    'use strict';
    var localizer = new Locale(i18n);

    // Commented because of Jshint error
     /*
    function isRunnableProjectPath(projectLevelPath) {
        if (!projectLevelPath || !pathUtil.isDirPath(projectLevelPath)) {
            return false;
        }

        var projectName = pathUtil.getName(projectLevelPath);
        if (!projectName || projectName[0] === '.') {
            return false;
        }
        // no project.json
        if (!runConfigurationManager.getByProjectName(projectName)) {
            return false;
        }

        return true;
    }

    function isRunnablePath(path) {
        var projectPath = pathUtil.getProjectRootPath(path);
        return isRunnableProjectPath(projectPath);
    }
    */

    return {
        getViableItems : function () {
            var itemsTest = {
                '&Test' : [ 'cmnd', 'plugins/project-wizard/test-commands', 'doTest' ]
            };
            var itemsBuild = {
                '&Build' : [ 'cmnd', 'plugins/project-wizard/export-commands', 'build' ],
                'Build Configurations' : [ 'cmnd', 'plugins/project-wizard/export-commands', 'editProfile' ],
                'Rebuild' : [ 'cmnd', 'plugins/project-wizard/export-commands', 'rebuild' ],
                'Clean' : [ 'cmnd', 'plugins/project-wizard/export-commands', 'buildClean' ],
                'Generate Signed Package' : [ 'cmnd', 'plugins/project-wizard/export-commands', 'buildSigned' ],
                '&Export' : [ 'cmnd', 'plugins/project-wizard/export-commands', 'doExport' ]
            };
            // FIXME:: Refactoring to use extension point
//            var itemsContext = {
//                'Debug' : [ 'cmnd', 'plugins/webida.ide.project-management.run/commands', 'workbenchDebugBinded' ],
//                'Run with Device' : [ 'cmnd', 'plugins/project-wizard/run-commands', 'runDevice' ],
//                'Debug with' : [ 'cmnd', 'plugins/project-wizard/run-commands', 'debugWith' ]
//            };

            var items = {};
            // to enable for the files in project directory
            if (Util.getProjectPath(wv.getSelectedPaths()) !== null) {
                items = $.extend(itemsTest, itemsBuild);
            }

            // items should be localized after building items object
            localizer.convertMenuItem(items, '[menu] ');

            var contextPaths = [];
            var context = workbench.getContext();
            if (context && context.paths) {
                contextPaths = context.paths;
                // Commented because of Jshint error
                /*
                if (contextPaths.length === 1) {
                    var isRunnable = isRunnablePath(contextPaths[0]);
                    if (isRunnable === true) {
                        // FIXME:: Refactoring to use extension point
//                        items = $.extend(items, itemsContext);
                    }
               }
               */
            }
            return items;
        },

        getViableItemsForWorkbenchAtFile : function () {
            var items = {
                '&Project' : [ 'cmnd', 'plugins/project-wizard/pw-commands', 'newProject' ] // 'doIt' - old impl.
            };
            localizer.convertMenuItem(items, '[menu] ');
            return items;
        },

        getViableItemsForWorkspaceView : function () {
            var items = {
                'Project': [ 'cmnd', 'plugins/project-wizard/pw-commands', 'newProject' ]
            };
            localizer.convertMenuItem(items, '[menu] ');
            return items;
        }
    };
});
