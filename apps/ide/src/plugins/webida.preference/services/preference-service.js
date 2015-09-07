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
 *
 * @since: 15. 9. 4
 * @author: Koong Kyungmi (kyungmi.k@samsung.com)
 */

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
 *
 * @since: 15. 8. 19
 * @author: Koong Kyungmi (kyungmi.k@samsung.com)
 */

define([
    '../preference-manager'
], function (
    preferenceManager
) {
    'use strict';

    var SCOPE = preferenceManager.SCOPE;
    var instances = {};

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

    PreferenceService.prototype.addFieldChangeListener = function (preferenceId, listener) {
        if (!this.valueChangeListeners[preferenceId]) {
            this.valueChangeListeners[preferenceId] = [];
        }
        if (this.valueChangeListeners[preferenceId].indexOf(listener) === -1) {
            this.valueChangeListeners[preferenceId].push(listener);
        }
    };

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

    PreferenceService.prototype.getValues = function (preferenceId, callback) {
        var self = this;
        preferenceManager.initialized.then(function () {
            if (callback) {
                callback(self._getRealPreferenceValues(preferenceManager.getStore(preferenceId, self.scope)));
            }
        });
        return self._getRealPreferenceValues(preferenceManager.getStore(preferenceId, self.scope));
    };

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
