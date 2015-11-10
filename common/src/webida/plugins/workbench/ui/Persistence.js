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

/*jshint bitwise:false*/

/**
 * Constructor
 * Persistence
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'external/eventEmitter/EventEmitter',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client'
], function (
    EventEmitter,
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

    var _persistenceId = 0;

    function Persistence(persistenceId) {
        logger.info('new Persistence(' + persistenceId + ')');

        this._persistenceId = ++_persistenceId;

        /** @type {Object} */
        this.persistenceId = persistenceId;

        /** @type {string} */
        this.contents = null;

        /** @type {number} */
        this.flags = 0;
    }


    genetic.inherits(Persistence, Object, {

        /**
         * @return {Object}
         */
        getPersistenceId: function () {
            return this.persistenceId;
        },

        /**
         * @abstract
         * @return {string}
         */
        getName: function () {
            throw new Error('getName() should be implemented by ' + this.constructor.name);
        },

        /**
         * @abstract
         * @return {string}
         */
        getExtension: function () {
            throw new Error('getExtension() should be implemented by ' + this.constructor.name);
        },

        /**
         * @param {string} contents
         */
        setContents: function (contents) {
            this.contents = contents;
        },

        /**
         * @return {string} contents
         */
        getContents: function () {
            return this.contents;
        },

        setFlag: function (/*int*/flag, /*boolean*/value) {
            if (!flag) {
                throw new Error('Invalid flag name');
            }
            if (value) {
                this.flags |= flag;
            } else {
                this.flags &= ~flag;
            }
        },

        getFlag: function (/*int*/flag) {
            return (this.flags & flag) !== 0;
        }
    });

    /** @constant {number} state flag : Read File Done */
    Persistence.READ = 1;

    return Persistence;
});
