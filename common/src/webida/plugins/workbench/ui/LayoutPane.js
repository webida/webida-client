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
 * LayoutPane
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

/* jshint unused:false */

// @formatter:off
define([
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './LayoutTree'
], function (
    genetic, 
    Logger,
    LayoutTree
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     * @typedef {Object} PartContainer
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function LayoutPane(id) {
        logger.info('new LayoutPane(' + id + ')');

        LayoutTree.call(this, id);

        /** @type {Array.<PartContainer>} */
        this.containers = [];

        this.on(LayoutPane.CONTAINER_SELECT, function (container) {
            if (container) {
                container.onSelect();
                container.updateDirtyState();
            }
        });
    }


    genetic.inherits(LayoutPane, LayoutTree, {

        /**
         * @param {PartContainer} container
         */
        addPartContainer: function (container) {
            logger.info('addPartContainer(' + container + ')');
            var containers = this.getPartContainers();
            if (containers.indexOf(container) < 0) {
                containers.push(container);
                container.setParent(this);
            }
        },

        /**
         * @param {PartContainer} container
         */
        removePartContainer: function (container) {
            var containers = this.getPartContainers();
            var index = containers.indexOf(container);
            if (index >= 0) {
                containers.splice(index, 1);
                container.setParent(null);
            }
        },

        /**
         * @return {Array.<PartContainer>} partContainers
         */
        getPartContainers: function () {
            return this.containers;
        },

        /**
         * Get PartContainer corresponding tabIndex
         * @param {number} tabIndex
         */
        getPartContainer: function (tabIndex) {
            //TODO
        },

        /**
         * Move the order of PartContainer
         *
         * @param {PartContainer} container
         * @param {number} tabIndex
         */
        movePartContainer: function (container, tabIndex) {
            //TODO
        }
    });

    /** @constant {string} */
    LayoutPane.CONTAINER_SELECT = 'containerSelect';

    return LayoutPane;
});
