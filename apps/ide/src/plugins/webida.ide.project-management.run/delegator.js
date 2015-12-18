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
 * @file Delegator for the actions on the run configurations
 * @since 1.1.0
 * @author kyungmi.k@samsung.com
 * @todo It's better to implement by sub-classing than delegating. (class-driven wins over function-driven)
 * @module RunConfiguration/delegator
 */
define([
    'external/lodash/lodash.min',
    'dojo/i18n!./nls/resource',
    'webida-lib/util/locale',
    'webida-lib/util/notify',
    'webida-lib/plugin-manager-0.1',
    'webida-lib/util/logger/logger-client',
    './default-delegator',
    './run-configuration-manager'
], function (
    _,
    i18n,
    Locale,
    notify,
    pluginManager,
    Logger,
    defaultDelegator,
    runConfigurationManager
) {
    'use strict';

    /**
     * @type {Logger}
     */
    var logger = new Logger();
    logger.off();
    /**
     * This module object
     * @type {Object}
     */
    var module = {};
    /**
     * Delegators
     * @type {Object}
     */
    var delegators = {};
    /**
     * @type {module:Locale}
     */
    var locale = new Locale(i18n);
    /**
     * Extension points managed
     * @constant {Object}
     */
    var extensionPoints = {
        RUN_CONFIGURATION_TYPE: 'webida.ide.project-management.run:type',
        RUN_CONFIGURATION: 'webida.ide.project-management.run:configuration',
        RUN_CONFIGURATION_RUNNER: 'webida.ide.project-management.run:runner'
    };
    /**
     * @constant {string}
     */
    var VIEW_CONTROLLER = 'plugins/webida.ide.project-management.run/view-controller';
    /**
     * Declaration list of extensions for user interactions
     * @type {Array}
     */
    var runConfActions = pluginManager.getExtensions(extensionPoints.RUN_CONFIGURATION);
    /**
     * Declaration list of extensions for run actions
     * @type {Array}
     */
    var runConfRunner = pluginManager.getExtensions(extensionPoints.RUN_CONFIGURATION_RUNNER);

    /**
     * Dojo Widget Object
     * @typedef {Object} dojo/Widget
     */

    /**
     * @callback contentLoadCallback
     * @param {(Error|String)} error
     * @param {module:RunConfiguration/manager.runConfigurationInfo} runConf
     * @param {Object} [content] - dojo widget
     * @memberOf module:RunConfiguration/delegator
     */

    /**
     * @callback contentDeletionCallback
     * @param error
     * @param {string} runConfName
     * @memberOf module:RunConfiguration/delegator
     */

    /**
     * Delegator class initialized by type
     * @example
     *      Delegator.get(type).[actionName](...)
     * @param {string} type - run configuration type defined as an extension(webida.ide.project-management.run:type)
     *      in the plugin descriptor(plugin.json)
     * @private use {@link Delegator#get}
     * @memberOf module:RunConfiguration/delegator
     */
    function Delegator(type) {
        this.type = type;
        var allActions = {};
        if (type) {
            var actions = _.where(runConfActions, {type: type});
            var runners = _.where(runConfRunner, {type: type});

            _.each(_.keys(defaultDelegator), function (delegatorType) {
                var module;
                var delegatorMethodName;
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
                                    callback(locale.formatMessage('messageNotFoundImplementation',
                                        {delegatorType: delegatorType, type: type}));
                                }
                                logger.error(locale.formatMessage('messageNotFoundImplementation',
                                    {delegatorType: delegatorType, type: type}));
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
     *      Because the default type is empty string, replace the name of default type with '_default' string
     *      to prevent from unexpected error.
     * @param {string} type - run configuration type defined as an extension(webida.ide.project-management.run:type)
     *      in the plugin descriptor(plugin.json)
     * @returns {module:RunConfiguration/delegator.Delegator}
     * @memberOf module:RunConfiguration/delegator.Delegator
     */
    Delegator.get = function (type) {
        if (!delegators[(type ? type : '_default')]) {
            delegators[(type ? type : '_default')] = new Delegator(type);
        }
        return delegators[(type ? type : '_default')];
    };

    /**
     * Generate configuration name from project name
     * @param {string} projectName
     * @returns {string}
     * @private
     */
    function _makeConfigurationName(projectName) {
        var defaultValue = projectName || i18n.valueNewConfiguration;
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
     * Whether is there a duplicated name of run configuration or not
     * @param {string} name - changed name
     * @param {string} originalName - original name
     * @returns {boolean}
     * @private
     */
    function _isDuplicateRunName(name, originalName) {
        var dupRunConf;
        if (originalName && originalName === name) {
            // When status of this configuration is 'saved' and its name has not been changed,
            // there is no need to check duplication.
            return false;
        }
        dupRunConf = runConfigurationManager.getByName(name);
        return (dupRunConf && !dupRunConf._dirty && !dupRunConf._deleted);
    }

    /**
     * Resolve duplication on the name (numbering)
     * @param {module:RunConfiguration/manager.runConfigurationInfo} runConf
     * @private
     */
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
     * @param {module:RunConfiguration/manager.runConfigurationInfo} runConf
     * @param callback
     * @private
     * @memberOf module:RunConfiguration/delegator
     */
    function _validation(runConf, callback) {
        if (!runConf.name) {
            return callback(i18n.validationNoName);
        }
        if (!runConf.project) {
            return callback(i18n.validationNoProject);
        }
        _resolveDuplication(runConf);
        callback();
    }

    /**
     * Execute selected run configuration
     * @param {module:RunConfiguration/manager.runConfigurationInfo} runConf - selected run configuration
     * @param [callback]
     * @memberOf module:RunConfiguration/delegator
     */
    module.run = function (runConf, callback) {
        logger.log('run', arguments);
        if (!_.isFunction(Delegator.get(runConf.type).run)) {
            var err = locale.formatMessage('messageNotFoundImplementation',
                {delegatorType: i18n.messageRunDelegator, type: runConf.type});
            notify.error(err);
            if (callback) {
                callback(err);
            }
        } else {
            Delegator.get(runConf.type).run(runConf, function (err) {
                if (err) {
                    notify.error(err);
                } else {
                    runConfigurationManager.setLatestRun(runConf.name);
                    notify.success(locale.formatMessage('messageSuccessRun', runConf));
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
     * @memberOf module:RunConfiguration/delegator
     */
    module.debug = function (runConf, callback) {
        logger.log('debug', arguments);
        if (!_.isFunction(Delegator.get(runConf.type).debug)) {
            var err = locale.formatMessage('messageNotFoundImplementation',
                {delegatorType: i18n.messageDebugDelegator, type: runConf.type});
            notify.error(err);
            if (callback) {
                callback(err);
            }
        } else {
            Delegator.get(runConf.type).debug(runConf, function (err) {
                if (err) {
                    notify.error(err);
                } else {
                    runConfigurationManager.setLatestRun(runConf.name);
                    notify.success(locale.formatMessage('messageSuccessDebug', runConf));
                }
                if (callback) {
                    callback(err, runConf);
                }
            });
        }
    };

    /**
     * Make a new run configuration
     * @param {dojo/Widget} content - dojo object of content widget
     * @param {String} type - the type of configuration
     * @param {String} [projectName] - project name
     * @param {contentLoadCallback} [callback]
     * @memberOf module:RunConfiguration/delegator
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
        if (!_.isFunction(Delegator.get(type).newConf)) {
            logger.warn('newConf function hasn\'t be implemented for the run configurator type(' + type + ')');
            runConfigurationManager.add(runConf);
            if (callback) {
                callback(null, runConf);
            }
        } else {
            Delegator.get(type).newConf(content, runConf, function (err, runConf) {
                if (err) {
                    notify.error(err);
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
     * @param {dojo/Widget} content - dojo object of content widget
     * @param {Object} runConf - selected run configuration
     * @param {contentLoadCallback} callback
     * @memberOf module:RunConfiguration/delegator
     */
    module.loadConf = function (content, runConf, callback) {
        logger.log('loadConf', arguments);

        if (!_.isFunction(Delegator.get(runConf.type).loadConf)) {
            logger.warn('loadConf function hasn\'t be implemented for the run configurator type(' +
            runConf.type + ')');
            if (callback) {
                callback(null, runConf);
            }
        } else {
            if (!runConf.originalName) {
                runConf.originalName = runConf.name;
            }
            Delegator.get(runConf.type).loadConf(content, runConf, function (err, runConf) {
                if (err) {
                    notify.error(err);
                }
                if (callback) {
                    callback(err, runConf);
                }
            });
        }
    };
    /**
     * Save properties of the selected run configuration
     * @param {Object} runConf - selected run configuration
     * @param {contentLoadCallback} [callback]
     * @memberOf module:RunConfiguration/delegator
     */
    module.saveConf = function (runConf, callback) {
        logger.log('saveConf', arguments);
        if (!_.isFunction(Delegator.get(runConf.type).saveConf)) {
            logger.warn('saveConf action hasn\'t be implemented for the run configurator type(' + runConf.type + ')');
            runConfigurationManager.save(runConf);
            if (callback) {
                callback(null, runConf);
            }
        } else {
            require([VIEW_CONTROLLER], function (viewController) {
                if (viewController.getWindowOpened()) {
                    Delegator.get(runConf.type).saveConf(runConf, function (err, runConf) {
                        if (err) {
                            notify.error(err);
                        } else {
                            // validation for mandatory properties (name, project)
                            _validation(runConf, function (errMsg) {
                                if (!errMsg) {
                                    runConfigurationManager.save(runConf);
                                    viewController.reload();
                                    notify.success(locale.formatMessage('messageSuccessSave', runConf));
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
     * @param {contentDeletionCallback} [callback]
     * @memberOf module:RunConfiguration/delegator
     */
    module.deleteConf = function (runConfName, callback) {
        var runConf = runConfigurationManager.getByName(runConfName);
        logger.log('deleteConf', arguments);
        if (!_.isFunction(Delegator.get(runConf.type).deleteConf)) {
            logger.warn('saveConf action hasn\'t be implemented for the run configurator type(' + runConf.type + ')');
            runConfigurationManager.delete(runConfName);
            if (callback) {
                callback(null, runConfName);
            }
        } else {
            Delegator.get(runConf.type).deleteConf(runConfName, function (err) {
                if (err) {
                    notify.error(err);
                } else {
                    runConfigurationManager.delete(runConfName);
                    notify.success(locale.formatMessage('messageSuccessRemove', runConf));
                }
                if (callback) {
                    callback(err, runConfName);
                }
            });
        }
    };

    return module;
});
