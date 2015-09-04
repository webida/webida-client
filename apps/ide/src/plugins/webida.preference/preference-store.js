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
    'external/lodash/lodash.min'
], function (
    _
) {
    'use strict';

    function PreferenceStore(id, scope, scopeInfo, targetFile) {
        this.id = id;
        this.scope = scope;
        this.scopeInfo = scopeInfo;
        this.targetFile = targetFile;

        this.status = {
            dirty: false,
            valid: true,
            override: false
        }
        this.invalidMessage = {};

        this.defaultValues = {};
        this.appliedValues = {};
        this.currentValues = _.clone(this.appliedValues, true);

        this.valueChangeListener = [];  // outer (change to topic)
        this.statusChangeListener = [];  // inner (view-controller)
        this.validator = function (key, value) {
            return;
        };
    }

    function getRealChangedValues(original, delta) {
        var changed = {};
        for (var key in delta) {
            if(delta.hasOwnProperty(key)){
                if (delta[key] !== original[key]) {
                    changed[key] = delta[key];
                }
            }
        }
        return changed;
    }

    PreferenceStore.prototype.initialValues = function (defaultValues, appliedValues) {
        this.defaultValues = defaultValues;
        this.appliedValues = appliedValues;
        if (Object.keys(this.appliedValues).length > 0) {
            this.setOverride(true);
        }
    };

    /**
     * Set current preference value
     * @param {string} key - preference key
     * @param value if it is null or undefined, the preference value of this key will be removed.
     */
    PreferenceStore.prototype.setValue = function (key, value) {
        var dirty = this.status.dirty;
        var valid = this.status.valid;
        if (key !== undefined && key !== null) {
            if (value !== undefined && value !== null) {
                this.currentValues[key] = value;
            } else {
                delete this.currentValues[key];
            }
            dirty = true;
            this.invalidMessage = this.validator(key, this.currentValues[key]);
            valid = !this.invalidMessage;
            this.setStatus({dirty: dirty, valid: valid});
        }
    };

    PreferenceStore.prototype.getValue = function (key) {
        return (this.currentValues[key] !== undefined) ? this.currentValues[key] : this.defaultValues[key];
    };

    PreferenceStore.prototype.getRealValues = function () {
        return _.extend({}, this.defaultValues, this.appliedValues);
    };

    PreferenceStore.prototype.setValidator = function (validator) {
        if (validator) {
            this.validator = validator;
        }
    };

    PreferenceStore.prototype.apply = function (callback) {
        if (this.status.dirty && this.status.valid) {
            this.appliedValues = _.clone(this.currentValues, true);
            this.setStatus({dirty: false});
            for (var i=0; i<this.valueChangeListener.length; i++) {
                this.valueChangeListener[i].call(this, this.appliedValues);
            }
            return callback(null, this.appliedValues);
        } else {
            return callback(this.invalidMessage);
        }
    };

    PreferenceStore.prototype.setStatus = function (status) {
        // status ['dirty', 'valid', 'override']
        var changedStatus = getRealChangedValues(this.status, status);
        console.log('beforeSetStatus: ', this.id, this.scope, this.status, status);
        _.extend(this.status, changedStatus);
        console.log('afterSetStatus: ', this.id, this.scope, this.status);
        if (Object.keys(changedStatus).length > 0) {
            // listener
            for (var i=0; i<this.statusChangeListener.length; i++) {
                this.statusChangeListener[i].call(this, changedStatus);
            }
        }
    };

    PreferenceStore.prototype.restore = function () {
        this.appliedValues = {};
        this.currentValues = {};
        this.setOverride(false);
        this.setStatus({dirty: false, valid: true});
        for (var i=0; i<this.valueChangeListener.length; i++) {
            this.valueChangeListener[i].call(this, this.appliedValues);
        }
    };

    PreferenceStore.prototype.addValueChangeListener = function (listener) {
        if (this.valueChangeListener.indexOf(listener) === -1) {
            this.valueChangeListener.push(listener);
        }
    };

    PreferenceStore.prototype.removeValueChangeListener = function (listener) {
        this.valueChangeListener = _.remove(this.valueChangeListener, listener);
    };

    PreferenceStore.prototype.addStatusChangeListener = function (listener) {
        if (this.statusChangeListener.indexOf(listener) === -1) {
            this.statusChangeListener.push(listener);
        }
    };

    PreferenceStore.prototype.removeStatusChangeListener = function (listener) {
        this.statusChangeListener = _.remove(this.statusChangeListener, listener);
    };

    /**
     * set override option
     * @param {boolean} override - override set or not
     */
    PreferenceStore.prototype.setOverride = function (override) {
        if (override !== this.status.override) {
            if (override) {
                this.currentValues = _.clone(this.defaultValues, true);
            } else {
                this.currentValues = {};
            }
            this.setStatus({override: override, dirty: true, valid: true});
        }
    };

    return PreferenceStore;
});
