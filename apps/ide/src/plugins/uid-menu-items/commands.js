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
 * @file This file is defining method for execution of command.
 * @since 1.7.0
 * @author minsung.jin@samsung.com
 */

define([
    'dojo/i18n!./nls/resource',
    'require',
    'webida-lib/app-config',
    'webida-lib/plugins/command-system/command/Command',
    'webida-lib/util/genetic',
    'webida-lib/util/notify',
    'webida-lib/webida-0.3'
], function (
    i18n,
    require,
    appConfig,
    Command,
    genetic,
    notify,
    webida
) {
    'use strict';

    function DashboardUserIdCommand(id) {
        DashboardUserIdCommand.id = id;
    }
    genetic.inherits(DashboardUserIdCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                location.href = appConfig.dashboardBaseUrl + '/pages/main.html';
                resolve();
            });
        }
    });

    function SignOutUserIdCommand(id) {
        SignOutUserIdCommand.id = id;
    }
    genetic.inherits(SignOutUserIdCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                webida.auth.logout(function (e) {
                    if (e) {
                        notify.error(i18n.errorSignOut);
                    } else {
                        window.location.replace(appConfig.dashboardBaseUrl);
                    }
                });
                resolve();
            });
        }
    });

    return {
        DashboardUserIdCommand: DashboardUserIdCommand,
        SignOutUserIdCommand: SignOutUserIdCommand
    };
});

