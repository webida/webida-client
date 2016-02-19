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
    'text!top/site-config.json'
], function (
    siteConfigText
) {
    'use strict';
    var siteConfig = JSON.parse(siteConfigText);

    return {
        appId:  siteConfig.app.appId || 'unknown-ide',
        clientId: siteConfig.app.oauth.clientId,
        redirectUrl: siteConfig.app.oauth.redirectUrl,
        baseUrl: siteConfig.app.baseUrl,
        dashboardBaseUrl: siteConfig.app.dashboardBaseUrl,
        apiDocBaseUrl : siteConfig.app.apidocBaseUrl,
        googleAnalytics : siteConfig.googleAnalytics,
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
            basePath: './styles/dist/webida-light'
        }
    };
});