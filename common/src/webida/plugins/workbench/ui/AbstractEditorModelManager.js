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
 * editorModelManager
 *
 * AbstractEditorModelManager connects a DataSource to a EditorModel.
 * It creates a EditorModel from a DataSource.
 * And it deals with saving EditorModel to the DataSource's Persistence.
 *
 * @see
 * @since: 2015.09.03
 * @author: hw.shim
 */

// @formatter:off
define([
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './PartModel',
    './PartModelManager'
], function(
    workbench,
    genetic, 
    Logger,
    PartModel,
    PartModelManager
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    /**
     * AbstractEditorModelManager connects a DataSource to a EditorModel.
     * It creates a EditorModel from a DataSource.
     * And it deals with saving EditorModel to the DataSource's Persistence.
     *
     * @constructor
     * @param {DataSource} dataSource
     * @param {Function} ModelClass
     */
    function AbstractEditorModelManager(dataSource, ModelClass) {
        logger.info('new AbstractEditorModelManager(' + dataSource + ', ModelClass)');

        this.setDataSource(dataSource);
        this.setModelClass(ModelClass);
    }


    genetic.inherits(AbstractEditorModelManager, PartModelManager, {

        /**
         * Saves a EditorModel to a Persistence
         */
        saveModel: function() {
            throw new Error('saveModel() should be implemented by ' + this.constructor.name);
        },

        /**
         * Returns whether the EditorModel can be saved or not.
         * @return {boolean}
         */
        canSaveModel: function() {
            throw new Error('canSaveModel() should be implemented by ' + this.constructor.name);
        },

        /**
         * Resets the given EditorModel to its last saved state.
         */
        resetModel: function() {
            throw new Error('resetModel() should be implemented by ' + this.constructor.name);
        },

        /**
         * Creates a EditorModel
         *
         * @param {editorModelManager~createModelCallback} callback
         * @return {EditorModel}
         */
        /**
         * @callback editorModelManager~createModelCallback
         * @param {EditorModel} model
         */
        createModel: function(callback) {
            logger.info('createModel(callback)');
            var that = this;
            var model = new (this.getModelClass())();
            this.setModel(model);
            this.getDataSource().getData(function(data) {
                model.createContents(data);
                that.setSavedData(data);
                that._execFunc(callback, model);
                //Let's give a chance to this model
                //that it can register READY event in advance
                //in case of synchronous getData().
                //See FileDataSource > getData()'s else block.
                setTimeout(function() {
                    model.emit(PartModel.READY, model);
                });
            });
            return model;
        },

        /**
         * Retrive Synchronized PartModel for the assigned dataSource
         * from PartModelProvider. If not exists this method
         * creates a new PartModel and register it to the PartModelProvider.
         *
         * @param {editorModelManager~getSynchronizedModel} callback
         * @return {EditorModel}
         */
        /**
         * @callback editorModelManager~getSynchronizedModel
         * @param {EditorModel} model
         */
        getSynchronizedModel: function(callback) {
            logger.info('getSynchronizedModel(callback)');
            var dataSource = this.getDataSource();
            var provider = workbench.getPartModelProvider();
            var model = provider.getPartModel(dataSource, this.getModelClass());
            logger.info('model --> ', model);
            if (!!model) {
            	this.setModel(model);
                this._execFunc(callback, model);
                //See createModel
                setTimeout(function() {
                    model.emit(PartModel.READY, model);
                });
            } else {
                model = this.createModel(callback);
                provider.register(dataSource, model);
            }
            return model;
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
        }
    });

    return AbstractEditorModelManager;
});
