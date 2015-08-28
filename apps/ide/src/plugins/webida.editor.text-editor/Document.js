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
    'webida-lib/plugins/workbench/ui/PartModel',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client'
], function(
    PartModel,
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

        PartModel.call(this, text);

        this.text = '';

        if ( typeof text === 'undefined' || text === null) {
            text = '';
        }
        if ( typeof text === 'object') {
            text = text.toString();
        }

        this.setContents(text);
    }


    genetic.inherits(Document, PartModel, {

        /**
         * @param {string} text
         * @param {Viewer} [viewer]
         */
        setContents: function(text, viewer) {
            var old = this.text;
            this.text = text;
            if (old !== text) {
                this.emit(PartModel.CONTENTS_CHANGE, this, viewer);
            }
        },

        /**
         * @return {string}
         */
        getContents: function() {
            return this.text;
        },

        /**
         * Alias for setContents with respect to Document
         * @param {string} text
         * @param {Viewer} [viewer]
         */
        setText: function(text, viewer) {
            this.setContents(text, viewer);
        },

        /**
         * Alias for setContents with respect to Document
         * @return {string}
         */
        getText: function() {
            return this.getContents();
        },

        /**
         * @return {number}
         */
        getLength: function() {
            return this.getText().length;
        },

        /**
         * @return {string}
         */
        getCharAt: function(position) {
            return this.getText().charAt(position);
        },

        /**
         * @return {number}
         */
        getNumberOfLines: function() {
            return this.getText().split(/\r\n|\r|\n/).length;
        },

        toString: function() {
            var suffix = '';
            var res = '<' + this.constructor.name + '>#' + this._partModelId;
            if (this.getText()) {
                if (this.getLength() > 10) {
                    suffix = '...';
                }
                res += '(' + this.text.substr(0, 10) + suffix + ')';
            }
            return res;
        }
    });

    return Document;
});
