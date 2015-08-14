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
    'webida-lib/plugin-manager-0.1',
    'webida-lib/plugins/workbench/plugin', //TODO : refactor
    'webida-lib/plugins/workbench/ui/DataSource',
    'webida-lib/plugins/workbench/ui/TabPartContainer',
    'webida-lib/plugins/workbench/ui/Workbench',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'text!./ext-to-mime.json'
], function(
    topic,
    EventEmitter,
    _,
    pluginManager,
    workbench,
    DataSource,
    TabPartContainer,
    Workbench,
    genetic, 
    Logger,
    extToMime
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

        /** @type {Object} */
        this.mimeType = JSON.parse(extToMime);

        /** @type {Array} */
        this.extensions = pluginManager.getExtensions('webida.common.editors:editor');
        logger.info('this.extensions = ', this.extensions);

        //this._subscribe();
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
         * @return {Array}
         */
        _getExtensions: function() {
            if (this.extensions instanceof Array) {
                return this.extensions;
            } else {
                return [];
            }
        },

        /**
         * TODO This should be refactored after Refactoring Plugin Manager.
         * This method should be called by plugin object itself.
         * For example, something like this..
         * plugin.getPartPath() or plugin.getAttr('partPath');
         */
        _getPathByExt: function(ext) {
            return ext.__plugin__.loc + '/' + ext.editorPart;
        },

        /**
         * Retrieve Part Module Path for a specific resource name.
         * Only one plugin should exist for a specific resource name.
         *
         * @return {string} Part's Class Path
         * @private
         */
        _getPathForName: function(dataSource) {
            logger.info('_getPathForName(' + dataSource + ')');
            var persistence = dataSource.getPersistence();
            var ext, extensions = this._getExtensions();
            //Case 2. specific resource name
            for (var i = 0; i < extensions.length; i++) {
                ext = extensions[i];
                if (ext.handledFileNames.indexOf(persistence.getName()) >= 0) {
                    return this._getPathByExt(ext);
                }
            }
            return null;
        },

        /**
         * @return {string} Mime Type
         * @private
         */
        _getMimeType: function(resourceExt) {
            return this.mimeType[resourceExt];
        },

        /**
         * Retrieve Part Module Path for a specific resource extension.
         * This method works when a DataSource's Persistence has an extension
         * (such as a File).
         * @see File, Persistence, DataSource
         *
         * @return {string} Part's Class Path
         * @private
         */
        _getPathForExtension: function(dataSource) {
            logger.info('_getPathForExtension(' + dataSource + ')');
            var extensions = this._getExtensions();
            var persistence = dataSource.getPersistence();
            var resourceExt = persistence.getExtension();
            var mime = this._getMimeType(resourceExt);

            var viable1 = extensions.filter(function(ext) {
                return ext.handledFileExt.some(function(supportedExt) {
                    return resourceExt.match('^' + supportedExt + '$');
                });
            });
            var viable2 = extensions.filter(function(ext) {
                return ext.handledMimeTypes.some(function(supportedMime) {
                    return mime && mime.match('^' + supportedMime + '$');
                });
            });
            var unviable1 = extensions.filter(function(ext) {
                return ext.unhandledFileExt.some(function(supportedExt) {
                    return resourceExt.match('^' + supportedExt + '$');
                });
            });
            var unviable2 = extensions.filter(function(ext) {
                return ext.unhandledMimeTypes.some(function(supportedMime) {
                    return mime && mime.match('^' + supportedMime + '$');
                });
            });

            var results = _.union(viable1, viable2);
            results = _.difference(results, unviable1, unviable2);

            if (results.length === 0) {
                return null;
            } else {
                return this._getPathByExt(results[0]);
            }
        },

        /**
         * Retrieve Part Module Path for specified a DataSource with options
         *
         * Case 1. 'open with specific editor' case
         * Case 2. specific resource name (should exist only one plugin)
         * Case 3. specific resource extension (if extension exists).
         *
         * @return {string} Part's Class Path
         * @private
         */
        _getPartPath: function(dataSource, options) {
            logger.info('_getPartPath(' + dataSource + ', options)');
            //Case 1. 'open with specific editor' case
            if ('openWithPart' in options) {
                return options.openWithPart;
            } else {
                //Case 2. specific resource name
                var pathForName = this._getPathForName(dataSource);
                if (pathForName) {
                    return pathForName;
                }
                //Case 3. specific resource extension (if extension exists).
                var pathForExtension = this._getPathForExtension(dataSource);
                if (pathForExtension) {
                    return pathForExtension;
                }
                return null;
            }
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
            var partClassPath = this._getPartPath(dataSource, options);
            logger.info('%cpartClassPath = '+partClassPath, 'color:green');
            require([partClassPath], function(PartClass) {
                var page = workbench.getCurrentPage();
                var registry = page.getPartRegistry();
                var parts = registry.getPartsByClass(dataSource, PartClass);

                //'open with specific editor' or 'default editor' not opened yet
                if ('openWithPart' in options || parts.length === 0) {
                    that._createPart(dataSource, options, callback);
                } else {
                    //'default editor' already exists
                    if (parts.length > 0) {
                        logger.log('find existing last part and show');
                    }
                }
            });
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

