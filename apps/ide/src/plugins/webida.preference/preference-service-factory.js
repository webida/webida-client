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
    './services/preference-service',
    './services/project-preference-service'
], function (
    preferenceManager,
    PreferenceService,
    ProjectPreferenceService
) {
    'use strict';

    var SCOPE = preferenceManager.SCOPE;
    var instances = {};

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

    preferenceManager.setValueChangeListener(function (store) {
        var priority = SCOPE[store.scope].priority;
        var realValues = _getRealPreferenceValues(store);
        for (var scopeName in SCOPE) {
            if(SCOPE[scopeName].priority >= priority) {
                var additionalInfo;
                if (scopeName === 'PROJECT' && store.scopeInfo) {
                    additionalInfo = store.scopeInfo.projectName;
                }
                var serviceInstance = PreferenceServiceFactory.findServiceInstance(scopeName, additionalInfo);
                if (serviceInstance) {

                    serviceInstance.callListeners(store.id, realValues);
                }
            }
        }
    });

    function PreferenceServiceFactory() {}

    PreferenceServiceFactory.findServiceInstance = function (scopeName, additionalInfo) {
        if (!additionalInfo && instances[scopeName]) {
            return instances[scopeName];
        } else if (additionalInfo && instances[scopeName] && instances[scopeName][additionalInfo]) {
            return instances[scopeName][additionalInfo];
        }
    };

    PreferenceServiceFactory.get = function (scopeName, additionalInfo) {
        var instance = PreferenceServiceFactory.findServiceInstance(scopeName, additionalInfo);
        if (instance) {
           return instance;
        }

        switch(scopeName) {
            case 'USER':
            case 'WORKSPACE':
                instances[scopeName] = new PreferenceService(scopeName);
                return instances[scopeName];
                break;
            case 'PROJECT':
                instances[scopeName][additionalInfo] = new ProjectPreferenceService(scopeName, additionalInfo);
                return instances[scopeName][additionalInfo];
                break;
        }
    };

    return PreferenceServiceFactory;
});
