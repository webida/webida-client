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
 * @file auth.js
 * @since 1.7.0
 * @author jh1977.kim@samsung.com
 */

define([
    './common', 
    './session'
],  function (
    common,
    session
) {
    'use strict';
    var logger = common.logger;
    var AuthApi = common.api.AuthApi;
    var authApi = new AuthApi();

    // TODO : introduce webida.initializeAsync() that handles all init things, 
    //        with credential provider that interacts with UI, 
    //        and remove initAuth or make it a legacy-compatibility helper 
    //  - ALL webida.*** should be accessible during initialization, without NPE. 
    //  - SOME webida.***.****() functions may throw error during initialization, 
    //  - We should have no no 'pending' operation due to auth. 


    // we may need to move this to common or somewhere else
    common.tokenManager.on('lost', function(error) {
        alert('TOKEN LOST. LOGIN AGAIN \n ' + error.toString() );
    });

    common.tokenManager.on('updated', function(token) {
        logger.debug('updated token', token);
    });

    // initAuth is called by app.js at first, before loading any other plugins
    function initAuth(clientId, redirectUrl, tokenGenerator, callback) {
        var masterToken = common.bootArgs.masterToken;

        logger.log('initAuth starts');

        if (!masterToken) {
            throw new Error('in-app login is not implemented yet');
        }

        authApi.login( {
            loginId:'bogus',
            loginPassword:'bogus',
            masterToken: masterToken
        }, function(err, data) {
            if (err) {
                // given callback is NOT a  error-first-callback function
                logger.error('auth error', err);
                throw(err);
            }
            common.tokenManager.updateAccessToken(data);
            session.connect();
            // Oddly, there's no error-fist-callback for initAuth
            logger.log('initAuth registered access token', data);
            callback(data.sessionId);
        }); 
    }

    function getMyInfo(callback) {
        authApi.getInfo(function (error, data) {
            if (!error) {
                callback(null, data);
            } else {
                logger.debug('getMyInfo failed', error);
                callback(error);
            }
        });
    }

    return {
        initAuth : initAuth,
        getMyInfo : getMyInfo,
        
        // for compatiblity with legacies
        getTokenObj : function getTokenObj() {
            var token = common.accessToken;
            if (token) {
                return {
                    issueTime : token.issuedAt,
                    data : token.text
                };
            }
        },

        getToken : function getToken() {
            var token = common.accessToken;
            if (token) {
                return token.text;
            }
        },

        getSessionID : function getSessionID() {
            var token = common.accessToken;
            if (token) {
                return token.sessionId;
            }
        }
    };
});