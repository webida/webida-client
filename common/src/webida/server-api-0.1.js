/*
 * Copyright (c) 2012-2016 S-Core Co., Ltd.
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
* @fileOverview Webida Server API binding library for Webida 1.x client
*  
* This module implements some sub-set of webida-0.3.js with new webida service api spec. 
* @module server-api
* @version 0.1
*/

define([
    './server-api-0.1-lib/common',
    './server-api-0.1-lib/auth',
    './server-api-0.1-lib/fs',
    './server-api-0.1-lib/messaging',
    './server-api-0.1-lib/session',
],  function (
    common,
    auth,
    fs,
    messaging, 
    session
) {
    'use strict';

    var mod = {
        VERSION: '0.1', 
        auth : auth,
        fs : fs,

        // incompatible properties, which webida-0.3.js does not have
        messaging: messaging,
        info : {
            serverUrl : common.serverUrl,
            serverUri : common.serverUri, 
            get accessToken() {
                return common.tokenManager.accessToken;
            },
            get sessionId() {
                if (common.tokenManager.accessToken) {
                    return common.tokenManager.accessToken.sessionId;
                }
            }
        },
        session : session,

        // for compatibility with plugin who are dependent to webida-0.3.js conf object
        conf : {
            fsServer : common.serverUrl,
            connServer: common.serverUrl,
            fsApiBaseUrl: common.serverUrl + '/api/wfs'
        },

        // for compatibility with current plugin manager
        //  - should be removed in next version (0.2 and later)
        //  - PM should should decide which plugin catalog to load by itself
        //    via window.__ELECTRON_BROWSER__ variable
        //  - PM should not load .user_info/plugin-settings.json file directly while initializing
        //    and may use local storage instead of using server api
        
        getPluginSettingsPath : function(callback) {
            // plugin-settings-desktop.json : to use embedded server from desktop
            // plugin-settings.json : to use legacy server from desktop/browser (0.1)
            //                        to connect remote server from desktop/browser (0.2~)
            // plugin-settings-legacy: to connect legacy server from desktop/browser (0.2~)

            if(common.bootArgs.legacy) {
                return callback('plugins/plugin-setting.json');
            } else {
                return callback('plugins/plugin-settings-desktop.json');
            }
        }
    };

    // for debugging purpose only, in debugger js console.

    // TODO : add bootArgs.debug
    //  - debugging mode should be customizable in runtime, not build time.
    //  - debugging mode will change Logger's singleton logger debugging level, too.
    //    in production mode, log level of logger should adjusted to 'error' or 'off'
    //    every new Logger() instance will respect global log level.

    window.__webida = mod;
    mod.common = common;

    return mod;
});
