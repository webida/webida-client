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
 * Main module of the deploy plugin
 * @since 1.6.0
 * @author kyungmi.k@samsung.com
 * @module Deploy
 */
define([
    'dojo/i18n!./nls/resource',
    'dojo/topic',
    'plugins/project-configurator/project-info-service',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/locale',
    'webida-lib/util/path'
], function (
    i18n,
    topic,
    projectConfigurator,
    wv,
    Locale,
    pathUtil
) {
    'use strict';

    /**
     * @typedef context
     * @property {string} fsidName
     * @property {string} workspaceName
     * @property {string} projectName
     * @property {string} workspaceProjectName
     * @property {string} workspacePath
     * @property {string} username
     * @memberof module:Deploy
     */

    /**
     * This module object
     * @type {Object}
     */
    var module = {};
    /**
     * @type {boolean}
     */
    var bEnable = false;
    /**
     * @type {module:Locale}
     */
    var locale = new Locale(i18n);

    /**
     * @type {Object}
     */
    var item = {'Deplo&y': [ 'cmnd', 'plugins/webida.ide.project.deploy/deploy-commands', 'openDialog' ]};

    /**
     * Convert menu locale for i18n
     */
    (function _convertMenuLocale() {
        locale.convertMenuItem(item, 'menu');
    })();

    /**
     * Get whether it is a project path or not
     * @param {string} path
     * @returns {boolean}
     * @private
     */
    function _isProjectPath(path) {
        return !!projectConfigurator.getByPath(path);
    }

    /**
     * Get whether deploy function is able to use or not by selected paths
     * @param {Object} context
     * @returns {boolean}
     * @private
     */
    function _isEnableContext(context) {
        if (!context || context.paths.length !== 1) {
            return false;
        }
        return _isProjectPath(context.projectPath);
    }

    /**
     * Listen to the changes of context
     * @param {Object} context
     */
    module.onContextChanged = function (context) {
        bEnable = _isEnableContext(context);
        if (bEnable) {
            topic.publish('toolbar/enable/deploy');
        } else {
            topic.publish('toolbar/disable/deploy');
        }
    };

    /**
     * Get viable menu items in workbench
     * @returns {Object}
     */
    module.getViableItemsForWorkbench = function () {
        return bEnable ? item : null;
    };

    /**
     * Get viable context menu items in workspace
     * @returns {Object}
     */
    module.getViableItemsForWorkspace = function () {
        var selectedPaths = wv.getSelectedPaths();
        if (!selectedPaths || selectedPaths.length !== 1) {
            return null;
        }

        var path = selectedPaths[0];
        if (!pathUtil.isDirPath(path) || path.split('/').length !== 4) {
            return null;
        }

        var viable = _isProjectPath(path);
        return viable ? item : null;
    };

    return module;
});
