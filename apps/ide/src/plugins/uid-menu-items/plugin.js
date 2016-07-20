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
 * handlers for dropdown menu at the top-right side
 *
 * @see plugins/uid-menu-items/plugin.json
 */
define([
    'dojo/i18n!./nls/resource',
    'webida-lib/app-config',
    'webida-lib/util/notify',
    'webida-lib/server-api'
], function (
    i18n,
    appConfig,
    notify,
    webida
) {
    'use strict';

    return {
        /**
         * Move to dashboard page
         */
        openDashboard: function () {
            location.href = appConfig.dashboardBaseUrl + '/pages/main.html';
        },
        /**
         * Logout and move to main page
         */
        signOut: function () {
            webida.auth.logout(function (e) {
                if (e) {
                    notify.error(i18n.errorSignOut);
                } else {
                    window.location.replace(appConfig.dashboardBaseUrl);
                }
            });
        }
    };
});
