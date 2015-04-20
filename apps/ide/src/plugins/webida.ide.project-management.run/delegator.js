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
 * webida - Delegator for the actions on the run configurations
 *
 * Src:
 *   plugins/webida.ide.project-management.run/delegator.js
 */
define([
    'webida-lib/app',
    'webida-lib/plugin-manager-0.1',
    'dojo/topic',
    './run-configuration-manager',
    'webida-lib/plugins/workspace/plugin',
    'other-lib/toastr/toastr',
    'other-lib/underscore/lodash.min'
], function (ide, pluginManager, topic, runConfigurationManager, workspace, toastr, _) {

    'use strict';

    var delegators = {};
    var module = {};
    var fsMount = ide.getFSCache();
    var liveReloadHandleList = [];

    var extensionPoints = {
        RUN_CONFIGURATION_TYPE: 'webida.ide.project-configurator:run-configuration-type',
        RUN_CONFIGURATION: 'webida.ide.project-configurator:run-configuration',
        RUN_CONFIGURATION_RUNNER: 'webida.ide.project-management.run:runner'
    };
    var runConfActions = pluginManager.getExtensions(extensionPoints.RUN_CONFIGURATION);
    var runConfRunner = pluginManager.getExtensions(extensionPoints.RUN_CONFIGURATION_RUNNER);

    var defaultDelegator = {
        'newConf': undefined,
        'loadConf': undefined,
        'saveConf': function _saveConf(runConfName, callback){
            require(['plugins/webida.ide.project-management.run/view-controller'], function(viewController){
                viewController.saveConf(runConfName, callback);
            });
        },
        'deleteConf': function _deleteConf(runConfName, callback){
            require(['plugins/webida.ide.project-management.run/view-controller'], function(viewController){
                viewController.deleteConf(runConfName, callback);
            });
        },
        'run': undefined
    };

    /**
     * Default new or load delegator
     * @type {Function}
     */
    defaultDelegator.newConf = function ($parent, newRunConf, callback){
        // draw ui
        newRunConf.path = '';   // initialize path value
        require(['plugins/webida.ide.project-management.run/view-controller'], function(viewController){
            viewController.loadConf($parent, newRunConf, callback);
        });
    };

    defaultDelegator.loadConf = function ($parent, newRunConf, callback){
        // draw ui
        require(['plugins/webida.ide.project-management.run/view-controller'], function(viewController){
            viewController.loadConf($parent, newRunConf, callback);
        });
    };

    /**
     * Default run delegator
     * @param projectProperty
     * @param runObject
     */
    defaultDelegator.run = function(runObject, callback) {
        var projectPath = workspace.getRootPath() + runObject.project;
        var openName = projectPath + runObject.project;
        var runningWin = window.open('', openName, runObject.openArgument);
        if (!runningWin) {
            callback('Window can\'t be opened.<br />It might be interrupted by pop-up blocking, please check it.');
            return;
        }

        fsMount.addAlias(projectPath, 3600, function (err, data) {
            if (err) {
                callback(err);
                return;
            }

            var argStr = runObject.argument ? '?' + runObject.argument : '';
            var sharpStr = runObject.fragment ? '#' + runObject.fragment : '';
            var url = data.url + '/' + runObject.path + argStr + sharpStr;

            runningWin.location.href = './redirect.html#' + url;

            toastr.success('\'' + runObject.project + '\' successfully launched');
            callback();
            if (runningWin.focus) {
                runningWin.focus();
            }

            var reloadHandle = liveReloadHandleList[openName];
            if (reloadHandle) {
                _releaseLiveReloadHandle(reloadHandle);
                liveReloadHandleList[openName] = null;
            }

            if (runObject.liveReload === true) {
                var handle = topic.subscribe('fs.cache.file.set', function (fsURL, target, reason, maybeModified) {
                    if (runningWin.closed) {
                        _releaseLiveReloadHandle(handle);
                    } else {
                        if ((target.indexOf(projectPath) === 0) && (maybeModified)) {
                            runningWin.location.href = './redirect.html#' + url;
                        }
                    }
                });
                liveReloadHandleList[openName] = handle;
            }
        });
    };

    /**
     * Usage: Delegator.get(type).action(...)
     * @param type
     * @constructor
     */
    function Delegator(type){
        this.type = type;
        var allActions = {};
        if(type) {
            var actions = _.where(runConfActions, {type: type});
            var runners = _.where(runConfRunner, {type: type});
            if(!_.isEmpty(actions)){
                _.each(defaultDelegator, function(value, delegator){
                    var module = (delegator === 'run') ? runners[0].module : actions[0].module;
                    var delegatorName = (delegator === 'run') ? runners[0].run : actions[0][delegator];
                    if(delegatorName){
                        allActions[delegator] = function(){
                            var args = arguments;
                            require([module], function (module) {
                                if(module[delegatorName]){
                                    module[delegatorName].apply(module, args);
                                } else {
                                    if(args.length > 0) {
                                        var callback = args[args.length - 1];
                                        callback(delegator + ' hasn\'t be implemented at run configurator type(' +
                                            type + ')');
                                    }
                                    console.log(delegator + ' hasn\'t be implemented at run configurator type(' +
                                        type + ')');
                                }
                            });
                        };
                    } else {
                        allActions[delegator] = function(){
                            console.log(delegator + ' hasn\'t be implemented at run configurator type(' + type + ')');
                        };
                    }
                });
            }
            _.extend(this, allActions);
        } else {
            _.extend(this, defaultDelegator);
        }
    }
    Delegator.get = function(type){
        if(!delegators[(type ? type : '_default')]){
            delegators[(type ? type : '_default')] = new Delegator(type);
        }
        return delegators[(type ? type : '_default')];
    };

    function _releaseLiveReloadHandle(handle) {
        handle.remove();
        handle = null;
    }

    function _makeConfigurationName() {
        var defaultValue = 'New run configuration';
        var result = defaultValue;
        var allRunConfs = runConfigurationManager.getAll();
        if (!_.isEmpty(allRunConfs)) {
            if(allRunConfs[result]){
                var numbering = 2;
                while(true){
                    result = defaultValue + ' (' + (numbering++) + ')';
                    if(!allRunConfs[result]){
                        break;
                    }
                }
            }
        }
        return result;
    }

    module.run = function(runObject, callback) {
        console.log('run', arguments);
        Delegator.get(runObject.type).run(runObject, function(err){
            if(err) {
                toastr.error(err);
            } else {
                runConfigurationManager.setLatestRun(runObject.name);
            }
            if(callback){
                callback(err, runObject);
            }
        });
    };

    /**
     * Make a new run configuration
     * @param $parent (mandatory)
     * @param type (mandatory)
     * @param project (optional)
     */
    module.newConf = function($parent, type, project, callback) {
        console.log('newConf', arguments);
        $parent.empty();
        var runObject = {
            type: type,
            name: _makeConfigurationName(),
            project: project,
            unsaved: true
        };

        Delegator.get(type).newConf($parent, runObject, function(err){
            if(err){
                toastr.error(err);
            } else {
                runConfigurationManager.add(runObject);
            }
            if(callback){
                callback(err, runObject);
            }
        });
    };

    module.loadConf = function($parent, runObject, callback){
        console.log('loadConf', arguments);
        $parent.empty();
        Delegator.get(runObject.type).loadConf($parent, runObject, function(err){
            if(err){
                toastr.error(err);
            }
            if(callback){
                callback(err, runObject);
            }
        });
    };

    module.saveConf = function(runConf, callback){
        console.log('saveConf', arguments);
        Delegator.get(runConf.type).saveConf(runConf, function(err, runConf){
            if(err){
                toastr.error(err);
            } else {
                runConfigurationManager.save(runConf);
            }
            if(callback){
                callback(err, runConf);
            }
        });
    };

    module.deleteConf = function($parent, runObjectName, callback){
        console.log('deleteConf', arguments);
        var conf = runConfigurationManager.getByName(runObjectName);
        Delegator.get(conf.type).deleteConf(runObjectName, function(err){
            if(err){
                toastr.error(err);
            } else {
                runConfigurationManager.delete(runObjectName);
                $parent.empty();
            }
            if(callback){
                callback(err, runObjectName);
            }
        });
    };

    return module;
});
