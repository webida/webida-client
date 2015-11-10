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
 * FlagSupport
 *
 * @see
 * @since: 2015.09.08
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
    //logger.off();

    function FlagSupport() {
        logger.info('new FlagSupport()');
        this.flags = 0;
    }


    genetic.inherits(FlagSupport, Object, {

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

    return FlagSupport;
});
