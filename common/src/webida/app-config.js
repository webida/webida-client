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

define([
    '/webida/api/app/configs?callback=define'
], function (
    serverConf
) {
    'use strict';
    var APP_ID = 'webida-client';
    return {
        appId: APP_ID,
        clientId: 'IDE_CLIENT_ID',
        redirectUrl: serverConf.systemApps[APP_ID].baseUrl + '/auth.html',
        guestMode: !!serverConf.featureEnables.guestMode,
        meta: {
            user: {
                dir: '.userInfo',
                file: 'workspace.json'
            },
            workspace: {
                dir: '.workspace',
                file: 'workspace.json'
            },
            project: {
                dir: '.project',
                file: 'project.json'
            }
        }
    };
});