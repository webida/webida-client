/**
 * Created by lunaris on 2016-05-23.
 */

define([
    './common'
],  function (
    common
) {
    "use strict";
    var logger = common.logger;
    var AuthApi = common.api.AuthApi;
    var authApi = new AuthApi();

    // initAuth is called by app.js at first, before loading any other plugins
    // it's good place to initialize swagger client
    function initAuth(clientId, redirectUrl, tokenGenerator, callback) {
        var masterToken = common.bootArgs.masterToken;

        if (!masterToken) {
            throw new Error('in-app login is not implemented yet');
            // TODO : respect webida-0.3.js TokenGenerator class
        }

        console.log("webida auth service api", authApi);
        var loginRequest = common.api.LoginRequest.constructFromObject({
            loginId: 'bogus',
            loginPassword: 'bogus',
            masterToken: masterToken
        });

        authApi.login(loginRequest, function (error, data, response) {
            if (!error) {
                logger.debug('login response', data, response);
                common.setLoginResponse(data);
                // Oddly, there's no error-fist-callback for initAuth
                callback(data.sessionId);
            } else {
                logger.error('initAuth failed', error);
                callback(error)
            }
        });
    }

    function getMyInfo(callback) {

        authApi.getInfo(function (error, data, response) {
            if (!error) {
                logger.debug('info response', data, response);
                // TODO : add common.userInfo and check it before sending request
                // don't forget to invoke callback with setTimeout(0)
                callback(null, data);
            } else {
                logger.debug('getMyInfo failed', error);
                callback(error)
            }
        });
    }

    return {
        initAuth : initAuth,
        getMyInfo : getMyInfo,

        // for compatiblity
        getTokenObj : function getTokenObject() {
            let token = common.loginResponse.accessToken;
            if (token) {
                return {
                    issueTime : common.loginResponse.decodedAccessToken.issuedAt,
                    data : common.loginResponse.accessToken
                }
            }
        },

        getToken : function getToken() {
            return  common.loginResponse.accessToken;
        },

        getSessionID : function getSessionID() {
            return common.loginResponse.decodedAccessToken.sessionId; 
        }
    };
});