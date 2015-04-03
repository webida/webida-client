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
    'lodash',
    'services/FS',
    'services/App',
    'q',
    'async',
    'webida'
], function (_, FS, App, Q, async, webida) {
    'use strict';
    /* global topic: true */
    var WORKSPACE_PATH = '/';

    var workspaceList = null;       // workspaceList cache
    var isLoaded = false;
    var isLoading = false;
    var fsid;

    /* global WS_INFO_PATH */
    var WorkspaceManager = function () {
        this.loadWorkspaces();
    };

    $.extend(WorkspaceManager.prototype, {
        loadWorkspaces: function (doReload) {
            var _this = this;
            var defer = Q.defer();

            isLoaded = doReload ? false : isLoaded;

            if (!isLoaded) {
                isLoading = true;

                async.parallel({
                    workspaceList: _this.getWorkspaces,
                    appList: webida.app.getMyAppInfo
                }, function (err, results) {
                    isLoading = false;
                    if (err) {
                        console.log('Workspaces Load error: ', err);
                        defer.reject(err);
                    } else {
                        isLoaded = true;
                        // Load all project list
                        async.every(results.workspaceList, function (workspace, next) {
                            _this.getProjects(WORKSPACE_PATH + workspace.name, results.appList).then(function (projects) { // jshint ignore:line
                                workspace.projects = projects;
                                next(true);
                            }).fail(function (err) {
                                console.log('Projects load error: ', err);
                                next(false);
                            });
                        }, function (result) {
                            if (result) {
                                workspaceList = results.workspaceList;
                                defer.resolve(workspaceList);
                            } else {
                                defer.reject('Projects load error');
                            }
                        });
                    }
                });
            } else {
                defer.resolve(workspaceList);
            }

            return defer.promise;
        },

        getWorkspaces: function (callback/*doReload*/) {
            FS.list(WORKSPACE_PATH, function (err, data) {
                if (err) {
                    callback(err);
                } else {
                    var workspaces = _.chain(data).filter(function (file) {
                        if (!file.name.match(/^\./) && file.isDirectory) {
                            // TODO it must have '.workspace' directory
                            return true;
                        }
                    }).value();
                    workspaces.sort(function (a, b) {
                        return (a.name > b.name) ? 1 : -1;
                    });
                    callback(null, workspaces);
                }
            });
        },

        getProjects: function (wsPath, deployList) {
            var defer = Q.defer();
            var projectList = [];

            FS.list(wsPath, false).then(function (data) {
                var list = _.chain(data).filter(function (file) {
                    if (!file.name.match('^.workspace$') &&
                        !file.name.match('^.git$') &&
                        file.isDirectory) {
                        return true;
                    }
                }).value();

                var dList = [];

                _.forEach(list, function (dir) {
                    var d = Q.defer();
                    dList.push(d.promise);

                    var fileName = wsPath + '/' + dir.name + '/.project/project.json';
                    FS.exists(fileName).then(function () {
                        FS.readFile(fileName).then(function (file) {
                            var project = JSON.parse(file);
                            project.isProject = true;
                            projectList.push(project);

                            var tokens = fileName.split('/');
                            var url = ['/', tokens[1], '/', tokens[2], '/'].join('');

                            if (deployList[url]) {
                                project.isDeployed = true;
                            }
                            d.resolve();
                        }).fail(function () {
                            projectList.push({
                                name: dir.name,
                                isProject: false
                            });
                            d.resolve();
                        });
                    }).fail(function () {
                        projectList.push({
                            name: dir.name,
                            isProject: false
                        });
                        d.resolve();
                    });
                });

                Q.allSettled(dList).then(function () {
                    projectList.sort(function (a, b) {
                        if (a.name > b.name) {
                            return 1;
                        } else {
                            return -1;
                        }
                    });
                    defer.resolve(projectList);
                });

            }).fail(function (e) {
                defer.reject(e);
            });

            return defer.promise;
        },

        getWorkspacePath: function (wsName) {
            if (fsid) {
                return fsid + '/' + wsName;
            } else {
                FS.getFSId().then(function (id) {
                    fsid = id;
                }).fail(function (e) {
                    console.log(e);
                });
                return null;
            }
        },

        runProject: function (projPath, runOpt) {
            var defer = Q.defer();

            FS.addAlias(projPath, 3600).then(function (info) {
                var sharp = runOpt.fragment ? '#' + runOpt.fragment : '';
                var args = runOpt.argument ? '?' + runOpt.argument : '';
                var url = info.url + '/' + runOpt.path + args + sharp;
                var projectPath = info.path;
                var conf = runOpt.name;

                var runningWin = window.open(url, projectPath + conf, runOpt.openArgument);

                if (runningWin) {
                    if (runOpt.liveReload === true) {
                        var handle = topic.subscribe('file.saved', function (file) {
                            if (runningWin.closed) {
                                runningWin = null;
                                handle.remove();
                                handle = null;

                            } else {
                                if (file.path.indexOf(projectPath) === 0) {
                                    runningWin = window.open(url, projectPath + conf, runOpt.openArgument);
                                }
                            }
                        });
                    }

                    defer.resolve();

                } else {
                    var e = new Error('Window can\'t be opened.<br />' +
                    'It might be interrupted by pop-up blocking, please check it.');
                    defer.reject(e);
                }

            }).fail(function (e) {
                console.log('addAlias error: ' + e);
                defer.reject(e);
            });

            return defer.promise;
        },

        exists: function (wsName) {
            var r = false;

            _.forEach(workspaceList, function (ws) {
                if (ws.name === wsName) {
                    r = true;
                    return false;
                }
            });

            return r;
        },
   
        createWorkspace: function (name/*, desc*/) { 
            // TODO should save desc when createWorkspace. Later, use desc parameter.
            var WS_META_PATH = name + '/.workspace';
            var WS_META_FILE = WS_META_PATH + '/workspace.json';
            var defer = Q.defer();

            FS.createDirectory(name, false).then(function () {
                FS.createDirectory(WS_META_PATH)
                    .then($.proxy(FS.writeFile, FS, WS_META_FILE, ''))
                    .then(function () {defer.resolve(); })
                    .fail(function (e) {
                        FS.delete(name, true);
                        defer.reject(e);
                    });
            }).fail(function (e) {
                defer.reject(e);
            });
            return defer.promise;
        },
        
        removeWorkspace: function (name) {
            return FS.delete(name, true);
        },

        editWorkspace: function (name, desc) {
            // TODO should make the way to save description or some other workspace's information.
            var defer = Q.defer();
            var obj;

            FS.readFile(WS_INFO_PATH).then(function (data) {
                obj = JSON.parse(data);
                if (obj[name]) {
                    obj[name].desc = desc;
                }

                FS.writeFile(WS_INFO_PATH, JSON.stringify(obj)).then(function () {
                    defer.resolve();
                }).fail(function () {
                    defer.resolve();
                });
            }).fail(function () {
                defer.resolve();
            });

            return defer.promise;
        }
    });

    if (WorkspaceManager.instance === undefined) {
        WorkspaceManager.instance = new WorkspaceManager();

        FS.getFSId().then(function (id) {
            fsid = id;
        }).fail(function (e) {
            console.log(e);
        });

    }

    return WorkspaceManager.instance;
});