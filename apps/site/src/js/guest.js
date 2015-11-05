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
 * Actions for guest mode UI
 *
 * @since: 15. 8. 28
 * @author: Koong Kyungmi (kyungmi.k@samsung.com)
 */

require([
    'webida',
    'toastr'
], function (
    webida,
    toastr
) {
    'use strict';

    var fsid;
    var fsMount;
    var login = false;

    var ERR_NO_FS = 'nofs';

    var STEPS = {
        guestLogin: {
            method: webida.auth.guestLogin,
            prog: {
                percent: 40,
                message: '2/5 user and file system created...'
            },
            success: function () {
                login = true;
            }
        },
        getAllMyFsInfo: {
            method: webida.fs.getMyFSInfos,
            prog: {
                percent: 50,
                message: '3/5 initialize file system...'
            }
        },
        noMyFsFallback: {
            method: webida.fs.addMyFS,
            bypass: function (err) {
                return (err !== ERR_NO_FS);
            },
            prog: {
                percent: 60,
                message: '3/5 initialize file system...'
            },
            success: function (fsInfo) {
                fsid = fsInfo.fsid;
                fsMount = webida.fs.mountByFSID(fsid);
            }
        },
        createWorkspaceDirectory: {
            method: function () {
                fsMount.createDirectory.apply(fsMount, arguments);
            },
            params: ['/guest/.workspace', true],
            prog: {
                percent: 80,
                message: '4/5 workspace initialize...'
            }
        },
        createWorkspaceMetaFile: {
            method: function () {
                fsMount.writeFile.apply(fsMount, arguments);
            },
            params: ['/guest/.workspace/workspace.json', ''],
            prog: {
                percent: 100,
                message: '5/5 workspace created...'
            }
        }
    };

    function thenable(opt) {
         /*jshint validthis:true */
        var self = this;
        return function () {
            return new Promise(function (resolve, reject) {
                opt.params = opt.params || [];
                opt.params.push(function (err, result) {
                    if (err) {
                        _setProgressInfo({error: err});
                        reject(err);
                    } else {
                        _setProgressInfo(opt.prog);
                        if (opt.success) {
                            opt.success(result);
                        }
                        resolve(result);
                    }
                });
                opt.method.apply(self, opt.params);
            });

        };
    }

    function catchable(opt) {
         /*jshint validthis:true */
        var self = this;
        return function (err) {
            if (opt.bypass) {
                if (opt.bypass(err)) {
                    throw err;
                }
            }
            return thenable(opt).apply(self);
        };
    }

    function _startRun(progress) {
        if (progress) {
            $('.login-button, .cancel-button').addClass('hidden');
            $('.progress, .progress-message').removeClass('hidden');
            $('.progress-bar').addClass('active');
            _setProgressInfo({percent: 10, message: '1/5 start process...'});
            _runSteps();
        } else {
            $('.login-button, .cancel-button').removeClass('hidden');
            $('.progress, .progress-message').addClass('hidden');
            $('.progress-bar').removeClass('active');
            _setProgressInfo({percent: 0, message: ''});
        }
    }

    function _setProgressInfo(prog) {
        if (prog.error) {
            var retryButton = $('<a href="#" class="retry-button">Retry</a>');
            $('.progress-bar')
                .attr('aria-valuenow', 100)
                .text(prog.error)
                .width('100%')
                .removeClass('progress-bar')
                .addClass('progress-bar-danger')
                .removeClass('active');
            $('.progress-message')
                .empty()
                .append(retryButton);
            retryButton.on('click', function (event) {
                event.preventDefault();
                _startRun(false);
            });
        } else {
            $('.progress-bar')
                .attr('aria-valuenow', prog.percent)
                .text(prog.percent + '%')
                .width(prog.percent + '%');
            if (prog.percent === 100) {
                $('.progress-bar').removeClass('active');
            }
            $('.progress-message').text(prog.message);
        }
    }

    function _runSteps() {
        var authThenable = thenable.bind(webida.auth);
        var fsThenable = thenable.bind(webida.fs);
        var fsCatchable = catchable.bind(webida.fs);

        Promise.resolve()
            .then(authThenable(STEPS.guestLogin))
            .then(fsThenable(STEPS.getAllMyFsInfo))
            .then(function (fsInfos) {
                return new Promise(function (resolve, reject) {
                    if (fsInfos && fsInfos.length > 0) {
                        fsid = fsInfos[0].fsid;
                        fsMount = webida.fs.mountByFSID(fsid);
                        resolve();
                    } else {
                        reject(ERR_NO_FS);
                    }
                });
            })
            .catch(fsCatchable(STEPS.noMyFsFallback))
            .then(thenable(STEPS.createWorkspaceDirectory))
            .then(thenable(STEPS.createWorkspaceMetaFile))
            .then(function () {
                location.replace('/apps/ide/src/index.html?workspace=' + fsid + '/guest');
                return;
            })
            .catch(function (cause) {
                if (login) {
                    webida.auth.logout(function (err) {
                        if (err) {
                            cause += ', ' + err;
                        }
                        _setProgressInfo({error: cause});
                        toastr.error(cause);
                    });
                } else {
                    _setProgressInfo({error: cause});
                    toastr.error(cause);
                }
            });
    }

    $(document).ready(function () {
        $('#loginButton').click(function () {
            _startRun(true);
        });
    });
});
