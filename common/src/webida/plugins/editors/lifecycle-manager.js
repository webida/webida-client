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
 * LifecycleManager manages editor's life-cycle.
 * the life-cycle consist of open, save, close.
 *
 * @since: 2015.07.19
 * @author: hw.shim@samsung.com
 */

// @formatter:off
define([
    'dojo/topic',
    'webida-lib/plugins/workbench/plugin', //TODO : refactor
    'webida-lib/plugins/workbench/ui/EditorPart',
    'webida-lib/plugins/workbench/ui/TabPartContainer',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/notify',
    './ExtensionManager'
], function (
    topic,
    workbench,
    EditorPart,
    TabPartContainer,
    Logger,
    notify,
    ExtensionManager
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     * @typedef {Object} LifecycleManager
     * @typedef {Object} ExtensionManager
     * @typedef {Object} Part
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    var lifecycleManager = {

        /**
         * @protected
         * @return {ExtensionManager}
         */
        _getExtensionManager: function () {
            return this.extensionManager;
        },

        // ************* Open ************* //

        /**
         * Creates a new DataSource if not exist then show Part.
         *
         * @param {Object} dataSourceId
         * @param {Object} options
         * @param {_openDataSourceCallback} callback
         */
        /**
         * @callback _openDataSourceCallback
         * @param {Part} part
         */
        _openDataSource: function (dataSourceId, options, callback) {
            logger.info('> _openDataSource(' + dataSourceId + ', ', options, ', ' + typeof callback + ')');
            logger.trace();

            var that = this;
            options = options || {};

            //1. prepare DataSource
            logger.info('workbench = ', workbench);
            var dsRegistry = workbench.getDataSourceRegistry();
            var dataSource = dsRegistry.getDataSourceById(dataSourceId);
            if (dataSource === null) {
                workbench.createDataSource(dataSourceId, function (dataSource) {
                    that._showPart(dataSource, options, callback);
                });
            } else {
                this._showPart(dataSource, options, callback);
            }
        },

        /**
         * Decide whether create new Part or show existing Part.
         *
         * @protected
         */
        _showPart: function (dataSource, options, callback) {
            logger.info('_showPart(' + dataSource + ', ' + options + ', callback)');

            var that = this;
            var extMgr = this._getExtensionManager();
            try {
                var partClassPath = extMgr.getPartPath(dataSource, options);
                logger.info('%c partClassPath = ' + partClassPath, 'color:green');
            } catch (e) {
                notify.info(e.message);
                return;
            }
            /*jshint -W038 */
            require([partClassPath], function (PartClass) {
                PartClass.classPath = partClassPath;
                var registry = that._getPartRegistry();
                var parts = registry.getPartsByClass(dataSource, PartClass);

                //'open with specific editor' or 'default editor' not opened
                // yet
                if ('openWithPart' in options || parts.length === 0) {
                    that._createPart(PartClass, dataSource, options, callback);
                } else {
                    //'default editor' already exists
                    if (parts.length > 0) {
                        logger.log('find existing last part and show');
                        that._showExistingPart(PartClass, dataSource, options, callback);
                    }
                }

                // Recent DataSource
                registry.setRecentDataSourceId(dataSource.getId());
            });
            /*jshint +W038 */
        },

        /**
         * @protected
         */
        _createPart: function (PartClass, dataSource, options, callback) {
            logger.info('_createPart(PartClass, ' + dataSource + ', ' + options + ', callback)');

            var page = workbench.getCurrentPage();
            var layoutPane = page.getChildById('webida.layout_pane.center');

            //3. create Tab & add to Pane
            var tabPartContainer = new TabPartContainer(dataSource);
            layoutPane.addPartContainer(tabPartContainer);

            //4. create Part
            tabPartContainer.createPart(PartClass, callback);
        },

        /**
         * @protected
         */
        _showExistingPart: function (PartClass, dataSource, options, callback) {
            logger.info('_showExistingPart(PartClass, ' + dataSource + ', ' + options + ', ' + callback + ')');
        },

        /**
         * @protected
         */
        _getPartRegistry: function () {
            var page = workbench.getCurrentPage();
            return page.getPartRegistry();
        },

        // ************* Save ************* //

        /**
         * Saves specified dataSource.
         * @param {Object} dataSourceId
         * @param {Object} options
         * @param {_saveByDataSourceIdCallback} callback
         * @protected
         */
        /**
         * @callback _saveByDataSourceIdCallback
         * @param {Part} part
         */
        _saveByDataSourceId: function (dataSourceId, callback) {
            logger.info('> _saveCurrentPart(' + dataSourceId + ', ' + typeof callback + ')');
            var part, parts;
            var registry = this._getPartRegistry();
            var dsRegistry = workbench.getDataSourceRegistry();
            var dataSource = dsRegistry.getDataSourceById(dataSourceId);
            parts = registry.getPartsByDataSource(dataSource);
            if (parts instanceof Array && parts.length > 0) {
                part = parts[0];
            }
            part.save(callback);
        },

        /**
         * Saves current editor part's dataSource.
         * @param {Object} options
         * @param {_saveCurrentPartCallback} callback
         * @protected
         */
        /**
         * @callback _saveCurrentPartCallback
         * @param {Part} part
         */
        _saveCurrentPart: function (callback) {
            logger.info('> _saveCurrentPart(' + typeof callback + ')');
            var registry = this._getPartRegistry();
            var part = registry.getCurrentEditorPart();
            part.save(callback);
        },

        /**
         * Saves all parts
         * @protected
         */
        _saveAllParts: function () {
            logger.info('_saveAllParts()');
            var registry = this._getPartRegistry();
            var parts = registry.getDirtyParts();
            parts.forEach(function (part) {
                part.save();
            });
        },

        // ************* Close ************* //

        /**
         * @param {Part} part
         * @protected
         */
        _closePart: function (part) {
            part.close();
        },

        /**
         * Closes current active EditorPart
         * @protected
         */
        _closeCurrentPart: function () {
            logger.info('_closeCurrentPart()');
            var registry = this._getPartRegistry();
            var part = registry.getCurrentEditorPart();
            part.close();
        },

        /**
         * @protected
         */
        _closeOtherParts: function () {
            var registry = this._getPartRegistry();
            var currentPart = registry.getCurrentEditorPart();
            var page = workbench.getCurrentPage();
            page.getExposedParts(EditorPart).forEach(function (part) {
                if (part !== currentPart) {
                    part.close();
                }
            });
        },

        /**
         * @protected
         */
        _closeAllParts: function () {
            logger.info('_closeAllParts()');
            var page = workbench.getCurrentPage();
            page.getExposedParts(EditorPart).forEach(function (part) {
                part.close();
            });
        },

        /**
         * @param {string} dataSourceId
         * @param {Object} option
         * @protected
         */
        _closeByDataSourceId: function (dataSourceId, option) {
            logger.info('_closeByDataSourceId(' + dataSourceId + ', ' + option + ')');
            var isForced = (typeof option === 'object') ? option.isForced : false;
            var dsRegistry = workbench.getDataSourceRegistry();
            var dataSource = dsRegistry.getDataSourceById(dataSourceId);
            var partRegistry = this._getPartRegistry();
            var parts = partRegistry.getPartsByDataSource(dataSource);
            parts.forEach(function (part) {
                part.close(isForced);
            });
        }
    };

    lifecycleManager.extensionManager = ExtensionManager.getInstance();

    return lifecycleManager;
});
