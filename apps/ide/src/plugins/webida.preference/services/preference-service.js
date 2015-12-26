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
 * @file Preference Service for getting and setting listeners against to a specific preference store
 * @since 1.4.0
 * @author kyungmi.k@samsung.com
 * @module Preference/Service
 */

define([
    'webida-lib/plugins/workbench/ui/promiseMap',
    '../preference-manager'
], function (
    promiseMap,
    preferenceManager
) {
    'use strict';

    var SCOPE = preferenceManager.SCOPE;

    /**
     * Preference Service for scopes ("USER" and "WORKSPACE")
     * @param {string} scopeName - scope name
     * @constructor
     */
    function PreferenceService(scopeName) {
        this.scope = SCOPE[scopeName];
        this.valueChangeListeners = {};
    }

    /**
     * Get cascaded (inherited and override) values of a preference store by its scope
     * @param {module:Preference/Store} store
     * @return {Object}
     * @private
     */
    PreferenceService.prototype._getRealPreferenceValues = function (store) {
        if (store) {
            var value = store.getRealValues();
            if (!store.status.override) {
                var parent = preferenceManager.getParentStore(store);
                if (parent) {
                    value = this._getRealPreferenceValues(parent);
                }
            }
            return value;
        }
    };

    /**
     * Add a change listener for a preference id
     * @param {string} preferenceId - preference id
     * @param {Function} listener
     */
    PreferenceService.prototype.addFieldChangeListener = function (preferenceId, listener) {
        if (!this.valueChangeListeners[preferenceId]) {
            this.valueChangeListeners[preferenceId] = [];
        }
        if (this.valueChangeListeners[preferenceId].indexOf(listener) === -1) {
            this.valueChangeListeners[preferenceId].push(listener);
        }
    };

    /**
     * Remove a change listener
     * @param {string} preferenceId - preference id
     * @param {Function} listener
     */
    PreferenceService.prototype.removeFieldChangeListener = function (preferenceId, listener) {
        if (this.valueChangeListeners[preferenceId]) {
            var index = this.valueChangeListeners[preferenceId].indexOf(listener);
            if (index > -1) {
                this.valueChangeListeners[preferenceId].splice(index, 1);
            }
        }
    };

    /**
     * Call all change listeners that registered in this service.
     * @todo It is better to register listeners to the preference manager using
     * @todo    {@link module:Preference/Manager.PREFERENCE_VALUE_CHANGED} and call all listeners by itself.
     * @todo {@link module:Preference/ServiceFactory} should only do the job that create
     * @todo    {@link module:Preference/Service} object.
     * @param {string} preferenceId - preference id
     * @param {Object} values
     */
    PreferenceService.prototype.callListeners = function (preferenceId, values) {
        if (this.valueChangeListeners[preferenceId]) {
            for (var i = 0; i < this.valueChangeListeners[preferenceId].length; i++) {
                this.valueChangeListeners[preferenceId][i](values);
            }
        }
    };

    /**
     * This callback will be called after preference values set
     * @callback preferenceValueCallback
     * @param {object} preference value or values
     */

    /**
     * Get all values by preference id
     * @param {string} preferenceId - preference id
     * @param {preferenceValueCallback} callback
     * @return {object} - return preference values even if loading is not completed
     */
    PreferenceService.prototype.getValues = function (preferenceId, callback) {
        var self = this;
        promiseMap.get('preference/load').then(function () {
            if (callback) {
                callback(self._getRealPreferenceValues(preferenceManager.getStore(preferenceId, self.scope)));
            }
        });
        return self._getRealPreferenceValues(preferenceManager.getStore(preferenceId, self.scope));
    };

    /**
     * Get value by preference id and preference field key
     * @param {string} preferenceId - preference id
     * @param {string} key - field key
     * @param {preferenceValueCallback} callback
     * @return {object} - return preference values even if loading is not completed
     */
    PreferenceService.prototype.getValue = function (preferenceId, key, callback) {
        var result = this.getValues(preferenceId, function (values) {
            if (callback) {
                callback(values[key]);
            }
        });
        return result && result[key];
    };

    /**
     * Set all values on specified preference
     * @param {string} preferenceId - preference id
     * @param {Object} values
     * @param {errorCallback} [callback]
     */
    PreferenceService.prototype.setValues = function (preferenceId, values, callback) {
        var self = this;
        var store = preferenceManager.getStore(preferenceId, self.scope);
        if (values) {
            for (var key in values) {
                if (values.hasOwnProperty(key)) {
                    store.setValue(key, values[key]);
                }
            }
            store.apply(function (invalid) {
                if (invalid) {
                    if (callback) {
                        callback(invalid);
                    }
                } else {
                    preferenceManager.flushPreference(self.scope);
                    if (callback) {
                        callback();
                    }
                }
            });
        }
    };

    /**
     * Set a value by its key
     * @param preferenceId
     * @param key - preference key
     * @param value
     * @param {errorCallback} [callback]
     */
    PreferenceService.prototype.setValue = function (preferenceId, key, value, callback) {
        var self = this;
        var store = preferenceManager.getStore(preferenceId, self.scope);
        store.setValue(key, value);
        store.apply(function (invalid) {
            if (invalid) {
                if (callback) {
                    callback(invalid);
                }
            } else {
                preferenceManager.flushPreference(self.scope);
                if (callback) {
                    callback();
                }
            }
        });
    };

    return PreferenceService;
});
