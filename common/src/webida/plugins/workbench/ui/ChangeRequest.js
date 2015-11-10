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
 * ChangeRequest
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client'
], function (
    genetic, 
    Logger
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    logger.off();

    var _changeRequestId = 0;

    function ChangeRequest(delta) {
        //logger.info('new ChangeRequest(delta)', delta);
        this._changeRequestId = ++_changeRequestId;
        this.setDelta(delta);
    }


    genetic.inherits(ChangeRequest, Object, {

        /**
         * Sets alterations
         * @param {Object} delta
         */
        setDelta: function (delta) {
            this.delta = delta;
        },

        /**
         * Retives alterations
         * @return {Object}
         */
        getDelta: function () {
            return this.delta;
        },

        toString: function () {
            return '<' + this.constructor.name + '>#' + this._changeRequestId;
        }
    });

    return ChangeRequest;
});
