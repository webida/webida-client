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
 * PartContainer
 *
 * @see Part, EditorPart, ViewPart
 * @since: 2015.07.07
 * @author: hw.shim
 */

// @formatter:off
define([
	'external/eventEmitter/EventEmitter',
	'webida-lib/util/genetic',
	'webida-lib/util/logger/logger-client'
], function(
	EventEmitter,
	genetic, 
	Logger
) {
	'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

	var _containerId = 0;

    function PartContainer() {
        logger.info('new PartContainer()');
        this._containerId = ++_containerId;
        this.dataSource = null;
    }


    genetic.inherits(PartContainer, EventEmitter, {
        /**
         * @param {aaa} bbb
         */
        xxx: function(yyy) {

        },
        /**
         * @param {aaa} bbb
         */
        xxx: function(yyy) {

        },
        /**
         * @param {aaa} bbb
         */
        xxx: function(yyy) {

        },
        /**
         * @param {aaa} bbb
         */
        xxx: function(yyy) {

        },
        /**
         * @param {aaa} bbb
         */
        xxx: function(yyy) {

        },
        /**
         * @param {aaa} bbb
         */
        xxx: function(yyy) {

        },
        /**
         * @param {aaa} bbb
         */
        xxx: function(yyy) {

        },
        /**
         * @param {DataSource} dataSource
         */
        setDataSource: function(dataSource) {

        },
    });

	/** @constant {string} */
	PartContainer.PART_CREATED = 'partCreated';
	/** @constant {string} */
	PartContainer.PART_DESTROYED = 'partDestroyed';
	/** @constant {string} */
	PartContainer.DATA_SOURCE_ADDED = 'dataSourceAdded';

    return PartContainer;
});
