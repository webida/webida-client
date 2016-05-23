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
* This module should not be used in Webida 2.x
* This module implements some sub-set of webida-0.3.js
* @module server-api
* @version 0.1
*/

define([
    './server-api-0.1-lib/common',
    './server-api-0.1-lib/auth',
    './server-api-0.1-lib/fs'
],  function (
    URI,
    common,
    auth, 
    fs
) {
    'use strict';

    
    // do we need some values from local storage, especially workspace-specific ones? 
    
    // auth & fs uses swagger client
    //  common will create the swagger client object in initialize() function
    //  other modueles (auth, fs) will get the client from commmon module
    
    common.initSwaggerClient();

    var mod = {
        auth : auth,
        fs : fs,

        // for compatibility with plugisn who are dependent to webida-0.3.js conf object
        conf : {
            fsServer : bootArgs.server,
            connServer: bootArgs.server,
            fsApiBaseUrl: fsServer + '/api/fs',
        },

        // for compatibility with current plugin manager
        //  - should be removed in next version
        //  - PM should should decide which plugin catalog to load by itself
        //    via window.__ELECTRON_BROWSER__ variable
        //  - PM should not load .user_info/plugin-settings.json file directly while initializing
        //    and may use local storage instead of using server api
        getPluginSettingsPath : function(callback) {
            // for desktop mode, check legacy or not
            if (window.__ELECTRON_BROWSER__) {
                if(bootArgs.legacy) {
                    return 'plugins/plugin-settings-desktop.json'
                } else {
                    return 'plugins/plugin-setting.json'
                }
            } else {
                // keep same behavior to webida 0.3
                mod.auth.getMyInfo(function (err, myInfo) {
                    if (err) {
                        callback(defaultPath);
                    } else {
                        callback(myInfo.isGuest ? 'plugins/plugin-settings-guest.json' : defaultPath);
                    }
                });
            }
        }
    };

    return mod;
});
