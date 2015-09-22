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
 * PartModelEvent
 *
 * @see
 * @since: 2015.09.21
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

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function PartModelEvent() {
        logger.info('new PartModelEvent()');
    }


    genetic.inherits(PartModelEvent, Object, {

        /**
         * @param {Object} delta
         */
        setDelta: function(delta) {
            this.delta = delta;
        },

        /**
         * @return {Object}
         */
        getDelta: function() {
            return this.delta;
        },

        /**
         * @param {Object} contents
         */
        setContents: function(contents) {
            this.contents = contents;
        },

        /**
         * @return {Object}
         */
        getContents: function() {
            return this.contents;
        }
    });

    return PartModelEvent;
});
