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
 * TabPartContainer
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './PartContainer'
], function(
    genetic, 
    Logger,
    PartContainer
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} HTMLElement
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function TabPartContainer(dataSource) {
        logger.info('new TabPartContainer(' + dataSource + ')');

        /** @type {Object} tabWidget */
        this.tabWidget = null

        PartContainer.call(this, dataSource);

        this.createTabWidget();
    }


    genetic.inherits(TabPartContainer, PartContainer, {

        /**
         * Explain
         * @param {}
         * @return {Array}
         */
        createTabWidget: function() {
        	logger.info('createTabWidget()');
            //TODO
        },

        /**
         * @return {Object} tabWidget
         */
        getTabWidget: function() {
            return this.tabWidget;
        },

        /**
         * Explain
         * @return {HTMLElement}
         */
        getInnerElement: function() {
            //TODO
        },

        /**
         * Explain
         * @return {HTMLElement}
         */
        getOuterElement: function() {
            //TODO
        }
    });

    return TabPartContainer;
});
