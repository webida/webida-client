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
 * Constructor function
 * CaControl abstract class
 * This should be an ancestor of all content assist control modules.
 *
 * @constructor
 * @see TernControl
 * @since: 2015.09.18
 * @author: h.m.kwom
 *
 */

// @formatter:off
define([
    'webida-lib/util/genetic',    
    'webida-lib/util/logger/logger-client',
], function(
       genetic,
        Logger
       ) {
    'use strict';
    // @formatter:on

    var logger = new Logger();
    logger.off(); 

    function CaControl() {
        logger.info('new CaControl()');

    }

    genetic.inherits(CaControl, Object, {

        /**
         * Returns whether the command is supported
         *
         * @param {string} command
         *
         * @return {boolean}
         * @abstract
         */
        canExecute: function(command) {
            throw new Error('canExecute(parentNode) should be implemented by ' + this.constructor.name);
        },

        /**
         * Execute the command
         *
         * @param {string} command
         *
         * @abstract
         */
        execCommand: function(command) {
            throw new Error('execCommand() should be implemented by ' + this.constructor.name);
        }
    });

    return CaControl;
});
