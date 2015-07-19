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
 * Page
 *
 * @see EventEmitter, PartContainer, Part
 * @since: 2015.07.12
 * @author: hw.shim
 */

// @formatter:off
define([
	'webida-lib/util/genetic',
	'webida-lib/util/logger/logger-client',
	'./LayoutTree',
	'./PartRegistry'
], function(
	genetic, 
	Logger,
	LayoutTree,
	PartRegistry
) {
	'use strict';
// @formatter:on

    /**
     * @typedef {Object} PartRegistry
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function Page(id, name) {
        logger.info('new Page(' + id + ', ' + name + ')');

        LayoutTree.call(this, id);
        this.setName(name);

        /** @type {PartRegistry} */
        this.partRegistry = new PartRegistry();
    }


    genetic.inherits(Page, LayoutTree, {

        setName: function(name) {
            /** @type {string} */
            this.name = name;
        },

        getName: function() {
            return this.name;
        },

        /**
         * @return {PartRegistry}
         */
        getPartRegistry: function() {
            return this.partRegistry;
        }
    });

    return Page;
});
