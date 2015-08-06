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
    'plugins/webida.notification/notification-message',
    'external/lodash/lodash.min'
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
     * @param {DojoWidget} content - dojo object of content widget
     * @param {Object} newRunConf - default run configuration
     * @param {contentCreationCallback} callback
     * @type {Function}
     */
    defaultDelegator.newConf = function (content, newRunConf, callback) {
        // draw ui
        newRunConf.path = '';   // initialize path value
        require(['plugins/webida.ide.project-management.run/view-controller'], function (viewController) {
            viewController.loadConf(content, newRunConf, callback);
        });
    };

    /**
     * Default load delegator
     * @param {DojoWidget} content - dojo object of content widget
     * @param {Object} newRunConf - default run configuration
     * @param {contentCreationCallback} callback
     * @type {Function}
     */
    defaultDelegator.loadConf = function (content, newRunConf, callback) {
        // draw ui
        require(['plugins/webida.ide.project-management.run/view-controller'], function (viewController) {
            viewController.loadConf(content, newRunConf, callback);
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

    function _makeConfigurationName(projectName) {
        var defaultValue = projectName || 'New configuration';
        var result = defaultValue;
        var allRunConfs = runConfigurationManager.getAll();
        if (!_.isEmpty(allRunConfs)) {
            if (allRunConfs[result]) {
                var numbering = 1;
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
                    toastr.success('Run configuration \'' + runConf.project + ':' + runConf.name +
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
                    toastr.success('Debug configuration \'' + runConf.project + ':' + runConf.name +
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
     * @param {DojoWidget} content - dojo object of content widget
     * @param {String} type - the type of configuration
     * @param {String} [projectName] - project name
     * @param {contentCreationCallback} [callback]
     */
    module.newConf = function (content, type, projectName, callback) {
        var name = _makeConfigurationName(projectName);
        var runConf = {
            type: type,
            name: name,
            originalName: name,
            project: projectName,
            _dirty: true
        };
        console.log('newConf', arguments);
        if (!_.isFunction(Delegator.get(type).newConf)) {
            console.warn('newConf function hasn\'t be implemented for the run configurator type(' + type + ')');
            runConfigurationManager.add(runConf);
            if (callback) {
                callback(null, runConf);
            }
        } else {
            Delegator.get(type).newConf(content, runConf, function (err, runConf) {
                if (err) {
                    toastr.error(err);
                } else {
                    runConfigurationManager.add(runConf);
                }
                if (callback) {
                    callback(err, runConf);
                }
            });
        }
    };

    /**
     * Load the selected run configuration
     * @param {DojoWidget} content - dojo object of content widget
     * @param {Object} runConf - selected run configuration
     * @param {contentCreationCallback} callback
     */
    module.loadConf = function (content, runConf, callback) {
        console.log('loadConf', arguments);
        
        if (!_.isFunction(Delegator.get(runConf.type).loadConf)) {
            console.warn('loadConf function hasn\'t be implemented for the run configurator type(' +
                runConf.type + ')');
            if (callback) {
                callback(null, runConf);
            }
        } else {
            runConf.originalName = runConf.name;
            Delegator.get(runConf.type).loadConf(content, runConf, function (err, runConf) {
                if (err) {
                    toastr.error(err);
                }
                if (callback) {
                    callback(err, runConf);
                }
            });
        }
    };

    function _isDuplicateRunName(name, originalName) {
        var dupRunConf;
        if (originalName && originalName === name) {
            // When status of this configuration is 'saved' and its name has not been changed,
            // there is no need to check duplication.
            return false;
        }
        dupRunConf = runConfigurationManager.getByName(name);
        return (dupRunConf && !dupRunConf._dirty);
    }

    function _resolveDuplication(runConf) {
        var ret = runConf.name;
        var i = 2;
        while (_isDuplicateRunName(ret, runConf.originalName)) {
            ret = runConf.name + ' (' + i++ + ')';
            if (i > 100) {
                ret = runConf.name + '_' + new Date().toUTCString();
            }
        }
        runConf.name = ret;
    }

    /**
     * Validation for common required fields (name and target project of the run configuration)
     * @param runConf
     * @param callback
     * @returns {*}
     * @private
     */
    function _validation(runConf, callback) {
        if (!runConf.name) {
            return callback('You should fill the configuration name');
        }
        if (!runConf.project) {
            return callback('You should fill the target project');
        }
        _resolveDuplication(runConf);
        callback();
    }
    /**
     * Save properties of the selected run configuration
     * @param {Object} runConf - selected run configuration
     * @param callback
     */
    module.saveConf = function (runConf, callback) {
        console.log('saveConf', arguments);
        if (!_.isFunction(Delegator.get(runConf.type).saveConf)) {
            console.warn('saveConf action hasn\'t be implemented for the run configurator type(' + runConf.type + ')');
            runConfigurationManager.save(runConf);
            if (callback) {
                callback(null, runConf);
            }
        } else {
            require(['plugins/webida.ide.project-management.run/view-controller'], function (viewController) {
                if (viewController.getWindowOpened()) {
                    Delegator.get(runConf.type).saveConf(runConf, function (err, runConf) {
                        if (err) {
                            toastr.error(err);
                        } else {
                            // validation for mandatory properties (name, project)
                            _validation(runConf, function (errMsg) {
                                if (!errMsg) {
                                    runConfigurationManager.save(runConf);
                                    viewController.reload();
                                    toastr.success('Run configuration \'' + runConf.project + ':' + runConf.name +
                                        '\' was successfully saved');
                                }
                                callback(errMsg, runConf);
                            });
                        }
                    });
                } else {
                    // if this run configuration has been auto-generated, there is no need to validate options
                    runConfigurationManager.save(runConf);
                    if (callback) {
                        callback(null, runConf);
                    }
                }
            });
        }
    };

    /**
     * Remove the selected run configuration
     * @param {String} runConfName - run configuration's name to remove
     * @param [callback]
     */
    module.deleteConf = function (runConfName, callback) {
        var runConf = runConfigurationManager.getByName(runConfName);
        console.log('deleteConf', arguments);
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
