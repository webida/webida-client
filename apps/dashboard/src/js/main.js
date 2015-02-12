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

$(function () {
    'use strict';
    function moveToPage(path) {
        if (path === 'workspace') {
            require(['controllers/StatController'], function (StatController) {
                (new StatController()).execute();
            });

            require(['controllers/WorkspaceController'], function (WorkspaceController) {
                (new WorkspaceController()).execute();
            });

        } else if (path === 'settings') {
            require(['controllers/SettingsController'], function (SettingsController) {
                (new SettingsController()).execute();
            });
        } else if (path === 'applications') {
            require(['controllers/ApplicationController'], function (ApplicationController) {
                (new ApplicationController()).execute();
            });
        }
    }

    $.ajaxSetup({
        cache: false
    });

    require([
        'webida',
        'webida-lib/app-config'
    ], function (webida, AppConfig) {

        var href = window.location.href;
        var url = href;

        if (url.indexOf('#') !== -1) {
            url = url.substring(0, url.indexOf('#'));
        }

        if (url.indexOf('index.html') !== -1) {
            url = url.replace('index.html', 'auth.html');
        } else {
            url = url + '/auth.html';
        }

        url = url.replace('//auth.html', '/auth.html');

        webida.auth.initAuth(AppConfig.clientId.dashboard, url);

        webida.auth.getMyInfo(function () {
            $(window).on('hashchange', function () {
                var hash = location.hash.replace(/^#/, '');

                if (hash === '') {
                    hash = 'workspace';
                }

                $('.menu-item').removeClass('selected');
                var menu = $('.menu-item.' + hash);
                menu.addClass('selected');

                moveToPage(hash);
            });

            $(window).hashchange();
        });
    });
});