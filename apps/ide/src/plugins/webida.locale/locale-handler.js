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
* This file is for managing the changes of Locale in Preference.
*
* @see support locale-sensitive languages.
* @since: 2015.10.20
* @author: minsung.jin
*/

define([
    'dojo/cookie',
    'dojo/i18n!./nls/resource',
    'dojo/topic',
    'plugins/webida.preference/preference-service-factory',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
], function (
    cookie,
    i18n,
    topic,
    PreferenceServiceFactory,
    ButtonedDialog
) {
    'use strict';

    var PREFERENCE_ID = 'webidaLocale';
    var PREFERENCE_KEY = 'webida.locale:code';
    var COOKIE_ID = 'webida.locale';

    var isLocaleChanged;

    function _reloadWindow() {
        window.location.reload();
    }

    function _setCookie(value) {
        cookie(COOKIE_ID, value, { expires: Infinity});
    }

    function addLocaleChangeListener() {
        var preferenceService = PreferenceServiceFactory.get('WORKSPACE');

        var localeCode;
        preferenceService.getValue(
                PREFERENCE_ID, PREFERENCE_KEY, function (value) {
            localeCode = value;
        });

        preferenceService.addFieldChangeListener(
                PREFERENCE_ID, function (value) {
            if (localeCode !== value[PREFERENCE_KEY]) {
                isLocaleChanged = true;
                localeCode = value[PREFERENCE_KEY];
                _setCookie(value[PREFERENCE_KEY]);
            }
        });
    }

    topic.subscribe('fs.cache.file.set',
                    function (fsURL, target, reason, isModified) {
        if (isLocaleChanged && isModified) {
            isLocaleChanged = false;
            var localeDialog = new ButtonedDialog({
                title: i18n.localeIsChanged,
                buttons: [
                    {
                        caption: i18n.restart,
                        methodOnClick: 'reload'
                    },
                    {
                        caption: i18n.cancel,
                        methodOnClick: 'cancelClose'
                    }
                ],
                refocus: false,
                methodOnEnter: null,
                reload: function () {
                    _reloadWindow();
                },
                cancelClose: function () {
                    localeDialog.hide();
                },
                onHide: function () {
                    localeDialog.destroyRecursive();
                },
                dialogClass: 'buttoned-dialog-text-only'
            });

            localeDialog.setContentArea(i18n.doYouRestart);
            localeDialog.show();
        }
    });

    return {
        addLocaleChangeListener : addLocaleChangeListener
    };
});
