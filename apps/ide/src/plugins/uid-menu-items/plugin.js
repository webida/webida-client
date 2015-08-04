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

define(['webida-lib/webida-0.3', 'plugins/webida.notification/notification-message'], function (webida, toastr) {
    'use strict';

    function openDashboard() {
        location.href = '/apps/dashboard/';
            // webidaHost is defined in dojoConfig.js
    }

    function signOut() {
        webida.auth.logout(function (e) {
            if (e) {
                toastr.error('Could not sign out.');
                console.log('logout error: ' + e);
            } else {
                window.location.replace('/'); // webidaHost is defined in dojoConfig.js
            }
        });
    }

    return {
        openDashboard: openDashboard,
        signOut: signOut
    };
});
