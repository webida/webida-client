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
 * ModelManager
 *
 * ModelManager connects a DataSource to a PartModel.
 * It creates a PartModel from a DataSource.
 * And it deals with saving PartModel to DataSource's Persistence.
 *
 * @see
 * @since: 2015.08.16
 * @author: hw.shim
 */

// @formatter:off
define([
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/plugins/workbench/plugin',
    './PartModel'
], function(
    genetic, 
    Logger,
    workbench,
    PartModel
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

    function ModelManager(dataSource) {
        logger.info('new ModelManager(' + dataSource + ')');

        /** @type {PartModel} */
        this.model = null;

        /** @type {Object} */
        this.savedContents = null;

        this.setDataSource(dataSource);
    }


    genetic.inherits(ModelManager, Object, {

        /**
         * Creates a PartModel
         */
        createModel: function(dataSource) {
            throw new Error('createModel(dataSource) should be implemented by ' + this.constructor.name);
        },

        /**
         * Saves a PartModel to a Persistence
         */
        saveModel: function() {
            throw new Error('saveModel() should be implemented by ' + this.constructor.name);
        },

        /**
         * Reset a PartModel to an initial state.
         */
        resetModel: function() {
            throw new Error('resetModel() should be implemented by ' + this.constructor.name);
        },

        /**
         * Returns whether the PartModel can be saved or not.
         */
        canSaveModel: function() {
            throw new Error('canSaveModel() should be implemented by ' + this.constructor.name);
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
         * @param {DataSource} dataSource
         */
        setDataSource: function(dataSource) {
            this.dataSource = dataSource;
        },

        /**
         * @return {DataSource}
         */
        getDataSource: function() {
            return this.dataSource;
        },

        /**
         * Retrive Synchronized PartModel for the assigned dataSource
         * from PartModelProvider. If not exists this method
         * creates a new PartModel and register it to the PartModelProvider.
         *
         * @param {DocumentManager~getSynchronizedModel} callback
         * @return {Document}
         */
        /**
         * @callback DocumentManager~getSynchronizedModel
         * @param {Document} doc
         */
        getSynchronizedModel: function(callback) {
            logger.info('getSynchronizedModel(callback)');
            var provider = workbench.getPartModelProvider();
            var model = provider.getPartModel(this.getDataSource(), this.getModelClass());
            logger.info('model --> ', model);
            if (!!model) {
                this._execFunc(callback, model);
                //Let's give a chance to this doc
                //that it can register READY event in advance
                //In case of synchronous getContents()
                //See FileDataSource > getContents()'s else block
                setTimeout(function() {
                    model.emit(PartModel.READY, model);
                });
            } else {
                model = this.createModel(callback);
                provider.register(this.getDataSource(), model);
            }
            this.setModel(model);
            return model;
        },

        /**
         * Returns constructor for PartModel
         * @abstract
         */
        getModelClass: function() {
            throw new Error('getModelClass() should be implemented by ' + this.constructor.name);
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

    return ModelManager;
});
