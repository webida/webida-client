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
 * Constructor
 *
 * EditorManager is a Mediator for EditorParts
 * EditorParts do not know each other,
 * only know their Mediator EditorManager.
 *
 * @see
 * @since: 2015.07.19
 * @author: hw.shim
 */

// @formatter:off
define([
    'dojo/topic',
    'external/eventEmitter/EventEmitter',
    'external/lodash/lodash.min',
    'webida-lib/plugins/workbench/plugin', //TODO : refactor
    'webida-lib/plugins/workbench/ui/DataSource',
    'webida-lib/plugins/workbench/ui/TabPartContainer',
    'webida-lib/plugins/workbench/ui/Workbench',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/notify',
    './ExtensionManager'
], function(
    topic,
    EventEmitter,
    _,
    workbench,
    DataSource,
    TabPartContainer,
    Workbench,
    genetic, 
    Logger,
    notify,
    ExtensionManager
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     * @typedef {Object} EditorManager
     * @typedef {Object} ExtensionManager
     * @typedef {Object} Part
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    var singleton = null;

    function EditorManager() {
        logger.info('new EditorManager()');

        /** @type {Object} */
        this.subscribed = {};

        this.extensionManager = ExtensionManager.getInstance();

        //this._subscribe();
    }

    /**
     * @return {EditorManager}
     */
    EditorManager.getInstance = function() {
        if (singleton === null) {
            singleton = new this();
        }
        return singleton;
    }

    genetic.inherits(EditorManager, EventEmitter, {

        /**
         * subscribe to topic
         * @private
         */
        // @formatter:off
        _subscribe: function() {
            this.subscribed['#REQUEST.openFile'] = topic.subscribe(
                '#REQUEST.openFile', this.requestOpen.bind(this));
        },
        // @formatter:on

        /**
         * unsubscribe topics
         * @private
         */
        _unsubscribe: function() {
            for (var prop in this.subscribed) {
                this.subscribed[prop].remove();
            }
        },

        /**
         * @private
         * @return {ExtensionManager}
         */
        _getExtensionManager: function() {
            return this.extensionManager;
        },

        /**
         * Creates a new DataSource if not exist then show Part.
         *
         * @param {Object} dataSourceId
         * @param {Object} options
         * @param {requestOpenCallback} callback
         */
        /**
         * @callback requestOpenCallback
         * @param {Part} part
         */
        requestOpen: function(dataSourceId, options, callback) {
            logger.info('> requestOpen(' + dataSourceId + ', ', options, ', ' + typeof callback + ')');

            var that = this;
            options = options || {};

            //1. prepare DataSource
            logger.info('workbench = ', workbench);
            var dsRegistry = workbench.getDataSourceRegistry();
            var dataSource = dsRegistry.getDataSourceById(dataSourceId);
            if (dataSource === null) {
                workbench.createDataSource(dataSourceId, function(dataSource) {
                    that._showPart(dataSource, options, callback);
                });
            } else {
                this._showPart(dataSource, options, callback);
            }
        },

        /**
         * Decide whether create new Part or show existing Part.
         *
         * @private
         */
        _showPart: function(dataSource, options, callback) {
            logger.info('_showPart(' + dataSource + ', ' + options + ', callback)');

            var that = this;
            var extMgr = this._getExtensionManager();
            try {
                var partClassPath = extMgr.getPartPath(dataSource, options);
                logger.info('%c partClassPath = ' + partClassPath, 'color:green');
            } catch(e) {
                notify.info(e.message);
                return;
            }
            require([partClassPath], function(PartClass) {
                var page = workbench.getCurrentPage();
                var registry = page.getPartRegistry();
                var parts = registry.getPartsByClass(dataSource, PartClass);

                //'open with specific editor' or 'default editor' not opened
                // yet
                if ('openWithPart' in options || parts.length === 0) {
                    that._createPart(PartClass, dataSource, options, callback, partClassPath);
                } else {
                    //'default editor' already exists
                    if (parts.length > 0) {
                        logger.log('find existing last part and show');
                        that._showExistingPart(PartClass, dataSource, options, callback);
                    }
                }
            });
        },

        /**
         * @private
         */
        _createPart: function(PartClass, dataSource, options, callback) {
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
         * @private
         */
        _showExistingPart: function(PartClass, dataSource, options, callback) {
            logger.info('_showExistingPart(PartClass, ' + dataSource + ', ' + options + ', callback)');
        }
    });

    EditorManager.DATA_SOURCE_OPENED = 'dataSourceOpened';

    return EditorManager;
});
