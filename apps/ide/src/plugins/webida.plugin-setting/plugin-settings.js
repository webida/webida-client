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
 * @file plugin-manager's API wrapper for this plugin
 * @since 1.5.0
 * @author kyungmi.k@samsung.com
 */

define([
    'external/lodash/lodash.min',
    'webida-lib/plugin-manager-0.1'
], function (
    _,
    pluginManager
) {
    'use strict';

    /**
     * @callback errorCallback
     * @param {(Error|String)} [error]
     */

    /**
     * @type {Array}
     * Plugin list for caching and update in real time.
     */
    var plugins;

    /**
     * module main
     * @type {Object}
     */
    var mod = {
        /**
         * Get all plugins
         * @return {Array}
         * @see {plugin-manager-0.1#getAllPluginSettings}
         */
        getPluginSettings: function () {
            if (!plugins) {
                plugins = _.values(pluginManager.getAllPluginSettings());
            }
            return plugins;
        },
        /**
         * Save user specific plugin settings to the file(plugin-settings.json)
         * @param {Array.<string>} disabledPlugins - list of the plugin locations to set disabled
         * @param {errorCallback} callback
         * @see {plugin-manager-0.1#setUserPluginSettings}
         */
        saveUserPluginSettings: function (disabledPlugins, callback) {
            _.forEach(plugins, function (plugin) {
                plugin.disabled = (disabledPlugins.indexOf(plugin.loc) > -1);
            });
            pluginManager.setUserPluginSettings('disabled-plugins', disabledPlugins, callback);
        }
    };
    return mod;
});