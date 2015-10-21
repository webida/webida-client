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
 * plugin-manager's API wrapper for this plugin
 *
 * @since: 15. 10. 19
 * @author: Koong Kyungmi (kyungmi.k@samsung.com)
 */

define([
    'external/lodash/lodash.min',
    'webida-lib/plugin-manager-0.1'
], function (
    _,
    pluginManager
) {
    'use strict';

    var plugins;    // for caching and update in real time.

    var mod = {
        getPluginSettings: function () {
            if (!plugins) {
                plugins = _.values(pluginManager.getAllPluginSettings());
            }
            return plugins;
        },
        saveUserPluginSettings: function (disabledPlugins, callback) {
            _.forEach(plugins, function (plugin) {
                plugin.disabled = (disabledPlugins.indexOf(plugin.loc) > -1);
            });
            pluginManager.setUserPluginSettings('disabled-plugins', disabledPlugins, callback);
        }
    };
    return mod;
});