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
    'webida-lib/util/path',
    'dojo/topic',
    './run-configuration-manager',
    'webida-lib/plugins/workspace/plugin',
    'other-lib/toastr/toastr',
    'other-lib/underscore/lodash.min'
], function (ide, pluginManager, pathUtil, topic, runConfigurationManager, workspace, toastr, _) {

    'use strict';

    var delegators = {};
    var module = {};
    var fsMount = ide.getFSCache();
    var liveReloadHandleList = [];

    var extensionPoints = {
        RUN_CONFIGURATION_TYPE: 'webida.ide.project-management.run:type',
        RUN_CONFIGURATION: 'webida.ide.project-management.run:configuration',
        RUN_CONFIGURATION_RUNNER: 'webida.ide.project-management.run:runner'
    };
    var runConfActions = pluginManager.getExtensions(extensionPoints.RUN_CONFIGURATION);
    var runConfRunner = pluginManager.getExtensions(extensionPoints.RUN_CONFIGURATION_RUNNER);

    var defaultDelegator = {
        'newConf': undefined,
        'loadConf': undefined,
        'saveConf': function _saveConf(runConfName, callback) {
            require(['plugins/webida.ide.project-management.run/view-controller'], function (viewController) {
                viewController.saveConf(runConfName, callback);
            });
        },
        'deleteConf': function _deleteConf(runConfName, callback) {
            require(['plugins/webida.ide.project-management.run/view-controller'], function (viewController) {
                viewController.deleteConf(runConfName, callback);
            });
        },
        'run': undefined,
        'debug': undefined
    };

    /**
     * Dojo Widget Object
     * @typedef {Object} DojoWidget
     */

    /**
     * @callback contentCreationCallback
     * @param error
     * @param runConf
     * @param content {Object} dojo object of
     */

    /**
     * Default new delegator
     * @param {DojoWidget} parent - dojo object of parent widget
     * @param {Object} newRunConf - default run configuration
     * @param {contentCreationCallback} callback
     * @type {Function}
     */
    defaultDelegator.newConf = function (parent, newRunConf, callback) {
        // draw ui
        newRunConf.path = '';   // initialize path value
        require(['plugins/webida.ide.project-management.run/view-controller'], function (viewController) {
            viewController.loadConf(parent, newRunConf, callback);
        });
    };

    /**
     * Default load delegator
     * @param {DojoWidget} parent - dojo object of parent widget
     * @param {Object} newRunConf - default run configuration
     * @param {contentCreationCallback} callback
     * @type {Function}
     */
    defaultDelegator.loadConf = function (parent, newRunConf, callback) {
        // draw ui
        require(['plugins/webida.ide.project-management.run/view-controller'], function (viewController) {
            viewController.loadConf(parent, newRunConf, callback);
        });
    };

    /**
     * Default run delegator
     * @param {Object} runObject - run configuration to execute
     * @param callback
     */
    defaultDelegator.run = function (runObject, callback) {
        var projectPath = workspace.getRootPath() + runObject.project;
        var openName = pathUtil.attachSlash(projectPath) + runObject.name;
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
     * @example
     *      Delegator.get(type).action(...)
     * @param {String} type - the type of run configuration
     * @constructor
     */
    function Delegator(type) {
        this.type = type;
        var allActions = {};
        if (type) {
            var actions = _.where(runConfActions, {type: type});
            var runners = _.where(runConfRunner, {type: type});

            _.each(_.keys(defaultDelegator), function (delegatorType) {
                var module, delegatorMethodName;
                if (delegatorType === 'run' && !_.isEmpty(runners)) {
                    module = runners[0].module;
                    delegatorMethodName = runners[0].run;
                } else if (delegatorType === 'debug' && !_.isEmpty(runners)) {
                    module = runners[0].module;
                    delegatorMethodName = runners[0].debug;
                } else if (delegatorType !== 'run' && delegatorType !== 'debug' && !_.isEmpty(actions)) {
                    module = actions[0].module;
                    delegatorMethodName = actions[0][delegatorType];
                }

                if (module && delegatorMethodName) {
                    allActions[delegatorType] = function () {
                        var args = arguments;
                        require([module], function (md) {
                            if (md[delegatorMethodName]) {
                                md[delegatorMethodName].apply(md, args);
                            } else {
                                if (args.length > 0) {
                                    var callback = args[args.length - 1];
                                    callback(delegatorType + ' hasn\'t be implemented at run configurator type(' +
                                        type + ')');
                                }
                                console.error(delegatorType + ' hasn\'t be implemented at run configurator type(' +
                                    type + ')');
                            }
                        });
                    };
                }
            });
            _.extend(this, allActions);
        } else {
            _.extend(this, defaultDelegator);
        }
    }

    /**
     * Get a delegators by its type
     * @param type
     * @returns {*}
     */
    Delegator.get = function (type) {
        if (!delegators[(type ? type : '_default')]) {
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
            if (allRunConfs[result]) {
                var numbering = 2;
                while (true) {
                    result = defaultValue + ' (' + (numbering++) + ')';
                    if (!allRunConfs[result]) {
                        break;
                    }
                }
            }
        }
        return result;
    }

    /**
     * Execute selected run configuration
     * @param {Object} runConf - selected run configuration
     * @param [callback]
     */
    module.run = function (runConf, callback) {
        console.log('run', arguments);
        if (!_.isFunction(Delegator.get(runConf.type).run)) {
            var err = 'run function hasn\'t be implemented for the run configurator type(' + runConf.type + ')';
            toastr.error(err);
            if (callback) {
                callback(err);
            }
        } else {
            Delegator.get(runConf.type).run(runConf, function (err) {
                if (err) {
                    toastr.error(err);
                } else {
                    runConfigurationManager.setLatestRun(runConf.name);
                    toastr.success('Run configuration \'' + runConf.project  + ':' + runConf.name +
                        '\' was successfully launched');
                }
                if (callback) {
                    callback(err, runConf);
                }
            });
        }
    };

    /**
     * Start to debug for selected run configuration
     * @param {Object} runConf - selected run configuration
     * @param [callback]
     */
    module.debug = function (runConf, callback) {
        console.log('debug', arguments);
        if (!_.isFunction(Delegator.get(runConf.type).debug)) {
            var err = 'debug function hasn\'t be implemented for the debug configurator type(' + runConf.type + ')';
            toastr.error(err);
            if (callback) {
                callback(err);
            }
        } else {
            Delegator.get(runConf.type).debug(runConf, function (err) {
                if (err) {
                    toastr.error(err);
                } else {
                    runConfigurationManager.setLatestRun(runConf.name);
                    toastr.success('Debug configuration \'' + runConf.project  + ':' + runConf.name +
                                   '\' was successfully launched');
                }
                if (callback) {
                    callback(err, runConf);
                }
            });
        }
    };

    /**
     * Make a new run configuration
     * @param {DojoWidget} parent - dojo object of parent widget
     * @param {String} type - the type of configuration
     * @param {String} [project] - project name
     * @param {contentCreationCallback} [callback]
     */
    module.newConf = function (parent, type, project, callback) {
        console.log('newConf', arguments);
        var runConf = {
            type: type,
            name: _makeConfigurationName(),
            project: project,
            unsaved: true
        };
        if (!_.isFunction(Delegator.get(type).newConf)) {
            console.warn('newConf function hasn\'t be implemented for the run configurator type(' + type + ')');
            runConfigurationManager.add(runConf);
            if (callback) {
                callback(null, runConf);
            }
        } else {
            Delegator.get(type).newConf(parent, runConf, function (err, runConf, content) {
                if (err) {
                    toastr.error(err);
                } else {
                    runConfigurationManager.add(runConf);
                }
                if (callback) {
                    callback(err, runConf, content);
                }
            });
        }
    };

    /**
     * Load the selected run configuration
     * @param {DojoWidget} parent - dojo object of parent widget
     * @param {Object} runConf
     * @param {contentCreationCallback} callback
     */
    module.loadConf = function (parent, runConf, callback) {
        console.log('loadConf', arguments);
        if (!_.isFunction(Delegator.get(runConf.type).loadConf)) {
            console.warn('loadConf function hasn\'t be implemented for the run configurator type(' +
                runConf.type + ')');
            if (callback) {
                callback(null, runConf);
            }
        } else {
            Delegator.get(runConf.type).loadConf(parent, runConf, function (err, runConf, content) {
                if (err) {
                    toastr.error(err);
                }
                if (callback) {
                    callback(err, runConf, content);
                }
            });
        }
    };

    /**
     * Save properties of the selected run configuration
     * @param {Object} runConf - selected run configuration
     * @param callback
     */
    module.saveConf = function (runConf, callback) {
        console.log('saveConf', arguments);
        if (!_.isFunction(Delegator.get(runConf.type).loadConf)) {
            console.warn('saveConf action hasn\'t be implemented for the run configurator type(' + runConf.type + ')');
            runConfigurationManager.save(runConf);
            if (callback) {
                callback(null, runConf);
            }
        } else {
            Delegator.get(runConf.type).saveConf(runConf, function (err, runConf) {
                if (err) {
                    toastr.error(err);
                } else {
                    // validation for mandatory properties (name, project)
                    if (runConf.name && runConf.project) {
                        runConfigurationManager.save(runConf);
                        toastr.success('Run configuration \'' + runConf.project  + ':' + runConf.name +
                            '\' was successfully saved');
                    } else {
                        err = 'You should fill the mandatory fields (run configuration name and target project)';
                    }
                }
                if (callback) {
                    callback(err, runConf);
                }
            });
        }
    };

    /**
     * Remove the selected run configuration
     *  @param {DojoWidget} parent - dojo object of parent widget
     * @param {String} runConfName - run configuration's name to remove
     * @param [callback]
     */
    module.deleteConf = function (parent, runConfName, callback) {
        console.log('deleteConf', arguments);
        var runConf = runConfigurationManager.getByName(runConfName);
        if (!_.isFunction(Delegator.get(runConf.type).deleteConf)) {
            console.warn('saveConf action hasn\'t be implemented for the run configurator type(' + runConf.type + ')');
            runConfigurationManager.delete(runConfName);
            if (callback) {
                callback(null, runConfName);
            }
        } else {
            Delegator.get(runConf.type).deleteConf(runConfName, function (err) {
                if (err) {
                    toastr.error(err);
                } else {
                    runConfigurationManager.delete(runConfName);
                    toastr.success('Run configuration \'' + runConf.project + ':' + runConf.name +
                        '\' was successfully removed');
                }
                if (callback) {
                    callback(err, runConfName);
                }
            });
        }
    };

    return module;
});
