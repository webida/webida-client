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
 * PartMenu
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

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function PartMenu(allItems, part) {
        logger.info('new PartMenu(allItems, part)');

        this.setAllItems(allItems);
        this.setPart(part);
    }


    genetic.inherits(PartMenu, Object, {

        /**
         * Creates Available Menu Items then return Thenable
         * @return {(Thenable|Object)}
         */
        getAvailableItems: function (section) {
            var method = '_getAvailable' + section + 'Items';
            if (typeof this[method] === 'function') {
                return this[method]();
            } else {
                return {};
            }
        },

        _getAvailableFileItems: function () {
            logger.info('_getAvailableFileItems()');
            var items = {};
            var menuItems = this.getAllItems();
            var part = this.getPart();
            var registry = this.getPartRegistry();
            var editorParts = registry.getEditorParts();
            if (part) {
                items['&Close'] = menuItems.fileMenuItems['&Close'];
                if (editorParts.length > 1) {
                    items['Cl&ose Others'] = menuItems.fileMenuItems['Cl&ose Others'];
                }
                items['C&lose All'] = menuItems.fileMenuItems['C&lose All'];
            }
            return items;
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

    return PartMenu;
});
