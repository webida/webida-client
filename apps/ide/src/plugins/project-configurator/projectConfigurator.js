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
 * @file Manager for the configurations of projects
 * @since 1.0.0
 * @author yt.byeon@samsung.com
 * @module ProjectConfigurator
 */
define([
    'external/lodash/lodash.min',
    'dojo/topic',
    'webida-lib/app',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/notify'
], function (
    _,
    topic,
    ide,
    Logger,
    notify
) {
    'use strict';

    /**
     * @typedef {Object} projectInfo
     * @property {string} name
     * @property {?string} created       - created date
     * @property {?string} lastmodified  - last modified date string
     * @property {?string} type
     * @property {?string} path
     * @property {boolean} isProject
     * @property {?string} description
     * @memberof module:ProjectConfigurator
     */

    /**
     * @type {Logger}
     */
    var logger = new Logger();

    /**
     * This module object
     * @type {Object}
     */
    var projectConfigurator = {};

    /**
     * FsCache instance
     * @type {Object}
     */
    var fsMount = ide.getFSCache();

    /**
     * All of the configuration of projects that has a .project/project.json file
     * @type {Array.<projectInfo>}
     */
    var projectPropertyList = [];

    /**
     * All of the configuration of projects that has no .project/project.json file
     * @type {Array.<projectInfo>}
     */
    var noProjectList = [];

    /**
     * The promise object for loading project configurations
     */
    var projectConfigurationLoadPromise;

    /**
     * The directory name of project configuration file in
     * @constant {string}
     */
    var PROJECT_CONF_DIR = '.project';
    /**
     * The name of project configuration file
     * @constant {string}
     */
    var PROJECT_CONF_FILE = 'project.json';

    /**
     * Get configurations from project list
     *
     * @param {Array.<module:webida.list_info>} projectList
     * @return {Promise}
     * @private
     */
    function _getConfigurationObjectByProject(projectList) {
        return Promise.all(projectList.map(function (project) {
            return new Promise(function (resolve) {
                if (project.isDirectory === true && project.name[0] !== '.') {
                    _readConfigurationObject(ide.getPath() + '/' + project.name + '/', function (obj) {
                        if (obj) {
                            _addProject(obj);
                        } else {
                            _addNoProjectByName(project.name);
                        }
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        }));
    }

    /**
     * Get all project list
     *
     * @return {Promise}
     * @private
     */
    function _getAllProjectList() {
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

    /**
     * Delete project configuration by its name
     *
     * @param projectName
     * @private
     */
    function _deleteProjectPropertyByName(projectName) {
        if (!projectName) {
            return;
        }
        var temp;
        for (var i = 0; i < projectPropertyList.length; i++) {
            temp = projectPropertyList[i];
            if (temp.name === projectName) {
                projectPropertyList.splice(i, 1);
                if (projectPropertyList.length === 0 && noProjectList.length === 0) {
                    topic.publish('toolbar/disable/runas');
                }
                return;
            }
        }
        topic.publish('project/config/changed', projectName);
    }

    /**
     * Add project configuration object
     *
     * @param {projectInfo} obj
     * @private
     */
    function _addProject(obj) {
        if (!obj) {
            return;
        }
        projectPropertyList.push(obj);
        if (noProjectList.length === 0 && projectPropertyList.length === 1) {
            topic.publish('toolbar/enable/runas');
        }
    }

    /**
     * Replace project configuration object by its name
     *
     * @param {projectInfo} obj
     * @private
     */
    function _replaceProject(obj) {
        var temp;
        for (var i = 0; i < projectPropertyList.length; i++) {
            temp = projectPropertyList[i];
            if (temp.name === obj.name) {
                projectPropertyList.splice(i, 1, obj);
                return;
            }
        }
        _addProject(obj);
    }

    /**
     * Get existence of project configuration by its name
     *
     * @param {string} name - project name
     * @return {boolean} - existence
     * @private
     */
    function _existProjectProperty(name) {
        var temp;
        for (var i = 0; i < projectPropertyList.length; i++) {
            temp = projectPropertyList[i];
            if (temp.name === name) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get project configuration by its name
     *
     * @param projectName
     * @return {?projectInfo}
     * @private
     */
    function _getProjectPropertyByName(projectName) {
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

    /**
     * Get project configuration by its path
     *
     * @param {string} path
     * @return {?projectInfo}
     * @private
     */
    function _getProjectPropertyByPath(path) {
        if (!path) {
            return null;
        }
        var pathSplit = path.split('/');
        var projectName = pathSplit[2];

        return _getProjectPropertyByName(projectName);
    }

    /**
     * Read project configuration object from .project/project.json file
     *
     * @param {string} projectPath - path to the project
     * @param {module:ProjectConfigurator/service.projectInfoCallback} cb
     * @private
     */
    function _readConfigurationObject(projectPath, cb) {
        var obj = null;
        if (!projectPath) {
            return cb(null);
        }

        fsMount.exists(projectPath + PROJECT_CONF_DIR, function (err, exist) {
            if (err) {
                return cb(null);
            }
            if (exist) {
                fsMount.readFile(projectPath + PROJECT_CONF_DIR + '/' + PROJECT_CONF_FILE, function (err, content) {
                    if (err) {
                        logger.log(err);
                        cb(null);
                    } else {
                        if (content !== '') {
                            try {
                                obj = JSON.parse(content);
                            } catch (e) {
                                logger.warn(projectPath + PROJECT_CONF_DIR + '/' + PROJECT_CONF_FILE +
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
        });
    }

    /**
     * Get existence of the project that has no configuration by its name
     *
     * @param {string} name - project name
     * @return {boolean} - existence
     * @private
     */
    function _existNoProject(name) {
        for (var i = 0; i < noProjectList.length; i++) {
            if (noProjectList[i].name === name) {
                return true;
            }
        }
        return false;
    }

    /**
     * Delete project (that has no configuration) fro no project list
     *
     * @param {string} name - project name
     * @private
     */
    function _deleteNoProjectByName(name) {
        for (var i = 0; i < noProjectList.length; i++) {
            if (noProjectList[i].name === name) {
                noProjectList.splice(i, 1);
                if (projectPropertyList.length === 0 && noProjectList.length === 0) {
                    topic.publish('toolbar/disable/runas');
                }
                return;
            }
        }
    }

    /**
     * Add project to the no project list
     *
     * @param {string} name - project name
     * @private
     */
    function _addNoProjectByName(name) {
        if (_existNoProject(name) === true) {
            return;
        }
        noProjectList.push(/** @type {projectInfo} */{
            name: name,
            isProject: false
        });
        if (noProjectList.length === 1 && projectPropertyList.length === 0) {
            topic.publish('toolbar/enable/runas');
        }
    }

    /**
     * Determine what type of the just created project
     *
     * @param {string} projectPath - path to the project
     * @param {string} projectName - project name
     * @private
     */
    function _newProjectAdded(projectPath, projectName) {
        if (!projectPath || !projectName) {
            return;
        }
        _readConfigurationObject(projectPath, function (obj) {
            if (obj) {
                if (_existProjectProperty(projectName) === true) {
                    _replaceProject(obj);
                } else {
                    _addProject(obj);
                }
                _deleteNoProjectByName(projectName);
            } else {
                _addNoProjectByName(projectName);
                logger.log('newProjectAdded fail ');
            }
            topic.publish('project/config/changed', projectName);
        });
    }

    /**
     * Start to listen some topics and initialize some values
     *
     * @private
     */
    (function _initialize() {
        projectConfigurationLoadPromise = _getAllProjectList()
            .then(_getConfigurationObjectByProject)
            .then(function () {
                topic.publish('project/config/load-completed');
                // FIXME this module has no relation with runAs
                if (projectPropertyList.length === 0 && noProjectList.length === 0) {
                    topic.publish('toolbar/disable/runas');
                }
            });

        topic.subscribe('fs/cache/file/set', function (fsURL, target, type, maybeModified) {
            var splitTarget = target.split('/');
            var idePath = ide.getPath() + '/';
            if (splitTarget.length !== 5 || !maybeModified) {
                return;
            }
            var name = splitTarget[4];

            if (name === PROJECT_CONF_FILE) {
                if (idePath === '/' + splitTarget[1] + '/' && splitTarget[3] === PROJECT_CONF_DIR) {
                    var splitTargetDir = target.split(PROJECT_CONF_DIR);
                    if (splitTargetDir[0]) {
                        _readConfigurationObject(splitTargetDir[0], function (obj) {
                            if (obj) {
                                _replaceProject(obj);
                            }
                            topic.publish('project/config/changed', splitTargetDir[2]);
                        });
                    }
                }
            }
        });

        topic.subscribe('project/wizard/created', function (targetDir, projectName) {
            _newProjectAdded(targetDir + '/' + projectName + '/', projectName);
        });

        topic.subscribe('fs/cache/node/added', function (fsURL, targetDir, name, type, created) {
            if (created === false) {
                return;
            }
            var splitTargetDir = targetDir.split('/');
            var idePath = ide.getPath() + '/';				//workspace

            //project folder added
            if (targetDir === idePath && name[0] !== '.') {
                _newProjectAdded(targetDir + name + '/', name);
            }

            //.project folder added
            if (name === PROJECT_CONF_DIR && type === 'dir' && splitTargetDir[2][0] !== '.') {
                // check .project
                if (splitTargetDir.length === 4 && idePath === '/' + splitTargetDir[1] + '/') {
                    _newProjectAdded(targetDir, splitTargetDir[2]);
                }
            }

            //project.json file added
            if (name === PROJECT_CONF_FILE && type === 'file' && splitTargetDir[2][0] !== '.') {
                if (splitTargetDir.length === 5 && idePath === '/' + splitTargetDir[1] + '/' &&
                    splitTargetDir[3] === PROJECT_CONF_DIR) {
                    var projectNameSplit = targetDir.split(PROJECT_CONF_DIR);
                    _newProjectAdded(projectNameSplit[0], splitTargetDir[2]);
                }
            }
        });

        topic.subscribe('fs/cache/node/deleted', function (fsURL, targetDir, name, type) {
            var splitTargetDir = targetDir.split('/');

            //project folder delete
            var idePath = ide.getPath() + '/';

            if (targetDir === idePath) {
                _deleteProjectPropertyByName(name);
                _deleteNoProjectByName(name);
            }

            //.project folder delete
            if (name === PROJECT_CONF_DIR && type === 'dir') {
                // check .project
                if (splitTargetDir.length === 4 && idePath === '/' + splitTargetDir[1] + '/') {
                    _deleteProjectPropertyByName(splitTargetDir[2]);
                    _addNoProjectByName(splitTargetDir[2]);
                }
            }

            //project.json delete
            if (name === PROJECT_CONF_FILE && type === 'file') {
                // check .project
                if (splitTargetDir.length === 5 && idePath === '/' + splitTargetDir[1] + '/' &&
                    splitTargetDir[3] === PROJECT_CONF_DIR) {
                    _deleteProjectPropertyByName(splitTargetDir[2]);
                    _addNoProjectByName(splitTargetDir[2]);
                }
            }
        });
    })();

    /**
     * Generate project information object
     *
     * @param {string} name
     * @param {string} description
     * @param {string} created
     * @param {string} type
     * @param {string} path
     * @return {projectInfo}
     * @private
     */
    function _makeProjectProjectObject(name, description, created, type, path) {
        return {
            name: name,
            description: description,
            created: created,
            type: type,
            path: path,
            isProject: true
        };
    }

    /**
     * Create the project configuration directory (.project)
     *
     * @param {string} path - project path
     * @param {module:ProjectConfigurator/service.errorCallback} cb
     * @private
     */
    function _createProjectFolder(path, cb) {
        var splitPath = path.split('/');

        if (splitPath.length !== 4) {
            if (cb) {
                cb('error: ' + path + 'is not a project path');
            }
            return;
        }
        var filePath = path + PROJECT_CONF_DIR;
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

    /**
     * Create project configurator file
     *
     * @param {string} path - path to project directory
     * @param {module:ProjectConfigurator/service.errorCallback} cb
     *
     * FIXME Did it put the intention not to call cb function in some error cases?
     */
    projectConfigurator.createProjectProperty = function (path, cb) {
        var filePath = path + PROJECT_CONF_DIR;

        fsMount.exists(filePath, function (err, result) {
            if (err) {
                notify.error('"exists" API call failed: ' + err);
                return;
            }
            if (result) {
                filePath += '/' + PROJECT_CONF_FILE;

                var date = new Date();
                var pathSplit = filePath.split('/');
                var name = pathSplit[2];
                var obj = _makeProjectProjectObject(name, '', date.toGMTString(), '', path);

                projectConfigurator.saveProjectProperty(path, obj, function (err) {
                    if (err) {
                        notify.error('"writeFile" API call failed: ' + err);
                    } else {
                        _addProject(obj);
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
                        filePath += '/' + PROJECT_CONF_FILE;

                        var date = new Date();
                        var pathSplit = filePath.split('/');
                        var name = pathSplit[2];
                        var obj = _makeProjectProjectObject(name, '', date.toGMTString(), '', filePath);

                        projectConfigurator.saveProjectProperty(path, obj, function (err) {
                            if (err) {
                                notify.error('"writeFile" API call failed: ' + err);
                            } else {
                                _addProject(obj);
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

    /**
     * Set project information to the project information file
     *
     * @param {string} path - project name
     * @param {object} obj - project information to save
     * @param {module:ProjectConfigurator/service.errorCallback} [cb] - callback that is called when setting is finished
     *
     * @see module:ProjectConfigurator/service.save
     */
    projectConfigurator.saveProjectProperty = function (path, obj, cb) {
        var jsonText = JSON.stringify(obj);
        _createProjectFolder(path, function (err) {
            if (err) {
                if (cb) {
                    cb(err);
                }
                return;
            }
            fsMount.writeFile(path + PROJECT_CONF_DIR + '/' + PROJECT_CONF_FILE, jsonText, function (err) {
                if (err) {
                    logger.log(path + 'Failed to save ' + PROJECT_CONF_DIR + '/' + PROJECT_CONF_FILE);
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

    /**
     * Get project configuration by file path
     * It's more safe to use callback function than to depend on return value.
     *
     * @param {string} path - path somewhere in any project directory
     * @param {module:ProjectConfigurator/service.projectInfoCallback} [callback]
     * @return {projectInfo}
     */
    projectConfigurator.getConfigurationObjectByPath = function (path, callback) {
        projectConfigurationLoadPromise.then(function () {
            var obj = _getProjectPropertyByPath(path);
            if (callback) {
                callback(obj);
            }
        });
        return _getProjectPropertyByPath(path);
    };

    /**
     * Get project configuration by its project name
     * It's more safe to use callback function than to depend on return value.
     *
     * @param {string} name - project name
     * @callback callback
     * @return {projectInfo}
     */
    projectConfigurator.getConfigurationObjectByProjectName = function (name, callback) {
        projectConfigurationLoadPromise.then(function () {
            var obj = _getProjectPropertyByName(name);

            if (callback) {
                callback(obj);
            }
        });
        return _getProjectPropertyByName(name);
    };

    /**
     * Get all project configurations
     * @callback callback
     * @return {Array.<projectInfo>}
     */
    projectConfigurator.getProjectPropertyList = function (callback) {
        projectConfigurationLoadPromise.then(function () {
            if (callback) {
                callback(projectPropertyList);
            }
        });
        return projectPropertyList;
    };

    return projectConfigurator;
});
