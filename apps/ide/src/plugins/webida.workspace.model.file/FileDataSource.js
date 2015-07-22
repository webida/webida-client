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
 * FileDataSource
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
	'dojo/topic',
    'external/eventEmitter/EventEmitter',
    'webida-lib/app',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/plugins/workbench/ui/DataSource',
    'external/toastr/toastr.min',
    './File'
], function(
	topic,
    EventEmitter,
    app,
    genetic, 
    Logger,
    DataSource,
    toastr,
    File
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} File
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    var fsCache = app.getFSCache();

    function FileDataSource(dataSourceId) {
        logger.info('new FileDataSource(' + dataSourceId + ')');

        DataSource.call(this, dataSourceId);

        /** @type {File} */
        this.file = new File(dataSourceId);

        /*
         var that = this;
         var file = this.file;
         fsCache.readFile(file.path, function(error, contents) {
         if (error) {
         toastr.error('Failed to read file "' + file.path + '" (' + error + ')');
         } else {
         file.setContents(contents);
         topic.publish('file.opened', file, contents);
         that.emit(DataSource.CONTENT_LOAD, that);
         }
         });
         */
    }


    genetic.inherits(FileDataSource, DataSource, {

        /**
         * @return {File}
         */
        getFile: function() {
            return this.file;
        },

        /**
         * @override
         * @param {DataSource} target
         */
        equals: function(target) {
            if ( typeof target.getFile === 'function') {
                var file = target.getFile();
                var thisFile = this.getFile();
                if (file.path === thisFile.path) {
                    return true;
                } else {
                    return false;
                }
            }
            return false;
        },

        /**
         * @param {Function} callback
         */
        getContents: function(callback) {
            var that = this;
            var file = this.file;
            if (file.getFlag(File.READ) === false) {
                fsCache.readFile(file.path, function(error, contents) {
                    if (error) {
                        toastr.error('Failed to read file "' + file.path + '" (' + error + ')');
                    } else {
                        file.setContents(contents);
                        file.setFlag(File.READ, true);
                        callback(file.getContents());
                    }
                });
            } else {
                callback(file.getContents());
            }
        },

        /**
         * @override
         */
        toString: function() {
            var res = '<' + this.constructor.name + '>#' + this.file.path;
            return res;
        }
    });

    return FileDataSource;
});
