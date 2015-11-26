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
 * webida - run configuration manager
 *
 * Src:
 *   plugins/webida.ide.project-management.run/run-configuration-manager.js
 */
define([
    'external/async/dist/async.min',
    'external/lodash/lodash.min',
    'external/URIjs/src/URI',
    'dojo/i18n!./nls/resource',
    'dojo/topic',
    'webida-lib/app',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/locale',
    'webida-lib/util/notify',
    'webida-lib/util/path'
], function (
    async,
    _,
    URI,
    i18n,
    topic,
    ide,
    workspace,
    Logger,
    Locale,
    notify,
    pathutil
) {
    'use strict';

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    logger.off();

    var locale = new Locale(i18n);

    var PATH_WORKSPACE = ide.getPath();
    var WORKSPACE_INFO_DIR_NAME = '.workspace';
    var RUN_CONFIG_FILE_NAME = 'workspace.json';
    var PATH_RUN_CONFIG = PATH_WORKSPACE + '/' + WORKSPACE_INFO_DIR_NAME + '/' + RUN_CONFIG_FILE_NAME;

    //var topics = {
    //    RUN_AS_DISABLED: 'toolbar.runas.disable',
    //    RUN_AS_ENABLED: 'toolbar.runas.enable'
    //};

    var MODE = {
        RUN_MODE: 'run',
        DEBUG_MODE: 'debug'
    };

    var fsMount = ide.getFSCache();

    var runConfigurationFileCache;
    var runConfigurations = {};

    var isFlushing = false;

    /**
     * Create sorted object in ascending order by keys
     */
    function sortKeysBy(obj) {
        var keys = _.sortBy(_.keys(obj));
        return _.object(keys, _.map(keys, function (key) {
            return obj[key];
        }));
    }

    /**
     * load run configurations of all project from workspace.json file
     */
    function loadRunConfigurations(callback) {
        if (!isFlushing) {
            async.waterfall([
                function (next) {
                    fsMount.exists(PATH_RUN_CONFIG, function (err, exist) {
                        if (err) {
                            next(err);
                        } else if (!exist) {
                            next(locale.formatMessage('messageNotExist', {target: PATH_RUN_CONFIG}));
                        } else {
                            next();
                        }
                    });
                },
                function (next) {
                    fsMount.readFile(PATH_RUN_CONFIG, function (err, content) {
                        var workspaceObj;
                        if (err) {
                            next(err);
                        } else {
                            runConfigurationFileCache = content || '{}';
                            workspaceObj = JSON.parse(runConfigurationFileCache);
                            if (workspaceObj.run && Object.getOwnPropertyNames(workspaceObj.run).length > 0) {
                                runConfigurations = sortKeysBy(workspaceObj.run);
                                next();
                            } else {
                                next(PATH_RUN_CONFIG + ' hasn\'t run configuration info');
                            }
                        }
                    });
                }
            ], function (err) {
                if (err) {
                    logger.error('loadRunConfigurations', err);
                }
                if (callback) {
                    callback(err);
                }
            });
        }
    }

    /**
     * flush updated run configurations to workspace.json file
     */
    function flushRunConfigurations(callback) {
        var originalRun = JSON.parse(runConfigurationFileCache).run;
        isFlushing = true;

        _.each(runConfigurations, function (runConf) {
            if (runConf._dirty) {
                if (originalRun[runConf.originalName]) {
                    runConfigurations[runConf.originalName] = originalRun[runConf.originalName];
                } else {
                    runConf._deleted = true;
                }
            }
            delete runConf._dirty;
            delete runConf.originalName;
        });

        runConfigurations = _.omit(runConfigurations, function (runConf) {
            return runConf._deleted;
        });

        var unsyncedItems = [];
        _.map(runConfigurations, function (runConf, name) {
            if (runConf.name !== name) {
                unsyncedItems.push({
                    oldName: name,
                    newName: runConf.name
                });
            }
        });

        _.each(unsyncedItems, function (item) {
            runConfigurations[item.newName] = runConfigurations[item.oldName];
            delete runConfigurations[item.oldName];
        });

        runConfigurationFileCache = JSON.stringify({ run: sortKeysBy(runConfigurations) });
        fsMount.writeFile(PATH_RUN_CONFIG, runConfigurationFileCache, function (err) {
            isFlushing = false;
            if (err) {
                notify.error(err);
                logger.error('flushRunConfigurations:writeFile', PATH_RUN_CONFIG);
            }
            if (callback) {
                callback(err);
            }
        });
    }

    function _getPathInfo(path) {
        var result = {};
        if (!path) {
            return result;
        }
        if (path.charAt(0) === '/') {
            path = path.substring(1);
        }
        var workspaceName = PATH_WORKSPACE.substring(1);
        var splitedPath = pathutil.detachSlash(path).split('/');

        if (splitedPath.length > 0) {
            result.name = splitedPath[splitedPath.length - 1];
            var distanceFromWorkspace = splitedPath.length - splitedPath.indexOf(workspaceName);
            if (distanceFromWorkspace <= splitedPath.length) {
                result.isInWorkspace = true;
                if (distanceFromWorkspace === 1) {
                    result.type = 'workspace';
                } else if (distanceFromWorkspace === 2 && result.name !== WORKSPACE_INFO_DIR_NAME) {
                    result.type = 'project';
                } else if (distanceFromWorkspace === 2 && result.name === WORKSPACE_INFO_DIR_NAME) {
                    result.type = 'workspaceInfo';
                } else if (distanceFromWorkspace === 3 && result.name === RUN_CONFIG_FILE_NAME &&
                    splitedPath[splitedPath.indexOf(workspaceName) + 1] === WORKSPACE_INFO_DIR_NAME) {
                    result.type = 'runConfig';
                } else {
                    result.projectName = splitedPath[splitedPath.indexOf(workspaceName) + 1];
                }
            } else {
                result.isInWorkspace = false;
            }
        }
        return result;
    }

    var projectActions = {
        replaceProject: function (oldProjectName, newProjectName) {
            // change runConfigurations object
            _.each(_.where(runConfigurations, {
                project: oldProjectName
            }), function (runConf) {
                runConf.project = newProjectName;
            });
            // change runConfigurationsByProject object

            flushRunConfigurations();
        },
        deleteProject: function (projectName) {
            // change runConfigurations object
            runConfigurations = _.omit(runConfigurations, function (runConf) {
                return runConf.project === projectName;
            });
            flushRunConfigurations();
        }
    };

    function addListeners() {
        topic.subscribe('sys.fs.node.moved', function (event) {
            logger.log('sys.fs.node.moved', arguments);
            var src = event.srcURL;
            var dest = event.dstURL;
            var srcPathInfo = _getPathInfo(src);
            var destPathInfo = _getPathInfo(dest);
            if (srcPathInfo.type === 'project' && destPathInfo.type === 'project') {
                // ignore the case of nested projects
                projectActions.replaceProject(srcPathInfo.name, destPathInfo.name);
            } else if (srcPathInfo.type === 'workspaceInfo' || srcPathInfo.type === 'runConfig') {
                loadRunConfigurations();
            }
        });

        function _applyChangesOnFile(filePath) {
            var targetPathInfo = _getPathInfo(filePath);
            if (targetPathInfo.type === 'runConfig') {
                require(['plugins/webida.ide.project-management.run/view-controller'], function (viewController) {
                    if (!viewController.getWindowOpened()) {
                        loadRunConfigurations();
                    }
                });
            }
        }

        // apply changes on run config file at current IDE
        topic.subscribe('fs.cache.file.set', function (fsURL, target) {
            logger.log('fs.cache.file.set', arguments);
            _applyChangesOnFile(target);
        });

        // apply changes on run config file at another IDE
        topic.subscribe('sys.fs.file.written', function (data) {
            logger.log('sys.fs.file.written', data);
            var uri = new URI(data.url);
            uri.segment(0, '');	                    // drop the fsid
            _applyChangesOnFile(uri.path(true));    // get decoded path
        });

        topic.subscribe('fs.cache.node.deleted', function (fsURL, targetDir, name, type) {
            logger.log('fs.cache.node.deleted', arguments);
            if (type !== 'dir') {
                return;
            }
            var targetPathInfo = _getPathInfo(targetDir);
            if (targetPathInfo.type === 'workspace') {
                projectActions.deleteProject(name);
            } else if (targetPathInfo.type === 'workspaceInfo' || targetPathInfo.type === 'runConfig') {
                loadRunConfigurations();
            }
        });
    }

    (function initialize() {
        loadRunConfigurations();
        addListeners();
    })();

    function RunConfigurationManager() {
        var self = this;

        this.MODE = MODE;

        this.flushRunConfigurations = flushRunConfigurations;
        this.getByPath = function (path) {
            var pathInfo = _getPathInfo(path);
            if (pathInfo.projectName) {
                return self.getByProjectName(pathInfo.projectName);
            }
            return;
        };
        this.getByProjectName = function (projectName, callback) {
            var confList = _.filter(_.values(runConfigurations), function (runConf) {
                return runConf.project === projectName;
            });

            if (callback) {
                callback(confList);
            }
            return confList;
        };
        this.getByName = function (runConfigurationName, callback) {
            var conf = runConfigurations[runConfigurationName];
            if (callback) {
                callback(conf);
            }
            return conf;
        };
        this.getAll = function () {
            return runConfigurations;
        };
        this.add = function (runConfiguration) {
            runConfigurations[runConfiguration.name] = runConfiguration;
        };
        this.save = function (runConfiguration) {
            delete runConfiguration._dirty;
            runConfigurations[runConfiguration.name] = runConfiguration;

            flushRunConfigurations();
        };
        this.set = function (projectName, runConfigurations, callback) {
            _.each(runConfigurations, function (runConf) {
                runConfigurations[runConf.name] = runConf;
            });

            flushRunConfigurations(function (err) {
                if (!err) {
                    loadRunConfigurations(callback);
                }
            });
        };
        this.delete = function (runConfigurationName) {
            if (runConfigurations[runConfigurationName]) {
                runConfigurations[runConfigurationName]._deleted = true;
            }
            flushRunConfigurations();
        };
        this.setLatestRun = function (runConfigurationName) {
            if (runConfigurations[runConfigurationName]) {
                var project = runConfigurations[runConfigurationName].project;
                _.each(runConfigurations, function (runConf) {
                    if (runConf.project === project) {
                        runConf.latestRun = false;
                    }
                });
                runConfigurations[runConfigurationName].latestRun = true;
                flushRunConfigurations();
            }
        };
        this.getProjectRootHtml = function (filePath, callback) {
            var pathInfo = _getPathInfo(filePath);
            var htmlPaths = [];
            if (pathInfo.projectName) {
                _.each(runConfigurations, function (runConf) {
                    if (runConf.project === pathInfo.projectName &&
                        runConf.type === '' &&
                        pathutil.isHtml(runConf.path)) {
                        htmlPaths.push(pathutil.combine(PATH_WORKSPACE + '/' + pathInfo.projectName, runConf.path));
                    }
                });
            }
            callback(htmlPaths);
        };
    }

    return new RunConfigurationManager();
});
