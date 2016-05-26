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
 * @file This file manages dynamic menus.
 * @since 1.7.0
 * @author minsung.jin@samsung.com
 */

define([
    'dojo/i18n!./nls/resource',
    'dojo/topic',
    'plugins/project-configurator/project-info-service',
    'webida-lib/plugins/command-system/system/command-system',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/util/locale',
    'webida-lib/util/path'
], function (
    i18n,
    topic,
    projectConfigurator,
    commandSystem,
    wv,
    wb,
    Locale,
    pathUtil
) {
    'use strict';

    var commandService = commandSystem.service;
    /**
     * Get whether it is a project path or not
     * @param {string} path
     * @return {boolean}
     * @private
     */
    function isProjectPath(path) {
        return !!projectConfigurator.getByPath(path);
    }
    /**
     * Get whether deploy function is able to use or not by selected paths
     * @param {Object} context
     * @return {boolean}
     * @private
     */
    function isEnableContext(context) {
        if (!context || !context.paths) {
            return false;
        } else if (context.paths.length !== 1) {
            return false;
        }
        return isProjectPath(context.projectPath);
    }

    function updateToolbar() {
        var bEnable = isEnableContext(wb.getContext());
        if (bEnable) {
            topic.publish('toolbar/enable/deploy');
        } else {
            topic.publish('toolbar/disable/deploy');
        }
    }

    function updateTopMenu() {
        var deployMenuItem = commandService.getTopMenuModel('deploy');
        var delimiterMenuItem = commandService.getTopMenuModel('deploy-delimiter');
        var bEnable = isEnableContext(wb.getContext());
        if (bEnable) {
            deployMenuItem.invisible = false;
            delimiterMenuItem.invisible = false;
        } else {
            deployMenuItem.invisible = true;
            delimiterMenuItem.invisible = true;
        }
    }

    function updateContextMenu() {
        var selectedPaths;
        var path;
        var viable;
        var deployMenuItem = commandService.getContextMenuModel('deploy');
        var delimiterMenuItem = commandService.getContextMenuModel('deploy-delimiter');
        selectedPaths = wv.getSelectedPaths();
        if (!selectedPaths || selectedPaths.length !== 1) {
            deployMenuItem.invisible = true;
            deployMenuItem.inviable = true;
            return;
        }
        path = selectedPaths[0];
        if (!pathUtil.isDirPath(path) || path.split('/').length !== 4) {
            deployMenuItem.invisible = true;
            deployMenuItem.inviable = true;
            return;
        }
        viable = isProjectPath(path);
        if (viable) {
            deployMenuItem.invisible = false;
            delimiterMenuItem.invisible = false;
        } else {
            deployMenuItem.inviable = true;
            delimiterMenuItem.invisible = true;
        }
    }

    return {
        updateToolbar: updateToolbar,
        updateTopMenu: updateTopMenu,
        updateContextMenu: updateContextMenu
    };
});
