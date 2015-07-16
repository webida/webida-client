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
 * PartRegistry
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
	'./DataSource',
	'./Part'
], function(
	EventEmitter,
	genetic, 
	Logger,
	DataSource,
	Part
) {
	'use strict';
// @formatter:on

    /**
     * @typedef {Object.<Object, Object>} Map
     * @typedef {Object} Part
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function PartRegistry() {
        logger.info('new PartRegistry()');

        /** @type {Map.<DataSource, {Array.<Part>}>} */
        this.parts = new Map();

        /** @type {Map.<DataSource, {Map.<Function, Part>}>} */
        this.recentParts = new Map();
    }


    genetic.inherits(PartRegistry, EventEmitter, {

        /**
         * @param {DataSource} dataSource
         * @param {Part} part
         */
        registerPart: function(part) {
            if (!( part instanceof Part)) {
                throw new Error('part should implement Part interface');
            }
            var dataSource = part.getContainer().getDataSource();
            var parts = this.getParts();
            if (parts.has(dataSource) === false) {
                parts.set(dataSource, []);
            }
            parts.get(dataSource).push(part);
            this.emit(DataSourceRegistry.PART_REGISTERED, part);
        },

        /**
         * @param {Part} part
         */
        unregisterPart: function(part) {
            var dataSource = part.getContainer().getDataSource();
            var parts = this.getParts();
            if (parts.has(dataSource) === true) {
                var partsOfDs = parts.get(dataSource);
                var index = partsOfDs.indexOf(part);
                partsOfDs.splice(index, 1);
                if (partsOfDs.length === 0) {
                    parts['delete'](dataSource);
                }
                this.emit(DataSourceRegistry.PART_REGISTERED, part);
            }
        },

        /**
         * @param {DataSource} dataSource
         * @return {Array} Parts related to the specified dataSource.
         * If not found returns undefined.
         */
        getPartsByDataSource: function(dataSource) {
            return this.getParts().get(dataSource);
        },

        /**
         * @param {DataSource} dataSource
         * @param {Function} PartClass
         * @return {Array} Parts with DataSource and PartClass
         */
        getPartsByClass: function(dataSource, PartClass) {
            var partsOfDs = this.getPartsByDataSource(dataSource);
            var result = [];
            if (partsOfDs) {
                partsOfDs.forEach(function(value) {
                    if ( value instanceof PartClass) {
                        result.push(value);
                    }
                });
            }
            return result;
        },

        setRecentPart: function(part) {
            var dataSource = part.getContainer().getDataSource();
            if (this.recentParts.has(dataSource)) {
                this.recentParts.get(dataSource).set(part.constructor, part);
            }
        },

        /**
         * @param {DataSource} dataSource
         * @param {Function} PartClass
         * @return {Part} Recently opened Part with given DataSource and
         * PartClass. If not found returns undefined.
         */
        getRecentPart: function(dataSource, PartClass) {
            if (this.recentParts.has(dataSource)) {
                var partsOfDs = this.recentParts.get(dataSource);
                return partsOfDs.get(PartClass);
            }
        },

        /**
         * @return {Map.<DataSource, {Array.<Part>}>} PartMap
         */
        getParts: function() {
            return this.parts;
        }
    });

    /** @type {string} */
    PartRegistry.PART_REGISTERED = 'partRegistered';

    /** @type {string} */
    PartRegistry.PART_UNREGISTERED = 'partUnregistered';

    return PartRegistry;
});
