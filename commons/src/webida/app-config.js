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

    var protocol = window.location.protocol + "//";
    var domainSplit = window.location.hostname.split('.');
    var domain = (domainSplit.length < 3) ? window.location.hostname :  window.location.hostname.substring(domainSplit[0].length + 1);

    window.WEBIDA_HOST_URL = protocol + domain;
    window.WEBIDA_FS_SERVER_URL = protocol + 'fs.' + domain;
    window.WEBIDA_AUTH_SERVER_URL = protocol + 'auth.' + domain;
    window.WEBIDA_APP_SERVER_URL = protocol + 'app.' + domain;
    window.WEBIDA_BUILD_SERVER_URL = protocol + 'build.' + domain;
    window.WEBIDA_DB_SERVER_URL = protocol + 'db.' + domain;
    window.WEBIDA_NTF_SERVER_URL = protocol + 'ntf.' + domain;
    window.WEBIDA_CORS_SERVER_URL = protocol + 'cors.' + domain;

    return {
        clientId: {
            webida: 'WEBIDA_CLIENT_ID_TO_BE_SET',
            desktop: 'DESKTOP_CLIENT_ID_TO_BE_SET',
            devenv: 'DEVENV_CLIENT_ID_TO_BE_SET',
            dashboard: 'DASHBOARD_CLIENT_ID_TO_BE_SET',
            deploy: 'DEPLOY_CLIENT_ID_TO_BE_SET',
            default: 'CLIENT_ID_TO_BE_SET'
        }

    };
});