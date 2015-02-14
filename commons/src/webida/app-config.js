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

define([], function () {
    'use strict';

    var protocol = window.location.protocol + '//';
    var serverDomain = 'webida.mine'; //server domain name

    window.WEBIDA_HOST_URL = serverDomain + ':5001';
    window.WEBIDA_FS_SERVER_URL = protocol + serverDomain + ':5003';
    window.WEBIDA_AUTH_SERVER_URL = protocol + serverDomain + ':5002';
    window.WEBIDA_APP_SERVER_URL = protocol +  serverDomain + ':5001';
    window.WEBIDA_BUILD_SERVER_URL = protocol  + serverDomain + ':5004';
    window.WEBIDA_DB_SERVER_URL = protocol +  serverDomain + ':5006';
    window.WEBIDA_NTF_SERVER_URL = protocol +  serverDomain + ':5011';
    window.WEBIDA_CORS_SERVER_URL = protocol + serverDomain;
    window.WEBIDA_CONN_SERVER_URL = protocol + serverDomain + ':5010';

    return {
        clientId: 'CLIENT_ID_TO_BE_SET',
        appRoute: {
            site: 'apps/desktop/index.html'/*,
            desktop: 'apps/desktop/index.html',
            ide: 'apps/ide/src/index.html',
            dashboard: 'apps/dashboard/index.html',
            deploy: 'apps/deploy/index.html',
            default: 'apps/site/index.html'*/
        },
        redirectUrl: protocol + window.WEBIDA_HOST_URL + '/auth.html'
    };
});