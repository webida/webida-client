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

// @formatter:off
define([
    'webida-lib/webida-0.3',
    'webida-lib/util/notify'
], function(
    webida,
    notify
) {
    'use strict';
// @formatter:on

    /* global webidaHost: true */
    function openDashboard() {
        location.href = '//' + webidaHost + '/pages/main.html';
        //'/apps/dashboard/';
        // webidaHost is defined in dojoConfig.js
    }

    function signOut() {
        webida.auth.logout(function(e) {
            if (e) {
                notify.error('Could not sign out.');
                console.log('logout error: ' + e);
            } else {
                window.location.replace('//' + webidaHost);
                // webidaHost is defined in dojoConfig.js
            }
        });
    }

    return {
        openDashboard: openDashboard,
        signOut: signOut
    };
});
