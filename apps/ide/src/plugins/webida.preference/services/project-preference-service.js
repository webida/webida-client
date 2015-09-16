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
 * Preference Service for getting and setting listeners against to a "PROJECT"-scoped preference store
 *
 * @since: 15. 9. 4
 * @author: Koong Kyungmi (kyungmi.k@samsung.com)
 * @module webida.preference.service.ProjectPreferenceService
 */

define([
    'webida-lib/util/genetic',
    './preference-service',
    '../preference-manager'
], function (
    genetic,
    PreferenceService,
    preferenceManager
) {
    'use strict';
    function ProjectPreferenceService(scopeName, projectName) {
        PreferenceService.apply(this, scopeName);
        this.projectName = projectName;
    }

    genetic.inherits(ProjectPreferenceService, PreferenceService, {
        getValues: function (preferenceId, callback) {
            var self = this;
            preferenceManager.initialized.then(function () {
                if (callback) {
                    callback(self._getRealPreferenceValues(preferenceManager.getStore(preferenceId, self.scope, {
                        projectName: self.projectName
                    })));
                }
            });
            return self._getRealPreferenceValues(preferenceManager.getStore(preferenceId, self.scope, {
                projectName: self.projectName
            }));
        },
        setValues: function (preferenceId, values, callback) {
            var store = preferenceManager.getStore(preferenceId, self.scope, {
                projectName: self.projectName
            });
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
                        preferenceManager.flushPreference(self.scope, {projectName: self.projectName});
                        if (callback) {
                            callback();
                        }
                    }
                });
            }
        },
        setValue: function (preferenceId, key, value, callback) {
            var store = preferenceManager.getStore(preferenceId, self.scope, {
                projectName: self.projectName
            });
            store.setValue(key, value);
            store.apply(function (invalid) {
                if (invalid) {
                    if (callback) {
                        callback(invalid);
                    }
                } else {
                    preferenceManager.flushPreference(self.scope, {projectName: self.projectName});
                    if (callback) {
                        callback();
                    }
                }
            });
        }
    });

    return ProjectPreferenceService;
});
