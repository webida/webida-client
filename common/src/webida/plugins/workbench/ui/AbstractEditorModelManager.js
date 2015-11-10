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

/*jshint unused:false*/

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
    './PartModelManager',
    './partModelProvider',
    './Persistence'
], function (
    workbench,
    genetic, 
    Logger,
    PartModel,
    PartModelManager,
    partModelProvider,
    Persistence
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
     */
    function AbstractEditorModelManager(dataSource) {
        logger.info('new AbstractEditorModelManager(' + dataSource + ')');
        this.setDataSource(dataSource);
    }


    genetic.inherits(AbstractEditorModelManager, PartModelManager, {

        /**
         * Saves a EditorModel to a Persistence
         */
        saveModel: function () {
            throw new Error('saveModel() should be implemented by ' + this.constructor.name);
        },

        /**
         * Returns whether the EditorModel can be saved or not.
         * @return {boolean}
         */
        canSaveModel: function () {
            throw new Error('canSaveModel() should be implemented by ' + this.constructor.name);
        },

        /**
         * Resets the given EditorModel to its last saved state.
         */
        resetModel: function () {
            throw new Error('resetModel() should be implemented by ' + this.constructor.name);
        },

        /**
         * Synchronizes to other PartModel
         * Any ModelManager which want to synchronize with other model
         * should implement this method. (syncFrom() also)
         *
         * @param {EditorModel} otherModel
         * @param {PartModelEvent} modelEvent
         */
        syncTo: function (otherModel, modelEvent) {
            throw new Error('syncTo(otherModel, modelEvent) should be implemented by ' + this.constructor.name);
        },

        /**
         * Synchronizes from other PartModel
         * Any ModelManager which want to synchronize with other model
         * should implement this method. (syncTo() also)
         *
         * @param {EditorModel} otherModel
         * @param {PartModelEvent} modelEvent
         */
        syncFrom: function (otherModel, modelEvent) {
            throw new Error('syncFrom(otherModel, modelEvent) should be implemented by ' + this.constructor.name);
        },

        /**
         * Creates a EditorModel
         *
         * @param {Function} ModelClass
         * @param {editorModelManager~createModelCallback} callback
         * @return {EditorModel}
         */
        /**
         * @callback editorModelManager~createModelCallback
         * @param {EditorModel} model
         */
        createModel: function (ModelClass, callback) {
            logger.info('createModel(ModelClass, callback)');
            var that = this;
            var model = new ModelClass();
            this.setModel(model);
            this.getDataSource().getData(function (data) {
                model.createContents(data);
                that._execFunc(callback, model);
                model.emitLater(PartModel.READY, model);
            });
            return model;
        },

        /**
         * Retrive Synchronized PartModel for the assigned dataSource
         * from partModelProvider. If not exists this method
         * creates a new PartModel and register it to the partModelProvider.
         *
         * @param {Function} ModelClass
         * @param {editorModelManager~getSynchronized} callback
         * @return {EditorModel}
         */
        /**
         * @callback editorModelManager~getSynchronized
         * @param {EditorModel} model
         */
        getSynchronized: function (ModelClass, callback) {
            logger.info('getSynchronized(' + ModelClass.name + ', callback)');
            var that = this;
            var dataSource = this.getDataSource();
            var persistence = dataSource.getPersistence();
            var model = partModelProvider.getPartModel(dataSource, ModelClass);
            logger.info('model --> ', model);
            if (!!model) {
                this.setModel(model);
                if (persistence.getFlag(Persistence.READ) === true) {
                    //Model and data exists
                    this._execFunc(callback, model);
                    model.emitLater(PartModel.READY, model);
                } else {
                    //Model exists but data has not been arrived yet.
                    //Case : call createModel() but still running
                    // this.getDataSource().getData()
                    //Wait until the model's READY state.
                    //When the model's data ready,
                    //1) set this ModelManager's saved data
                    //2) then execute callback.
                    model.once(PartModel.READY, function (model) {
                        that._execFunc(callback, model);
                    });
                }
            } else {
                model = this.createModel(ModelClass, callback);
                partModelProvider.register(dataSource, model);
            }
            return model;
        },

        /**
         * Synchronizes to other model.
         * The ModelManager which calls this method should
         * implement syncTo(), syncFrom() method.
         *
         * @param {Function} ModelClass
         */
        synchronize: function (ModelClass) {
            logger.info('synchronize(' + ModelClass.name + ')');
            var that = this;
            var myModel = this.getModel();
            var otherManager = new (this.constructor)(this.getDataSource());
            var otherModel = otherManager.getSynchronized(ModelClass, function (otherModel) {
                myModel.on(PartModel.CONTENTS_CHANGE, function (modelEvent) {
                    if (myModel.serialize() !== otherModel.serialize()) {
                        that.syncTo(otherModel, modelEvent);
                    }
                });
                otherModel.on(PartModel.CONTENTS_CHANGE, function (modelEvent) {
                    if (myModel.serialize() !== otherModel.serialize()) {
                        that.syncFrom(otherModel, modelEvent);
                    }
                });
            });
        },

        /**
         * @param {DataSource} dataSource
         */
        setDataSource: function (dataSource) {
            this.dataSource = dataSource;
        },

        /**
         * @return {DataSource}
         */
        getDataSource: function () {
            return this.dataSource;
        }
    });

    return AbstractEditorModelManager;
});
