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
    'webida-lib/webida-0.3',
    'webida-lib/util/logger/logger-client'
], function (
    webida,
    Logger
) {
    'use strict';
    var logger = new Logger();
    var APP_ID = 'webida-client';
    var serverConf;

    try {
        serverConf = JSON.parse($.ajax({
            type: 'GET',
            url: webida.conf.appApiBaseUrl + '/configs',
            async: false
        }).responseText);
    } catch (e) {
        logger.warn('Failed to load configs. Using default one: ' + e.message);
        serverConf = {
            systemApps: { 'webida-client': { baseUrl: window.location.protocol + '//' + window.location.host } }
        };
    }

    return {
        appId: APP_ID,
        clientId: 'IDE_CLIENT_ID',
        redirectUrl: serverConf.systemApps[APP_ID].baseUrl + '/auth.html',
        baseUrl: serverConf.systemApps[APP_ID].baseUrl,
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
        },
        theme: {
            name: 'webida-light',
            basePath: serverConf.systemApps[APP_ID].baseUrl + '/apps/ide/src/styles/dist/webida-light'
        }
    };
});