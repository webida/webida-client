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
    'q'
], function (_, FS, App, Q) {
    'use strict';
    /* global topic: true */
    
    var workspaceList = null;
    var isLoaded = false;
    var isLoading = false;
    var fsid;
    
    /* global WS_INFO_PATH, WS_PROFILE_PATH: true */
    var WorkspaceManager = function () {
        this.loadWorkspaces();
    };
    
    $.extend(WorkspaceManager.prototype, {
        
        loadWorkspaces: function (doReload) {
            
            var _this = this;
            var defer = Q.defer();
            
            isLoaded = !!doReload ? false : isLoaded;
            
            if (!isLoading && !isLoaded) {
                isLoading = true;
                
                FS.exists(WS_INFO_PATH).then(function () {
                    _loadWorkspaces();
                    
                }).fail(function () {
                    _this._createWorkspaceInfo()
                    .then($.proxy(_loadWorkspaces, _this));
                });
            }
            
            /* jshint loopfunc: true,forin: false */
            function _loadWorkspaces() {					
                Q.all([FS.readFile(WS_INFO_PATH), App.getMyAppInfo()]).spread(function (data, appInfo) {
                    
                    var deployList = {};
                    var len = appInfo.length;
                    
                    for (var i = 0; i < len; i++) {
                        var info = appInfo[i];
                        
                        if (info.srcurl) {
                            var tokens = info.srcurl.split('/');
                            var total = tokens.length;
                            
                            if (total >= 2) {
                                var id = '/' + tokens[total - 2] + '/' + tokens[total - 1] + '/';
                                deployList[id] = appInfo;
                            }
                        }
                    }
                    
                    workspaceList = [];
                    var list = JSON.parse(data);
                    var dList = [];
                      
                    for (var key in list) {
                        (function () {
                            var ws = list[key];
                            var d = Q.defer();

                            _this.getProjects(ws.path, deployList).then(
                                function (projectList) {
                                    ws.projects = projectList;

                                    d.resolve();

                                }).fail(function (e) {
                                console.log('fail: ', e);
                                ws.projects = [];

                                d.reject(e);
                            });
                            workspaceList.push(ws);
                            dList.push(d.promise);
                        }());
                    }
                   

                    Q.all(dList).then(function () {
                        isLoaded = true;
                        isLoading = false;
                        
                    }).fail(function () {
                        _this._createWorkspaceInfo(list)
                        .then($.proxy(_loadWorkspaces, _this));
                    });
                    
                }).fail(function (e) {
                    console.log('readFile error: ', e);
                    defer.reject(e);
                });
            }
            /* jshint loopfunc: false,forin: true */
            
            function checkIsLoaded() {
                if (isLoaded) {
                    defer.resolve(workspaceList);
                    
                } else {
                    setTimeout(function () {
                        checkIsLoaded();
                    }, 500);
                }
            }
            
            checkIsLoaded();
            
            return defer.promise;
        },
        
        getWorkspaces: function (doReload) {
            var _this = this;
            var defer = Q.defer();
            
            _this.loadWorkspaces(doReload).then(function () {
                workspaceList.sort(function (a, b) {
                    if (a.name > b.name) {
                        return 1;
                    } else {
                        return -1;
                    }
                });
                
                defer.resolve(workspaceList);
                
            }).fail(function (e) {
                defer.reject(e);
            });
            
            return defer.promise;
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
                    var filename = wsPath + '/' + dir.name + '/.project/project.json';
                    
                    FS.readFile(filename).then(function (file) {
                        var project = JSON.parse(file);
                        project.isProject = true;
                        projectList.push(project);
                        
                        var tokens = filename.split('/');
                        var url = ['/', tokens[1], '/', tokens[2], '/'].join('');
                        
                        if (deployList[url]) {
                            project.isDeployed = true;
                        }
                        
                        d.resolve();
                        
                    }).fail(function () {
                        var project = {
                            name: dir.name,
                            isProject: false
                        };
                        
                        projectList.push(project);
                        
                        d.resolve();
                    });
                    
                    dList.push(d.promise);
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
        
        getProjectInfo: function (/* path */) {
            
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
        
        createWorkspace: function (name, desc) {
            var WS_META_PATH = name + '/.workspace';
            var WS_META_FILE = WS_META_PATH + '/workspace.json';
            var defer = Q.defer();
            
            FS.createDirectory(name, false).then(function () {
                FS.createDirectory(WS_META_PATH)
                .then($.proxy(FS.writeFile, FS, WS_META_FILE, ''))
                .then($.proxy(FS.readFile, FS, WS_INFO_PATH))
                .then(function (info) {
                    info = JSON.parse(info);
                    var d = Q.defer();
                    
                    FS.stat([name]).then(function (data) {
                        data[0].birth = new Date().toJSON();
                        data[0].desc = desc;
                        
                        info[name] = data[0];
                        
                        d.resolve(info);
                    });
                    
                    return d.promise;
                    
                }).then(function (info) {
                    FS.writeFile(WS_INFO_PATH, JSON.stringify(info)).then(function () {
                        defer.resolve();
                    });
                    
                }).fail(function (e) {
                    FS.delete(name, true);
                    defer.reject(e);
                });
                
            }).fail(function (e) {
                defer.reject(e);
            });
            
            return defer.promise;
        },
        
        removeWorkspace: function (name) {
            //var WS_META_PATH = name + '/.workspace';
            //var WS_META_FILE = WS_META_PATH + '/workspace.json';
            var defer = Q.defer();
            
            FS.delete(name, true)
            .then($.proxy(FS.readFile, FS, WS_INFO_PATH))
            .then(function (info) {
                info = JSON.parse(info);
                
                if (info[name]) {
                    delete info[name];
                }
                
                return info;
                
            }).then(function (info) {
                FS.writeFile(WS_INFO_PATH, JSON.stringify(info)).then(function () {
                    defer.resolve();
                });
                
            }).fail(function (e) {
                defer.reject(e);
            });
            
            return defer.promise;
        },
        
        editWorkspace: function (name, desc) {
            //var WS_META_PATH = name + '/.workspace';
            //var WS_META_FILE = WS_META_PATH + '/workspace.json';
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
        },
        
        _createWorkspaceInfo: function (oldInfo) {
            var defer = Q.defer();
            
            if (!oldInfo) {
                oldInfo = {};
            }
            
            FS.list('/', false).then(function (data) {
                var wsList = _.chain(data).filter(function (fileObj) {
                    if (!fileObj.name.match(/^\./) && fileObj.isDirectory) {
                        return true;
                    }
                    
                }).map(function (fileObj) { 
                    return '/' + fileObj.name; 
                }).value();
                
                if (wsList.length === 0) {
                    FS.exists(WS_PROFILE_PATH).then(function () {
                        
                    }, function () {
                        //FS.createDirectory(dir, true);
                        FS.createDirectory(WS_PROFILE_PATH, true);
                    })
                    .then($.proxy(FS.writeFile, FS, WS_INFO_PATH, '{}'))
                    .then(function () {
                        defer.resolve();
                        
                    }).fail(function (e) {
                        defer.reject(e);
                    });
                    
                } else {
                    FS.stat(wsList).then(function (stats) {
                        var wsObj = {};
                        
                        _.forEach(stats, function (fileObj) {
                            var name = fileObj.name;
                            
                            if (oldInfo[name]) {
                                fileObj.birth = oldInfo[name].birth;
                                fileObj.desc = oldInfo[name].desc;
                                
                            } else {
                                fileObj.birth = '';
                                fileObj.desc = '';
                            }
                            
                            wsObj[name] = fileObj;
                        });
                        
                        FS.writeFile(WS_INFO_PATH, JSON.stringify(wsObj)).then(function () {
                            defer.resolve();
                        });
                        
                    }).fail(function (e) {
                        defer.reject(e);
                    });
                }
                
            }).fail(function (e) {
                defer.reject(e);
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