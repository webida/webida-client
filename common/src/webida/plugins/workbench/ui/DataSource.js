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
 * DataSource
 *
 * @see EventEmitter, PartContainer, Part, Perspective
 * @since: 2015.07.12
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

    var _dataSourceId = 0;

    function DataSource(dataSourceId) {
        logger.info('new DataSource(' + dataSourceId + ')');
        this._dataSourceId = ++_dataSourceId;
        this.dataSourceId = dataSourceId;
    }


    genetic.inherits(DataSource, EventEmitter, {
        /**
         * @param {DataSource} dataSource
         */
        equals: function(dataSource) {
            throw new Error('equals(dataSource) should be implemented by ' + this.constructor.name);
        },
        /**
         * @return {Object}
         */
        getId: function() {
            return this.dataSourceId;
        },
        toString: function() {
            var res = '<' + this.constructor.name + '>#' + this._dataSourceId;
            return res;
        }
    });

    DataSource.CONTENT_CHANGED = 'contentChanged';

    return DataSource;
});
