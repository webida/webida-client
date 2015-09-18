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
 * PartModelCommand
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client'
], function(
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

    function PartModelCommand() {
        logger.info('new PartModelCommand()');
    }


    genetic.inherits(PartModelCommand, Object, {

        /**
         * @abstract
         */
        execute: function() {
            throw new Error('execute() should be implemented by ' + this.constructor.name);
        },

        /**
         * @param {PartModel}
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
         * @param {ChangeRequest}
         */
        setRequest: function(request) {
            this.request = request;
        },

        /**
         * @return {ChangeRequest}
         */
        getRequest: function() {
            return this.request;
        }
    });

    return PartModelCommand;
});
