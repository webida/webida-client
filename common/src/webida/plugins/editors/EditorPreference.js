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
 * Constructor function
 * EditorPreference set or unset fields of editor preferences
 *
 * @constructor
 * @see TextEditorPart
 * @since: 2015.06.23
 * @author: hw.shim
 *
 */

define([
    'external/lodash/lodash.min',
    'plugins/webida.preference/preference-service-factory',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client'
], function (
    _,
    PreferenceFactory,
    genetic,
    Logger
) {
    'use strict';

    var logger = new Logger();
    logger.off();

    var preferences = PreferenceFactory.get('WORKSPACE');

    function EditorPreference(watchConfigs) {
        this._watchConfigs = watchConfigs;
        this._watchers = {};
        this._initialize();
    }

    genetic.inherits(EditorPreference, Object, {
        /**
         * Initialize EditorePreference with setting initial values and register preference watchers
         * @protected
         */
        _initialize: function () {
            var that = this;
            _.forEach(this._watchConfigs, function (configs, preferenceId) {
                var watcher = function (values) {
                    that.setFields(preferenceId, values);
                };
                preferences.getValues(preferenceId, watcher);   // set initial values
                that._watchers[preferenceId] = watcher;
                preferences.addFieldChangeListener(preferenceId, watcher);
            });
        },

        /**
         * Unregister all preference watchers on destroy
         */
        destroy: function () {
            _.forEach(this._watchers, function (watcher, preferenceId) {
                preferences.removeFieldChangeListener(preferenceId, watcher);
            });
        },

        /**
         * Set all preference values using setters set in watchConfig file
         *
         * @param {string} preferenceId - preference Id to set values
         * @param {object} values - values to be set
         */
        setFields: function (preferenceId, values) {
            var that = this;
            if (that._watchConfigs[preferenceId]) {
                _.forEach(values, function (value, key) {
                    that.setField(preferenceId, key, value);
                });
            }
        },
        /**
         * Set a preference value using setter set in watchConfig file
         *
         * @param {string} preferenceId - preference id to set a value
         * @param {string} key - preference key to set a value
         * @param {object} value - value to be set
         */
        setField: function (preferenceId, key, value) {
            var setter = this._watchConfigs[preferenceId][key];
            if (setter && setter.length === 2 && setter[0] && setter[1]) {
                setter[0][setter[1]](value);
            }
        },

        /**
         * Get values by preference Id
         *
         * @param {string} preferenceId - preference id to get the value
         * @callback [callback] - callback function that will be called with the preference value.
         * @returns {object} If preferences plugin has been loaded completely at this method called,
         *      It will return the preference value. But preference plugin has not been loaded,
         *      this value will be undefined. We Recommend to use the callback.
         */
        getFields: function (preferenceId, callback) {
            return preferences.getValues(preferenceId, function (value) {
                if (callback) {
                    callback(value);
                }
            });
        }
    });

    return EditorPreference;
});
