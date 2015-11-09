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
 * DataSourceRegistry
 *
 * @see DataSource, Workbench, PartContainer, Part
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
	'external/eventEmitter/EventEmitter',
	'webida-lib/util/genetic',
	'webida-lib/util/logger/logger-client',
	'./DataSource'
], function (
	EventEmitter,
	genetic, 
	Logger,
	DataSource
) {
	'use strict';
// @formatter:on

    /**
     * @typedef {Object.<Object, Object>} Map
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function DataSourceRegistry() {
        logger.info('new DataSourceRegistry()');

        /** @type {Array.<DataSource>} */
        this.dataSources = [];
    }


    genetic.inherits(DataSourceRegistry, EventEmitter, {

        /**
         * @param {DataSource} dataSource
         */
        register: function (dataSource) {
            if (!(dataSource instanceof DataSource)) {
                throw new Error('dataSource should implement DataSource interface');
            }
            var ds = this.getDataSources();
            for (var i = 0; i < ds.length; i++) {
                if (ds[i].equals(dataSource) === true) {
                    logger.info(dataSource + ' already exist');
                    return false;
                }
            }
            ds.push(dataSource);
            this.emit(DataSourceRegistry.DATA_SOURCE_REGISTERED, dataSource);
        },

        /**
         * @param {DataSource} dataSource
         */
        unregister: function (dataSource) {
            var ds = this.getDataSources();
            var index = ds.indexOf(dataSource);
            if (index >= 0) {
                var removed = ds.splice(index, 1);
                this.emit(DataSourceRegistry.DATA_SOURCE_UNREGISTERED, removed);
            }
        },

        /**
         * Retrive DataSource by it's dataSourceId.
         * For the Object type dataSourceId this method compares reference.
         * @param {Object} dataSourceId
         */
        getDataSourceById: function (dataSourceId) {
            var ds = this.getDataSources();
            for (var i = 0; i < ds.length; i++) {
                if (ds[i].getId() === dataSourceId) {
                    return ds[i];
                }
            }
            return null;
        },

        /**
         * Retrive all registered DataSources
         * @return {Array}
         */
        getDataSources: function () {
            return this.dataSources;
        }
    });

    /** @type {string} */
    DataSourceRegistry.DATA_SOURCE_REGISTERED = 'dataSourceRegistered';

    /** @type {string} */
    DataSourceRegistry.DATA_SOURCE_UNREGISTERED = 'dataSourceUnregistered';

    return DataSourceRegistry;
});
