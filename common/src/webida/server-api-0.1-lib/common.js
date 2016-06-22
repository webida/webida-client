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
 * @file common.js
 * @since 1.7.0
 * @author jh1977.kim@samsung.com
 */
define([
    'URIjs',
    'webida-lib/util/logger/logger-client',
    './webida-service-api-0.1/src/index',
    './TokenManager'
],  function (
    URI,
    Logger,
    WebidaServiceApi,
    TokenManager
) {
    'use strict';

    var logger = new Logger();
    if (!logger.debug) {
        logger.debug = logger.log;
    }

    var privates = {
        bootArgs : null,
        // comes from boot args. need public accessor
        serverUri : null,
        serverUrl : null,

        // comes from login response. no need of public accessor
        tokenManager : TokenManager.instance
    };

    var publics = {
        // accessors to privates. getters only, no setters
        get logger() { return logger; },
        get bootArgs() { return privates.bootArgs; },
        get tokenManager() { return privates.tokenManager;},
        get api() {
            return WebidaServiceApi;
        }
    };

    function initializeThisModule() {
        var locationUri = new URI(window.location.href);
        var bootArgs = locationUri.query(true);

        privates.bootArgs = bootArgs;
        Object.freeze(privates.bootArgs);

        privates.serverUri = new URI(bootArgs.serverUrl).normalize().resource('').path('');
        privates.serverUrl = privates.serverUri.toString().slice(0, -1);

        // by default, generated js client uses 'http://localhost/api' as base url
        //  we should replace it to real server url

        var defaultClient = WebidaServiceApi.ApiClient.instance;
        defaultClient.basePath = privates.serverUrl + '/api';

        // webidaSimpleAuth.apiKey is not a 'fixed' value.
        // so, we should define property getter (maybe proxy, later)
        var webidaSimpleAuth = defaultClient.authentications['webida-simple-auth'];
        Object.defineProperty(webidaSimpleAuth, 'apiKey', {
            enumerable: true,
            get : function getSimpleAuthApiKey() {
                if (privates.tokenManager.accessToken) {
                    return privates.tokenManager.accessToken.text;
                } else {
                    logger.log('has no access token yet');
                    return 'not-a-token';
                }
            }
        });
        console.log('swagger api default client', defaultClient);
    }

    /* module main script */
    initializeThisModule();
    return publics;

});
