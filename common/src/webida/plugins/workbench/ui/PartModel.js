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
 * PartModel
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'external/eventEmitter/EventEmitter',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './DataSource'
], function(
    EventEmitter,
    genetic, 
    Logger,
    DataSource
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} ChangeRequest
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    var _partModelId = 0;

    function PartModel() {
        logger.info('new PartModel()');

        this._partModelId = ++_partModelId;
    }


    genetic.inherits(PartModel, EventEmitter, {

        /**
         * From given data, build new contents for the model.
         * @abstract
         * @param {String} data Source data to build new contents of the model.
         */
        createContents: function(data) {
            throw new Error('createContents(data) should be implemented by ' + this.constructor.name);
        },

        /**
         * @abstract
         * @param {Object} contents
         */
        setContents: function(contents) {
            throw new Error('setContents(contents) should be implemented by ' + this.constructor.name);
        },

        /**
         * @abstract
         * @return {Object}
         */
        getContents: function() {
            throw new Error('getContents() should be implemented by ' + this.constructor.name);
        },

        /**
         * @abstract
         * @param {ChangeRequest} request
         */
        update: function(request) {
            throw new Error('update(request) should be implemented by ' + this.constructor.name);
        }
    });

    /** @constant {string} */
    PartModel.CONTENTS_CREATED = 'contentsCreated';

    /** @constant {string} */
    PartModel.CONTENTS_CHANGE = 'contentsChange';

    /** @constant {string} */
    PartModel.READY = 'partModelReady';

    PartModel.toString = function() {
        return 'Model';
    };

    return PartModel;
});
