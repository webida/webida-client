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

    function PartContextMenu(menuItems, part) {
        logger.info('new PartContextMenu(menuItems, part)');

        this.items = {};
        this.setPart(part);
        this.setItems(this.createItems(menuItems));
    }


    genetic.inherits(PartContextMenu, Object, {

        /**
         * Creates Menu Items
         * @return {Object} viable menu items
         * @abstract
         */
        createItems: function(menuItems) {
            throw new Error('createItems(menuItems) should be implemented by ' + this.constructor.name);
        },

        /**
         * Sets context menu items
         * @param {Array} items
         */
        setItems: function(items) {
            this.items = items;
        },

        /**
         * Returns viable context menu items
         * @return {Array}
         */
        getItems: function() {
            return this.items;
        },

        /**
         * @param {Part}
         */
        setPart: function(part) {
            this.part = part;
        },

        /**
         * @return {Part}
         */
        getPart: function() {
            return this.part;
        },

        /**
         * Convenient method
         * @return {PartRegistry}
         */
        getPartRegistry: function() {
            var workbench = require('webida-lib/plugins/workbench/plugin');
            var page = workbench.getCurrentPage();
            return page.getPartRegistry();
        }
    });

    return PartContextMenu;
});
