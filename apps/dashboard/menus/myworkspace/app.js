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
    'underscore',
    'async',
    'moment',
    'path',
    'text!menus/myworkspace/index.html'
], function (_, async, moment, path, myworkspaceView) {
    'use strict';

    /* global webidaFs, webidaApp:true */
    var menu = $('#menu');
    var menuname = '<li><a href="#/workspace">WORKSPACE</a></li>';
    menu.append(menuname);

    var contents = $('#contents');

    function registerCreateWSEvent() {
        var wsDialog = $('#WorkspaceDialog');
        var CreateWSBtn = $('#CreateWSBtn');
        var wsName = $('#WorkspaceName');

        CreateWSBtn.on('click', function () {
            var WSname = wsName.val();
            if (WSname === '') {
                return alert('Empty workspace name');
            }

            var WSPath = WSname + '/.workspace';
            var hiddenWSFile = WSPath + '/workspace.json';
            var workspaceItem = $('#WorkspaceItems');

            async.waterfall([
                function (next) {
                    // workspace create
                    webidaFs.createDirectory(WSname, true, function (err) {
                        if (err) {
                            next(err);
                        } else {
                            next();
                        }
                    });
                },
                function (next) {
                    webidaFs.createDirectory(WSPath, true, function (err) {
                        if (err) {
                            next(err);
                        } else {
                            next();
                        }
                    });
                },
                function (next) {
                    webidaFs.writeFile(hiddenWSFile, '', function (err) {
                        if (err) {
                            next(err);
                        } else {
                            next();
                        }
                    });
                }
            ], function (err) {
                if (err) {
                    alert(err + ' fail to crate workspace');
                } else {
                    wsDialog.modal('hide');
                    wsName.val('');

                    var uniqID = _.uniqueId();
                    /* jshint maxlen :200 */
                    var templete =
                        '<tr id="ws_' + uniqID + '" class="ws-item">' +
                        '<td><span class="glyphicon glyphicon-chevron-right"></span></td>' +
                        '<td>' + WSname + '</td>' +
                        '<td>' + moment().format('lll') + '</td>' +
                        '<td></td>' +
                        '<td></td>' +
                        '<td class="text-right">' +
                        '<button id="launchIDE_' + uniqID + '" type="button" class="btn btn-success"><span class="glyphicon glyphicon-wrench"></span> IDE</button>' +
                        ' <button id="removeIDE_' + uniqID + '" type="button" class="btn btn-danger"><span class="glyphicon glyphicon-trash"></span> Delete</button>' +
                        '</td>' +
                        '</tr>';
                    /* jshint maxlen :120 */
                    
                    workspaceItem.append(templete);

                    $('#launchIDE_' + uniqID).on('click', function () {
                        var workspace = '?workspace=' + webidaFs.fsid + '/' + WSname;
                        webidaApp.launchApp('devenv', true, workspace);
                    });

                    $('#removeIDE_' + uniqID).on('click', function () {
                        if (confirm('Do you really want to delete workspace?')) {
                            webidaFs.delete(WSname, true, function (err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    alert('Successfully removed');
                                    $('#ws_' + uniqID).remove();
                                }
                            });
                        }
                    });
                }
            });
        });
    }

    function workspace() {
        contents.empty();
        contents.append(myworkspaceView);

        var workspaceItem = $('#WorkspaceItems');

        registerCreateWSEvent();

        async.waterfall([
            function (next) {
                webidaFs.list('/', function (err, data) {
                    if (err) {
                        next(err);
                    } else {
                        _.chain(data)
                        .filter(function (file) {
                            if (!file.name.match(/^\./) && file.isDirectory) {
                                return true;
                            }
                        }).each(function (file, idx) {
                            var wsName = file.name;
                            /* jshint maxlen:200 */
                            var workspace =
                                '<tr id="' + idx + '" class="ws-item">' +
                                '<td class="ws-open"><span class="glyphicon glyphicon-chevron-right"></span></td>' +
                                '<td>' + file.name + '</td>' +
                                '<td>' + moment(file.mtime).format('lll') + '</td>' +
                                '<td>' + moment(file.ctime).format('lll') + '</td>' +
                                '<td></td>' +
                                '<td class="text-right">' +
                                '<button data-launch="' + file.name + '" type="button" class="btn btn-success"><span class="glyphicon glyphicon-wrench"></span> IDE</button>' +
                                ' <button data-remove="' + file.name + '" type="button" class="btn btn-danger"><span class="glyphicon glyphicon-trash"></span> Delete</button>' +
                                '</td>' +
                                '</tr>' +
                                '<tr id="project_' + idx + '" class="project-group hide"><td colspan="6"><table class="table table-hover"><tbody></tbody></td></tr>';
                            /* jshint maxlen:120 */

                            workspaceItem.append(workspace);

                            // get the project
                            webidaFs.list(file.name, function (err, data) {
                                if (err) {
                                    next(err);
                                } else {
                                    var wIdx = idx;
                                    _.chain(data)
                                    .filter(function (file) {
                                        if (!file.name.match('.workspace') && file.isDirectory) {
                                            return true;
                                        }
                                    }).each(function (file) {
                                        var PROJECT_PATH = wsName + '/' + file.name + '/.project/project.json';

//                                        console.log(PROJECT_PATH);
                                        webidaFs.exists(PROJECT_PATH, function (err, exist) {
                                            if (err) {
                                                next(err);
                                            } else {
                                                if (exist) {
                                                    webidaFs.readFile(PROJECT_PATH, function (err, data) {
                                                        if (err) {
                                                            next(err);
                                                        } else {
                                                            var rt = JSON.parse(data);
                                                            /* jshint maxlen:200 */
                                                            var project =
                                                                '<tr class="project-item">' +
                                                                '<td style="width: 29px;">-</td>' +
                                                                '<td style="width: 235px;">' + rt.name + '</td>' +
                                                                '<td style="width: 245px;">' + rt.lastmodified + '</td>' +
                                                                '<td style="width: 245px;">' + rt.created + '</td>' +
                                                                '<td></td>' +
                                                                '<td>' + rt.description + '</td>' +
                                                                '<td>' + rt.type + '</td>' +
                                                                '</tr>';
                                                            /* jshint maxlen:120 */

                                                            $('tr#project_' + wIdx).find('tbody').append(project);
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    });
                                }
                            });
                        });
                        next();
                    }
                });
            },
            function (next) {
                // register event
                $('tr.ws-item').find('button[data-launch]').click(function () {
                    var self = this;
                    var filename = $(self).attr('data-launch');

                    var workspace = '?workspace=' + webidaFs.fsid + '/' + filename;
                    webidaApp.launchApp('devenv', true, workspace);
                });

                $('td.ws-open').click(function () {
                    var self = this;
                    var idx = $(this).parent().attr('id');

                    var hasHideClass = $('tr#project_' + idx).hasClass('hide');
                    if (hasHideClass) {
                        $(self).find('.glyphicon-chevron-right').addClass('glyphicon-chevron-down');
                        $(self).find('.glyphicon-chevron-down').removeClass('glyphicon-chevron-right');

                        $('tr#project_' + idx).removeClass('hide');
                    } else {
                        $(self).find('.glyphicon-chevron-down').addClass('glyphicon-chevron-right');
                        $(self).find('.glyphicon-chevron-right').removeClass('glyphicon-chevron-down');

                        $('tr#project_' + idx).addClass('hide');
                    }
                });

                $('tr.ws-item').find('button[data-remove]').click(function () {
                    var self = this;

                    if (confirm('Do you really want to delete workspace?')) {
                        var filename = $(self).attr('data-remove');

                        webidaFs.delete(filename, true, function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                $(self).parent().parent().remove();
                            }
                        });
                    }
                });

                next();
            }
        ], function (err) {
            if (err) {
                console.log(err);
            }
        });
    }

    workspace();

    path.map('#/workspace').to(workspace);
    path.listen();
});
