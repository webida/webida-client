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
 * WidgetAdapter
 *
 * WidgetAdapter is an adapter for Viewer.
 * The instance of this class contains a widget.
 * Such as Codemirror, ace, .. dojo widgets, jqx widgets..
 *
 * @see
 * @since: 2015.07.22
 * @author: hw.shim
 */

// @formatter:off
define([
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client'
], function(
    genetic, 
    Logger
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

    function WidgetAdapter() {
        logger.info('new WidgetAdapter()');

        /** @type {Object} */
        this.widget = null;

        /** @type {Map.<Object, Plugin>} */
        this.plugins = new Map();
    }


    genetic.inherits(WidgetAdapter, Object, {

        /**
         * Retrive widget instance.
         * For example codemirror, ace, tree viewer...
         * @return {Object}
         */
        getWidget: function() {
            return this.widget;
        },

        /**
         * Installs plugin (such as code assist engine).
         * @abstract
         * @param {Object} key
         * @param {Object} plugin
         */
        installPlugin: function(key, plugin) {
            throw new Error('destroy() should be implemented by ' + this.constructor.name);
        },

        /**
         * Activate plugin
         * @abstract
         * @param {Object} key
         */
        activatePlugin: function(key) {
            throw new Error('destroy() should be implemented by ' + this.constructor.name);
        },

        /**
         * Reset all installed plugin.
         * This method calls deactive() of plugin
         * @abstract
         * @param {Object} key
         */
        resetPlugins: function() {
            throw new Error('destroy() should be implemented by ' + this.constructor.name);
        }
    });

    return WidgetAdapter;
});
