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
 * PartModelProvider
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'external/eventEmitter/EventEmitter',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './DataSource',
    './PartModel'
], function(
    EventEmitter,
    genetic, 
    Logger,
    DataSource,
    PartModel
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     * @typedef {Object} PartModel
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function PartModelProvider() {
        logger.info('new PartModelProvider()');

        /** @type {Map.<DataSource, {Map.<Function, PartModel>}>} */
        this.modelRegistry = new Map();
    }


    genetic.inherits(PartModelProvider, Object, {

        /**
         * @private
         * @return {Map.<DataSource, {Map.<Function, PartModel>}>}
         */
        _getModelRegistry: function() {
            return this.modelRegistry;
        },

        _getModelsByDataSource: function(dataSource) {
            return this._getModelRegistry().get(dataSource);
        },

        /**
         * Retrive a PartModel from modelRegistry with
         * given dataSource and PartModel's constructor
         *
         * @param {DataSource} dataSource
         * @param {Function} PartModelClass
         * @return {PartModel}
         */
        getPartModel: function(dataSource, PartModelClass) {
            logger.info('getPartModel(' + dataSource + ', ' + PartModelClass.name + ')');
            var modelsOfDs = this._getModelsByDataSource(dataSource);
            if (modelsOfDs) {
                return modelsOfDs.get(PartModelClass);
            }
        },

        /**
         * Register PartModel to the modelRegistry.
         *
         * @param {DataSource} dataSource
         * @param {PartModel} model
         */
        register: function(dataSource, model) {
            logger.info('register(' + dataSource + ', ' + model + ')');
            if (!( model instanceof PartModel)) {
                throw new Error('model should implement PartModel interface');
            }
            var reg = this._getModelRegistry();
            if (reg.has(dataSource) === false) {
                reg.set(dataSource, new Map());
            }
            reg.get(dataSource).set(model.constructor, model);
        }
    });

    return PartModelProvider;
});
