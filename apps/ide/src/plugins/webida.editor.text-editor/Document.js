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
 * Document
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'webida-lib/plugins/workbench/ui/ViewerModel',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client'
], function(
    ViewerModel,
    genetic, 
    Logger
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function Document(text) {
        logger.info('new Document(' + text + ')');

        if ( typeof text === 'undefined' || text === null) {
            text = '';
        }
        if ( typeof text === 'object') {
            text = text.toString();
        }

        /** @type {string} */
        this.text = text;
    }


    genetic.inherits(Document, ViewerModel, {

        /**
         * @param {string} text
         */
        setText: function(text) {
            this.text = text;
        },

        /**
         * @return {string}
         */
        getText: function() {
            return this.text;
        },

        /**
         * @return {number}
         */
        getLength: function() {
            return this.text.length;
        },

        /**
         * @return {string}
         */
        getCharAt: function(position) {
            return this.text.charAt(position);
        },

        /**
         * @return {number}
         */
        getNumberOfLines: function() {
            return this.text.split(/\r\n|\r|\n/).length;
        },

        /**
         * @param {string} text
         * @param {Viewer} viewer
         */
        update: function(text, viewer) {
            this.setText(text);
            this.emit(ViewerModel.CONTENTS_CHANGE, this, viewer);
        }
    });

    return Document;
});
