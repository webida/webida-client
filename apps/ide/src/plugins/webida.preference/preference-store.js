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
 * @file The value stores by its preference key
 * @since 1.4.0
 * @author kyungmi.k@samsung.com
 * @module Preference/Store
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

    /**
     * @typedef {Object} status
     * @property {boolean} [dirty] - Is there any changes on this store.
     * @property {boolean} [valid] - validity of values
     * @property {boolean} [override] - Whether override (or specify) the preference values of the higher level scope
     *      or not
     * @memberof module:Preference/Store
     */

    /**
     * Preference store
     * @param {string} id - preference id
     * @param {Object} scope - scope object
     * @param {Object} scopeInfo - additional scope object
     * @param {string} targetFile - path to the target preference file
     * @constructor
     */
    function PreferenceStore(id, scope, scopeInfo, targetFile) {
        /**
         * @member {string}
         */
        this.id = id;
        /**
         * @member {Object}
         */
        this.scope = scope;
        /**
         * @member {Object}
         */
        this.scopeInfo = scopeInfo;
        /**
         * @member {string}
         */
        this.targetFile = targetFile;
        /**
         * @member {module:Preference/Store.status}
         */
        this.status = {
            dirty: false,
            valid: true,
            override: false
        };
        /**
         * Invalidate message from validator
         * @member {string}
         * @see module:Preference/Store#validator
         */
        this.invalidMessage = '';
        /**
         * Default values for this store
         * It has already set by configuration(plugin.json).
         * When values of this store are reverted, this object will override the {@link currentValues}
         * and {@link appliedValues} object.
         * @member {Object}
         */
        this.defaultValues = {};
        /**
         * Values that are applied to IDE and saved in the target file
         * @member {Object}
         */
        this.appliedValues = {};
        /**
         * The values in changing by a user
         * Initially, this object is same with the {@link appliedValues}.
         * @member {Object}
         */
        this.currentValues = {};
        /**
         * Validator for this store values
         * @param {string} [key] - preference key
         * @param {Object} [value] - preference value
         * @return {?string} - If there is an error, this return value will be a validation error message.
         * @see module:Preference/Store#setValidator
         */
        this.validator = function (/*key, value*/) {
            return;
        };
    }

    /**
     * Extract only changed values
     * @param {Object} original - original object
     * @param {Object} delta - changed object
     * @return {Object}
     */
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
        /**
         * Initialize store's values by its default values and already applied values
         * @param {Object} defaultValues
         * @param {Object} appliedValues
         */
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
         * @param {Object} value - if it is null or undefined, the preference value of this key will be removed.
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

        /**
         * Get current preference value by preference key
         * @param {string} key - preference key
         * @return {Object}
         */
        getValue: function (key) {
            return (this.currentValues[key] !== undefined) ? this.currentValues[key] : this.defaultValues[key];
        },

        /**
         * Get All preference values of this store
         * @todo It would be better to be renamed 'getValues'.
         */
        getRealValues: function () {
            return _.extend({}, this.defaultValues, this.appliedValues);
        },

        /**
         * Replace default validator
         * @param {Function} validator
         */
        setValidator: function (validator) {
            if (validator) {
                this.validator = validator;
            }
        },

        /**
         * Check dirtiness and validity and apply current values
         * @param {errorCallback} callback
         */
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

        /**
         * Set current status
         * @param {module:Preference/Store.status} status - sub-set of status to be updated
         */
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

        /**
         * Revert changes on this store
         */
        restore: function () {
            this.appliedValues = {};
            this.currentValues = {};
            this.setOverride(false);
            this.setStatus({dirty: false, valid: true});
            this.emit(PreferenceStore.VALUE_CHANGED, this);
        },

        /**
         * Undo changes from the last appliedValues
         */
        undoChanges: function () {
            this.initialValues(this.defaultValues, this.appliedValues);
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

    /**
     * Event name for notifying changes on values of preference store
     * @constant {string}
     */
    PreferenceStore.VALUE_CHANGED = 'preferenceStoreValueChanged';
    /**
     * Event name for notifying changes on status of preference store
     * @constant {string}
     */
    PreferenceStore.STATUS_CHANGED = 'preferenceStoreStatusChanged';

    return PreferenceStore;
});
