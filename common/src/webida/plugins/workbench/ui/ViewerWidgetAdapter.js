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

/*jshint unused:false*/

/**
 * Constructor
 * ViewerWidgetAdapter
 *
 * ViewerWidgetAdapter is an adapter for Viewer.
 * The instance of this class contains a widget.
 * Such as Codemirror, ace, .. dojo widgets, jqx widgets..
 *
 * @see
 * @since: 2015.07.22
 * @author: hw.shim
 */

// @formatter:off
define([
    'external/eventEmitter/EventEmitter',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './WidgetAdapter'
], function (
    EventEmitter,
    genetic, 
    Logger,
    WidgetAdapter
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} Map
     * @typedef {Object} Plugin
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function ViewerWidgetAdapter() {
        logger.info('new ViewerWidgetAdapter()');

        /** @type {Map.<Object, Plugin>} */
        this.plugins = new Map();
    }


    genetic.inherits(ViewerWidgetAdapter, WidgetAdapter, {

        /**
         * Installs plugin (such as code assist engine).
         * @abstract
         * @param {Object} key
         * @param {Object} plugin
         */
        installPlugin: function (key, plugin) {
            throw new Error('destroy() should be implemented by ' + this.constructor.name);
        },

        /**
         * Activate plugin
         * @abstract
         * @param {Object} key
         */
        activatePlugin: function (key) {
            throw new Error('destroy() should be implemented by ' + this.constructor.name);
        },

        /**
         * Reset all installed plugin.
         * This method calls deactive() of plugin
         * @abstract
         * @param {Object} key
         */
        resetPlugins: function () {
            throw new Error('destroy() should be implemented by ' + this.constructor.name);
        },

        /**
         * Set contents for the widget
         * @abstract
         * @param {Object} contents
         */
        setContents: function (contents) {
            throw new Error('setContents(contents) should be implemented by ' + this.constructor.name);
        },

        /**
         * Retrive contents of the widget
         * @abstract
         * @return {Object} contents
         */
        getContents: function () {
            throw new Error('getContents() should be implemented by ' + this.constructor.name);
        }
    });

    return ViewerWidgetAdapter;
});
