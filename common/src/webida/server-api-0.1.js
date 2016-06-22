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
    './server-api-0.1-lib/fs'
],  function (
    common,
    auth,
    fs
) {
    'use strict';

    var serverUrl = common.bootArgs.serverUrl;
    var mod = {
        auth : auth,
        fs : fs,

        // for compatibility with plugisn who are dependent to webida-0.3.js conf object
        conf : {
            fsServer : serverUrl,
            connServer: serverUrl,
            fsApiBaseUrl: serverUrl + '/vfs'
        },

        // for compatibility with current plugin manager
        //  - should be removed in next version
        //  - PM should should decide which plugin catalog to load by itself
        //    via window.__ELECTRON_BROWSER__ variable
        //  - PM should not load .user_info/plugin-settings.json file directly while initializing
        //    and may use local storage instead of using server api
        
        getPluginSettingsPath : function(callback) {
            // plugin-settings-desktop.json : to connect embedded server from desktop  (0.1)
            //                              : to connect server from desktop (0.2)
            // plugin-settings.json : to connect legacy server from desktop/browser (0.1)
            //                      : to connect server from browser (0.2)

            // this is version 0.1. (simple but enough, for we don't access legacy server as guest) 
            if(common.bootArgs.legacy) {
                return callback('plugins/plugin-setting.json');
            } else {
                return callback('plugins/plugin-settings-desktop.json');
            }
        }
    };
    
    // for debugging purpose only in debugger js console
    window.__webida = mod;
    mod.common = common;

    return mod;
});
