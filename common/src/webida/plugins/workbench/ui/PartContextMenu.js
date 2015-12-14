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
 * PartContextMenu
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim@samsung.com
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

    /**
     * @typedef {Object} Thenable
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function PartContextMenu(allItems, part) {
        logger.info('new PartContextMenu(allItems, part)');

        this.setAllItems(allItems);
        this.setPart(part);
    }


    genetic.inherits(PartContextMenu, Object, {

        /**
         * Creates Available Menu Items then return Thenable
         * @return {Thenable}
         * @abstract
         */
        getAvailableItems: function () {
            throw new Error('getAvailableItems() should be implemented by ' + this.constructor.name);
        },

        /**
         * @param {Object}
         */
        setAllItems: function (allItems) {
            this.allItems = allItems;
        },

        /**
         * @return {Object}
         */
        getAllItems: function () {
            return this.allItems;
        },

        /**
         * @param {Part}
         */
        setPart: function (part) {
            this.part = part;
        },

        /**
         * @return {Part}
         */
        getPart: function () {
            return this.part;
        },

        /**
         * Convenient method
         * @return {PartRegistry}
         */
        getPartRegistry: function () {
            var workbench = require('webida-lib/plugins/workbench/plugin');
            var page = workbench.getCurrentPage();
            return page.getPartRegistry();
        }
    });

    return PartContextMenu;
});
