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

define(['path', 'webida-lib/app-config'], function (path) {
    'use strict';

    /* global webidaAuth, webidaHost:true */
    var menu = $('#sub-menu');
    var menuname = '<li><a href="#/logout">Logout</a></li>';

    menu.append(menuname);

    path.map('#/logout').to(function () {
        if (confirm('Do you want to logout?')) {
            webidaAuth.logout(function (err) {
                if (err) {
                    alert('Failed to logout');
                } else {
                    location.href = '//' + webidaHost;
                }
            });
        }
    });

    path.listen();
});
