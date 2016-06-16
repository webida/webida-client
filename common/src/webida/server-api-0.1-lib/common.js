"use strict";

define([
    'URIjs',
    'webida-lib/util/logger/logger-client',
    './webida-service-api-0.1/src/index'
],  function (
    URI,
    Logger,
    WebidaServiceApi
) {
    "use strict";

    var logger = new Logger();
    if (!logger.debug) {
        logger.debug = logger.log;
    }

    var privates = {
        bootArgs : null,
        isDebugging : false,

        // comes from boot args. need public accessor
        serverUri : null,
        serverUrl : null,

        // comes from login response, need public accessor for each properties
        loginResponse : {},

    };

    var publics = {
        // accessors to privates. getters only, no setters

        get logger() { return logger; },
        get bootArgs() { return privates.bootArgs; },
        get loginResponse() { return privates.loginResponse },

        // TODO - break login response object into tokens
        setLoginResponse : function setLoginResponse(loginResponse) {
            if (!loginResponse) {
                logger.error('should not set empty login response');
                throw new Error('empty login response');
            }
            privates.loginResponse = loginResponse; // believe swagger client
            Object.freeze(privates.loginResponse);
        },

        get api() {
            return WebidaServiceApi;
        }
    };

    function initialize() {
        // for embedded server
        //   - main process will set some 'boot token', randomly chosen when webida desktop starts
        //   - embedded server understands boot token and convert it to actual jwt for any webida client
        //   - auth.initAuth() will send boot token to server if set
        //   (in next version, initAuth will be removed & auth.login() will handle it directly)
        var locationUri = new URI(window.location.href);
        var bootArgs = locationUri.query(true);

        privates.bootArgs = bootArgs;
        Object.freeze(privates.bootArgs);

        privates.serverUri = new URI(bootArgs.serverUrl).normalize().resource('').path('');
        privates.serverUrl = privates.serverUri.toString().slice(0, -1);

        logger.log("webida service url base is " + privates.serverUrl);
        // by default, generated js client uses 'http://localhost/api' as base url
        //  we should replace

        var defaultClient = WebidaServiceApi.ApiClient.instance;
        defaultClient.basePath = privates.serverUrl + '/api';
        var webidaSimpleAuth = defaultClient.authentications['webida-simple-auth'];
        Object.defineProperty(webidaSimpleAuth, 'apiKey', {
            enumerable: true,
            get : function getSimpleAuthApiKey() {
                if (privates.loginResponse.accessToken) {
                    return privates.loginResponse.accessToken;
                } else {
                    logger.debug('sending api request without access token', obj);
                    return 'not-a-token';
                }
            }
        });

        console.log("defaultClient", defaultClient);

    }

    /* module script */

    initialize();
    return publics;

});
