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
 * EditorModelManager
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
    './AbstractEditorModelManager'
], function (
    EventEmitter,
    genetic, 
    Logger,
    AbstractEditorModelManager
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
     * EditorModelManager connects a DataSource to a EditorModel.
     * It creates a EditorModel from a DataSource.
     * And it deals with saving EditorModel to the DataSource's Persistence.
     *
     * @constructor
     * @param {DataSource} dataSource
     * @param {Function} ModelClass
     */
    function EditorModelManager(dataSource) {
        logger.info('new EditorModelManager(' + dataSource + ')');

        AbstractEditorModelManager.apply(this, arguments);
    }


    genetic.inherits(EditorModelManager, AbstractEditorModelManager, {

        /**
         * Saves a PartModel to a Persistence
         *
         * @param {EditorModelManager~saveModelCallback} callback
         * TODO : Consider Memento Pattern
         */
        /**
         * @callback EditorModelManager~saveModelCallback
         * @param {EditorModel} model
         */
        saveModel: function (callback) {
            if (this.canSaveModel() === true) {
                //var that = this;
                var model = this.getModel();
                var dataSource = this.getDataSource();
                dataSource.setData(model.serialize(), function () {
                    callback(model);
                });
            }
        },

        /**
         * Returns whether the EditorModel can be saved or not.
         * @return {boolean}
         */
        canSaveModel: function () {
            if (this.getModel()) {
                var model = this.getModel();
                var dataSource = this.getDataSource();
                var persistence = dataSource.getPersistence();
                if (model.serialize() === persistence.getContents()) {
                    return false;
                } else {
                    return true;
                }
            } else {
                return false;
            }
        },

        /**
         * Resets the given EditorModel to its last saved state.
         */
        resetModel: function () {
            logger.info('resetModel()');
            var model = this.getModel();
            this.getDataSource().reload(function (data) {
                model.createContents(data);
            });
        },
    });

    return EditorModelManager;
});
