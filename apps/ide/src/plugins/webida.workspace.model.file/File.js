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
 * File
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
], function(
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

    function File(path) {
        logger.info('new File(' + path + ')');

        if (path.slice(-1) === '/') {
            throw new Error('Path should be end with file name');
        }

        /** @type {string} a/b/c.d.e */
        this.path = path;

        /** @type {string} c.d.e */
        this.name = path.split(/[\\/]/).pop();

        /** @type {string} c.d */
        this.basename = this.name.replace(/(.*)\.(.*)$/, "$1");

        /** @type {string} e */
        this.extension = path.indexOf('.') >= 0 ? path.split('.').pop() : '';

        /** @type {string} */
        this.contents = null;

        this.state = 0;
    }


    genetic.inherits(File, Object, {

        /**
         * @param {string} contents
         */
        setContents: function(contents) {
            return this.contents = contents;
        },

        /**
         * @return {string} contents
         */
        getContents: function() {
            return this.contents;
        },

        setFlag: function(/*int*/flag, /*boolean*/value) {
            if (!flag) {
                throw new Error('Invalid flag name');
            }
            if (value) {
                this.flags |= flag;
            } else {
                this.flags &= ~flag;
            }
        },

        getFlag: function(/*int*/flag) {
            return (this.flags & flag) != 0;
        },

        toString: function() {
        	return '<' + this.constructor.name + '>#' + this.path;
        }
    });

    /** @constant {number} state flag : Read File Done */
    File.READ = 1;

    return File;
});
