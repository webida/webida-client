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
 * Viewer
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
     * @typedef {Object} HTMLElement
     * @typedef {Object} PartModel
     * @typedef {Object} WidgetAdapter
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    var _viewerId = 0;

    function Viewer() {
        logger.info('new Viewer()');
        this._viewerId = ++_viewerId;

        /** @type {HTMLElement} */
        this.parentNode = null

        /** @type {WidgetAdapter} */
        this.adapter = null;
    }


    genetic.inherits(Viewer, EventEmitter, {

        /**
         * @param {HTMLElement} parentNode
         *
         * @abstract
         */
        createAdapter: function(parentNode) {
            throw new Error('createAdapter(parentNode) should be implemented by ' + this.constructor.name);
        },

        /**
         * Destroy WidgetAdapter for this View.
         * You can clean up the registered events here.
         *
         * @abstract
         */
        destroyAdapter: function() {
            throw new Error('destroyAdapter() should be implemented by ' + this.constructor.name);
        },

        /**
         * @param {WidgetAdapter} adapter
         */
        setAdapter: function(adapter) {
            this.adapter = adapter;
        },

        /**
         * @return {WidgetAdapter}
         */
        getAdapter: function() {
            return this.adapter;
        },

        /**
         * Renders WidgetAdapter with delta
         *
         * @param {Object} delta
         * @abstract
         */
        render: function(delta) {
            throw new Error('render(delta) should be implemented by ' + this.constructor.name);
        },

        /**
         * Refreshes all of the view with contents
         *
         * @param {Object} contents
         * @abstract
         */
        refresh: function(contents) {
            throw new Error('refresh(contents) should be implemented by ' + this.constructor.name);
        },

        /**
         * @param {HTMLElement} element
         */
        setParentNode: function(element) {
            //TODO remove this.elem
            this.elem = element;
            this.parentNode = element;
        },

        /**
         * @return {HTMLElement}
         */
        getParentNode: function() {
            return this.parentNode;
        },

        /**
         * Set viewer widget's size
         *
         * @param {number} width
         * @param {number} height
         * @abstract
         */
        setSize: function(width, height) {
            throw new Error('setSize(width, height) should be implemented by ' + this.constructor.name);
        },

        /**
         * get viewer widget's size
         *
         * @return {Object}
         * @abstract
         */
        getSize: function() {
            throw new Error('getSize() should be implemented by ' + this.constructor.name);
        },

        /**
         * Updates widget size according to the parent of the widget
         *
         * @abstract
         */
        fitSize: function() {
            throw new Error('fitSize() should be implemented by ' + this.constructor.name);
        },

        toString: function() {
            var res = '<' + this.constructor.name + '>#' + this._viewerId;
            return res;
        }
    });

    /** @constant {string} */
    Viewer.CONTENT_CHANGE = 'contentChange';

    /**
     *
     * @constant {string}
     */
    Viewer.READY = 'viewerReady';

    Viewer.toString = function() {
        return 'Viewer';
    };

    return Viewer;
});
