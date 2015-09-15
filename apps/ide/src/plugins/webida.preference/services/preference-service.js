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
 * Preference Service for getting and setting listeners against to a specific preference store
 *
 * @since: 15. 9. 4
 * @author: Koong Kyungmi (kyungmi.k@samsung.com)
 * @module webida.preference.service.PreferenceService
 */

define([
    '../preference-manager',
    'webida-lib/plugins/workbench/ui/promiseMap'
], function (
    preferenceManager,
    promiseMap
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
     *
     * @param preferenceId
     * @param listener
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
     *
     * @param preferenceId
     * @param listener
     */
    PreferenceService.prototype.removeFieldChangeListener = function (preferenceId, listener) {
        if (this.valueChangeListeners[preferenceId]) {
            var index = this.valueChangeListeners[preferenceId].indexOf(listener);
            if (index > -1) {
                this.valueChangeListeners[preferenceId].splice(index, 1);
            }
        }
    };

    PreferenceService.prototype.callListeners = function (preferenceId, values) {
        if (this.valueChangeListeners[preferenceId]) {
            for (var i = 0; i < this.valueChangeListeners[preferenceId].length; i++) {
                this.valueChangeListeners[preferenceId][i](values);
            }
        }
    };

    /**
     * This callback will be called after preference values set
     *
     * @callback preferenceValueCallback
     * @param {object} preference value or values
     */

    /**
     * Get all values by preference ID
     *
     * @param {string} preferenceId - preference ID
     * @param {preferenceValueCallback} callback
     * @returns {object} - return preference values even if loading is not completed
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
     * Get value by preference ID and preference field key
     *
     * @param {string} preferenceId - preference ID
     * @param {string} key - field key
     * @param {preferenceValueCallback} callback
     * @returns {object} - return preference values even if loading is not completed
     */
    PreferenceService.prototype.getValue = function (preferenceId, key, callback) {
        var result = this.getValues(preferenceId, function (values) {
            if (callback) {
                callback(values[key]);
            }
        });
        return result[key];
    };

    return PreferenceService;
});
