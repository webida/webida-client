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

require([
    'common',
    'lodash',
    'moment',
    'async',
    'text!resource/add_wsdlg.html',
    'text!resource/remove_wsdlg.html'
], function (common, _, moment, async, addDlg, removeDlg) {
    'use strict';

    /* global webidaFs, webidaApp, webidaAuth, webidaHost: true */
    var WORKSPACE_PATH = '.userinfo/workspace.json';
    var WORKSPACE_INFO;
    //var _menuSettings = $('#menu-settings');
    var _wsContents = $('.ws-body');
    var _dimming = $('.dimming');
    var _uniqId;

    function _dimmingOn() {
        _dimming.addClass('active');
    }

    function _dimmingOff() {
        _dimming.removeClass('active');
    }

    function _checkValidWSFile(cb) {
        webidaFs.readFile(WORKSPACE_PATH, function (err, data) {
            if (err) {
                cb('_checkValidWSFile() - readFile Error: ' + err);
            } else {
                var wsMeta = JSON.parse(data);
                var wsMetaCount = Object.keys(wsMeta).length;

                _getWSList(function (err, wslist) {
                    if (err) {
                        cb('_checkValidWSFile() - _getWSList Error: ' + err);
                    } else {
                        var wsCount = wslist.length;
                        if (wsMetaCount === wsCount) {
                            cb(null, true);
                        } else {
                            cb(null, false);
                        }
                    }
                });
            }
        });
    }

    function _launchIDE(domObj) {
        console.log($(domObj).attr('data-wsname'));
        var workspace = '?workspace=' + webidaFs.fsid + '/' + domObj.attr('data-wsname');
        webidaApp.launchApp('devenv', true, workspace);
    }

    function _registerDefaultEvent() {
        // register dimming cancel event
        _dimming.on('click', function () {
            _dimming.removeClass('active');

            var addWSDlg = $('.add_wsdlg');
            var removeWSDlg = $('.remove_wsdlg');

            if (addWSDlg) {
                addWSDlg.remove();
            }

            if (removeWSDlg) {
                removeWSDlg.remove();
            }

        });

        $('#menu-logo').on('click', function () {
            webidaApp.launchApp('desktop', false, null);
        });

        // register workspace event
        $('#menu-ws').on('click', function () {
            var wswrap = $('.ws-wrap');
            var settingwrap = $('.settings-wrap');

            if (wswrap.hasClass('acitve')) {
                settingwrap.removeClass('active');
            } else {
                wswrap.addClass('active');
                settingwrap.removeClass('active');
            }
        });

        // register setting event
        $('#menu-settings').on('click', function () {
            var wswrap = $('.ws-wrap');
            var settingwrap = $('.settings-wrap');

            if (settingwrap.hasClass('acitve')) {
                wswrap.removeClass('active');
            } else {
                settingwrap.addClass('active');
                wswrap.removeClass('active');
            }
        });

        // register logout event
        $('#menu-logout').on('click', function () {
            _setLogout();
        });

        // register workspace add event
        $('.ws-icon-add').on('click', function () {
            _addWSList();
        });
    }

    // WORKSPACE_PATH 파일이 있는지 없는지 여부 확인 후 없으면 생성.
    function _initialize() {
        _registerDefaultEvent();

        webidaFs.exists(WORKSPACE_PATH, function (err, exist) {
            if (err) {
                console.log('_checkWSFile() - exists Error: ' + err);
            }

            if (!exist) {
                _setWorkspace(function (err) {
                    if (err) {
                        console.log(err);
                    }

                    _renderWSList();
                });
            } else {
                _checkValidWSFile(function (err, bool) {
                    if (err) {
                        console.log(err);
                    } else {
                        if (bool) {
                            _renderWSList();
                        } else {
                            console.log('workspace meta-info is invalid.');
                            _renderWSList();
                        }
                    }
                });
            }
        });
    }

    // WORKSPACE 목록 생성 및 WORKSPACE_PATH에 정보 저장.
    function _setWorkspace(cb) {
        webidaFs.list('/', function (err, data) {
            if (err) {
                console.log('setWorkspace() - list Error: ' + err);
                cb(err);
            } else {
                var WSList =
                    _.chain(data).filter(function (fileObj) {
                        if (!fileObj.name.match(/^\./) && fileObj.isDirectory) { return true; }
                    }).map(function (fileObj) { return '/' + fileObj.name; }).value();

                webidaFs.stat(WSList, function (err, stats) {
                    if (err) {
                        console.log('setWorkspace() - stat Error: ' + err);
                        cb(err);
                    } else {
                        var wsObj = {};

                        _.forEach(stats, function (fileObj) {
                            fileObj.birth = '';
                            fileObj.desc = '';
                            wsObj[fileObj.name] = fileObj;
                        });

                        webidaFs.writeFile(WORKSPACE_PATH, JSON.stringify(wsObj), function (err) {
                            if (err) {
                                console.log('setWorkspace() - writeFile Error: ' + err);
                                cb(err);
                            } else {
                                cb(null, true);
                            }
                        });
                    }
                });
            }
        });
    }

    // 유니크 id 생성.
    function _genUniuqeId() {
        _uniqId = _.uniqueId();
        return _uniqId;
    }

    // 로그아웃
    function _setLogout() {
        webidaAuth.logout(function (err) {
            if (err) {
                alert('Failed to logout');
            } else {
                location.href = '//' + webidaHost;
            }
        });
    }

    function _getWSList(cb) {
        webidaFs.list('/', function (err, data) {
            if (err) {
                cb(err);
            } else {
                var WSList =
                    _.chain(data).filter(function (fileObj) {
                        if (!fileObj.name.match(/^\./) && fileObj.isDirectory) { return true; }
                    }).map(function (fileObj) { return '/' + fileObj.name; }).value();

                webidaFs.stat(WSList, function (err, stats) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, stats);
                    }
                });
            }
        });
    }

    // 프로젝트 목록 얻어오기
    function _getPJListPath(WSPath, cb) {
        webidaFs.list(WSPath, function (err, pjList) {
            if (err) {
                cb(err);
            } else {
                var filteredPJList =
                    _.chain(pjList).filter(function (file) {
                        if (!file.name.match('.workspace') && file.isDirectory) {
                            return true;
                        }
                    }).map(function (file) {
                        return WSPath + '/' + file.name + '/.project/project.json';
                    }).value();

                return cb(null, filteredPJList);
            }
        });
    }

    // 프로젝트 목록 그리기
    function _renderPJList(domObj) {
        var ws = domObj.attr('data-wspath');
        var wsRow = domObj.parent();

        if (wsRow.hasClass('ws-closed')) {
            wsRow.addClass('ws-opened');
            wsRow.removeClass('ws-closed');
            wsRow.after('<div class="pj-body" data-id="' + wsRow.attr('data-id') + '"></div>');

            var proRow = wsRow.next();

            _getPJListPath(ws, function (err, pjPathList) {
                if (err) {
                    console.log('_renderPJList() - _getPJListPath Error: ' + err);
                } else {
                    _.forEach(pjPathList, function (pjPath) {
                        webidaFs.exists(pjPath, function (err, exist) {
                            if (err) {
                                console.log('_renderPJList() - exists Error: ' + err);
                            }

                            if (exist) {
                                webidaFs.readFile(pjPath, function (err, data) {
                                    if (err) {
                                        console.log('_renderPJList() - read Error: ' + err);
                                    } else {
                                        var projInfo = JSON.parse(data);
                                        /* jshint maxlen : 200 */
                                        var template =
                                            '<div class="pj-row"">' +
                                            '<div class="pj-content">' +
                                            '<div class="pj-item pj-arrow"></div>' +
                                            '<div class="pj-item pj-name">' + projInfo.name + '</div>' +
                                            '<div class="pj-item pj-ltime"></div>' +
                                            '<div class="pj-item pj-birth">' + moment(projInfo.created).fromNow() + '</div>' +
                                            '<div class="pj-item pj-desc">' + projInfo.description + '</div>' +
                                            '</div>' +
                                            '<div class="pj-content-icon">' +
                                            '</div>' +
                                            '</div>';
                                        /* jshint maxlen:120 */

                                        proRow.append(template);
                                    }
                                });
                            }
                        });
                    });
                }
            });
        } else {
            var projRow = wsRow.next();
            if (projRow.hasClass('pj-body') && (projRow.attr('data-id') === wsRow.attr('data-id'))) {
                projRow.remove();
                wsRow.removeClass('ws-opened');
                wsRow.addClass('ws-closed');
            }
        }
    }

    // 워크스페이스 목록 그리기
    function _renderWSList() {
        if (_wsContents.children.length) {
            _wsContents.empty();
        }

        webidaFs.readFile(WORKSPACE_PATH,  function (err, data) {
            if (err) {
                console.log('_renderWSList() - readFile Error: ' + err);
            } else {
                var wsObj = JSON.parse(data);

                WORKSPACE_INFO = wsObj;
                _.forEach(wsObj, function (ws) {
                    var id = _genUniuqeId();
                    var birth = '';
                    var desc = '';
                    if (ws.birth) {
                        birth = moment(ws.birth).fromNow();
                    }

                    if (ws.desc) {
                        desc = ws.desc;
                    }
                    /* jshint maxlen : 200 */
                    var template =
                        '<div class="ws-row ws-closed" data-id="' + id + '">' +
                        '<div class="ws-content" data-wspath="' + ws.path + '">' +
                        '<div class="ws-item ws-arrow"></div>' +
                        '<div class="ws-item ws-name">' + ws.name + '</div>' +
                        '<div class="ws-item ws-ltime">' + moment(ws.mtime).fromNow() + '</div>' +
                        '<div class="ws-item ws-birth">' + birth + '</div>' +
                        '<div class="ws-item ws-desc">' + desc + '</div>' +
                        '</div>' +
                        '<div class="ws-content-icon">' +
                        '<div class="ws-launch">' +
                        '<div class="ws-icon-launch" title="Launch IDE" data-wsname="' + ws.name + '"></div>' +
                        '</div>' +
                        '<div class="ws-delete">' +
                        '<div class="ws-icon-delete" title="Delete Workspace" data-wsname="' + ws.name + '" data-id="' + id + '"></div>' +
                        '</div>' +
                        '</div>' +
                        '</div>';
                    /* jshint maxlen : 120 */
                    _wsContents.append(template);
                });

                // register get project event
                $('.ws-body .ws-content').on('click', function (evt) {
                    var domObj = $(evt.target).parent();
                    _renderPJList(domObj);
                });

                // register launch event
                $('.ws-icon-launch').on('click', function (evt) {
                    var domObj = $(evt.target);
                    _launchIDE(domObj);
                });

                $('.ws-icon-delete').on('click', function (evt) {
                    var domObj = $(evt.target);
                    _removeWSList(domObj);
                });
            }
        });
    }

    function _addWSList() {
        _dimmingOn();
        $('body').append(addDlg);

        // register dialog close event
        $('.adddlg_close').on('click', function () {
            $('.add_wsdlg').remove();
            _dimmingOff();
        });

        // input에 포커스
        $('#workspace_name').focus();

        $('#workspace_name').on('keyup', function () {
            var wsname = this.value;
            if (wsname) {
                $('#adddlg_message').text('');
            }
        });

        // register create workspace event
        $('#adddlg_confirm').on('click', function (evt) {
            evt.preventDefault();

            var wsname = $('#workspace_name').val();
            var wsdesc = $('#workspace_desc').val();
            var message = $('#adddlg_message');

            if (!wsname) {
                message.text('Please enter workspace name.');
                return;
            }

            _getWSList(function (err, wslist) {
                if (err) {
                    console.log('_addWSList()' + err);
                } else {
                    var isExist = _.find(wslist, { 'name' : wsname });
                    if (isExist) {
                        message.text('\'' + wsname + '\' worskpace is already existed.');
                        return;
                    } else {
                        // create workspace
                        var WS_META_PATH = wsname + '/.workspace';
                        var WS_META_FILE = WS_META_PATH + '/workspace.json';

                        async.waterfall([
                            function (next) {
                                webidaFs.createDirectory(wsname, false, function (err) {
                                    if (err) {
                                        next('_addWSList() - 1st createDirectory Error:' + err);
                                    } else {
                                        next();
                                    }
                                });
                            },
                            function (next) {
                                webidaFs.createDirectory(WS_META_PATH, false, function (err) {
                                    if (err) {
                                        next('_addWSList() - 2nd createDirectory Error:' + err);
                                    } else {
                                        next();
                                    }
                                });
                            },
                            function (next) {
                                webidaFs.writeFile(WS_META_FILE, '', function (err) {
                                    if (err) {
                                        next('_addWSList() - 1st writeFile Error:' + err);
                                    } else {
                                        next();
                                    }
                                });
                            },
                            function (next) {
                                webidaFs.stat([wsname], function (err, stats) {
                                    if (err) {
                                        next('_addWSList() - stat Error:' + err);
                                    } else {
                                        stats[0].birth = new Date().toJSON();
                                        stats[0].desc = wsdesc;

                                        WORKSPACE_INFO[wsname] = stats[0];
                                        next();
                                    }
                                });

                            },
                            function (next) {
                                webidaFs.writeFile(WORKSPACE_PATH, JSON.stringify(WORKSPACE_INFO), function (err) {
                                    if (err) {
                                        next('_addWSList() - 2nd writeFile Error:' + err);
                                    } else {
                                        next();
                                    }
                                });
                            }
                        ], function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                $('.add_wsdlg').remove();
                                _dimmingOff();

                                _renderWSList();
                            }
                        });
                    }
                }
            });
        });
    }

    function _removeWSList(domObj) {
        _dimmingOn();
        $('body').append(removeDlg);

        $('.removedlg_close').on('click', function () {
            $('.remove_wsdlg').remove();
            _dimmingOff();
        });

        var deleteWSname = domObj.attr('data-wsname');

        var msg = '<p>This action <strong style="color:#fff">CANNOT</strong> be undone. ' +
            'This will delete the <span style="color:#fff; font-weight:bold;">' + 
            deleteWSname + '</span> workspace and projects permanetly.</p>' +
            '<p>Please type in the name of the workspace to confirm.</p>';

        $('.removedlg_warning_text').html(msg);

        // input에 포커스
        $('#workspace_name').focus();

        $('#workspace_name').on('keyup', function () {
            var wsname = this.value;
            if (wsname) {
                $('#removedlg_message').text('');
            }
        });

        $('#removedlg_confirm').on('click', function (evt) {
            evt.preventDefault();

            var wsname = $('#workspace_name').val();
            var message = $('#removedlg_message');

            if (!wsname) {
                message.text('Please enter workspace name.');
                return;
            } else if (wsname !== deleteWSname) {
                message.text('workspace name doesn\'t match.');
                return;
            }

            if (WORKSPACE_INFO[deleteWSname]) {
                delete WORKSPACE_INFO[deleteWSname];

                async.waterfall([
                    function (next) {
                        webidaFs.writeFile(WORKSPACE_PATH, JSON.stringify(WORKSPACE_INFO), function (err) {
                            if (err) {
                                err('_removeWSList() - writeFile Error: ' + err);
                            } else {
                                next();
                            }
                        });
                    },
                    function (next) {
                        webidaFs.delete(deleteWSname, true, function (err) {
                            if (err) {
                                next('_removeWSList() - delete Error:' + err);
                            } else {
                                next();
                            }
                        });
                    }
                ], function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        var id = domObj.attr('data-id');
                        var selectorWS = '.ws-row[data-id=' + id + ']';
                        var selectorProj = '.pj-body[data-id=' + id + ']';
                        $(selectorWS).remove();
                        if ($(selectorProj)) {
                            $(selectorProj).remove();
                        }

                        $('.remove_wsdlg').remove();
                        _dimmingOff();
                    }
                });
            }
        });
    }

    common.getFS(function (exist) {
        if (exist) {
            _initialize();

        } else {
            location.href = '//' + webidaHost;
        }
    });
});
