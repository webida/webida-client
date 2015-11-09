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

/* jshint unused :false */

// @formatter:off
define([
	'external/eventEmitter/EventEmitter',
	'webida-lib/util/genetic',
	'webida-lib/util/logger/logger-client'
], function (
	EventEmitter,
	genetic, 
	Logger
) {
	'use strict';
// @formatter:on

    /**
     * @typedef {Object} Persistence
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    var _dataSourceId = 0;

    function DataSource(dataSourceId) {
        logger.info('new DataSource(' + dataSourceId + ')');
        this._dataSourceId = ++_dataSourceId;

        /** @type {Object} */
        this.dataSourceId = dataSourceId;

        /** @type {Persistence} */
        this.persistence = null;

        /** @type {boolean} */
        this.deleted = false;
    }


    genetic.inherits(DataSource, EventEmitter, {

        /**
         * @param {Object}
         */
        setId: function (dataSourceId) {
            if (this.dataSourceId !== dataSourceId) {
                this.emit(DataSource.ID_CHANGE, this, this.dataSourceId, dataSourceId);
            }
            this.dataSourceId = dataSourceId;
        },

        /**
         * @return {Object}
         */
        getId: function () {
            return this.dataSourceId;
        },

        /**
         * @param {Persistence}
         */
        setPersistence: function (persistence) {
            this.persistence = persistence;
        },

        /**
         * @return {Persistence}
         */
        getPersistence: function () {
            return this.persistence;
        },

        /**
         * @param {DataSource} dataSource
         */
        equals: function (dataSource) {
            throw new Error('equals(dataSource) should be implemented by ' + this.constructor.name);
        },

        /**
         * @param {Object} data
         * @param {Function} callback
         */
        setData: function (data, callback) {
            throw new Error('setData(contents, callback) should be implemented by ' + this.constructor.name);
        },

        /**
         * @param {Function} callback
         */
        getData: function (callback) {
            throw new Error('getData(callback) should be implemented by ' + this.constructor.name);
        },

        /**
         * @param {Function} callback
         */
        reload: function (callback) {
            throw new Error('reload(callback) should be implemented by ' + this.constructor.name);
        },

        /**
         * @return {string} title
         */
        getTitle: function () {
            throw new Error('getTitle() should be implemented by ' + this.constructor.name);
        },

        /**
         * @return {string} toolTip
         */
        getToolTip: function () {
            throw new Error('getToolTip() should be implemented by ' + this.constructor.name);
        },

        /**
         * @return {ImageDescriptor} imageDescriptor
         */
        getTitleImage: function () {
            throw new Error('getTitleImage() should be implemented by ' + this.constructor.name);
        },

        /**
         * @param {boolean} deleted
         */
        setDeleted: function (deleted) {
            this.deleted = !!deleted;
        },

        /**
         * @return {boolean}
         */
        isDeleted: function () {
            return this.deleted;
        },

        toString: function () {
            var res = '<' + this.constructor.name + '>#' + this._dataSourceId;
            return res;
        }
    });

    /**
     * Emit this event when DataSource's
     * getContents() starts to load the contents
     * @constant {string}
     */
    DataSource.LOAD_START = 'loadStart';

    /**
     * Emit this event when DataSource's
     * getContents() fails to load the contents
     * @constant {string}
     */
    DataSource.LOAD_FAIL = 'loadFail';

    /**
     * Emit this event when DataSource's
     * getContents() completes to load the contents
     * @constant {string}
     */
    DataSource.LOAD_COMPLETE = 'loadComplete';

    /**
     * Emit this event before DataSource's
     * setData(contents, callback) is called
     * @constant {string}
     */
    DataSource.BEFORE_SAVE = 'beforeSave';

    /**
     * Emit this event after DataSource's
     * setData(contents, callback) is called
     * @constant {string}
     */
    DataSource.AFTER_SAVE = 'afterSave';

    /**
     * Emit this event when error occured
     * during setData(contents, callback)
     * @constant {string}
     */
    DataSource.SAVE_FAIL = 'saveFail';

    /**
     * This event is emitted when setId(newId) is called
     * @constant {string}
     */
    DataSource.ID_CHANGE = 'idChange';

    return DataSource;
});
