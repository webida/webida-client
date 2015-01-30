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

define([
    'webida',
    'async',
], function (webida, async) {
    'use strict';
    
    var exports = {};
    
    exports.getFS = function (cb) {
        async.waterfall([
            function (next) {
                var CLIENT_ID = 'E9CXCte9dnUU1GID';
                var redirectURL = window.location.href.replace('index.html', 'auth.html');
                
                webida.auth.initAuth(CLIENT_ID, redirectURL);
                next();
            },
            function (next) {
                window.webidaApp = webida.app;
                window.webidaAuth = webida.auth;
                webida.auth.getMyInfo(next);
            },
            function (user, next) {
                window.webidaInfo = user;
                webida.fs.getMyFSInfos(next);
            },
            function (fsInfos, next) {
                if (fsInfos.length > 0) {
                    window.webidaFs = webida.fs.mountByFSID(fsInfos[0].fsid);
                    next(null);
                } else {
                    webida.fs.addMyFS(function (err, fsinfo) {
                        if (err || !fsinfo) {
                            next('addMyFS failed');
                        } else {
                            window.webidaFs = webida.fs.mountByFSID(fsinfo.fsid);
                            next(null);
                        }
                    });
                }
            }
        ], function (err) {
            if (err) {
                cb(false);
            } else {
                cb(true);
            }
        });
    };
    
    return exports;
});
