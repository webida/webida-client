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
 * @file Main module for the project wizard
 * @since 0.1.0 (2013.10.01)
 * @author kh5325.kim@samsung.com
 */

define([
    'dojo/i18n!./nls/resource',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/locale',
    'webida-lib/webida-0.3',
    './lib/util'
], function (
    i18n,
    workbench,
    workspace,
    Locale,
    webida,
    Util
) {
    'use strict';
    var localizer = new Locale(i18n);

    return {
        /**
         * Get all viable menu items as the sub-item of the 'Project' menu tree to inform the Menu System
         *
         * @see ./plugin.json
         * @return {Object} - menu items to attach as the sub-item of the 'Project' menu
         */
        getViableItems : function () {
            var itemsTest = {
                '&Test': [ 'cmnd', 'plugins/project-wizard/test-commands', 'doTest' ]
            };
            var itemsBuild = {
                '&Build': [ 'cmnd', 'plugins/project-wizard/export-commands', 'build' ],
                'Build Configurations': [ 'cmnd', 'plugins/project-wizard/export-commands', 'editProfile' ],
                Rebuild: [ 'cmnd', 'plugins/project-wizard/export-commands', 'rebuild' ],
                Clean: [ 'cmnd', 'plugins/project-wizard/export-commands', 'buildClean' ],
                'Generate Signed Package': [ 'cmnd', 'plugins/project-wizard/export-commands', 'buildSigned' ],
                '&Export': [ 'cmnd', 'plugins/project-wizard/export-commands', 'doExport' ]
            };
            // FIXME:: Refactoring to use extension point
//            var itemsContext = {
//                'Debug' : [ 'cmnd', 'plugins/webida.ide.project-management.run/commands', 'workbenchDebugBinded' ],
//                'Run with Device' : [ 'cmnd', 'plugins/project-wizard/run-commands', 'runDevice' ],
//                'Debug with' : [ 'cmnd', 'plugins/project-wizard/run-commands', 'debugWith' ]
//            };

            var items = {};
            // to enable for the files in project directory
            //FIXME just use `pathUtil.getProjectRootPath(workspace.getSelectedPaths()[0])`
            if (Util.getProjectPath(workspace.getSelectedPaths()) !== null) {
                items = $.extend(itemsTest, itemsBuild);
            }

            // items should be localized after building items object
            localizer.convertMenuItem(items, '[menu] ');

            /*var contextPaths = [];
            var context = workbench.getContext();
            if (context && context.paths) {
                contextPaths = context.paths;
                // Commented because of Jshint error

                if (contextPaths.length === 1) {
                    var isRunnable = isRunnablePath(contextPaths[0]);
                    if (isRunnable === true) {
                        // FIXME:: Refactoring to use extension point
//                        items = $.extend(items, itemsContext);
                    }
               }

            }*/
            return items;
        },

        /**
         * Get all viable menu items as the sub-item of the 'File' menu tree to inform the Menu System
         *
         * @see ./plugin.json
         * @return {Object} - menu items to attach as the sub-item of the 'File' menu
         */
        getViableItemsForWorkbenchAtFile : function () {
            var items = {
                '&Project': [ 'cmnd', 'plugins/project-wizard/pw-commands', 'newProject' ]
            };
            localizer.convertMenuItem(items, '[menu] ');
            return items;
        },

        /**
         * Get all viable menu items as the context menu of the 'Workspace' view to inform the Menu System
         *
         * @see ./plugin.json
         * @return {Object} - menu items to attach as the context menu of the 'Workspace' view
         */
        getViableItemsForWorkspaceView : function () {
            var items = {
                Project: [ 'cmnd', 'plugins/project-wizard/pw-commands', 'newProject' ]
            };
            localizer.convertMenuItem(items, '[menu] ');
            return items;
        }
    };
});
