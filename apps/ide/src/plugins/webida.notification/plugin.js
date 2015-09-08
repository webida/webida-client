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
 * This plug-in check the toastr message
 *
 * @since: 2015.07.20
 * @author: minsung.jin
 */
define([
    'plugins/webida.preference/preference-service-factory',
    './notification-message'
], function (
    PreferenceFactory,
    topic
) {
    'use strict';

    var module = {};
    var preference = PreferenceFactory.get('WORKSPACE');
    preference.getValues('notification', topic.setPreferenceColor);
    preference.addFieldChangeListener('notification', topic.setPreferenceColor);

    //TODO:
    module.getDefaultPreference = function () {
        return {
            'error-color': '#db1515',
            'warn-color': '#f57003',
            'info-color': '#000000',
            'success-color': '#4072bd'
        };
    };

    return module;
});
