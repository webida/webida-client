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
    'external/eventEmitter/EventEmitter',
    'external/lodash/lodash.min',
    'webida-lib/util/genetic'
], function (
    EventEmitter,
    _,
    genetic
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
        };
        this.invalidMessage = '';

        this.defaultValues = {};
        this.appliedValues = {};
        this.currentValues = {};

        this.validator = function (/*key, value*/) {
            return;
        };
    }

    function getRealChangedValues(original, delta) {
        var changed = {};
        for (var key in delta) {
            if (delta.hasOwnProperty(key)) {
                if (delta[key] !== original[key]) {
                    changed[key] = delta[key];
                }
            }
        }
        return changed;
    }

    genetic.inherits(PreferenceStore, EventEmitter, {

        initialValues: function (defaultValues, appliedValues) {
            this.defaultValues = defaultValues;
            this.appliedValues = appliedValues;
            this.currentValues = _.clone(this.appliedValues, true);
            if (Object.keys(this.appliedValues).length > 0) {
                this.setOverride(true, true);
            }
        },

        /**
         * Set current preference value
         * @param {string} key - preference key
         * @param value if it is null or undefined, the preference value of this key will be removed.
         */
        setValue: function (key, value) {
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
                this.setStatus({dirty: dirty, valid: valid, override: true});
            }
        },

        getValue: function (key) {
            return (this.currentValues[key] !== undefined) ? this.currentValues[key] : this.defaultValues[key];
        },

        getRealValues: function () {
            return _.extend({}, this.defaultValues, this.appliedValues);
        },

        setValidator: function (validator) {
            if (validator) {
                this.validator = validator;
            }
        },

        apply: function (callback) {
            if (this.status.dirty && this.status.valid) {
                this.appliedValues = _.clone(this.currentValues, true);
                this.setStatus({dirty: false});
                this.emit(PreferenceStore.VALUE_CHANGED, this);
                return callback(null, this.appliedValues);
            } else {
                return callback(this.invalidMessage);
            }
        },

        setStatus: function (status) {
            // status ['dirty', 'valid', 'override']
            var changedStatus = getRealChangedValues(this.status, status);
            _.extend(this.status, changedStatus);
            if (this.status.valid) {
                this.invalidMessage = '';
            }
            if (Object.keys(changedStatus).length > 0) {
                this.emit(PreferenceStore.STATUS_CHANGED, changedStatus);
            }
        },

        restore: function () {
            this.appliedValues = {};
            this.currentValues = {};
            this.setOverride(false);
            this.setStatus({dirty: false, valid: true});
            this.emit(PreferenceStore.VALUE_CHANGED, this);
        },

        /**
         * set override option
         * @param {boolean} override - override set or not
         */
        setOverride: function (override, initialize) {
            if (override !== this.status.override) {
                if (override) {
                    this.currentValues = _.clone(this.getRealValues(), true);
                } else {
                    this.currentValues = {};
                }
                this.setStatus({override: override, dirty: !initialize, valid: true});
            }
        }

    });

    PreferenceStore.VALUE_CHANGED = 'preferenceStoreValueChanged';
    PreferenceStore.STATUS_CHANGED = 'preferenceStoreStatusChanged';

    return PreferenceStore;
});
