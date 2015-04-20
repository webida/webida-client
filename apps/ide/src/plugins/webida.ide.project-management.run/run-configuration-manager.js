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
define(['webida-lib/app',
        'webida-lib/util/path',
        'dojo/topic',
        'webida-lib/plugins/workspace/plugin',
        'other-lib/async',
        'other-lib/underscore/lodash.min',
        'other-lib/toastr/toastr'
], function (ide, pathutil, topic, workspace, async, _, toastr) {
    'use strict';

    var WORKSPACE_DIR_NAME = ide.getPath();
    var WORKSPACE_INFO_DIR_NAME = '.workspace';
    var RUN_CONFIG_FILE_NAME = 'workspace.json';
    var PATH_RUN_CONFIG = WORKSPACE_DIR_NAME + '/' + WORKSPACE_INFO_DIR_NAME + '/' + RUN_CONFIG_FILE_NAME;

    var topics = {
        RUN_AS_DISABLED: 'toolbar.runas.disable',
        RUN_AS_ENABLED: 'toolbar.runas.enable'
    };

    var fsMount = ide.getFSCache();

    var runConfigurations = {};
    var runConfigurationsByProject = {};

    /**
     * load run configurations of all project from workspace.json file
     */
    function loadRunConfigurations(callback){

        runConfigurations = {};
        runConfigurationsByProject = {};

        function readRunConfigurationFile(next) {
            fsMount.exists(PATH_RUN_CONFIG, function (err, exist) {
                if (err) {
                    console.error('loadRunConfigurations:exist:' + PATH_RUN_CONFIG, err);
                    next(err);
                } else if (exist) {
                    fsMount.readFile(PATH_RUN_CONFIG, function (err, content) {
                        if (err) {
                            next(err);
                            console.error('loadRunConfigurations:readFile:' + PATH_RUN_CONFIG, err);
                        } else if (content) {
                            var workspaceObj = JSON.parse(content);
                            if (workspaceObj.run && Object.getOwnPropertyNames(workspaceObj.run).length > 0) {
                                next(null, workspaceObj.run);
                            }
                        }
                        next(null, {});
                    });
                } else {
                    //topic.publish(topics.RUN_AS_DISABLED);
                    next(null, {});
                }
            });
        }

        function getAllProjects(next) {
            fsMount.list(WORKSPACE_DIR_NAME, function (err, files) {
                if (err) {
                    console.error('loadRunConfigurations:list:' + ide.getPath(), err);
                    next(err);
                } else {
                    files = _.filter(files, function(file){
                        return file.isDirectory && file.name.charAt(0) !== '.';
                    });
                    next(null, files);
                }
            });
        }

        async.parallel(
            [readRunConfigurationFile, getAllProjects],
            function (err, results) {
                if(err){
                    toastr.error(err);
                } else {
                    runConfigurations = results[0];
                    var projects = results[1];
                    if(!_.isEmpty(projects)){
                        runConfigurationsByProject = _.groupBy(runConfigurations, 'project');
                        _.each(projects, function(project){
                            if(!runConfigurationsByProject[project.name]){
                                runConfigurationsByProject[project.name] = [];
                            }
                        });
                    }
                    console.log('loadRunConfigurations success', runConfigurations, runConfigurationsByProject);
                }
                if(callback){
                    callback(err);
                }
            }
        );
    }

    /**
     * flush updated run configurations to workspace.json file
     */
    function flushRunConfigurations(callback){
        var content = JSON.stringify({run: runConfigurations});
        _.each(runConfigurations, function(runConf){
            if(runConf.unsaved){
                delete runConfigurations[runConf.name];
            }
        });
        fsMount.writeFile(PATH_RUN_CONFIG, content, function(err){
            if(err){
                toastr.error(err);
                console.error('flushRunConfigurations:writeFile', PATH_RUN_CONFIG);
            }
            if(callback) {
                callback(err);
            }
        });
    }

    function _getPathInfo(path){
        var splitedPath = pathutil.detachSlash(path).split('/');
        var result = {};
        if(splitedPath.length > 0) {
            result.name = splitedPath[splitedPath.length - 1];
            var distanceFromWorkspace = splitedPath.length - splitedPath.indexOf(WORKSPACE_DIR_NAME);
            if (distanceFromWorkspace <= splitedPath.length) {
                result.isInWorkspace = true;
                if(distanceFromWorkspace === 1){
                    result.type = 'workspace';
                } else if(distanceFromWorkspace === 2 && result.name !== WORKSPACE_INFO_DIR_NAME) {
                    result.type = 'project';
                } else if (distanceFromWorkspace === 2 && result.name === WORKSPACE_INFO_DIR_NAME) {
                    result.type = 'workspaceInfo';
                } else if(distanceFromWorkspace === 3 && path.indexOf(PATH_RUN_CONFIG) > -1){
                    result.type = 'runConfig';
                } else {
                    result.projectName = splitedPath[splitedPath.indexOf(WORKSPACE_DIR_NAME) + 1];
                }
            } else {
                result.isInWorkspace = false;
            }
        }
        return result;
    }

    var actions = {
        replaceProject: function(oldProjectName, newProjectName){
            // change runConfigurations object
            _.each(_.where(runConfigurations, {project: oldProjectName}), function(runConf){
                runConf.project = newProjectName;
            });
            // change runConfigurationsByProject object
            runConfigurationsByProject[newProjectName] = runConfigurationsByProject[oldProjectName];
            delete runConfigurationsByProject[oldProjectName];
        },
        addNewProject: function(projectName){
            // change runConfigurationsByProject object
            runConfigurationsByProject[projectName] = [];
            //topic.publish(topics.RUN_AS_ENABLED);
        },
        deleteProject: function(projectName){
            // change runConfigurations object
            _.each(_.where(runConfigurations, {project: projectName}), function(runConf, name){
                delete runConfigurations[name];
            });
            // change runConfigurationsByProject object
            delete runConfigurationsByProject[projectName];
            if(_.isEmpty(runConfigurations)){
                //topic.publish(topics.RUN_AS_DISABLED);
            }
        }
    };

    function addListeners(){
        topic.subscribe('sys.fs.node.moved', function(uid, sid, src, dest){
            console.log('sys.fs.node.moved', arguments);
            var srcPathInfo = _getPathInfo(src);
            var destPathInfo = _getPathInfo(dest);
            if(srcPathInfo.type === 'project' && destPathInfo.type === 'project'){
                // ignore the case of nested projects
                actions.replaceProject(srcPathInfo.name, destPathInfo.name);
            } else if(srcPathInfo.type === 'workspaceInfo' || srcPathInfo.type === 'runConfig'){
                loadRunConfigurations();
            }
        });

        topic.subscribe('fs.cache.file.set', function (fsURL, target, type, maybeModified) {
            console.log('fs.cache.file.set', arguments);
            var targetPathInfo = _getPathInfo(target);
            if(targetPathInfo.type === 'runConfig'){
                loadRunConfigurations();
            }
        });

        topic.subscribe('projectWizard.created', function (targetDir, projectName) {
            console.log('projectWizard.created', arguments);
            actions.addNewProject(projectName);
        });

        topic.subscribe('fs.cache.node.added', function (fsURL, targetDir, name, type, created) {
            console.log('fs.cache.node.added', arguments);
            if (!created || type !== 'dir') {
                return;
            }
            var targetPathInfo = _getPathInfo(targetDir);
            if(targetPathInfo.type === 'workspace'){
                // new added dir is a project
                actions.addNewProject(name);
            }
        });

        topic.subscribe('fs.cache.node.deleted', function (fsURL, targetDir, name, type) {
            console.log('fs.cache.node.deleted', arguments);
            if (type !== 'dir') {
                return;
            }
            var targetPathInfo = _getPathInfo(targetDir);
            if (targetPathInfo.type === 'project') {
                actions.deleteProject(name);
            } else if (targetPathInfo.type === 'workspaceInfo' || targetPathInfo.type === 'runConfig') {
                loadRunConfigurations();
            }
        });
    }

    (function initialize(){
        loadRunConfigurations();
        addListeners();
    })();

    function RunConfigurationManager(){
        var self = this;
        this.DEBUG_MODE = 'debug'; //FIXME remove (ref. project-wizard/run-commands.js)
        this.RUN_MODE = 'run'; //FIXME remove (ref. project-wizard/run-commands.js)

        this.flushRunConfigurations = flushRunConfigurations;
        this.getByPath = function(path) {
            var pathInfo = _getPathInfo(path);
            if(pathInfo.projectName){
                return self.getByProjectName(pathInfo.projectName);
            }
            return;
        };
        this.getByProjectName = function(projectName, callback) {
            var conf = runConfigurationsByProject[projectName];
            if(callback) {
                callback(conf);
            }
            return conf;
        };
        this.getByName = function(runConfigurationName, callback){
            var conf = runConfigurations[runConfigurationName];
            if(callback) {
                callback(conf);
            }
            return conf;
        };
        this.getAll = function () {
            return runConfigurations;
        };
        this.add = function(runConfiguration){
            runConfigurations[runConfiguration.name] = runConfiguration;
            if(runConfiguration.project) {
                if(!runConfigurationsByProject[runConfiguration.project]){
                    runConfigurationsByProject[runConfiguration.project] = [];
                }
                runConfigurationsByProject[runConfiguration.project].push(runConfiguration);
            }
        };
        this.save = function(runConfiguration){
            delete runConfiguration.unsaved;
            _.each(runConfigurations, function(runConf, name){
                if(runConf.name !== name){
                    runConfigurations[runConf.name] = runConf;
                    delete runConfigurations[name];
                }
            });

            runConfigurationsByProject = _.extend(runConfigurationsByProject, _.groupBy(runConfigurations, 'project'));
            flushRunConfigurations();
        };
        this.set = function(projectName, runConfigurations, callback){
            _.each(runConfigurations, function(runConf){
               runConfigurations[runConf.name] = runConf;
            });
            if(projectName) {
                runConfigurationsByProject[projectName] = runConfigurations;
            }

            flushRunConfigurations(function(err){
                if(!err){
                    loadRunConfigurations(callback);
                }
            });
        };
        this.delete = function(runConfigurationName) {
            if(runConfigurations[runConfigurationName]){
                var project = runConfigurations[runConfigurationName].project;
                runConfigurationsByProject[project] = _.reject(runConfigurationsByProject[project], function(conf){
                    return conf.project === project;
                });
                delete runConfigurations[runConfigurationName];
            }
        };
        this.setLatestRun = function(runConfigurationName) {
            if(runConfigurations[runConfigurationName]){
                var project = runConfigurations[runConfigurationName].project;
                _.each(runConfigurationsByProject[project], function(conf){
                    conf.latestRun = false;
                    if(conf.name === runConfigurationName){
                        conf.latestRun = true;
                    }
                });
                flushRunConfigurations();
            }
        };
        this.getProjectRootHtml = function (filePath, callback) {
            var pathInfo = _getPathInfo(filePath);
            if(pathInfo.projectName){
                var runConfs = runConfigurationsByProject[pathInfo.projectName];
                var htmlPaths = [];
                _.each(runConfs, function(runConf){
                    if(!runConf.type && pathutil.isHtml(runConf.path)){
                        htmlPaths.push(pathutil.combine(WORKSPACE_DIR_NAME + '/' + pathInfo.projectName, runConf.path));
                    }
                });
                callback(htmlPaths);
            }
        };
        this.getProjects = function(){  // FIXME temporary
            return _.keys(runConfigurationsByProject);
        };
    }



    return new RunConfigurationManager();
});
