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
 * PartModelManager
 *
 * PartModelManager connects a Data to a PartModel.
 * It creates a PartModel from a Data.
 * And it deals with saving PartModel to the Data's Persistence.
 *
 * @see
 * @since: 2015.09.03
 * @author: hw.shim
 */

// @formatter:off
define([
    'external/eventEmitter/EventEmitter',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './DataSource',
    './FlagSupport'
], function(
    EventEmitter,
    genetic, 
    Logger,
    DataSource,
    FlagSupport
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} PartModel
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function PartModelManager() {
        logger.info('new PartModelManager()');

        /** @type {PartModel} */
        this.model = null;

        /** @type {function} */
        this.ModelClass = null;
    }


    genetic.inherits(PartModelManager, FlagSupport, {

        /**
         * Creates a PartModel
         */
        createModel: function() {
            throw new Error('createModel() should be implemented by ' + this.constructor.name);
        },

        /**
         * Reset a PartModel to an initial state.
         */
        resetModel: function() {
            throw new Error('resetModel() should be implemented by ' + this.constructor.name);
        },

        /**
         * Set Model's Constructor
         * @param {Function} ModelClass
         */
        setModelClass: function(ModelClass) {
            this.ModelClass = ModelClass;
        },

        /**
         * Returns constructor for PartModel
         * @return {Function}
         */
        getModelClass: function() {
            return this.ModelClass;
        },

        /**
         * @param {PartModel} model
         */
        setModel: function(model) {
            this.model = model;
        },

        /**
         * @return {PartModel}
         */
        getModel: function() {
            return this.model;
        },

        /**
         * @param {Object} data
         */
        setSavedData: function(data) {
            logger.info('setSavedData(' + data + ')');
            this.savedData = data;
        },

        /**
         * @return {Object}
         */
        getSavedData: function() {
            return this.savedData;
        },

        /**
         * @private
         */
        _execFunc: function(callback, param) {
            if ( typeof callback === 'function') {
                callback(param);
            }
        }
    });

    return PartModelManager;
});
