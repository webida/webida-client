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
 * ExtensionManager
 *
 * This class manages 'webida.common.editors:editor' extension point.
 * 
 * @see
 * @since: 2015.08.14
 * @author: hw.shim
 */

// @formatter:off
define([
    'external/eventEmitter/EventEmitter',
    'webida-lib/plugin-manager-0.1',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'text!./ext-to-mime.json'
], function(
    EventEmitter,
    pluginManager,
    genetic, 
    Logger,
    extToMime
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function ExtensionManager() {
        logger.info('new ExtensionManager()');

        /** @type {Object} */
        this.mimeType = JSON.parse(extToMime);

        /** @type {Array} */
        this.extensions = pluginManager.getExtensions('webida.common.editors:editor');
        logger.info('this.extensions = ', this.extensions);
    }


    genetic.inherits(ExtensionManager, Object, {

        /**
         * @return {Array}
         */
        getExtensions: function() {
            if (this.extensions instanceof Array) {
                return this.extensions;
            } else {
                return [];
            }
        },

        /**
         * @return {string} Mime Type
         * @private
         */
        _getMimeType: function(resourceExt) {
            return this.mimeType[resourceExt];
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
         * Retrieve Part Module Path for specified a DataSource with options
         *
         * Case 1. 'open with specific editor' case
         * Case 2. specific resource name (should exist only one plugin)
         * Case 3. specific resource extension (if extension exists).
         *
         * @return {string} Part's Class Path
         */
        getPartPath: function(dataSource, options) {
            logger.info('getPartPath(' + dataSource + ', options)');
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
                //Case 4. Nothing found
                var resourceName = dataSource.getPersistence().getName();
                throw new Error('None of the plugins contribute for the resource ' + resourceName);
            }
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
            var ext, extensions = this.getExtensions();
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
            var extensions = this.getExtensions();
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
    });

    return ExtensionManager;
});
