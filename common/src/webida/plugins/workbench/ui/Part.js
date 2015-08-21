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
 * Interface
 * An ancestor of all workbench UI parts
 *
 * @see View, Editor
 * @since: 2015.06.09
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

    /**
     * @typedef {Object} ModelManager
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    var _partId = 0;

    function Part(container) {
        logger.info('new Part(' + container + ')');
        this._partId = ++_partId;
        this.flags = 0;
        this.parent = null;
        this.container = container;
        this.viewer = null;
        this.modelManager = null;
    }


    genetic.inherits(Part, EventEmitter, {

        /**
         * @param {HTMLElement} parent
         * @param {Function} callback
         * @abstract
         */
        createViewer: function(parent, callback) {
            throw new Error('createViewer(parent, callback) should be implemented by ' + this.constructor.name);
        },

        destroy: function() {
            throw new Error('destroy() should be implemented by ' + this.constructor.name);
        },

        /**
         * Convenient method to get DataSource
         * @return {DataSource}
         */
        getDataSource: function() {
            return this.getContainer().getDataSource();
        },

        getContainer: function() {
            return this.container;
        },

        /**
         * @param {Viewer} viewer
         */
        setViewer: function(viewer) {
            this.viewer = viewer;
        },

        /**
         * @return {Viewer}
         */
        getViewer: function() {
            return this.viewer;
        },

        /**
         * @param {ModelManager} modelManager
         */
        setModelManager: function(modelManager) {
            this.modelManager = modelManager;
        },

        /**
         * @return {ModelManager}
         */
        getModelManager: function() {
            return this.modelManager;
        },

        setFlag: function(/*int*/flag, /*boolean*/value) {
            if (!flag) {
                throw new Error('Invalid flag name');
            }
            if (value) {
                this.flags |= flag;
            } else {
                this.flags &= ~flag;
            }
        },

        getFlag: function(/*int*/flag) {
            return (this.flags & flag) != 0;
        },

        setParentElement: function(/*HtmlElement*/parent) {
            this.parent = parent;
        },

        getParentElement: function() {
            return this.parent;
        },

        // ----------- unknowkn ----------- //
        //TODO refactor the follwings

        show: function() {
            throw new Error('show() should be implemented by ' + this.constructor.name);
        },

        hide: function() {
            throw new Error('hide() should be implemented by ' + this.constructor.name);
        },

        focus: function() {
            throw new Error('focus() should be implemented by ' + this.constructor.name);
        },
    });

    /** @constant {number} state flag : Part created */
    Part.CREATED = 1;

    /** @constant {string} */
    Part.PROPERTY_CHANGED = 'propertyChanged';

    return Part;
});
