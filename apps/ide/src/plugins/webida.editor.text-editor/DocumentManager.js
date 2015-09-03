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
 * DocumentManager
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'dojo/topic',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/plugins/workbench/ui/ModelManager',
    'webida-lib/plugins/workbench/ui/PartModel',
    './Document'
], function(
    topic,
    genetic, 
    Logger,
    ModelManager,
    PartModel,
    Document
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     * @typedef {Object} Document
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function DocumentManager(dataSource) {
        logger.info('new DocumentManager(' + dataSource + ')');

        ModelManager.apply(this, arguments);
    }


    genetic.inherits(DocumentManager, ModelManager, {

        /**
         * Creates a Document
         *
         * @param {DocumentManager~createModelCallback} callback
         * @return {Document}
         */
        /**
         * @callback DocumentManager~createModelCallback
         * @param {Document} doc
         */
        createModel: function(callback) {
            logger.info('createModel(callback)');
            var that = this;
            var doc = new Document();
            var dataSource = this.getDataSource();
            dataSource.getData(function(data) {
                doc.setText(data);
                that.savedContents = data;
                that._execFunc(callback, doc);
                //Let's give a chance to this doc
                //that it can register READY event in advance
                //In case of synchronous getContents()
                //See FileDataSource > getContents()'s else block
                setTimeout(function() {
                    doc.emit(PartModel.READY, doc);
                });
            });
            return doc;
        },

        /**
         * Saves a PartModel to a Persistence
         *
         * @param {DocumentManager~saveModelCallback} callback
         * TODO : Consider Memento Pattern
         */
        /**
         * @callback DocumentManager~saveModelCallback
         * @param {Document} doc
         */
        saveModel: function(callback) {
            var that = this;
            var doc = this.getModel();
            var dataSource = this.getDataSource();
            dataSource.setData(doc.getText(), function(data) {
                that.savedContents = data;
                callback();
            });
        },

        /**
         * Resets the given document to its last saved state.
         */
        resetModel: function() {
            var doc = this.getModel();
            doc.setText(this.savedContents);
        },

        /**
         * Returns whether the PartModel can be saved or not.
         * This method compares between the Document's text
         * and Persistence(File)'s contents
         */
        canSaveModel: function() {
            if (this.getModel()) {
                var doc = this.getModel();
                var dataSource = this.getDataSource();
                var persistence = dataSource.getPersistence();
                if (doc.getText() === persistence.getContents()) {
                    return false;
                } else {
                    return true;
                }
            } else {
                return false;
            }
        },

        /**
         * @param {string} contents
         * @param {Object} caller
         */
        setContents: function(contents, caller) {
            var doc = this.getModel();
            if (contents !== doc.getText()) {
                doc.setContents(contents, caller);
            }
        },

        getContents: function() {
            var doc = this.getModel();
            if (doc) {
                return doc.getText();
            } else {
                throw new Error('Document has not been set yet');
            }
        },

        /**
         * Returns constructor for PartModel
         *
         * @return {Function} Document
         */
        getModelClass: function() {
            return Document;
        }
    });

    return DocumentManager;
});
