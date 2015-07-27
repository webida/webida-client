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
    'webida-lib/plugins/workbench/plugin', //TODO : refactor
    'webida-lib/plugins/workbench/ui/DataSource',
    'webida-lib/plugins/workbench/ui/TabPartContainer',
    'webida-lib/plugins/workbench/ui/Workbench',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
], function(
    topic,
    EventEmitter,
    workbench,
    DataSource,
    TabPartContainer,
    Workbench,
    genetic, 
    Logger
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     * @typedef {Object} Part
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function EditorManager() {
        logger.info('new EditorManager()');

        /** @type {Object} */
        this.subscribed = {};

        //this.subscribe();
    }


    genetic.inherits(EditorManager, EventEmitter, {

        /**
         * subscribe to topic
         */
        // @formatter:off
        subscribe: function() {
            this.subscribed['#REQUEST.openFile'] = topic.subscribe(
                '#REQUEST.openFile', this.requestOpen.bind(this));
        },
        // @formatter:on

        unsubscribe: function() {
            for (var prop in this.subscribed) {
                this.subscribed[prop].remove();
            }
        },

        getPartClassName: function(dataSource) {
            var path = this.getPartClassPath(dataSource);
            return path.split(/[\\/]/).pop();
        },

        getPartClassPath: function(dataSource) {
            return 'plugins/webida.editor.example.codemirror/CmEditorPart';
        },

        /**
         * @param {DataSource} dataSourceId
         * @param {Object} options
         * @param {requestOpenCallback} callback
         */
        /**
         * @callback requestOpenCallback
         * @param {Part} part
         */
        requestOpen: function(dataSourceId, options, callback) {
            logger.info('> requestOpen(' + dataSourceId + ', ' + options + ', callback)');

            var that = this;
            options = options || {};

            //1. prepare DataSource
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
         * @private
         */
        _showPart: function(dataSource, options, callback) {
            logger.info('_showPart(' + dataSource + ', ' + options + ', callback)');

            var page = workbench.getCurrentPage();
            var registry = page.getPartRegistry();
            var ClassName = this.getPartClassName(dataSource);
            var parts = registry.getPartsByClassName(dataSource, ClassName);

            //'open with specific editor' or 'default editor' not opened yet
            if (options.unlimitedOpen === true || parts.length === 0) {
                this._createPart(dataSource, options, callback);
            } else {
                //'default editor' already exists
                if (parts.length > 0) {
                    logger.log('show existing editor');
                }
            }
        },

        /**
         * @private
         */
        _createPart: function(dataSource, options, callback) {
            logger.info('_createPart(' + dataSource + ', ' + options + ', callback)');

            var page = workbench.getCurrentPage();
            var layoutPane = page.getChildById('webida.layout_pane.center');

            //3. create Tab & add to Pane
            var tabPartContainer = new TabPartContainer(dataSource);
            layoutPane.addPartContainer(tabPartContainer);

            //4. create Part
            tabPartContainer.createPart(options, callback);
        }
    });

    EditorManager.DATA_SOURCE_OPENED = 'dataSourceOpened';

    return EditorManager;
});

