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
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/plugins/workbench/ui/ModelManager',
    './Document'
], function(
    genetic, 
    Logger,
    ModelManager,
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
         */
        /**
         * @callback DocumentManager~createModelCallback
         * @param {Document} doc
         */
        createModel: function(callback) {
        	logger.info('createModel(callback)');
            var that = this;
            var dataSource = this.getDataSource();
            dataSource.getContents(function(contents) {
                that.savedContents = contents;
                //Creates a Document(Model) from a DataSource
                var doc = new Document(contents);
                that.setModel(doc);
                callback(doc);
            });
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
            dataSource.setContents(doc.getText(), function(contents) {
                that.savedContents = contents;
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
                doc.update(contents, caller);
            }
        },

        getContents: function() {
            var doc = this.getModel();
            if (doc) {
                return doc.getText();
            } else {
                throw new Error('Document has not been set yet');
            }
        }
    });

    return DocumentManager;
});
