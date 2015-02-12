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
    'async',
    'path',
    'text!menus/settings/index.html',
    'webida-lib/app-config'
], function (async, path, settingsView) {
    'use strict';
    
    /* global webidaFs, webidaInfo:true */
    var menu = $('#menu');
    var menuname = '<li><a href="#/settings">SETTINGS</a></li>';
    menu.append(menuname);

    var GITHUBCONFIG_PATH = '.profile/github.json';
    var RSA_KEYPATH = '.profile/id_rsa';
    var PUBLIC_KEYPATH = '.profile/id_rsa.pub';
    var PRIVATE_KEYPATH = '.profile/id_rsa';

    function _generateKey() {
        var info = {
            cmd: 'ssh-keygen',
            args: ['-t', 'rsa', '-C', webidaInfo.email, '-f', RSA_KEYPATH, '-N', '']
        };

        webidaFs.exec('', info, function (e) {
            if (!e) {
                webidaFs.readFile(PUBLIC_KEYPATH, function (err, data) {
                    if (!err) {
                        $('#gen-sshkey').val(data);
                    }

                });
            }
        });
    }

    function _init() {
        var contents = $('#contents');

        contents.empty();
        contents.append(settingsView);

        var githubTokenKey = $('#GitHub_TokenKey');
        var githubSaveBtn = $('#SaveGitHub');

        async.waterfall([
            function (next) {
                webidaFs.exists(PUBLIC_KEYPATH, function (err, exist) {
                    if (err) {
                        next(err);
                    } else {
                        if (exist) {
                            webidaFs.readFile(PUBLIC_KEYPATH, function (err, data) {
                                if (!err) {
                                    $('#gen-sshkey').val(data);
                                }

                                next();
                            });
                        } else {
                            next();
                        }
                    }
                });
            },
            function (next) {
                webidaFs.exists(GITHUBCONFIG_PATH, function (err, exist) {
                    if (exist) {
                        webidaFs.readFile(GITHUBCONFIG_PATH, function (err, data) {
                            if (err) {
                                next(err);
                            } else {
                                var rt = JSON.parse(data);
                                githubTokenKey.val(rt.tokenKey);

                                next();
                            }
                        });
                    } else {
                        next();
                    }
                });
            }
        ], function (err) {
            if (err) {
                alert(err);
            } else {
                console.log('ok');
                $('#gen-key-btn').on('click', function (evt) {
                    evt.preventDefault();

                    var warningMsg = 'Do you want to Re-generate ssh-key?';

                    if (confirm(warningMsg) === true) {
                        webidaFs.exists(PUBLIC_KEYPATH, function (err, exist) {
                            if (exist) {
                                // remove PUBLIC_KEYPATH
                                webidaFs.remove(PUBLIC_KEYPATH, true, function (err) {
                                    if (!err) {
                                        // remove PRIVATE_KEYPATH
                                        webidaFs.remove(PRIVATE_KEYPATH, true, function (err) {
                                            if (!err) {
                                                // generate SSH_KEY
                                                _generateKey();
                                            }
                                        });
                                    }
                                });
                            } else {
                                _generateKey();
                            }
                        });
                    }
                });

                githubSaveBtn.on('click', function () {
                    var githubConfig = {
                        tokenKey: githubTokenKey.val()
                    };

                    console.log(githubConfig);

                    webidaFs.writeFile(GITHUBCONFIG_PATH, JSON.stringify(githubConfig), function (err) {
                        if (err) {
                            console.log(err);
                            return alert(err);
                        } else {
                            alert('Successfully saved');
                        }
                    });
                });
            }
        });
    }

    path.map('#/settings').to(_init);

    path.listen();
});
