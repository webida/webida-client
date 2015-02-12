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
    'text!settingsdlg.html',
    'webida-lib/app-config'
], function (webida, async, settingsDlg, AppConfig) {
    'use strict';
    
    /* global webidaFs:true */
    
    var exports = {};
    
    $('body').append(settingsDlg);
    
    var PROFILE_PATH = '/.profile';
    
    exports.getFS = function (cb) {
        console.log('getFS');
        async.waterfall([
            function (next) {
                //var CLIENT_ID = 'ci60g08h60000uum1rixrzhsj';
                
                webida.auth.initAuth(AppConfig.clientId.desktop);
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
                console.log('getFS fsInfos', fsInfos);
                if (fsInfos.length > 0) {
                    window.webidaFs = webida.fs.mountByFSID(fsInfos[0].fsid);
                    next(null);
                } else {
                    webida.fs.addMyFS(function (err, fsinfo) {
                        if (err || !fsinfo) {
                            next('addMyFS failed');
                        } else {
                            window.webidaFs = webida.fs.mountByFSID(fsinfo.fsid);
                            webidaFs.createDirectory(PROFILE_PATH, function (err) {
                                if (err) {
                                    next('createDirectory: ' + err);
                                } else {
                                    /*
                                    webidaFs.writeFile(PROFILEJSON_PATH, 
                                                       JSON.stringify(PROFILE_CONFIG), function (err) {
                                        if (err) {
                                            next('writeFile: ' + err);
                                        } else {
                                            next(null);
                                        }
                                    });
                                    */
                                    next(null);
                                }
                            });
                        }
                    });
                }
            }
        ], function (err) {
            if (err) {
                cb(false);
                console.log(err);
            } else {
                cb(true);
            }
        });
    };

    return exports;
});
