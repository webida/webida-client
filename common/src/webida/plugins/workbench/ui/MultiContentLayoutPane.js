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
 * MultiContentLayoutPane
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './LayoutPane'
], function (
    genetic, 
    Logger,
    LayoutPane
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function MultiContentLayoutPane(id, owner) {
        logger.info('new MultiContentLayoutPane(' + id + ', ' + owner + ')');
        LayoutPane.call(this, id);
        this.setOwner(owner);
    }


    genetic.inherits(MultiContentLayoutPane, LayoutPane, {

        /**
         * @param {Part} owner
         */
        setOwner: function (owner) {
            this.owner = owner;
        },

        /**
         * @return {Part}
         */
        getOwner: function () {
            return this.owner;
        }
    });

    return MultiContentLayoutPane;
});
