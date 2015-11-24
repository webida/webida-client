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
 * webida - project configurator
 *
 * Src:
 *   plugins/project-configurator/projectConfigurator.js
 */
define([
    'external/lodash/lodash.min',
    'dojo/topic',
    'webida-lib/app',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/notify',
    'webida-lib/util/path'
], function (
    _,
    topic,
    ide,
    Logger,
    notify,
    pathUtil
) {
    'use strict';

    var projectConfigurator = {};
    var fsMount = ide.getFSCache(); // ide.getMount();
    var projectPropertyList = [];
    var noProjectList = [];

    var logger = new Logger();

    projectConfigurator.DEBUG_MODE = 'debug';
    projectConfigurator.RUN_MODE = 'run';

    function getConfigurationObjectByProject(projectList) {
        return Promise.all(projectList.map(function (project) {
            return new Promise(function (resolve) {
                if (project.isDirectory === true && project.name[0] !== '.') {
                    getConfigurationObjectFromPath(ide.getPath() + '/' + project.name + '/', function (obj) {
                        if (obj) {
                            addProjectPropertyByName(obj);
                        } else {
                            addNoProjectByName(project.name);
                        }
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        }));
    }

    function readProjectRunConfigurations() {
        return new Promise(function (resolve, reject) {
            fsMount.list(ide.getPath(), function (err, projectList) {
                if (err) {
                    notify.error(err);
                    reject(err);
                } else {
                    resolve(projectList);
                }
            });
        });
    }

    var projectConfigurationLoadPromise = readProjectRunConfigurations()
        .then(getConfigurationObjectByProject)
        .then(function () {
            topic.publish('projectConfig.loadCompleted');
            // FIXME this module has no relation with runAs
            if (projectPropertyList.length === 0 && noProjectList.length === 0) {
                topic.publish('toolbar.runas.disable');
            }
        });


    function deleteProjectPropertyByName(projectName) {
        if (!projectName) {
            return;
        }
        var temp;

        for (var i = 0; i < projectPropertyList.length; i++) {
            temp = projectPropertyList[i];
            if (temp.name === projectName) {
                projectPropertyList.splice(i, 1);
                if (projectPropertyList.length === 0 && noProjectList.length === 0) {
                    topic.publish('toolbar.runas.disable');
                }
                return;
            }
        }
        topic.publish('projectConfig.changed', projectName);
    }

    function addProjectPropertyByName(obj) {
        if (!obj) {
            return;
        }

        projectPropertyList.push(obj);

        if (noProjectList.length === 0 && projectPropertyList.length === 1) {
            topic.publish('toolbar.runas.enable');
        }
    }

    function replaceProjectProperty(obj) {
        var temp;

        for (var i = 0; i < projectPropertyList.length; i++) {
            temp = projectPropertyList[i];
            if (temp.name === obj.name) {
                projectPropertyList.splice(i, 1, obj);
                return;
            }
        }

        addProjectPropertyByName(obj);
    }

    function exsistProjectProperty(name) {
        var temp;

        for (var i = 0; i < projectPropertyList.length; i++) {
            temp = projectPropertyList[i];
            if (temp.name === name) {
                return true;
            }
        }

        return false;
    }

    function getProjectPropertyByName(projectName) {
        if (!projectName) {
            return null;
        }
        var temp;

        for (var i = 0; i < projectPropertyList.length; i++) {
            temp = projectPropertyList[i];
            if (temp.name === projectName) {
                return temp;
            }
        }

        return null;
    }

    function getProjectPropertyByPath(path) {
        if (!path) {
            return null;
        }
        var pathSplit = path.split('/');
        var projectName = pathSplit[2];

        return getProjectPropertyByName(projectName);
    }

    function getConfigurationObjectFromPath(projectPath, cb) {
        var obj = null;
        if (!projectPath) {
            cb(null);
        }

        fsMount.exists(projectPath + '.project', function (err, exist) {
            if (err) {
                cb(null);
            } else {
                if (exist) {
                    fsMount.readFile(projectPath + '.project/project.json', function (err, content) {
                        if (err) {
                            logger.log(err);
                            cb(null);
                        } else {
                            if (content !== '') {
                                try {
                                    obj = JSON.parse(content);
                                } catch (e) {
                                    logger.warn(projectPath + '.project/project.json' +
                                        ' is not valid JSON file. It will be fixed.', e);
                                }
                                var splitProjectPath = projectPath.split('/');
                                var projectName = splitProjectPath[2];
                                if (!obj) {
                                    // If the project.json file was corrupted,
                                    // rewrite this file with the known information.
                                    obj = {
                                        name: projectName,
                                        created: new Date().toGMTString(),
                                        lastmodified: new Date().toGMTString(),
                                        description: '',
                                        type: ''
                                    };
                                    projectConfigurator.saveProjectProperty(projectPath, obj, null);
                                } else if (obj.name !== projectName) {
                                    obj.name = projectName;
                                    obj.lastmodified = new Date().toGMTString();
                                    projectConfigurator.saveProjectProperty(projectPath, obj, null);
                                }
                            }
                            cb(obj);
                        }
                    });
                } else {
                    cb(null);
                }
            }
        });
    }

    function getProjectRootPath(childPath) {
        if (!childPath) {
            return null;
        }
        var splitPath = childPath.split('/');
        if (splitPath.length < 3) {
            return null;
        }
        return splitPath.slice(0, 3).join('/') + '/';
    }

    topic.subscribe('fs.cache.file.set', function (fsURL, target, type, maybeModified) {
        var splitTarget = target.split('/');
        var idePath = ide.getPath() + '/';
        if (splitTarget.length !== 5 || !maybeModified) {
            return;
        }
        var name = splitTarget[4];

        if (name === 'project.json') {
            if (idePath === '/' + splitTarget[1] + '/' && splitTarget[3] === '.project') {
                var splitTargetDir = target.split('.project');
                if (splitTargetDir[0]) {
                    getConfigurationObjectFromPath(splitTargetDir[0], function (obj) {
                        if (obj) {
                            replaceProjectProperty(obj);
                        }
                        topic.publish('projectConfig.changed', splitTargetDir[2]);
                        //logger.log('replace project property : ' + obj);
                    });
                }
            }
        }
    });

    function existNoProject(name) {
        for (var i = 0; i < noProjectList.length; i++) {
            if (noProjectList[i].name === name) {
                return true;
            }
        }
        return false;
    }

    function deleteNoProjectByName(name) {
        for (var i = 0; i < noProjectList.length; i++) {
            if (noProjectList[i].name === name) {
                noProjectList.splice(i, 1);
                if (projectPropertyList.length === 0 && noProjectList.length === 0) {
                    topic.publish('toolbar.runas.disable');
                }
                return;
            }
        }
    }

    function addNoProjectByName(name) {
        if (existNoProject(name) === true) {
            return;
        }

        var noProjectObj = {
            name: name,
            isProject: false
        };

        noProjectList.push(noProjectObj);

        if (noProjectList.length === 1 && projectPropertyList.length === 0) {
            topic.publish('toolbar.runas.enable');
        }
    }

    function newProjectAdded(projectPath, projectName) {
        if (!projectPath || !projectName) {
            return;
        }
        getConfigurationObjectFromPath(projectPath, function (obj) {
            if (obj) {
                if (exsistProjectProperty(projectName) === true) {
                    replaceProjectProperty(obj);
                } else {
                    addProjectPropertyByName(obj);
                }
                deleteNoProjectByName(projectName);
            } else {
                addNoProjectByName(projectName);
                logger.log('newProjectAdded fail ');
            }
            topic.publish('projectConfig.changed', projectName);
        });
    }

    topic.subscribe('projectWizard.created', function (targetDir, projectName) {
        //logger.log(projectName);
        newProjectAdded(targetDir + '/' + projectName + '/', projectName);
    });

    topic.subscribe('fs.cache.node.added', function (fsURL, targetDir, name, type, created) {
        //logger.log('node added' +  ':' + fsURL + ':' + targetDir + ':' + name + ':' + type + ':' + created);
        if (created === false) {
            return;
        }
        var splitTargetDir = targetDir.split('/');
        var idePath = ide.getPath() + '/';				//workspace

        //project folder added
        if (targetDir === idePath && name[0] !== '.') {
            newProjectAdded(targetDir + name + '/', name);
        }

        //.project folder added
        if (name === '.project' && type === 'dir' && splitTargetDir[2][0] !== '.') {
            // check .project
            if (splitTargetDir.length === 4 && idePath === '/' + splitTargetDir[1] + '/') {
                newProjectAdded(targetDir, splitTargetDir[2]);
            }
        }

        //project.json file added
        if (name === 'project.json' && type === 'file' && splitTargetDir[2][0] !== '.') {
            if (splitTargetDir.length === 5 && idePath === '/' + splitTargetDir[1] + '/' &&
                splitTargetDir[3] === '.project') {
                var projectNameSplit = targetDir.split('.project');
                newProjectAdded(projectNameSplit[0], splitTargetDir[2]);
            }
        }
    });

    topic.subscribe('fs.cache.node.deleted', function (fsURL, targetDir, name, type) {
        var splitTargetDir = targetDir.split('/');

        //project folder delete
        var idePath = ide.getPath() + '/';

        if (targetDir === idePath) {
            deleteProjectPropertyByName(name);
            deleteNoProjectByName(name);
        }

        //.project folder delete
        if (name === '.project' && type === 'dir') {
            // check .project
            if (splitTargetDir.length === 4 && idePath === '/' + splitTargetDir[1] + '/') {
                deleteProjectPropertyByName(splitTargetDir[2]);
                addNoProjectByName(splitTargetDir[2]);
            }
        }

        //project.json delete
        if (name === 'project.json' && type === 'file') {
            // check .project
            if (splitTargetDir.length === 5 && idePath === '/' + splitTargetDir[1] + '/' &&
                splitTargetDir[3] === '.project') {
                deleteProjectPropertyByName(splitTargetDir[2]);
                addNoProjectByName(splitTargetDir[2]);
            }
        }
    });

    function makeProjectProjectObject(name, description, created,
                                      type, path) {
        var obj = {
            name: name,
            description: description,
            created: created,
            type: type,
            path: path,
            isProject: true
        };
        return obj;
    }

    function makeProjectRunObject(name, path, fragment, argument, openArgument,
                                  liveReload) {
        var obj = {
            name: name,
            path: path,
            fragment: fragment,
            argument: argument,
            openArgument: openArgument,
            liveReload: liveReload
        };
        return obj;
    }


    projectConfigurator.makeEmptyProjectPropertyObject = function () {
        return makeProjectProjectObject('', '', '', '', '');
    };

    projectConfigurator.makeEmptyRunObject = function () {
        return makeProjectRunObject('', '', '', '', '', '');
    };

    projectConfigurator.getOwnerProjectRootPath = function (childFilePath) {
        var workspacePath = ide.getPath();

        if (childFilePath.substring(0, workspacePath.length) === workspacePath) {
            var subpath = childFilePath.substring(workspacePath.length + 1);
            var names = subpath.split('/');
            if (names.length > 0) {
                return pathUtil.combine(workspacePath, names[0]);
            }
        }

        return null;
    };

    function createProjectFolder(path, cb) {
        var splitPath = path.split('/');

        if (splitPath.length !== 4) {
            if (cb) {
                cb('error: ' + path + 'is not a project path');
            }
            return;
        }
        var filePath = path + '.project';
        fsMount.exists(filePath, function (err, result) {
            if (err) {
                notify.error('"exists" API call failed: ' + err);
                return;
            }
            if (result) {
                if (cb) {
                    cb();
                }
            } else {
                fsMount.createDirectory(filePath, function (err) {
                    if (err) {
                        cb('"createDirectory" API call failed: ' + err);
                    } else {
                        if (cb) {
                            cb();
                        }
                    }
                });
            }
        });

    }
    projectConfigurator.createProjectProperty = function (path, cb) {
        var filePath = path + '.project';

        fsMount.exists(filePath, function (err, result) {
            if (err) {
                notify.error('"exists" API call failed: ' + err);
                return;
            }
            if (result) {
                filePath += '/project.json';

                var date = new Date();
                var pathSplit = filePath.split('/');
                var name = pathSplit[2];
                var obj = makeProjectProjectObject(name, '', date.toGMTString(), '', path);

                //projectConfigurator.saveProjectProperty(path, obj, cb);
                projectConfigurator.saveProjectProperty(path, obj, function (err) {
                    if (err) {
                        notify.error('"writeFile" API call failed: ' + err);
                    } else {
                        addProjectPropertyByName(obj);
                        if (cb) {
                            cb();
                        }
                    }
                });
            } else {
                fsMount.createDirectory(filePath, function (err) {
                    if (err) {
                        cb(filePath + ' create fail');
                    } else {
                        filePath += '/project.json';

                        var date = new Date();
                        var pathSplit = filePath.split('/');
                        var name = pathSplit[2];
                        var obj = makeProjectProjectObject(name, '', date.toGMTString(), '', filePath);

                        projectConfigurator.saveProjectProperty(path, obj, function (err) {
                            if (err) {
                                notify.error('"writeFile" API call failed: ' + err);
                            } else {
                                addProjectPropertyByName(obj);
                                if (cb) {
                                    cb();
                                }
                            }
                        });
                    }
                });
            }
        });

    };

    projectConfigurator.saveProjectProperty = function (path, obj, cb) {
        var jsonText = JSON.stringify(obj);
        createProjectFolder(path, function (err) {
            if (err) {
                if (cb) {
                    cb(err);
                }
                return;
            }
            fsMount.writeFile(path + '.project/project.json', jsonText, function (err) {
                if (err) {
                    logger.log(path + 'Failed to save .project/project.json');
                    if (cb) {
                        cb(err);
                    }
                } else {

                    if (cb) {
                        cb();
                    }
                }
            });
        });
    };

    projectConfigurator.getProjectFileName = function () {
        return '.project/project.json';
    };

    projectConfigurator.getConfigurationObject = function (path, c) {
        return projectConfigurator.getConfigurationObjectByPath(path, c);
    };

    projectConfigurator.getConfigurationObjectByPath = function (path, callback) {
        projectConfigurationLoadPromise.then(function () {
            var obj = getProjectPropertyByPath(path);
            if (callback) {
                callback(obj);
            }
        });
        return getProjectPropertyByPath(path);
    };

    projectConfigurator.getConfigurationObjectByProjectName = function (name, callback) {
        projectConfigurationLoadPromise.then(function () {
            var obj = getProjectPropertyByName(name);

            if (callback) {
                callback(obj);
            }
        });
        return getProjectPropertyByName(name);
    };

    projectConfigurator.getProjectRootPath = getProjectRootPath;

    projectConfigurator.getProjectPropertyList = function (callback) {
        projectConfigurationLoadPromise.then(function () {
            if (callback) {
                callback(projectPropertyList);
            }
        });
        return projectPropertyList;
    };

    projectConfigurator.getRunAsList = function () {
        var runAsList = projectPropertyList.concat(noProjectList);
        runAsList.sort(function (a, b) {
            if (a.name > b.name) {
                return 1;
            } else {
                return -1;
            }
        });
        return runAsList;
    };

    projectConfigurator.getProjectRootHtml = function (filePath, c) {
        var projectRootPath = projectConfigurator.getOwnerProjectRootPath(filePath);
        var projectFileName = projectConfigurator.getProjectFileName();
        if (projectRootPath === undefined || projectRootPath === null ||
            projectFileName === undefined || projectFileName === null) {
            c([]);
        } else {
            var projectConfPath = pathUtil.combine(projectRootPath, projectFileName);
            projectConfigurator.getConfigurationObject(projectConfPath, function (projectObj) {
                var htmlPaths = [];
                if (projectObj && projectObj.run && projectObj.run.list && projectObj.run.list.length > 0) {
                    for (var i = 0; i < projectObj.run.list.length; i++) {
                        var runObj = projectObj.run.list[i];
                        if (pathUtil.endsWith(runObj.path, '.html', true)) {
                            var htmlPath = runObj.path;
                            if (/^\//.test(htmlPath)) {
                                htmlPath = htmlPath.substr(1);
                            }
                            htmlPath = projectRootPath + '/' + htmlPath;
                            if (!/^\//.test(htmlPath)) {
                                htmlPath = '/' + htmlPath;
                            }
                            htmlPaths.push(htmlPath);
                        }
                    }
                }
                c(htmlPaths);
            });
        }
    };

    return projectConfigurator;
});
