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
 * @file Manage constants
 * @since 1.0.0
 * @author cimfalab@gmail.com
 */
define(['webida-lib/webida-0.3'],
function (webida) {
    'use strict';

    // constructor
    var Constants = function () {
    };

    Constants.GCM_URL = 'android.googleapis.com/gcm/send';

    Constants.HOST_SIMULATOR = 'sim';
    Constants.HOST_DEBUG = 'debug'; // https://debug.webida.net

    Constants.API_FS_FILE = 'webida/api/fs/file';

    Constants.OUTPUT_DIR = 'out';

    Constants.getWebidaHost = function () {
        return decodeURIComponent(
            document.cookie.replace(/(?:(?:^|.*;\s*)webida\.host\s*\=\s*([^;]*).*$)|^.*$/, '$1')
        );
    };

    //var WEINRE_CLIENT_URL = 'http://aqueous-mesa-1234.herokuapp.com/client/#anonymous';
    //var WEINRE_TARGET_HOST = 'http://aqueous-mesa-1234.herokuapp.com';
    Constants.WEINRE_CLIENT_URL = Constants.HOST_DEBUG + '.' + Constants.getWebidaHost() + '/client/#';
    Constants.WEINRE_TARGET_HOST = Constants.HOST_DEBUG + '.' + Constants.getWebidaHost();
    Constants.WEINRE_TARGET_URL = Constants.WEINRE_TARGET_HOST + '/target/target-script-min.js#';


    Constants.getSimulateUrl = function () {
        return '//' + Constants.HOST_SIMULATOR + '.' + Constants.getWebidaHost() + '/emulate';
    };

    Constants.getDebugClientUrl = function (debugId) {
        return '//' + Constants.WEINRE_CLIENT_URL + (debugId ? debugId : 'anonymous');
    };

    Constants.getDebugTargetUrl = function (debugId) {
        return '//' + Constants.WEINRE_TARGET_URL + (debugId ? debugId : 'anonymous');
    };

    Constants.getProxyUrl = function (url) {
        var proxyUrl = webida.conf.corsServer;
        var reqUrl;
        if (url.indexOf('://') > -1) {
            reqUrl = url.substr(url.indexOf('://') + 3);
        } else {
            reqUrl = url;
        }
        return proxyUrl + '/' + reqUrl;
    };

   // FIXME It's better to move to ./lib/Util.js
    Constants.getFileDownloadUrl = function (fsid, path) {
        var url = webida.conf.fsServer + '/' + Constants.API_FS_FILE + '/' + fsid + path +
            '?access_token=' + webida.auth.getToken();
        return url;
    };

    return Constants;
});
