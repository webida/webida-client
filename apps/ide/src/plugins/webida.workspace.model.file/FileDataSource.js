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
    'webida-lib/util/notify',
    'webida-lib/plugins/workbench/ui/DataSource',
    'webida-lib/plugins/workbench/ui/Persistence',
    './File'
], function(
	topic,
    EventEmitter,
    app,
    genetic, 
    Logger,
    notify,
    DataSource,
    Persistence,
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

        this.setPersistence(new File(dataSourceId));
    }


    genetic.inherits(FileDataSource, DataSource, {

        /**
         * @override
         * @param {Object}
         */
        setId: function(dataSourceId) {
            var persistence = this.getPersistence();
            if (persistence) {
                persistence.setPath(dataSourceId);
            }
            DataSource.prototype.setId.call(this, dataSourceId);
        },

        /**
         * @override
         * @param {DataSource} target
         */
        equals: function(target) {
            if ( typeof target.getPersistence === 'function') {
                var file = target.getPersistence();
                var thisFile = this.getPersistence();
                if (file.getPath() === thisFile.getPath()) {
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
        reload: function(callback) {
            logger.info('reload(callback)');
            var file = this.getPersistence();
            file.setFlag(Persistence.READ, false);
            this.getData(callback);
        },

        /**
         * @param {Function} callback
         */
        getData: function(callback) {
            logger.info('getData(callback)');
            var that = this;
            var file = this.getPersistence();
            if (this.isDeleted() === true) {
                return;
            }
            if (file.getFlag(Persistence.READ) === false) {
                this.emit(DataSource.LOAD_START, this);
                fsCache.readFile(file.getPath(), function(error, data) {
                    if (error) {
                        notify.error('Failed to read file "' + file.getPath() + '" (' + error + ')');
                        that.emit(DataSource.LOAD_FAIL, that);
                    } else {
                        logger.info('data arrived');
                        file.setContents(data);
                        file.setFlag(Persistence.READ, true);
                        that.emit(DataSource.LOAD_COMPLETE, data);
                        callback(file.getContents());
                    }
                });
            } else {
                callback(file.getContents());
            }
        },

        /**
         * @param {Object} data
         * @param {Function} callback
         */
        setData: function(data, callback) {
            var that = this;
            var file = this.getPersistence();
            this.emit(DataSource.BEFORE_SAVE);
            file.setFlag(Persistence.READ, false);
            fsCache.writeFile(file.getPath(), data, function(error) {
                if (error) {
                    notify.error('Failed to write file "' + file.getPath() + '" (' + error + ')');
                    that.emit(DataSource.SAVE_FAIL);
                } else {
                    file.setContents(data);
                    file.setFlag(Persistence.READ, true);
                    callback(file.getContents());
                    that.emit(DataSource.AFTER_SAVE);
                }
            });
        },

        /**
         * @override
         */
        getTitle: function() {
            return this.getPersistence().getName();
        },

        /**
         * @override
         */
        getToolTip: function() {
            return this.getPersistence().getPath();
        },

        /**
         * @override
         */
        getTitleImage: function() {
            //TODO
            //var desc = new ImageDescriptor(this.file.getExtension());
            return null;
        },

        /**
         * @override
         */
        toString: function() {
            var suffix = this.getPersistence().getPath();
            return DataSource.prototype.toString.call(this) + suffix;
        }
    });

    return FileDataSource;
});
