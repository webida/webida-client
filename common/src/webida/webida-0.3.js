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

/**
* @fileOverview Webida SDK for JavaScript
*/

/**
* Webida SDK for Javascript module.
*
* This module provides JavaScript API's for Webida Auth/App/FS services.
* @module webida
*/

/* global unescape: true */
/* global sio: true */
/* global io: true */

var ENV_TYPE;

(function (root, factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        ENV_TYPE = 'amd';
        define([], factory);
    } else if (typeof exports === 'object') {
        ENV_TYPE = 'commonjs';
        module.exports = factory();
    } else {
        // Browser globals
        ENV_TYPE = 'browser';
        root.Webida = factory();
    }
}(this, function () {
    'use strict';

    var XHR;
    var FD;
    if (ENV_TYPE === 'amd') {
        XHR = XMLHttpRequest;
        FD = FormData;
    } else if (ENV_TYPE === 'commonjs') {
        FD = function () {};
        XHR = require('xmlhttprequest').XMLHttpRequest;
    } else {
        XHR = XMLHttpRequest;
        FD = FormData;
    }

    function readCookie(name) {
        if (typeof exports === 'object') {
            return null;
        } else {
            name = name.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
            var regex = new RegExp('(?:^|;)\\s?' + name + '=(.*?)(?:;|$)', 'i');
            var match = document.cookie.match(regex);
            return match && unescape(match[1]);
        }
    }

    function getParamByName(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
        results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    function prependSubDomain(subdomain, url) {
        return url.replace('//', '//' + subdomain + '.');
    }

    function getHostParam(paramName, subdomain, webidaHost) {
        var globalVarName = paramName.replace('.', '_');
        var hostUrl = (typeof window !== 'undefined' && window[globalVarName]) ||
            getParamByName(paramName) ||
            readCookie(paramName) ||
            prependSubDomain(subdomain, webidaHost);
        return hostUrl;
    }

    function getHostFromLocation() {
        return location.protocol + '//' + location.host;
    }

    var mod = {};
    mod.getHostParam = getHostParam;
    
    /* jshint camelcase:false */
    var webidaHost = (typeof window !== 'undefined' && window && window.webida_host) ||
        getParamByName('webida.host') || readCookie('webida.host') || getHostFromLocation() || 'https://webida.org';
    /* jshint camelcase:true */
    var fsServer = getHostParam('webida.fsHostUrl', 'fs', webidaHost);
    var authServer = getHostParam('webida.authHostUrl', 'auth', webidaHost);
    var appServer = getHostParam('webida.appHostUrl', 'app', webidaHost);
    var buildServer = getHostParam('webida.buildHostUrl', 'build', webidaHost);
    var dbServer = getHostParam('webida.dbHostUrl', 'db', webidaHost);
    var ntfServer = getHostParam('webida.ntfHostUrl', 'ntf', webidaHost);
    var corsServer = getHostParam('webida.corsHostUrl', 'cors', webidaHost);
    var connServer = getHostParam('webida.connHostUrl', 'conn', webidaHost);

    var deploy = {
        type: readCookie('webida.deploy.type') || 'domain',
        pathPrefix: readCookie('webida.deploy.pathPrefix') || '-'
    };
    /**
     * webida config object
     * @name conf
     * @type {module:webida.webida_config}
     * @memberOf module:webida
     */
    mod.conf = {
        webidaHost: webidaHost,
        fsServer: fsServer,
        authServer: authServer,
        appServer: appServer,
        buildServer: buildServer,
        ntfServer: ntfServer,
        corsServer: corsServer,
        fsApiBaseUrl: fsServer + '/webida/api/fs',
        authApiBaseUrl: authServer + '/webida/api/oauth',
        appApiBaseUrl: appServer + '/webida/api/app',
        dbApiBaseUrl: dbServer + '/webida/api/db',
        buildApiBaseUrl: buildServer + '/webida/api/build',
        aclApiBaseUrl: authServer + '/webida/api/acl',
        groupApiBaseUrl: authServer + '/webida/api/group',
        connServer: connServer,
        deploy: deploy
    };

    /**
     * This is webida filesystem service class. Just use 'webida.fs' instance.
     * @class FSService
     * @memberOf module:webida
     */
    mod.FSService = function () {};

    /**
     * This is webida authentication service class. Just use 'webida.auth' instance.
     * @class AuthService
     * @memberOf module:webida
     */
    mod.AuthService = function () {};

    /**
     * This is webida app service class. Just use 'webida.app' instance.
     * @class AppService
     * @memberOf module:webida
     */
    mod.AppService = function () {};

    /*
     * This class is objet so it does not need instantiation, Just use 'webida.db'
     * @class DBService
     * @memberOf module:webida
     */
    mod.DBService = function () {};

    /*
     * This class is objet so it does not need instantiation, Just use 'webida.build'
     * @class BuildService
     * @memberOf module:webida
     */
    mod.BuildService = function () {};

    /**
     * This is webida acl service class. Just use 'webida.acl' instance.<br><br>
     *
     * @example
       policy_info : {
           pid: id,                    // generated by system
           name: "name",               //
           owner: id,                  // generated by system
           effect: "allow" or "deny",  // default="allow"
           action: ["action"],         // array of webida action format
           resource: ["resource"]      // array of webida resource format
       };
     * <br><br>
     * webida action format : <b>"{prefix}:{action}" </b>
     * <UL>
     * <LI> {prefix} - service prefix. (ex) fs, fssvc, app, auth, ...
     * <LI> {action} - Webida sdk api name.
     * <LI> (ex) "fs:readFile", "app:launchApp", "fssvc:addMyFS", ...
     * </UL>
     *
     * webida resource format : <b>"{prefix}:{resource}" </b>
     * <UL>
     * <LI> {prefix} - service prefix. (ex) fs, fssvc, app, auth, ...
     * <LI> {resource} - each service define it.
     * <UL><LI> fs service : path(file or folder) with fsid
     * <LI> auth/app service : *</UL>
     * <LI> (ex) "fs:eyXFCbhTWg/workspace/app-desktop/index.html", "app:*", "fssvc:*", ...
     * </UL>
     * @class ACLService
     * @memberOf module:webida
     */
    mod.ACLService = function () {
        /**
         * Representation of public user. (All users)
         * @name PUBLIC_USER
         * @memberOf module:webida.ACLService
         */
        this.PUBLIC_USER = 0;

        /**
         * Representation of anonymous user. (Logged-in Webida users)
         * @name ANONYMOUS_USER
         * @memberOf module:webida.ACLService
         */
        this.ANONYMOUS_USER = 1;
    };


    // access token
    var token = {
        issueTime: 0,
        data: null
    };

    var _authFrame, alreadyRequested;
    var tokenChangeListeners = {};
    var tokenChangeListenerId = 0;
    var isAnonymousMode = false;

    /**
     * This is default TokenGenerator class.
     * If you want to modify it, override the 'webida.tokenGenerator' instance.
     * @class TokenGenerator
     * @memberOf module:webida
     */
    mod.TokenGenerator = function () {
        this.clientId = null;
        this.redirectUrl = null;
    };


    /**
    * Check whether the access token is valid or not.
    * Default implementation check the expire time of access token.
    * Do not call this function, just override this if you need then webida system will apply it.
    *
    * @method validateToken
    * @param {module:webida.token} token - access token object
    * @returns {boolean} access token validation check result.
    * @memberOf module:webida.TokenGenerator
    */
    mod.TokenGenerator.prototype.validateToken = function (token) {
        function getTokenElapsedTime(token) {
            return Date.now() - token.issueTime;
        }
        if (getTokenElapsedTime(token) < 550000) {
                        // It should be somewhat less than the server's (10 minutes)
            return true;
        } else {
            return false;
        }
    };

    var c = 1;
    function cuniq() {
        var d = new Date(),
            m = d.getMilliseconds() + '',
            u = ++d + m + (++c === 10000 ? (c = 1) : c);

        return u;
    }

    var sessionID = null;

    /**
    * Generate the new access token.
    * Do not call this function, just override this if you need then webida system will apply it.
    *
    * @method generateNewToken
    * @param {module:webida.request_callback_with_token_only} callback -
    *        (token:string) - undefined.
    *        <br>Register the access token using {@link module:webida.AuthService.registerToken}
    * @memberOf module:webida.TokenGenerator
    */
    mod.TokenGenerator.prototype.generateNewToken = function (cb) {
        function receiveMsg(event) {
            //console.log('receiveMsg', event.data);
            window.removeEventListener('message', receiveMsg);
            alreadyRequested = false;
            cb(event.data);
            //var regex = /([^&=]+)=([^&]*)/g, m;
            //while ((m = regex.exec(event.data))) {
            //    if (m[1] === 'access_token') {
            //        window.removeEventListener('message', receiveMsg);
            //        alreadyRequested = false;
            //        cb(m[2]);    // m[2] is the token
            //        break;
            //    }
            //}

        }

        window.addEventListener('message', receiveMsg);

        if (alreadyRequested) {
            return;
        }

        var src;
        if (_authFrame) {
            //console.log('reloading auth-frame');
            src = _authFrame.src;
            _authFrame.src = 'about:blank';

            alreadyRequested = true;
            _authFrame.src = src;
        } else {
            //console.log('creating auth-frame');
            src = mod.conf.authApiBaseUrl + '/authorize' +
                '?response_type=token' +
                '&redirect_uri=' + encodeURIComponent(this.redirectUrl) +
                '&client_id=' + this.clientId;
            var text = '<iframe id="authframe" src="' + src +
                       '" style="display:none"></iframe>';
            var body =  document.getElementsByTagName('body')[0];

            alreadyRequested = true;
            body.insertAdjacentHTML('afterbegin', text);
            _authFrame = document.getElementById('authframe');
        }
    };

    function ensureAuthorize(cb) {
        if (isAnonymousMode ||
                mod.tokenGenerator.validateToken(mod.auth.getTokenObj())) {
            cb();
        } else {
            //console.log('auth: generateNewToken');
            mod.tokenGenerator.generateNewToken(function (newToken) {
                //console.log('hina temp: new token = ' + newToken);
                mod.auth.registerToken(newToken);
                //console.log('auth: callback restApi : ' + cb);
                cb();
            });
        }
    }

    /**
    * Initialize the authorization configurations to use webida api authorization service.
    *
    * @method initAuth
    * @param {string} clientID - client ID
    * @param {string} [redUrl] - Redirect url to receive the access token
    * @param {module:webida.token_generator} [generator] - User defined token generator object.
    * @param {module:webida.initauth_callback} callback - if callback is spefified then deliver session id onto callback
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.initAuth = function (clientID, redUrl/*optional*/, generator/*optional*/,
                                                    cb/*optional*/) {
        if (generator) {
            if (generator.generateNewToken) {
                mod.tokenGenerator.generateNewToken = generator.generateNewToken;
            }
            if (generator.validateToken) {
                mod.tokenGenerator.validateToken = generator.validateToken;
            }
        }

        sessionID = cuniq();
        mod.tokenGenerator.clientId = clientID;
        if (!redUrl) {
            var paths = location.pathname.split('/');
            var lastPath = paths[paths.length - 1];
            var siblingPath = location.pathname.substring(0, location.pathname.length - lastPath.length);
            redUrl = location.protocol + '//' + location.host + siblingPath + 'auth.html';
        }
        mod.tokenGenerator.redirectUrl = redUrl;

        if (cb) {
            cb(sessionID);
        }
    };



    /**
    * Initialize the authorization configurations to use webida api authorization service.
    *
    * @method getSessionID
    * @returns {string} sessionID - session id for this app session
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.getSessionID = function () {
        return sessionID;
    };

    /**
    * Set anonymous mode
    *
    * If anonymous mode is set, all the following APIs are called without access token.
    * If it's unset, APIs are called with access token which will be acquired by OAuth2 implicit flow.
    *
    * @name setAnonymousMode
    * @function
    * @param {bool} anonymousMode - true for anonymous mode. false to unset anonymous mode.
    * @memberOf module:webida
    */
    mod.setAnonymousMode = function (anonymousMode) {
        isAnonymousMode = anonymousMode;
    };

    
    mod.ensureAuthorize = ensureAuthorize;

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback initauth_callback
    * @param {string} [sessionID] - Session ID. Which is id for this app session
    * @memberOf module:webida
    */


    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_appid
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {string} [appid] - Application ID.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_search_result
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {Array.<module:webida.search_result>} [result] - Search result.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_result_flag
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {boolean} [result] - Result flag.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_list_contents
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {Array.<module:webida.list_info>} [contents] - File/Directory list information.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_stat_infos
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {Array.<module:webida.stat_info>} [content] - File/Directory stat information.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_file_data
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {string} [content] - File's contetns.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_app_info_list
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {Array.<module:webida.app_info>} [content] - Applications information.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_app_info
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {module:webida.app_info} [content] - Application information.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_user_info
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {module:webida.user_info} [content] - User information.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_user_info_list
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {Array.<module:webida.user_info>} users - User information list.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_group_info
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {module:webida.group_info} group - group information.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_group_info_list
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {Array.<module:webida.group_info>} groups - group information list.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_policy_info
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {module:webida.policy_info} policy - Registered policy object
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_policy_info_list
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {Array.<module:webida.policy_info>} policies - Registered array of policy object
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_policy_info_list
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {Array.<module:webida.policy_info>} policies - policy information list.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_filesystem
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {module:webida.FSService.FileSystem} [fs] - Webida file system.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_filesystem_info
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {module:webida.fs_info} [fsinfo] - Webida file system information.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_acl
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {module:webida.acl} [acl] - Access control list.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_alias_info
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {module:webida.alias_info} [aliasInfo] - Alias information.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_result_log
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {string} [log] - Command execution result message.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_metadata
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {module:webida.metadata} [metadata] - file's metadata.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_filesystem_info_list
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {Array.<module:webida.fs_info>} [fsInfos] - Webida file system information list.
    * @memberOf module:webida
    */

    /**
    * Callback function. Register the token to the webida module,
    * then the api authorization will be done by webida module automatically.
    *
    * @callback request_callback_with_token_only
    * @param {string} token - access token
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_filesystem_usage
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {string} [usage] - filesystem usage in bytes. This value might not be updated up to 1 minute.

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_filesystem_limit
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {string} [limit] - filesystem limit in bytes.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_token
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {string} [token] - Newly added personal token.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_token_object_list
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {Array.<module:webida.token_object>} [tokens] - Registered personal token list.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_lock_info_list
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {Array.<module:webida.lock_info>} [lockInfos] - File lock information list.
    * @memberOf module:webida
    */

    /**
    * Callback function. If function finished successfully then error is undefined
    *
    * @callback request_callback_with_file_link
    * @param {module:webida.callback_error} error - Error message. Error message is string or undefined
    * @param {Array.<module:webida.file_link_info>} filelinkinfo - file link information.
    * @memberOf module:webida
    */

    /**
    * Webida module's API functions.
    *
    * @callback api_function
    * @param {_a_1} argument - API parameter.
    * @param {} ... - API parameter.
    * @param {_a_n} argument - API parameter.
    * @param {module:webida.api_callback_function} callback_function - Callback function.
    * @memberOf module:webida
    */

    /**
    * Webida module's API callback functions.
    *
    * @callback api_callback_function
    * @param {string|undefined} error - API error string.
    * @param {_a} returnVal - API return data.
    * @memberOf module:webida
    */

    /**
    * Webida module's API callback functions.
    *
    * @callback api_success_function
    * @param {_a} returnVal - API return data.
    * @memberOf module:webida
    */

    /**
    * Webida module's API callback functions.
    *
    * @callback api_error_function
    * @param {string} error - API error message.
    * @memberOf module:webida
    */

    /**
    * Access token change listener
    *
    * @callback token_change_listener
    * @param {string} token - newly registered access token
    * @memberOf module:webida
    */

    /**
    * Error type.
    * @typedef {string|undefined} callback_error
    * @memberOf module:webida
    */

    /**
    * Application domain - Domain name should be at least 5 characters. And each character must be [a-z0-9-]
    * @typedef {string} domain
    * @memberOf module:webida
    */

    /**
    * Value of metadata - any string value associated with the metaName and resource
    * @typedef {string} metadata
    * @memberOf module:webida
    */

    /**
    * Application type - Current app type is only valid 'html'|'nodejs'
    * @typedef {string} app_type
    * @summary 'html'|'nodejs'
    * @memberOf module:webida
    */

    /**
    * Deploy type - Deploy source path type
    * @typedef {string} deploy_type
    * @summary 'git'|'url'
    * @memberOf module:webida
    */

    /**
    * Application status - Status is only vaild 'running'|'stopped'
    * @typedef {string} app_status
    * @summary 'running'|'stopped'
    * @memberOf module:webida
    */

    /**
    * Webida file system's path - eg. '/ws1/dir1', 'ws1/file1'
    * @typedef {string} path
    * @memberOf module:webida
    */

    /**
    * Webida file system's url id - eg. wfs://host/fsid
    * @typedef {string} fs_url
    * @memberOf module:webida
    */

    /**
    * Webida file system's url path - eg. wfs://host/fsid/file/path
    * @typedef {string} fs_url_path
    * @memberOf module:webida
    */

    /**
    * Options for listEx api.
    * dirOnly, fileOnly is mutual exclusive
    * @typedef {object} list_option
    * @property {boolean} recursive
    * @property {boolean} dirOnly
    * @property {boolean} fileOnly
    * @memberOf module:webida
    */

    /**
    * Access control list. eg. {'user1':'r', 'user2':'w', 'user3':'rw'}
    * @typedef {object} acl
    * @property {module:webida.access_control} 'user1' - User access control.
    * @property {module:webida.access_control} 'user2' - User access control.
    * @property {} ... - User access control.
    * @memberOf module:webida
    */

    /**
    * Access control.
    * @typedef {string} access_control
    * @summary 'r'|'w'|'rw'
    * @memberOf module:webida
    */

    /**
    * Search options.
    * @typedef {object} search_option
    * @property {boolean} ignoreCase - Ignore case
    * @property {boolean} wholeWord - Whole word
    * @property {string} includeFile - Regular expression pattern for file path to be searched
    * @property {string} excludeDir - Regular expression pattern for directory path to be
        exluded from search. This has higher priority than <tt>includeFile</tt>; if both
        <tt>includeFile</tt> and <tt>excludeDir</tt> are matched with a path, it's skipped.
    * @memberOf module:webida
    */

    /**
    * Search result.
    * @typedef {object} search_result
    * @property {module:webida.path} fileName - search file path
    * @property {Array.<module:webida.search_match_info>} match - wholeword
    * @memberOf module:webida
    */

    /**
    * Search match file information.
    * @typedef {object} search_match_info
    * @property {int} line - Matching line's number
    * @property {string} text - Matching line's text
    * @memberOf module:webida
    */

    /**
    * List directory contents.
    *
    * atime, mtime, ctime are UTC time in ISO format like '2014-01-03T04:50:32.000Z'.
    * This can be directly parsed using <tt>new Date(atime)</tt>.
    * @typedef {object} stat_info
    * @property {string} name - File/Directory name
    * @property {module:webida.path} path - File path
    * @property {boolean} isFile - If contents is file then ture
    * @property {boolean} isDirectory - If contents is directory then true
    * @property {int} size - File size(byte). If contents is directory then size is 4096
    * @property {string} atime - atime is the file access time. The atime gets updated when you
        open a file but also when a file is used for other operations like grep, sort, cat, head,
        tail and so on. This is not always correct due to OS(Linux) filesystem performance. As default,
        atime is not updated if current atime is newer than mtime.
    * @property {string} mtime - mtime is the file modify time. The mtime gets updated when you
        modify a file. Whenever you update content of a file or save a file the mtime gets updated.
        Most of the times ctime and mtime will be the same, unless only the file attributes are updated.
        In that case only the ctime gets updated.
    * @property {string} ctime - ctime is the inode or file change time. The ctime gets updated
        when the file attributes are changed, like changing the owner, changing the permission or moving
        the file to an other filesystem but will also be updated when you modify a file.
    * @memberOf module:webida
    */

    /**
    * List directory contents.
    * @typedef {object} list_info
    * @property {string} name - File name
    * @property {boolean} isFile - If contents is file then ture
    * @property {boolean} isDirectory - If contents is directory then true
    * @property {Array.<module:webida.list_info>} [children] - Child file/directory contents.
    * @memberOf module:webida
    */

    /**
    * Application information contents.
    * @typedef {object} app_info
    * @property {string} app_id - Appication id
    * @property {module:webida.domain} domain - Appication id
    * @property {module:webida.app_type} apptype - Appication type
    * @property {string} name - Appication name
    * @property {string} desc - Appication description
    * @property {string} owner - Appication owner
    * @property {module:webida.fs_url_path} [srcurl] - Application source path
    * @property {module:webida.app_status} status - Appication status
    * @memberOf module:webida
    */

    /**
    * User information.
    * @typedef {object} user_info
    * @property {int} uid - User id
    * @property {string} email - User mail
    * @property {string} name - User name
    * @property {string} company - user company
    * @property {string} telephone - telephone number
    * @property {string} department - department
    * @property {int} status - account status (0:PENDING, 1:APPROVED, 2:REJECTED)
    * @property {int} isAdmin - user's admin authority(0:NOT ADMIN, 1:ADMIN)
    * @property {string} lastLoginTime - Last login time ("yyyy-mm-dd hh:mm:ss")
    * @memberOf module:webida
    */

    /**
    * Group information.
    * @typedef {object} group_info
    * @property {int} gid - Group id
    * @property {string} name - Group name
    * @property {int} owner - Group owner
    * @property {string} userdata - user defined data field
    * @memberOf module:webida
    */

    /**
    * Policy information.
    * @typedef {object} policy_info
    * @property {string} pid - Policy id which is hash value generated by system.
    * @property {string} name - Policy name.
    * @property {int} owner - Owner id of policy that is assigned as a requested user by system.
    * @property {string} [effect] - Effect type ("allow"(default value) or "deny")
    * @property {Array.<string>} action - All webida api could be a policy action.<br>
    Each action must have a service prefix. (eg. ["auth:myinfo", "fs:readFile"] or ["app:*"], ...)
    * @property {Array.<string>} resource - Resource type is service dependent.<br>
    FSService and FileSystem action need a path as a resource.<br>
    All resource must have a service prefix and FileSystem resource also must have a fsid. <br>
    (eg. ["fs:l1UOzY7Dbx/workspace/app-desktop/index.html"])
    * @memberOf module:webida
    */

    /**
    * Alias information.
    * @typedef {object} alias_info
    * @property {string} aliasKey - Alias key
    * @property {string} owner - User name
    * @property {string} fsid - File system id
    * @property {string} path - Path
    * @property {int} expireTime - Expire time
    * @property {string} expireDate - Expire date
    * @property {string} url - Url
    * @memberOf module:webida
    */

    /**
    * Filesystem information.
    * @typedef {object} fs_info
    * @property {int} owner - Uid of filesystem owner
    * @property {string} fsid - Filesystem id
    * @memberOf module:webida
    */

    /**
    * Window open() Method's options in W3C spec.
    * Currently support 'name,specs,replace' options. 'name,specs,replace' is key of this param.
    * Referce more detail information in http://www.w3schools.com/jsref/met_win_open.asp
    * @typedef {object} window_open_option
    * @property {string} name - Specifies the target attribute or the name of the window.
    * @property {string} specs - A comma-separated list of items. The following values are supported.
    * @property {boolean} replace -
        Whether the URL creates a new entry or replaces the current entry in the history list.
            true - URL replaces the current document in the history list.
            false - URL creates a new entry in the history list.
    * @memberOf module:webida
    */

    /**
    * Execution command.
    * @typedef {object} execution_info
    * @property {string} cmd - Execution command. (ex. git)
    * @property {Array.<string>} args - Execution command's argument list.
    * @memberOf module:webida
    */

    /**
    * OAuth information.
    * Referce more detail information in http://passportjs.org/guide/profile/
    * @typedef {object} passport_user_profile
    * @property {} ...
    * @memberOf module:webida
    */

    /**
    * Binary large object
    * Referce more detail information in http://en.wikipedia.org/wiki/Binary_large_object
    * @typedef {object} blob
    * @property {} ...
    * @memberOf module:webida
    */

    /**
    * Window object
    * Referce more detail information in http://www.w3schools.com/jsref/obj_window.asp
    * @typedef {object} window
    * @property {} ...
    * @memberOf module:webida
    */

    /**
    * File object
    * Referce more detail information in https://developer.mozilla.org/en-US/docs/Web/API/File
    * @typedef {object} file
    * @property {} ...
    * @memberOf module:webida
    */

    /**
    * Token generator object. You can override the default TokenGenerator functions using this.
    * @typedef {object} token_generator
    * @property {module:webida.TokenGenerator.validateToken} [validateToken] - validateToken() function
    * @property {module:webida.TokenGenerator.generateNewToken} [generateNewToken] - generateNewToken() function
    * @memberOf module:webida
    */

    /**
    * Token object.
    * @typedef {object} token_object
    * @property {Number} issueTime - access token issued time
    * @property {string} data - access token value
    * @memberOf module:webida
    */

    /**
    * webida configuration object.
    * @typedef {object} webida_config
    * @property {string} webidaHost - webida host address
    * @property {string} fsServer - fs server address
    * @property {string} authServer - auth server address
    * @property {string} appServer - app server address
    * @property {string} fsApiBaseUrl - fs api base url
    * @property {string} authApiBaseUrl - auth api base url
    * @property {string} appApiBaseUrl - app api base url
    * @memberOf module:webida
    */

    /**
    * Lock information.
    * @typedef {object} lock_info
    * @property {string} path - file path
    * @property {int} uid - user id
    * @property {string} timestamp - locked time
    */

    /**
    * File link information.
    * @typedef {object} file_link_info
    * @property {string} fsid - filesystem id
    * @property {string} fileId - guid for the file
    * @property {string} filePath - file path string
    * @memberOf module:webida
    */

    /**
    * @class FileSystem
    * @classdesc This class represents a Webida FileSystem.
    * @property {module:webida.fs_url} fsUrl - Url for the Webida FileSystem. eg. wfs://host/fsid
    * @property {string} protocol - Protocol eg. wfs
    * @property {string} host - Host name
    * @property {string} fsid - File system id
    * @constructor FileSystem
    * @param {module:webida.fs_url} fsUrl - Url for the Webida FileSystem. eg. wfs://host/fsid
    * @returns {module:webida.FSService.FileSystem}
    * @memberOf module:webida.FSService
    */
    mod.FSService.FileSystem = function FileSystem(fsUrl) {
        this.fsUrl = fsUrl;
        var splittedUrl = fsUrl.split('/');
        this.protocol = splittedUrl[0];
        this.host = splittedUrl[2];
        this.fsid = splittedUrl[3];
    };
    var FileSystem = mod.FSService.FileSystem;

    /**
    * Get the current usage of filesystem
    *
    * @method getQuotaUsage
    * @param {module:webida.request_callback_with_filesystem_usage} callback -
    *        (error:callback_error, [usage:string]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And 'usage' is the size of all data in the filesystem in bytes.
    *        This value might not be updated up to 1 minute.
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.getQuotaUsage = function (callback) {
        var self = this;
        function restApi() {
            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/usage/' + self.fsid,
                data: null,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get the quota limit of filesystem
    *
    * @method getQuotaLimit
    * @param {module:webida.request_callback_with_filesystem_limit} callback -
    *        (error:callback_error, [limit:string]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And <tt>limit</tt> is the limit of all data in the filesystem in bytes.
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.getQuotaLimit = function (callback) {
        var self = this;
        function restApi() {
            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/limit/' + self.fsid,
                data: null,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * This function let the browser download the zipped file.
    *
    * @method exportZip
    * @param {Array.<module:webida.path>} sourceList - Source path list. eg. ['/ws1/file1', 'ws1/file2']
    * @param {string} fileName - File name of the zipfile. eg. "archive.zip"
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.exportZip = function (sourceList, filename) {
        var argument = '/?source=' +
            encodeURIComponent(sourceList.join(';')) + '&target=' + encodeURIComponent(filename) + '&mode=export';
        var url = mod.conf.fsApiBaseUrl + '/archive/' + this.fsid + argument;

        function restApi() {
            window.open(url + '&access_token=' + token.data);
        }

        ensureAuthorize(restApi);
    };

   /**
    *
    * Create a archive file (zip)
    *
    * @method createZip
    * @param {Array.<module:webida.path>} sourceList -
    * Source path list(eg. ['/ws1/file1', 'ws1/file2']) for creating zipfile.
    * @param {module:webida.path} target - Created zip file path.
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined.
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.createZip = function (sourceList, target, callback) {
        var self = this;
        function restApi() {
            var data = {
                source : sourceList.join(';'),
                target : target,
                mode : 'create'
            };

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/archive/' + self.fsid + '/',
                data: data,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

   /**
    *
    * Extract a archive file (zip)
    *
    * @method extractZip
    * @param {module:webida.path} source - Source zip file path(eg. /ws1/file1.zip).
    * @param {module:webida.path} target - Extract file path.
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined.
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.extractZip = function (source, target, callback) {
        var self = this;
        function restApi() {
            var data = {
                source : source,
                target : target,
                mode : 'extract'
            };

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/archive/' + self.fsid + '/',
                data: data,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Search lines matching a pattern in file contents
    *
    * @method searchFiles
    * @param {string} pattern - Search regular expression pattern. eg. <tt>a+b+c</tt>
    * @param {module:webida.path} where - Find target path
    * @param {module:webida.search_option} options - Search option
    * @param {module:webida.request_callback_with_search_result} callback -
    *        (error:callback_error, [result:[search_result]]) → undefined
    *        <br>If function finished successfully then error is undefined
    *        And 'result' is search result list.
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.searchFiles = function (pattern, where, options, callback) {
        var self = this;
        function restApi() {
            pattern = encodeURIComponent(pattern);

            var data = {};
            if (options !== undefined) {
                data = options;
            }
            data.where = where;

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/search/' + self.fsid + '/' + pattern,
                data: data,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
     * Search and replace files matching served pattern with a replace pattern
     *
     * @param {string} pattern - Search regular expression pattern. eg. <tt>a+b+c</tt>
     * @param {string} replacePattern - Replace regular expression pattern.
     * @param {module:webida.path[]} where - target path array to replace
     * @param {module:webida.search_option} options - Search and replace option
     * @param {module:webida.request_callback} callback -
     *        (error:callback_error) → undefined
     *        <br>If function finished successfully then error is undefined
     * @memberOf module:webida.FSService.FileSystem
     */
    FileSystem.prototype.replaceFiles = function (pattern, replacePattern, where, options, callback) {
        var self = this;
        function restApi() {
            var data = {};
            if (options !== undefined) {
                data = options;
            }
            if (where && where instanceof Array) {
                where = where.map(encodeURIComponent);
            }
            data.where = where;
            data.pattern = pattern;
            data.replacePattern = replacePattern;

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/replace/' + self.fsid,
                type: 'POST',
                data: data,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Copy from source to destination. You can specify recursive mode.
    *
    * @method copy
    * @param {module:webida.path} source - Source path
    * @param {module:webida.path|module:webida.fs_url_path} destination - Destination path or destination url
    * @param {boolean} [mode=false] - Recursive mode. "true" | "false" (default is "false")
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.copy = function (src, dest, recursive, callback) {
        var self = this;
        function restApi() {
            var data = {
                src: src,
                dest: dest,
                sessionID: sessionID
            };

            if (typeof recursive === 'function') {
                callback = recursive;
            } else {
                data.recursive = recursive;
            }

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/copy/' + self.fsid + '/',
                type: 'POST',
                data: data,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Create a directory. You can specify recursive mode.
    *
    * @method createDirectory
    * @param {module:webida.path} target - Directory path whitch to be crated.
    * @param {boolean} [mode=false] - Recursive mode. "true" | "false" (default is "false")
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.createDirectory = function (path, recursive, callback) {
        var self = this;
        function restApi() {
            var data = {};
            path = encodeURI(path);

            if (typeof recursive === 'function') {
                callback = recursive;
            } else {
                if (recursive === true) {
                    data.recursive = true;
                }
            }

            data.sessionID = sessionID;

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/directory/' + self.fsid + '/' + path,
                type: 'POST',
                data: data,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Checks whether the specified path exists.
    *
    * @method exists
    * @param {module:webida.path} target - Check path.
    * @param {module:webida.request_callback_with_result_flag} callback -
    *        (error:callback_error, [result:boolean]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And if file exist then resultFlag is true. Otherwise resultFlag is false.
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.exists = function (path, callback) {
        var self = this;
        function restApi() {
            path = encodeURI(path);

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/exists/' + self.fsid + '/' + path,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Checks whether the specified path is a directory.
    *
    * @method isDirectory
    * @param {module:webida.path} target - Check path.
    * @param {module:webida.request_callback_with_result_flag} callback -
    *        (error:callback_error, [result:boolean]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And if target path is directory then resultFlag is true. Otherwise resultFlag is false.
    *        And if target path does not exist then error has error message.
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.isDirectory = function (path, callback) {
        var self = this;
        self.stat([path], function (err, data) {
            if (err) {
                return callback(err);
            }

            if (!data || !data[0]) {
                callback('Can not find directory information');
            } else {
                callback(null, data[0].isDirectory);
            }
        });
    };

    /**
    * Checks whether the specified path is a emtpy directory.
    *
    * @method isEmpty
    * @param {module:webida.path} target - Check path
    * @param {module:webida.request_callback_with_result_flag} callback -
    *        (error:callback_error, [result:boolean]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And if target path is empty directory then resultFlag is true. Otherwise resultFlag is false.
    *        If target path is file then error is string. path must be directory.
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.isEmpty = function (path, callback) {
        var self = this;
        function restApi() {
            path = encodeURI(path);

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/list/' + self.fsid + '/' + path,
                callbackWithRawData: function (data) {
                    data = JSON.parse(data);
                    if (data.result === 'ok') {
                        var listlen = data.data.length;

                        if (listlen === 0) {
                            // if the path is empty directory, return true
                            callback(null, true);
                        } else {
                            // if the path is not empty directory, return false
                            callback(null, false);
                        }
                    } else {
                        callback(data.reason);
                    }
                },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Checks whether the specified path is a file.
    *
    * @method isFile
    * @param {module:webida.path} target - Check path
    * @param {module:webida.request_callback_with_result_flag} callback -
    *        (error:callback_error, [result:boolean]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And if target path is file then resultFlag is true. Otherwise resultFlag is false.
    *        And if target path does not exist then error has error message.
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.isFile = function (path, callback) {
        var self = this;
        self.stat([path], function (err, data) {
            if (err) {
                return callback(err);
            }

            if (!data || !data[0]) {
                callback('Can not find file information');
            } else {
                callback(null, data[0].isFile);
            }
        });
    };

    /**
    * Get the list of specified path. You can specify recursive mode.
    *
    * @method list
    * @param {module:webida.path} target - List directory path
    * @param {boolean} [mode=false] - Recursive mode. true | false (default is false)
    * @param {module:webida.request_callback_with_list_contents} callback -
    *        (error:callback_error, [contents:[list_info]]) → undefined
    *        <br>If function finished successfully then err is undefined.
    *        And contents is sub directory/file information list.
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.list = function (path, recursive, callback) {
        var self = this;
        function restApi() {
            var data = {};
            path = encodeURI(path);

            if (typeof recursive === 'function') {
                callback = recursive;
                data.recursive = 'false';
            } else if (recursive) {
                data.recursive = 'true';
            } else {
                data.recursive = 'false';
            }

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/list/' + self.fsid + '/' + path,
                data: data,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    // options: {recursive, dirOnly, fileOnly}
    /**
    * Get the list of specified path with options. <br>
    * You can specify recursive, dirOnly, fileOnly options as a parameter.
    *
    * @method listEx
    * @param {module:webida.path} target - List directory path
    * @param {module:webida.list_option} [options] - Options for list.
    * @param {module:webida.request_callback_with_list_contents} callback -
    *        (error:callback_error, [contents:[list_info]]) → undefined
    *        <br>If function finished successfully then err is undefined.
    *        And contents is sub directory/file information list.
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.listEx = function (path, options, callback) {
        var self = this;
        function restApi() {
            var data = {};
            path = encodeURI(path);

            if (typeof options === 'function') {
                callback = options;
            } else {
                data = options;
            }

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/listex/' + self.fsid + '/' + path,
                data: data,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get the stat of specified path.
    *
    * @method stat
    * @param {Array.<module:webida.path>} pathList - Check path
    * @param {module:webida.request_callback_with_stat_infos} callback -
    *        (error:callback_error, [content:[stat_info]]) → undefined
    *        size:int, atime:string, mtime:string, ctime:string}]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And stat_infos is an array of stat informations.
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.stat = function (pathList, callback) {
        var self = this;
        function restApi() {
            var data = { source : pathList.join(';') };

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/stat/' + self.fsid + '/',
                data: data,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Delete the directory or file. You can specify recursive mode.
    *
    * @method delete
    * @param {module:webida.path} target - Target path
    * @param {boolean} [mode=false] - Recursive mode. "true" | "false" (default is "false")
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.delete = function (path, recursive, callback) {
        var self = this;
        function restApi() {
            var data = {};
            path = encodeURI(path);

            if (typeof recursive === 'function') {
                callback = recursive;
                data.recursive = 'false';
            } else if (recursive) {
                data.recursive = 'true';
            } else {
                data.recursive = 'false';
            }

            data.sessionID = sessionID;

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/file/' + self.fsid + '/' + path,
                type: 'DELETE',
                data: data,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Move file
    *
    * @method move
    * @param {module:webida.path} oldPath - Source path
    * @param {module:webida.path|module:webida.fs_url_path} newPath - Destination path or destination url
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.move = function (oldpath, newpath, callback) {
        var self = this;
        function restApi() {
            var data = {
                oldpath: oldpath,
                newpath: newpath,
                sessionID: sessionID
            };

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/rename/' + self.fsid + '/',
                type: 'POST',
                data: data,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Read a file contents.
    *
    * @method readFile
    * @param {module:webida.path} target - Read file path
    * @param {module:webida.responseType} [responseType=""] -
    *        Response type to be used for XMLHttpRequest call.
    *        If not specified, the default is empty string that means response is assumed text.
    *        'text', 'arraybuffer', 'blob', etc are supported by most browsers.
    *        See https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#Properties
    * @param {module:webida.request_callback_with_file_data} callback -
    *        (error:callback_error, [content:string]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And contents is file contents.
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.readFile = function (path, responseType, callback) {
        var self = this;
        if (!callback) {
            callback = responseType;
            responseType = '';
        }
        function restApi() {
            path = encodeURI(path);

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/file/' + self.fsid + '/' + path,
                callbackWithRawData: function (data) {
                    callback(null, data);
                },
                responseType: responseType,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * File write unsing input data
    *
    * @method writeFile
    * @param {module:webida.path} target - Path of the file in filesystem
    * @param {module:webida.file|module:webida.blob|string} data - File or blob object
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.writeFile = function (path, data, callback) {
        var self = this;
        function restApi() {
            var fd = new FD();
            path = encodeURI(path);

            if (typeof data === 'string') {
                var blob = createBlobObject(data, 'application/octet-stream');
                fd.append('file', blob);
            } else if (data instanceof window.Blob) {
                fd.append('file', data);
            } else {
                return callback('Data must be File or Blob object');
            }

            if (sessionID) {
                fd.append('sessionID', sessionID);
            }

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/file/' + self.fsid + '/' + path,
                type: 'POST',
                data: fd,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Lock the file
    *
    * @method lockFile
    * @param {module:webida.path} file - File path to lock.<br>
             Folder is not a target of lock.
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.lockFile = function (file, callback) {
        var self = this;
        function restApi() {
            file = encodeURI(file);
            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/lockfile/' + self.fsid + '/' + file,
                data: { sessionID: sessionID },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Unlock the file
    *
    * @method unlockFile
    * @param {module:webida.path} file - file to unlock
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.unlockFile = function (file, callback) {
        var self = this;
        function restApi() {
            file = encodeURI(file);

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/unlockfile/' + self.fsid + '/' + file,
                data: { sessionID: sessionID },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get the locked file list
    *
    * @method getLockedFiles
    * @param {module:webida.path} path - path want to get the list<br>
             Need the read permission for the path to use this api.
    * @param {module:webida.request_callback_with_lock_info_list} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.getLockedFiles = function (path, callback) {
        var self = this;
        function restApi() {
            path = encodeURI(path);

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/getlockedfiles/' + self.fsid + '/' + path,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get file link infomation
    *
    * @method getFileLink
    * @param {module:webida.fileId} fileId - file id has a guid format
    * @param {module:webida.request_callback_with_file_link} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.getFileLink = function (fileId, callback) {
        var self = this;
        function restApi() {
            fileId = encodeURI(fileId);

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/flink/' + self.fsid + '/' + fileId,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get file link infomation by file path
    *
    * @method getFileLinkByPath
    * @param {module:webida.filePath} filePath - file path
    * @param {module:webida.request_callback_with_file_link} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.getFileLinkByPath = function (filePath, callback) {
        var self = this;
        function restApi() {
            filePath = encodeURI(filePath);

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/flinkbypath/' + self.fsid + '/' + filePath,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };


    /**
    * Register user's keystore file
    *
    * @method registerKeystoreFile
    * @param {module:webida.filename} target - The name of keystore file
    * @param {module:webida.keyInfo|module:string} keyInfo - key information
    * @param {module:webida.file|module:webida.blob|string} data - File or blob object
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.registerKeystoreFile = function (filename, keyInfo, data, callback) {
        var self = this;
        function restApi() {
            var fd = new FD();

            fd.append('keyInfo', JSON.stringify(keyInfo));

            if (typeof data === 'string') {
                var blob = createBlobObject(data, 'application/octet-stream');
                fd.append('file', blob);
            } else if (data instanceof window.Blob) {
                fd.append('file', data);
            } else {
                return callback('Data must be File or Blob object');
            }

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/mobile/ks/' + self.fsid + '/' + filename,
                type: 'POST',
                data: fd,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Remove user's keystore file
    *
    * @method removeKeystoreFile
    * @param {module:webida.alias} - alias name of keystore file
    * @param {module:webida.filename} - name of keystore file
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.removeKeystoreFile = function (alias, filename, callback) {
        var self = this;
        function restApi() {

            var data  = {
                alias: alias,
                filename: filename
            };

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/mobile/ks/' + self.fsid,
                type: 'DELETE',
                data: data,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * get user's keystore info. list
    *
    * @method getKeystoreList
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.getKeystoreList = function (callback) {
        var self = this;
        function restApi() {


            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/mobile/ks/' + self.fsid,
                type: 'GET',
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get metadata of a resource.
    * Only fs owner can read metadata.
    *
    * @method getMeta
    * @param {module:webida.path} target - File path
    * @param {String} metaName - name of the metadata
    * @param {module:webida.request_callback_with_metadata} callback -
    *        (error:callback_error, [metadata:metadata]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And metadata is a string value associated with the metaName and resource.
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.getMeta = function (path, metaName, callback) {
        var self = this;
        function restApi() {
            path = encodeURI(path);

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/meta/' + self.fsid + '/' + path,
                data: { name: metaName },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Set ACL of a resource.
    * Only fs owner can write metadata.
    *
    * @method setMeta
    * @param {string} target - File path
    * @param {String} metaName - name of the metadata
    * @param {module:webida.metadata} metadata - a string value to be associated with the metaName and resource
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.setMeta = function (path, metaName, metadata, callback) {
        var self = this;
        function restApi() {
            var data = {
                name: metaName,
                data: metadata
            };
            path = encodeURI(path);

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/meta/' + self.fsid + '/' + path,
                type: 'POST',
                data: data,
                callback: callback
            });
        }
        ensureAuthorize(restApi);
    };

    /**
    * Add temporary public alias for a path.
    * This requires FS owner permission.
    *
    * @method addAlias
    * @param {string} path - path in this fs
    * @param {int} expireTime - expire time of the alias in seconds
    * @param {module:webida.request_callback_with_alias_info} callback -
    *        (error:callback_error, [aliasInfo:alias_info]) → undefined
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.addAlias = function (path, expireTime, callback) {
        var self = this;
        function restApi() {
            path = encodeURI(path);

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/alias/' + self.fsid + '/' + path,
                type: 'POST',
                data: { expireTime: expireTime },
                callback: callback
            });
        }
        ensureAuthorize(restApi);
    };

    /**
    * Delete alias
    *
    * @method deleteAlias
    * @param {string} aliasKey - aliasKey
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.deleteAlias = function (aliasKey, callback) {
        function restApi() {
            aliasKey = encodeURI(aliasKey);

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/alias/' + aliasKey,
                type: 'DELETE',
                callback: callback
            });
        }
        ensureAuthorize(restApi);
    };

    /**
    * Get alias info
    *
    * @method getAliasInfo
    * @param {string} aliasKey - aliasKey
    * @param {module:webida.request_callback_with_alias_info} callback -
    *        (error:callback_error, [aliasInfo:alias_info]) → undefined
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.getAliasInfo = function (aliasKey, callback) {
        function restApi() {
            aliasKey = encodeURI(aliasKey);

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/alias/' + aliasKey,
                type: 'GET',
                callback: callback
            });
        }
        ensureAuthorize(restApi);
    };

    /**
    * Execute command where filesystem.
    *
    * @method exec
    * @param {module:webida.path} cwd - Working directory.
    * @param {module:webida.execution_info} info - Execution command information.
    * @param {module:webida.request_callback_with_result_log} callback -
    *        (error:callback_error, [log:string]) → undefined
    *        <br>If function finished successfully then err is undefined.
    *        And command execute successfully then command's output send resultLog.
    * @memberOf module:webida.FSService.FileSystem
    */
    FileSystem.prototype.exec = function (path, info, callback) {
        var self = this;
        function restApi() {
            path = encodeURI(path);

            var data = {
                info: JSON.stringify(info),
                sessionID: sessionID
            };

            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/exec/' + self.fsid + '/' + path,
                type: 'POST',
                data: data,
                callback: callback,
                callbackWithRawData: function (data) {
                    data = JSON.parse(data);
                    if (data.result === 'ok') {
                        callback(null, data.data.stdout, data.data.stderr);
                    } else {
                        callback(data.reason);
                    }
                }
            });
        }

        ensureAuthorize(restApi);
    };
    /**
    * API helper function with callback function.
    * And API callback's parameter is error.
    * If error callback function's parameter omitted then error string is printed in console.log
    *
    * @method CB
    * @param {module:webida.api_function} APIFunction - API function.
    * @param {Array.<_a>} APIParameters - API parameter. It must be array.
    * @param {module:webida.api_success_function} succFunction - This function called when API successfully finished.
    * @param {module:webida.api_error_function} [errorFunction] - This function called when API error occrued.
    *           If this parameter is omitted then error is printed in console.log
    * @memberOf module:webida.FSService.FileSystem
    * @example
    * var checkPath = 'exist/check/path';
    * var succFunc = function (result) { console.log("CHECK EXIST PATH : " + result); }
    * var errFunc = function (err) { console.log("API ERROR : " + err); }
    * webidafs.CB(webidafs.exists, [checkPath], succFunc, errFunc);
    */
    FileSystem.prototype.CB = function (api, params, succFunc, errFunc) {
        if (!errFunc) {
            errFunc = function (error) {
                console.log(error);
            };
        }

        var callbackFunc = function (error, data) {
            if (error) {
                errFunc.apply(this, [error]);
            } else {
                succFunc.apply(this, [data]);
            }
        };

        params.push(callbackFunc);

        api.apply(this, params);
    };

    /**
    * API helper function with callback function.
    * And API callback's parameter is error and result boolean flag.
    * If error callback function's parameter omitted then error string is printed in console.log
    *
    * @method CBIf
    * @param {module:webida.api_function} APIFunction - API function.
    * @param {Array.<_a>} APIParameters - API parameters. It must be array.
    * @param {module:webida.api_success_function} trueFunction -
        This function called when API successfully finished and return value is true.
    * @param {module:webida.api_success_function} falseFunction -
        This function called when API successfully finished and return value is false.
    * @param {module:webida.api_error_function} [errorFunction] - This function called when API error occrued.
    *           If this parameter is omitted then error is printed in console.log
    * @memberOf module:webida.FSService.FileSystem
    * @example
    * var checkPath = 'empty/check/directory';
    * var trueFunc = function (result) { console.log('THIS DIRECTORY IS EMPTY'); }
    * var falseFunc = function (result) { console.log('THIS DIRECTORY IS NOT EMPTY'); }
    * var errFunc = function (err) { console.log("API ERROR : " + err); }
    * webidafs.CBIf(webidafs.isEmpty, [checkPath], trueFunc, falseFunc, errFunc);
    */
    FileSystem.prototype.CBIf = function (api, params, trueFunc, falseFunc, errFunc) {
        if (!errFunc) {
            errFunc = function (error) {
                console.log(error);
            };
        }

        var callbackFunc = function (error, flag) {
            if (error) {
                errFunc.apply(this, [error]);
            } else {
                if (flag) {
                    trueFunc.apply(this);
                } else {
                    falseFunc.apply(this);
                }
            }
        };

        params.push(callbackFunc);

        api.apply(this, params);
    };


    /**
     * get External Drag & Drop's download URL for dataTransfer object including authorized token
     * @param {boolean} archiving - whether it needs archiving download files or not
     * @param {string} sources - file path(s) relative with file system to download
     *      Semicolon(';') can be used to present multiple paths.
     * @param {string} downloadFileName - the file name to be downloaded (including file extension)
     * @param callback
     * @memberOf module:webida.FSService.FileSystem
     */
    FileSystem.prototype.makeDnDDownloadUrl = function(archiving, sources, downloadFileName, callback) {
        var self = this;
        ensureAuthorize(function () {
            var downloadUrl = 'application/octet-stream:' + downloadFileName + ':' +
                mod.conf.fsApiBaseUrl;
            if (archiving) {
                downloadUrl += '/archive/' + self.fsid + '/?mode=export&source=' + sources +
                    '&access_token=' + mod.auth.getToken();
            } else {
                downloadUrl += '/file/' + self.fsid + sources + '?access_token=' + mod.auth.getToken();
            }
            callback(null, downloadUrl);
        });
    };

    /**
    * Get FileSystem object indicating the given Webida file system url
    *
    * @method mount
    * @param {module:webida.fs_url} fsUrl - Webida file system url
    * @returns {FSService.FileSystem} - Mounted file system object
    * @memberOf module:webida.FSService
    */
    mod.FSService.prototype.mount = function (fsUrl) {
        return new mod.FSService.FileSystem(fsUrl);
    };

    /**
    * Get FileSystem object indicating the given Webida file system id
    * @method mountByFSID
    * @param {string} fsid - Webida file system id
    * @returns {FSService.FileSystem} - Mounted file system object
    * @memberOf module:webida.FSService
    */
    mod.FSService.prototype.mountByFSID = function (fsid) {
        return new mod.FSService.FileSystem('wfs://webida/' + fsid);
    };

    /**
    * Get my file system object
    *
    * @method getMyFS
    * @param {module:webida.request_callback_with_filesystem} callback -
    *        (error:callback_error, [fs:FileSystem]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And filesystem is file system object.
    * @memberOf module:webida.FSService
    */
    mod.FSService.prototype.getMyFS = function (callback) {
        mod.fs.getMyFSInfos(function (err, fsInfos) {
            if (err) {
                return callback(err);
            }

            if (!fsInfos || fsInfos.length <= 0) {
                return callback(new Error('You have no FS'));
            }

            var fs = mod.fs.mountByFSID(fsInfos[0].fsid);

            callback(null, fs);
        });
    };

    /**
    * Get my file system info list
    *
    * @method getMyFSInfos
    * @param {module:webida.request_callback_with_filesystem_info_list} callback -
    *        (error:callback_error, [fsInfos:[fs_info]]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And fsInfos is my file system information list.
    * @memberOf module:webida.FSService
    */
    mod.FSService.prototype.getMyFSInfos = function (callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.fsApiBaseUrl,
                callback: callback
            });
        }
        ensureAuthorize(restApi);
    };

    /**
    * Add my file system object
    *
    * @method addMyFS
    * @param {module:webida.request_callback_with_filesystem_info} callback -
    *        (error:callback_error, [fsinfo:fs_info]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And fsinfo is my file system information.
    * @memberOf module:webida.FSService
    */
    mod.FSService.prototype.addMyFS = function (callback) {
        function restApi() {
            mod.auth.getMyInfo(function (err, myinfo) {
                if (err) { return callback(err); }

                var data = { owner: myinfo.uid};

                ajaxCall({
                    url: mod.conf.fsApiBaseUrl,
                    type: 'POST',
                    data: data,
                    callback: callback
                });
            });
        }
        ensureAuthorize(restApi);
    };

    /**
    * Delete filesystem
    *
    * @method deleteFS
    * @param {string} fsid - Webida file system id
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined.
    * @memberOf module:webida.FSService
    */
    mod.FSService.prototype.deleteFS = function (fsid, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.fsApiBaseUrl + '/' + fsid,
                type: 'DELETE',
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Delete all my filesystems
    *
    * @method deleteAllMyFS
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined.
    * @memberOf module:webida.FSService
    */
    mod.FSService.prototype.deleteAllMyFS = function (callback) {
        mod.fs.getMyFSInfos(function (err, fsInfos) {
            if (err) {
                return callback(err);
            }

            if (fsInfos.length === 0) {
                return callback(new Error('You have no FS'));
            }

            var count = 0, escape = false;
            Object.keys(fsInfos).forEach(function (i) {
                if (escape) {
                    return;
                }

                mod.fs.deleteFS(fsInfos[i].fsid, function (err) {
                    count++;

                    if (escape) {
                        return;
                    }

                    if (err) {
                        escape = true;
                        return callback(err);
                    }

                    if (count === fsInfos.length) {
                        return callback(null);
                    }
                });
            });
        });
    };

    /**
    * Check input domain's validation. check format and domain name uniq.
    *
    * @method isValidDomain
    * @param {module:webida.domain} domain - Application domain
    * @param {module:webida.request_callback_with_result_flag} callback -
    *        (error:callback_error, [result:boolean]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And if file exist then resultFlag is true. Otherwise resultFlag is false.
    * @memberOf module:webida.AppService
    */
    mod.AppService.prototype.isValidDomain = function (domain, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.appApiBaseUrl + '/isValidDomain',
                data: { domain: domain },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get the host of currently used server
    *
    * @method getHost
    * @returns {string} Host of current server. eg. 'webida.org'
    * @memberOf module:webida.AppService
    */
    mod.AppService.prototype.getHost = function () {
        return mod.conf.webidaHost;
    };

    /**
    * Check input application type's validation
    *
    * @method isValidAppType
    * @param {module:webida.app_type} apptype - Application type
    * @returns {boolean} Application type validation check result.
    * @memberOf module:webida.AppService
    */
    var VALID_APPTYPES = ['html', 'nodejs'];
    mod.AppService.prototype.isValidAppType = function (apptype) {
        for (var i in VALID_APPTYPES) {
            if (VALID_APPTYPES.hasOwnProperty(i) && VALID_APPTYPES[i] === apptype) {
                return true;
            }
        }
        return false;
    };

    /**
    * Create application
    *
    * @method createApp
    * @param {module:webida.domain} domain - Application sub domain.
    * @param {module:webida.app_type} apptype - Application type
    * @param {string} name - Application name
    * @param {string} desc - Application description
    * @param {module:webida.request_callback_with_appid} callback -
    *        (error:callback_error, [appid:string]) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.AppService
    */
    mod.AppService.prototype.createApp = function (domain, apptype, name, desc, callback) {
        function restApi() {
            if (!mod.app.isValidAppType(apptype)) {
                callback({result: 'failed', reason: 'Invalid apptype'});
                return;
            }

            var data = {
                domain: domain,
                apptype: apptype,
                name: name,
                desc: desc
            };

            ajaxCall({
                url: mod.conf.appApiBaseUrl + '/create',
                data: data,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Change application's information
    *
    * @method setAppInfo
    * @param {string} app_id - Application id
    * @param {module:webida.domain} domain - Application domain
    * @param {module:webida.app_type} type - Application type. "html" | "nodejs"
    * @param {string} name - Application name
    * @param {string} desc - Application description
    * @param {module:webida.fs_url_path} [srcurl] - Application source path
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.AppService
    */
    mod.AppService.prototype.setAppInfo = function (appid, domain, apptype, name, desc, srcurl, callback) {
        function restApi() {
            var data = {
                appid: appid,
                newdomain: domain,
                newapptype: apptype,
                newname: name,
                newdesc: desc
            };

            if (typeof srcurl === 'function') {
                callback = srcurl;
            }  else {
                data.newsrcurl = srcurl;
            }

            if (!mod.app.isValidAppType(apptype)) {
                callback({result: 'failed', reason: 'Invalid apptype'});
                return;
            }

            ajaxCall({
                url: mod.conf.appApiBaseUrl + '/changeappinfo',
                data: data,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get my application list
    *
    * @method getMyAppInfo
    * @param {module:webida.request_callback_with_app_info_list} callback -
    *        (error:callback_error, [content:[app_info]]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And myAppInfoList is my application informaiton list.
    * @memberOf module:webida.AppService
    */
    mod.AppService.prototype.getMyAppInfo = function (callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.appApiBaseUrl + '/myapps',
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get all application list
    *
    * @method getAllAppInfo
    * @param {module:webida.request_callback_with_app_info_list} callback -
    *        (error:callback_error, [content:[app_info]]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And allAppInfoList is all application informaiton list.
    * @memberOf module:webida.AppService
    */
    mod.AppService.prototype.getAllAppInfo = function (callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.appApiBaseUrl + '/allapps',
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get application information using application id.
    *
    * @method getAppInfo
    * @param {string} appid - Application id.
    * @param {module:webida.request_callback_with_app_info} callback -
    *        (error:callback_error, [content:app_info]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And appInfo is application informaiton.
    * @memberOf module:webida.AppService
    */
    mod.AppService.prototype.getAppInfo = function (appid, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.appApiBaseUrl + '/appinfo',
                data: { appid: appid },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Delete application.
    *
    * @method deleteApp
    * @param {string} appid - Application id.
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.AppService
    */
    mod.AppService.prototype.deleteApp = function (appid, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.appApiBaseUrl + '/delete',
                data: { appid: appid },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Delete all my applications.
    *
    * @method deleteMyApps
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.AppService
    */
    mod.AppService.prototype.deleteMyApps = function (callback) {
        mod.app.getMyAppInfo(function (err, infos) {
            if (err) {
                callback(err);
            }

            if (infos.length === 0) {
                callback(null);
            }

            var count = 0, escape = false;
            Object.keys(infos).forEach(function (i) {
                if (escape) {
                    return;
                }

                mod.app.deleteApp(infos[i].appid, function (err) {
                    count++;

                    if (escape) {
                        return;
                    }

                    if (err) {
                        escape = true;
                        return callback(err);
                    }

                    if (count === infos.length) {
                        return callback(null);
                    }
                });
            });
        });
    };

    /**
    * Start application.
    *
    * @method startApp
    * @param {string} appid - Application id.
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.AppService
    */
    mod.AppService.prototype.startApp = function (appid, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.appApiBaseUrl + '/start',
                data: { appid: appid },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Stop application.
    *
    * @method stopApp
    * @param {string} appid - Application id.
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.AppService
    */
    mod.AppService.prototype.stopApp = function (appid, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.appApiBaseUrl + '/stop',
                data: { appid: appid },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Deploy application.
    *
    * @method deployApp
    * @param {string} appid - Application id.
    * @param {module:webida.fs_url_path} srcUrl - Application source url
    * @param {module:webida.deploy_type} type - Deploy type. 'git' | 'url'
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.AppService
    */
    mod.AppService.prototype.deployApp = function (appid, srcUrl, type, callback) {
        function restApi() {
            var data = {
                appid: appid,
                srcUrl: srcUrl,
                type: type
            };

            ajaxCall({
                url: mod.conf.appApiBaseUrl + '/deploy',
                data: data,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Register the access token to the webida module to use webida api authorization.
    *
    * @method registerToken
    * @param {string} tokenString - access token
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.registerToken = function (tokenString) {
        token.issueTime = Date.now();
        token.data = tokenString;
        var keys = Object.keys(tokenChangeListeners);
        var length = keys.length;
        var listener = null;
        for (var i = 0; i < length; i++) {
            listener = tokenChangeListeners[keys[i]];
            listener(tokenString);
        }
    };

    /**
    * Get the access token object
    *
    * @method getTokenObj
    * @returns {module:webida.token_object} access token object
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.getTokenObj = function () {
        return token;
    };

    /**
    * Get the access token
    *
    * @method getToken
    * @returns {string} access token value
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.getToken = function () {
        return token.data;
    };

    /**
    * Add the token change listener.
    * This is called when the new token is registered.
    *
    * @method addTokenChangeListener
    * @param {module:webida.token_change_listener} listener - token change listener
    * @returns {string} id - listener id
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.addTokenChangeListener = function (listener) {
        var id = '__TCL' + tokenChangeListenerId;
        tokenChangeListeners[id] = listener;
        tokenChangeListenerId++;
        return id;
    };

    /**
    * Delete the token change listener.
    *
    * @method deleteTokenChangeListener
    * @param {string} listenerID - listener id returned by {@link module:webida.AuthService.addTokenChangeListener}
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.deleteTokenChangeListener = function (listenerID) {
        delete tokenChangeListeners[listenerID];
    };

    /**
     * Get the deployed App's url.
     *
     * @method getDeployedAppUrl
     * @param {module:webida.domain} domain - Application domain
     * @param {string} queryString - Application launch option. This string is added in tartget url.
     * @returns {string} accessible url
     * @memberOf module:webida.AppService
     */
    mod.AppService.prototype.getDeployedAppUrl = function (domain, queryString) {
        var deployConf = mod.conf.deploy;

        var addr = mod.app.getHost();
        if (deployConf.type === 'domain' || domain === '') {
            // When system deployType is 'domain' or this app is a system client app(domain is empty).
            addr = (domain ? domain + '.' : '') + addr;
        } else {
            addr = addr + '/' + deployConf.pathPrefix + '/' + domain;
        }
        var url = window.location.protocol + '//' + addr + '/';

        //Add query string
        if (queryString) {
            url = url + queryString;
        }
        return url;
    };

    /**
    * Launch application.
    *
    * @method launchApp
    * @param {module:webida.domain} domain - Application domain
    * @param {boolean} mode - Launch mode. If mode is true then new windows opend using app.
    *                         If false then app is launction in current window
    * @param {string} queryString - Application launch option. This string is added in tartget url.
    * @param {module:webida.window_open_option} [newWindowOptions] -
        This param is Window open() Method's options in W3C spec.
        It's working on mode is true. If mode is false then this options not working.
    * @return {window} Window object
    * @memberOf module:webida.AppService
    */
    mod.AppService.prototype.launchApp = function (domain, newWindowFlag, queryString, newWindowOptions) {
        var url = mod.app.getDeployedAppUrl(domain, queryString);

        if (newWindowFlag) {
            if (!newWindowOptions) {
                return window.open(url);
            } else if (newWindowOptions) {
                var name = newWindowOptions.name ? newWindowOptions.name : '_blank';
                var specs = newWindowOptions.specs ? newWindowOptions.specs : '';
                var replace = newWindowOptions.replace;

                if (replace) {
                    return window.open(url, name, specs, replace);
                } else {
                    return window.open(url, name, specs);
                }
            }
        } else {
            return window.location.assign(url);
        }
    };

    /**
    * Log out current user
    *
    * @method logout
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.logout = function (callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.authApiBaseUrl + '/logout/',
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Sign up new user.
    * This api create a temporary user account.
    * Email validation and password registration are needed to activate the account.
    *
    * @method signup
    * @param {string} email - User email
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.signup = function (email, callback) {
        function restApi() {
            var formData = {email: email};

            ajaxCall({
                url: mod.conf.authApiBaseUrl + '/signup',
                type: 'POST',
                data: formData,
                callback: callback
            });
        }

        restApi();
    };

    /**
    * Update the user information.
    *
    * @method updateUser
    * @param {module:webida.user_info} user - email, name, company,
    * telehpone, department, status fields of user_info are updatable.
    * @param {module:webida.request_callback_with_user_info} callback -
    *        (error:callback_error, newUser:user_info) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And newUser is updated user information.
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.updateUser = function (user, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.authApiBaseUrl + '/updateuser/',
                type: 'POST',
                data: user,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get my information.
    *
    * @method getMyInfo
    * @param {module:webida.request_callback_with_user_info} callback -
    *        (error:callback_error, [content:user_info]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And myInfo is my informaiton.
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.getMyInfo = function (callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.authApiBaseUrl + '/myinfo/',
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Delete my account
    *
    * @method deleteMyAccount
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined.
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.deleteMyAccount = function (callback) {
        mod.app.deleteMyApps(function (err) {
            if (err) {
                return callback(err);
            }

            mod.fs.deleteAllMyFS(function (err) {
                if (err) {
                    return callback(err);
                }

                function restApi() {
                    ajaxCall({
                        url: mod.conf.authApiBaseUrl + '/myinfo/',
                        type: 'DELETE',
                        callback: callback
                    });
                }

                ensureAuthorize(restApi);

            });
        });
    };

    mod.AuthService.prototype.deleteAccount = function (uid, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.authApiBaseUrl + '/deleteaccount/',
                data: {uid: uid},
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Change my password.
    *
    * @method changeMyPassword
    * @param {string} oldPassword - old password
    * @param {string} newPassword - new password
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined.
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.changeMyPassword = function (oldPassword, newPassword, callback) {
        var oldPW = window.btoa(oldPassword);
        var newPW = window.btoa(newPassword);
        function restApi() {
            ajaxCall({
                url: mod.conf.authApiBaseUrl + '/changepassword/',
                type: 'POST',
                data: {oldpw: oldPW, newpw: newPW},
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get user information by user name.
    *
    * @method getUserInfoByEmail
    * @param {string} email - User email
    * @param {module:webida.request_callback_with_user_info} callback -
    *        (error:callback_error, [content:user_info]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And userInfo is user informaiton.
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.getUserInfoByEmail = function (email, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.authApiBaseUrl + '/userinfo/',
                data: { email: email},
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Add personal Token.
    *
    * @method addNewPersonalToken
    * @param {module:webida.request_callback_with_token} callback -
    *        (error:string|undefined, [token:string]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And token is new personal token.
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.addNewPersonalToken = function (callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.authApiBaseUrl + '/personaltoken/',
                type: 'POST',
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get personal Tokens.
    *
    * @method getPersonalTokens
    * @param {module:webida.request_callback_with_token_object_list} callback -
    *        (error:string|undefined, [tokens:[token_object]]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And tokens is personal token list.
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.getPersonalTokens = function (callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.authApiBaseUrl + '/personaltoken/',
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Delete personal Token.
    *
    * @method deletePersonalToken
    * @param {string} token - Personal token returned by {@link module:webida.AuthService.addNewPersonalToken}
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.deletePersonalToken = function (deleteToken, callback) {
        function restApi() {
            deleteToken = encodeURI(deleteToken);

            ajaxCall({
                url: mod.conf.authApiBaseUrl + '/personaltoken/' + deleteToken,
                type: 'DELETE',
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get the logged-in status.
    *
    * @method getLoginStatus
    * @param {module:webida.request_callback_with_user_info} callback -
    *        (error:callback_error, [content:user_info]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And myInfo is my informaiton.
    *        This api is not need to get authorization to use.
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.getLoginStatus = function (callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.authApiBaseUrl + '/isloggedin',
                callback: callback
            });
        }

        restApi();
    };

    /**
    * Find user as a specified user_info fields.
    *
    * @method findUser
    * @param {module:webida.user_info} findKeys - Conditions to find user.<br>
            Findable fields are uid, email, status, firstname, lastname, tel, department, isAdmin.
    * @param {module:webida.request_callback_with_user_info_list} callback -
    *        (error:callback_error, users:[user_info]) → undefined<br>
    *        If function finished successfully then error is undefined.<br>
    *        And users is user information list.
    * @memberOf module:webida.AuthService
    * @example
    * var fields = {status:webida.auth.STATUS_PENDING, department:'dev1'};
    * webida.auth.findUser(fields, function (err, users) {});
    */
    mod.AuthService.prototype.findUser = function (fields, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.authApiBaseUrl + '/finduser/',
                data: fields,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    mod.AuthService.prototype.guestLogin = function (callback) {
        ajaxCall({
            url: mod.conf.authApiBaseUrl + '/guestlogin',
            type: 'POST',
            callback: callback
        });
    };

    //db
    //

    mod.DBService.prototype.createDB = function (cb) {
        function restApi() {
            ajaxCall({
                url: mod.conf.dbApiBaseUrl + '/createDb',
                callback: cb
            });
        }
        ensureAuthorize(restApi);
    };

    mod.DBService.prototype.deleteDB = function (cb) {
        function readApi() {
            ajaxCall({
                url: mod.conf.dbApiBaseUrl + '/deleteDb',
                callback: cb
            });
        }
        ensureAuthorize(readApi);
    };

    mod.DBService.prototype.createTable = function (cb) {
        function readApi() {
            ajaxCall({
                url: mod.conf.dbApiBaseUrl + 'createTable',
                callback: cb
            });
        }
        ensureAuthorize(readApi);
    };

    mod.DBService.prototype.deleteTable = function (cb) {
        function readApi() {
            ajaxCall({
                url: mod.conf.dbApiBaseUrl + 'deleteTable',
                callback: cb
            });
        }
        ensureAuthorize(readApi);
    };

    function includeOnce(sURI) {
        var scripts = document.getElementsByTagName('script');
        if (scripts) {
            for (var k = 0; k < scripts.length; k++) {
                if (scripts[k].src === sURI && (typeof io !== 'undefined')) {
                    return;
                }
            }
        }
        console.log('loading javascript...', sURI);
        var jsTag = document.createElement('script');
        jsTag.type = 'text/javascript';
        jsTag.src = sURI;
        document.getElementsByTagName('head')[0].appendChild(jsTag);
    }


    function checkBuildStatus(ntfHost, taskid, cb) {

        var ssio =  ((typeof sio !== 'undefined') && sio) || io;
        var socket = ssio.connect(ntfHost, {'force new connection': true});
        socket.on('connect', function () {
            console.log('connected to notify server');
        });

        socket.on('ready', function (data) {
            console.log(data);
            socket.emit('getBuildStatus', { taskId: taskid});
        });

        socket.on('disconnect', function () {
            console.log('disconnected');
        });
        socket.on('invalid', function (data) {
            console.error(data);
            socket.disconnect();
        });
        socket.on('status', function (data) {
            console.log('status = ' + JSON.stringify(data));
            cb(null, data);
            if (data.status.ret === 'succ' || data.status.ret === 'fail') {
                console.log('disconnecting...');
                socket.disconnect();
            }
        });
    }


    /*
     * Build Service APIs
     */
    mod.BuildService.prototype.buildProject = function (profileInfo, platformInfo, cb) {
        function restApi() {
            var ntfHost = mod.conf.ntfServer;
            var js = ntfHost + '/socket.io/socket.io.js';
            console.log(js);


            if (typeof sio === 'undefined') {
                console.log('include once....');
                includeOnce(js);
            }

            var data  = {
                profileInfo : JSON.stringify(profileInfo),
                platformInfo : JSON.stringify(platformInfo)
            };


            var ncb = function (err, result) {
                console.log(result);
                if (!err) {
                    console.log('ncb = ' + JSON.stringify(result));
                    var taskId = result;
                    checkBuildStatus(ntfHost, taskId, cb);
                }

                cb(err, result);
            };

            ajaxCall({
                url: mod.conf.buildApiBaseUrl + '/build',
                data: data,
                type: 'POST',
                callback: ncb
            });
        }
        ensureAuthorize(restApi);
    };

    mod.BuildService.prototype.buildClean = function (profileInfo, cb) {
        function restApi() {

            var data  = {
                profileInfo : JSON.stringify(profileInfo)
            };

            ajaxCall({
                url: mod.conf.buildApiBaseUrl + '/clean',
                data: data,
                type: 'POST',
                callback: cb
            });
        }
        ensureAuthorize(restApi);
    };

    mod.BuildService.prototype.rebuild = function (profileInfo, platformInfo, cb) {
        function restApi() {
            var ntfHost = mod.conf.ntfServer;
            var js = ntfHost + '/socket.io/socket.io.js';
            console.log(js);
            if (typeof sio === 'undefined') {
                includeOnce(js);
            }

            var data  = {
                profileInfo : JSON.stringify(profileInfo),
                platformInfo : JSON.stringify(platformInfo)
            };


            var ncb = function (err, result) {
                console.log(result);
                if (!err) {
                    console.log('ncb = ' + JSON.stringify(result));
                    var taskId = result;
                    checkBuildStatus(ntfHost, taskId, cb);
                }

                cb(err, result);
            };


            var arrData = [];
            arrData.push(data, data, data);

            ajaxCall({
                url: mod.conf.buildApiBaseUrl + '/rebuild',
                data: data,
                type: 'POST',
                callback: ncb
            });
        }
        ensureAuthorize(restApi);
    };

    mod.BuildService.prototype.registerGCMRegId = function (regid, info, cb) {
        var data  = {
            info : info
        };

        function restApi() {
            ajaxCall({
                url: mod.conf.buildApiBaseUrl + '/gcm/' + regid,
                type: 'POST',
                data: data,
                callback: cb
            });
        }
        ensureAuthorize(restApi);
    };

    mod.BuildService.prototype.removeGCMRegId = function (regid, cb) {
        function restApi() {
            ajaxCall({
                url: mod.conf.buildApiBaseUrl + '/gcm/' + regid,
                type: 'DELETE',
                callback: cb
            });
        }
        ensureAuthorize(restApi);
    };

    mod.BuildService.prototype.getGCMInfo = function (cb) {
        function restApi() {
            ajaxCall({
                url: mod.conf.buildApiBaseUrl + '/gcm',
                type: 'GET',
                callback: cb
            });
        }
        ensureAuthorize(restApi);
    };
    // end of BuildService APIs

    // ACLService APIs

    /**
    * Create the access control policy for Webida ACL service.
    *
    * @method createPolicy
    * @param {module:webida.policy_info} policy - policy object.<br>
             Do not fill the pid, owner fields which will be generated by system.
    * @param {module:webida.request_callback_with_policy_info} callback -
    *        (error:string|undefined, policy:policy_info) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And policy is created policy object.
    * @memberOf module:webida.ACLService
    */
    mod.ACLService.prototype.createPolicy = function (policy, callback) {
        var data = {
            name: policy.name,
            action: JSON.stringify(policy.action),
            resource: JSON.stringify(policy.resource)
        };
        if (policy.effect) {
            data.effect = policy.effect;
        }

        function restApi() {
            ajaxCall({
                url: mod.conf.aclApiBaseUrl + '/createpolicy/',
                type: 'POST',
                data: data,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Create the access control policy for Webida ACL service.
    *
    * @method createPolicies
    * @param {Array.<module:webida.policy_info>} pArr - Array of policy object.<br>
             Do not fill the pid, owner fields which will be generated by system.
    * @param {module:webida.request_callback_with_policy_info_list} callback -
    *        (error:string|undefined, policyArr:[policy_info]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And policyArr is created array of policy object.
    * @memberOf module:webida.ACLService
    */
    mod.ACLService.prototype.createPolicies = function (pArr, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.aclApiBaseUrl + '/createpolicies/',
                type: 'POST',
                data: { data: JSON.stringify(pArr) },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };
    /**
    * Delete the access control policy for Webida ACL service.
    *
    * @method deletePolicy
    * @param {string} pid - policy id in policy_info returned by {@link module:webida.ACLService.createPolicy}
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.ACLService
    */
    mod.ACLService.prototype.deletePolicy = function (pid, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.aclApiBaseUrl + '/deletepolicy/',
                data: { pid: pid },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Update the access control policy for Webida ACL service.
    *
    * @method updatePolicy
    * @param {string} pid - policy id in policy_info returned by {@link module:webida.ACLService.createPolicy}
    * @param {policy_info} newPolicy - All fields could be updated except pid.
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.ACLService
    */
    mod.ACLService.prototype.updatePolicy = function (pid, policy, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.aclApiBaseUrl + '/updatepolicy/',
                data: { pid: pid, policy: JSON.stringify(policy), sessionID: sessionID },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Assign the policy to the Webida user or Webida group.
    *
    * @method assignPolicy
    * @param {Array.<int>} idArr - array of uid or gid
    * @param {int} pid - policy id
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.ACLService
    */
    mod.ACLService.prototype.assignPolicy = function (idArr, pid, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.aclApiBaseUrl + '/assignpolicy/',
                data: { pid: pid, user: idArr.join(';'), sessionID: sessionID },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Assign the array of policies to the Webida user or Webida group.
    *
    * @method assignPolicies
    * @param {int} id - uid or gid
    * @param {Array.<int>} pidArr - array of policy id
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.ACLService
    */
    mod.ACLService.prototype.assignPolicies = function (id, pidArr, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.aclApiBaseUrl + '/assignpolicies/',
                data: { pid: pidArr.join(';'), user: id, sessionID: sessionID },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Remove the policy from Webida user or Webida group.
    *
    * @method removePolicy
    * @param {int} id - uid or gid
    * @param {int} pid - policy id
    * @param {module:webida.request_callback} callback -
    *        (error:callback_error) → undefined
    *        <br>If function finished successfully then error is undefined
    * @memberOf module:webida.ACLService
    */
    mod.ACLService.prototype.removePolicy = function (user, pid, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.aclApiBaseUrl + '/removepolicy/',
                data: { pid: pid, user: user, sessionID: sessionID },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get the list of user_info object assigned to a specific policy
    *
    * @method getAssignedUser
    * @param {int} pid - policy id
    * @param {module:webida.request_callback_with_user_info_list} callback -
    *        (error:callback_error, users:[user_info]) → undefined
    *        <br>If function finished successfully then error is undefined
    *        And users is user information list.
    * @memberOf module:webida.ACLService
    */
    mod.ACLService.prototype.getAssignedUser = function (pid, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.aclApiBaseUrl + '/getassigneduser/',
                data: { pid: pid },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get the list of group_info object assigned to a specific policy.
    *
    * @method getAssignedGroup
    * @param {int} pid - policy id
    * @param {module:webida.request_callback_with_group_info_list} callback -
    *        (error:callback_error, groups:[group_info]) → undefined
    *        <br>If function finished successfully then error is undefined
    *        And groups is group information list.
    * @memberOf module:webida.ACLService
    */
    mod.ACLService.prototype.getAssignedGroup = function (pid, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.aclApiBaseUrl + '/getassignedgroup/',
                data: { pid: pid },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get the list of user_info object having a specific permission.
    *
    * @method getAuthorizedUser
    * @param {string} action - action want to check
    * @param {string} resource - resource want to check
    * @param {module:webida.request_callback_with_user_info_list} callback -
    *        (error:callback_error, users:[user_info]) → undefined
    *        <br>If function finished successfully then error is undefined
    *        And users is user information list.
    * @memberOf module:webida.ACLService
    */
    mod.ACLService.prototype.getAuthorizedUser = function (action, resource, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.aclApiBaseUrl + '/getauthorizeduser/',
                data: { action: action, resource: resource},
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get the list of group_info object having a specific permission.
    *
    * @method getAuthorizedGroup
    * @param {string} action - action want to check
    * @param {string} resource - resource want to check
    * @param {module:webida.request_callback_with_group_info_list} callback -
    *        (error:callback_error, groups:[group_info]) → undefined
    *        <br>If function finished successfully then error is undefined
    *        And groups is group information list.
    * @memberOf module:webida.ACLService
    */
    mod.ACLService.prototype.getAuthorizedGroup = function (action, resource, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.aclApiBaseUrl + '/getauthorizedgroup/',
                data: { action: action, resource: resource},
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get a list of resource the user authorized for a specified action.
    *
    * @method getAuthorizedRsc
    * @param {string} action - action want to check
    * @param {module:webida.request_callback_with_resource_list} callback -
    *        (error:callback_error, resources:[string]) → undefined
    *        <br>If function finished successfully then error is undefined
    *        And resources is the resource list.
    * @memberOf module:webida.ACLService
    */
    mod.ACLService.prototype.getAuthorizedRsc = function (action, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.aclApiBaseUrl + '/getauthorizedrsc/',
                data: { action: action },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get the list of policy_info assigned to a specific id(user or group).
    *
    * @method getAssignedPolicy
    * @param {int} id - uid or gid
    * @param {module:webida.request_callback_with_policy_info_list} callback -
    *        (error:callback_error, policies:[policy_info]) → undefined
    *        <br>If function finished successfully then error is undefined
    *        And policies is policy information list.
    * @memberOf module:webida.ACLService
    */
    mod.ACLService.prototype.getAssignedPolicy = function (id, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.aclApiBaseUrl + '/getassignedpolicy/',
                data: {id: id},
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get the list of policy_info owned to me.
    *
    * @method getOwnedPolicy
    * @param {module:webida.request_callback_with_policy_info_list} callback -
    *        (error:callback_error, policies:[policy_info]) → undefined
    *        <br>If function finished successfully then error is undefined
    *        And policies is policy information list.
    * @memberOf module:webida.ACLService
    */
    mod.ACLService.prototype.getOwnedPolicy = function (callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.aclApiBaseUrl + '/getownedpolicy/',
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get the list of policy_info.
    *
    * @method getPolicies
    * @param {Array.<string>} pidArr - array of pid
    * @param {module:webida.request_callback_with_policy_info_list} callback -
    *        (error:callback_error, policies:[policy_info]) → undefined
    *        <br>If function finished successfully then error is undefined
    *        And policies is policy information list.
    * @memberOf module:webida.ACLService
    */
    mod.ACLService.prototype.getPolicies = function (pidArr, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.aclApiBaseUrl + '/getpolicies/',
                data: { pid: pidArr.join(';') },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    // AuthService APIs (groups)

    /**
    * Create the Webida group.
    *
    * @method createGroup
    * @param {module:webida.group_info} group - Group object. <br>
             Do not fill the gid and owner field which will be generated by system.
    * @param {module:webida.request_callback_with_group_info} callback -
    *        (error:string|undefined, group:group_info) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And group is created group object.
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.createGroup = function (group, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.groupApiBaseUrl + '/creategroup/',
                data: group,
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Delete the Webida group.
    *
    * @method deleteGroup
    * @param {int} gid - group id in group_info returned by {@link module:webida.AuthService.createGroup}
    * @param {module:webida.request_callback} callback -
    *        (error:string|undefined) → undefined
    *        <br>If function finished successfully then error is undefined.
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.deleteGroup = function (gid, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.groupApiBaseUrl + '/deletegroup/',
                data: { gid: gid },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Add the user to Webida group.
    *
    * @method addUserToGroup
    * @param {int} uid - user id
    * @param {int} gid - group id in group_info returned by {@link module:webida.AuthService.createGroup}
    * @param {module:webida.request_callback} callback -
    *        (error:string|undefined) → undefined
    *        <br>If function finished successfully then error is undefined.
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.addUserToGroup = function (uid, gid, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.groupApiBaseUrl + '/addusertogroup/',
                data: { uid: uid, gid: gid },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Add multiple users to Webida group.
    *
    * @method addUsersToGroup
    * @param {Array.<int>} uidArr - array of user id
    * @param {int} gid - group id in group_info returned by {@link module:webida.AuthService.createGroup}
    * @param {module:webida.request_callback} callback -
    *        (error:string|undefined) → undefined
    *        <br>If function finished successfully then error is undefined.
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.addUsersToGroup = function (uidArr, gid, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.groupApiBaseUrl + '/addusertogroup/',
                data: { uid: uidArr.join(';'), gid: gid },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Remove the user from Webida group.
    *
    * @method removeUserFromGroup
    * @param {int} uid - user id
    * @param {int} gid - group id in group_info returned by {@link module:webida.AuthService.createGroup}
    * @param {module:webida.request_callback} callback -
    *        (error:string|undefined) → undefined
    *        <br>If function finished successfully then error is undefined.
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.removeUserFromGroup = function (uid, gid, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.groupApiBaseUrl + '/removeuserfromgroup/',
                data: { uid: uid, gid: gid },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Remove multiple users from Webida group.
    *
    * @method removeUsersFromGroup
    * @param {Array.<int>} uidArr - Array of user id
    * @param {int} gid - group id in group_info returned by {@link module:webida.AuthService.createGroup}
    * @param {module:webida.request_callback} callback -
    *        (error:string|undefined) → undefined
    *        <br>If function finished successfully then error is undefined.
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.removeUsersFromGroup = function (uidArr, gid, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.groupApiBaseUrl + '/removeuserfromgroup/',
                data: { uid: uidArr.join(';'), gid: gid },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get the group list I own.
    *
    * @method getMyGroups
    * @param {module:webida.request_callback_with_group_info_list} callback -
    *        (error:string|undefined, groups:[group_info]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And groups is group information list.
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.getMyGroups = function (callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.groupApiBaseUrl + '/getmygroups/',
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get the group list I belong to.
    *
    * @method getAssignedGroups
    * @param {module:webida.request_callback_with_group_info_list} callback -
    *        (error:string|undefined, groups:[group_info]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And groups is group information list.
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.getAssignedGroups = function (callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.groupApiBaseUrl + '/getassignedgroups/',
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get the group member list.
    *
    * @method getGroupMembers
    * @param {int} gid - group id in group_info.
    * @param {module:webida.request_callback_with_user_info_list} callback -
    *        (error:string|undefined, users:[user_info]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And users is user information list.
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.getGroupMembers = function (gid, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.groupApiBaseUrl + '/getgroupmembers/',
                data: { gid: gid },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Set the group member list.
    *
    * @method setGroupMembers
    * @param {int} gid - group id in group_info.
    * @param {Array.<int>} uidArr - Array of user id.
    * @param {module:webida.request_callback} callback -
    *        (error:string|undefined) → undefined
    *        <br>If function finished successfully then error is undefined.
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.setGroupMembers = function (gid, uidArr, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.groupApiBaseUrl + '/setgroupmembers/',
                data: { gid: gid, uid: uidArr.join(';') },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    /**
    * Get all group list.
    *
    * @method getAllGroups
    * @param {module:webida.request_callback_with_group_info_list} callback -
    *        (error:string|undefined, groups:[group_info]) → undefined
    *        <br>If function finished successfully then error is undefined.
    *        And groups is group information list.
    * @memberOf module:webida.AuthService
    */
    mod.AuthService.prototype.getAllGroups = function (callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.groupApiBaseUrl + '/getallgroups/',
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    mod.AuthService.prototype.updateGroup = function (gid, group, callback) {
        function restApi() {
            ajaxCall({
                url: mod.conf.groupApiBaseUrl + '/updategroup/',
                data: { gid: gid, group: JSON.stringify(group) },
                callback: callback
            });
        }

        ensureAuthorize(restApi);
    };

    mod.getPluginSettingsPath = function (callback) {
        var defaultPath = 'plugins/plugin-settings.json';
        mod.auth.getMyInfo(function (err, myInfo) {
            if (err) {
                callback(defaultPath);
            } else {
                callback(myInfo.isGuest ? 'plugins/plugin-settings-guest.json' : defaultPath);
            }
        });
    };

    /**
    * API helper function with callback function.
    * And API callback's parameter is error.
    * If error callback function's parameter omitted then error string is printed in console.log
    *
    * @method CB
    * @param {module:webida.api_function} APIFunction - API function.
    * @param {Array.<_a>} APIParameters - API parameters. It must be array.
    * @param {module:webida.api_success_function} succFunction - This function called when API successfully finished.
    * @param {module:webida.api_error_function} [errorFunction] - This function called when API error occrued.
    *           If this parameter is omitted then error is printed in console.log
    * @memberOf module:webida
    * @example
    * var appid = 'app';
    * var succFunc = function (result) { console.log("APPLICATION INFORMATION : " + result); }
    * var errFunc = function (err) { console.log("API ERROR : " + err); }
    * webida.CB(webida.app.getAppInfo, [appid], succFunc, errFunc);
    */
    mod.CB = function (api, params, succFunc, errFunc) {
        if (!errFunc) {
            errFunc = function (error) {
                console.log(error);
            };
        }

        var callbackFunc = function (error, data) {
            if (error) {
                errFunc.apply(this, [error]);
            } else {
                succFunc.apply(this, [data]);
            }
        };

        params.push(callbackFunc);

        api.apply(this, params);
    };

    /**
    * API helper function with callback function.
    * And API callback's parameter is error and result boolean flag.
    * If error callback function's parameter omitted then error string is printed in console.log
    *
    * @method CBIf
    * @param {module:webida.api_function} APIFunction - API function.
    * @param {Array.<_a>} APIParameters - API parameters. It must be array.
    * @param {module:webida.api_success_function} trueFunction -
        This function called when API successfully finished and return value is true.
    * @param {module:webida.api_success_function} falseFunction -
        This function called when API successfully finished and return value is false.
    * @param {module:webida.api_error_function} [errorFunction] - This function called when API error occrued.
    *           If this parameter is omitted then error is printed in console.log
    * @memberOf module:webida
    */
    mod.CBIf = function (api, params, trueFunc, falseFunc, errFunc) {
        if (!errFunc) {
            errFunc = function (error) {
                console.log(error);
            };
        }

        var callbackFunc = function (error, flag) {
            if (error) {
                errFunc.apply(this, [error]);
            } else {
                if (flag) {
                    trueFunc.apply(this);
                } else {
                    falseFunc.apply(this);
                }
            }
        };

        params.push(callbackFunc);

        api.apply(this, params);
    };

    function createBlobObject(data, type) {
        var blob;

        try {
            blob = new Blob([data], { 'type': type });
        } catch (e) {
            console.error('Failed to create Blob, trying by BlobBuilder...', e);
            // TypeError old chrome and FF
            window.BlobBuilder = window.BlobBuilder ||
                window.WebKitBlobBuilder ||
                window.MozBlobBuilder ||
                window.MSBlobBuilder;
            if (window.BlobBuilder) {
                var bb = new window.BlobBuilder();
                bb.append(data);
                blob = bb.getBlob(type);
            } else {
                // We're screwed, blob constructor unsupported entirely
                console.error('Finally failed to create Blob');
            }
        }
        return blob;
    }

    function ajaxCall(opts) {
        function serialize(obj) {
            var str = [];
            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
                }
            }
            return str.join('&');
        }
        if (!opts.callback) {
            throw new Error('callback must be set');
        }
        if (!opts.url) {
            console.assert(false, 'URL field must be set');
            return;
        }

        //var CRLF = '\r\n';
        var url = opts.url;
        var data = null;
        var method = opts.type || 'GET';

        if (typeof opts.data === 'object' && !(opts.data instanceof FD)) {
            if (method === 'POST' || method === 'DELETE') {
                data = serialize(opts.data);
            } else {
                url = opts.url + '?' + serialize(opts.data);
            }
        } else {
            data = opts.data;
        }

        //console.log('ajaxCall', opts);
        var xhr = new XHR();
        xhr.open(method, url, true);
        if (opts.responseType) {
            xhr.responseType = opts.responseType;
        }
        xhr.withCredentials = true; // Should be after xhr.open(). Otherwise InvalidStateError occurs in IE11.
        if (!isAnonymousMode) {
            xhr.setRequestHeader('Authorization', token.data);
        }
        // In case of FD, xhr generates Content-Type automatically
        if (!(opts.data instanceof FD)) {
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
        xhr.send(data);
        xhr.onreadystatechange = function () {
            //console.log('onreadystatechange', xhr.readyState, xhr.status, xhr.responseText);
            if (xhr.readyState === 4) {
                var status = xhr.status;
                // Only 2XX and 304 are successful status code. In this case, retData.result should be 'failed'
                var successful = status >= 200 && status < 300 || status === 304;
                // if opts.success exists and request succeeded, call it with whole response text.
                if (successful && opts.callbackWithRawData) {
                    if (opts.responseType === '' || opts.responseType === 'text') {
                        opts.callbackWithRawData(xhr.responseText);
                    } else {
                        opts.callbackWithRawData(xhr.response);
                    }
                    return;
                }

                if (status === 0) {
                    opts.callback('server unreachable');
                    return;
                }

                var retData;
                try {
                    retData = JSON.parse(xhr.responseText);
                } catch (e) {
                    console.error(e, 'Invalid server return', xhr.responseText);
                    retData = {result: 'failed', reason: 'Invalid server return: ' + xhr.responseText};
                }

                if (successful) {
                    if (retData.result === 'ok') {
                        opts.callback(null, retData.data);
                    } else {
                        console.error('Here shouldn\'t be reached. Invalid status code is set for failed response.');
                        opts.callback(retData.reason || 'Unknown error');
                    }
                } else {
                    opts.callback(retData.reason || 'Unknown reason');
                }

            }
        };
    }

    /**
     * Default FS Service instance
     * @name fs
     * @type {module:webida.FSService}
     * @memberOf module:webida
     */
    mod.fs = new mod.FSService();

    /**
     * Default App Service instance
     * @name app
     * @type {module:webida.AppService}
     * @memberOf module:webida
     */
    mod.app = new mod.AppService();

    /**
     * Default Auth Service instance
     * @name auth
     * @type {module:webida.AuthService}
     * @memberOf module:webida
     */
    mod.auth = new mod.AuthService();

    /**
     * db service
     * @type {module:wdbida.DBService}
     */
    mod.db = new mod.DBService();

    /**
     * Build service
     * @type {module:wdbida.BuildService}
     */
    mod.build = new mod.BuildService();

    /**
     * Default ACL Service instance
     * @name acl
     * @type {module:webida.ACLService}
     * @memberOf module:webida
     */
    mod.acl = new mod.ACLService();

    /**
     * Default token generator
     * @name tokenGenerator
     * @type {module:webida.TokenGenerator}
     * @memberOf module:webida
     */
    mod.tokenGenerator = new mod.TokenGenerator();
    
    mod.ajaxCall = ajaxCall;


    /* Check whether the "personal_token" value is in url.
       If then, use that value as a access token.
    */
    if (typeof window !== 'undefined') {
        var href = window.location.search;
        var startIndex = href.indexOf('personal_token');
        if (startIndex !== -1) {
            startIndex += 'personal_token='.length;
            var endIndex = href.indexOf('&', startIndex);
            if (endIndex === -1) {
                endIndex = href.length;
            }

            token.issueTime = Date.now();
            token.data = href.substring(startIndex, endIndex);
            mod.tokenGenerator.validateToken = function (/*token*/) { return true; };
            console.log(token.data, token.issueTime);
        }
    }

    return mod;
}));
