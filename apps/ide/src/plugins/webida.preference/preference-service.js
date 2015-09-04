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
    './preference-manager',
    'webida-lib/plugins/workbench/plugin'
], function (
    preferenceManager,
    workbench
) {
    'use strict';

    var module = {};
    var valueChangeListeners = {};


    function _getRealPreferenceValues(store) {
        if (store) {
            var value = store.getRealValues();
            if (!store.status.override) {
                var parent = preferenceManager.getParentStore(store);
                if (parent) {
                    value = _getRealPreferenceValues(parent);
                }
            }
            return value;
        }
    };

    function _callListener(store, values) {
        if (valueChangeListeners[store.id]) {
            for (var i = 0; i < valueChangeListeners[store.id].length; i++) {
                valueChangeListeners[store.id][i](values, {
                    scope: store.scope,
                    scopeInfo: store.scopeInfo
                });
            }
        }
    }

    preferenceManager.setValueChangeListener(function (store) {
        // FIXME by current workspace context?
        if (valueChangeListeners[store.id]) {
            var realValues = _getRealPreferenceValues(store);
            _callListener(store, realValues);
        }
    });

    module.addFieldChangeListener = function (preferenceId, listener) {
        if (!valueChangeListeners[preferenceId]) {
            valueChangeListeners[preferenceId] = [];
        }
        if (valueChangeListeners[preferenceId].indexOf(listener) === -1) {
            valueChangeListeners[preferenceId].push(listener);
        }
    };

    module.removeFieldChangeListener = function (preferenceId, listener) {
        if (valueChangeListeners[preferenceId]) {
            var index = valueChangeListeners[preferenceId].indexOf(listener);
            if (index > -1) {
                valueChangeListeners[preferenceId].splice(index, 1);
            }
        }
    };

    function _getValues(preferenceId, context) {
        // FIXME
        var stores = preferenceManager.getStoresById(preferenceId);
        var scope = preferenceManager.SCOPE.WORKSPACE;
        if (context && context.projectPath) {
            var scopeInfo = {projectName: context.projectPath.split('/')[2]};
        }
        return _getRealPreferenceValues(preferenceManager.getStore(preferenceId, scope, scopeInfo));
    }

    module.getValues = function (preferenceId, context, callback) {
        preferenceManager.initialized.then(function () {
            if (callback) {
                callback(_getValues(preferenceId, context));
            }
        });
        return _getValues(preferenceId, context);
    };

    module.getValue = function (preferenceId, key, context, callback) {
        var result = module.getValues(preferenceId, context, function (values) {
            if (callback) {
                callback(values[key]);
            }
        });
        return result[key];
    };

    return module;
});
