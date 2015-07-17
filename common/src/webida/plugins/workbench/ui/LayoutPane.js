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

// @formatter:off
define([
	'webida-lib/util/genetic',
	'webida-lib/util/logger/logger-client',
	'./LayoutTree'
], function(
	genetic, 
	Logger,
	LayoutTree
) {
	'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function LayoutPane() {
        logger.info('new LayoutPane()');

        /** @type {Map.<DataSource, {Array.<PartContainer>}>} */
        this.partContainers = new Map();
    }


    genetic.inherits(LayoutPane, LayoutTree, {

        /**
         * @param {DataSource} dataSource
         * @param {PartContainer} container
         */
        addPartContainer: function(dataSource, container) {
            var containers = this.partContainers;
            if (containers.has(dataSource) === false) {
                containers.set(dataSource, []);
            }
            if (containers.get(dataSource).indexOf(container) < 0) {
                containers.get(dataSource).push(container);
            }
            privateFn.registerDataSource(this, dataSource);
        },

        /**
         * @param {DataSource} dataSource
         * @param {PartContainer} container
         */
        rmovePartContainer: function(dataSource, container) {
            var containers = this.partContainers;
            if (containers.has(dataSource) === false) {
                return;
            }
            var index = containers.get(dataSource).indexOf(container);
            if (index > 0) {
                containers.get(dataSource).splice(index, 1);
                if (containers.get(dataSource).length === 0) {
                    containers['delete'](dataSource);
                }
            }
            if (this.getParts(dataSource).length === 0) {
                privateFn.unregisterDataSource(this, dataSource);
            }
        },

        /**
         * @return {Map.<DataSource, {Array.<PartContainer>}>} partContainers
         */
        getPartContainers: function() {
            return this.partContainers;
        },
    });

    return LayoutPane;
});
