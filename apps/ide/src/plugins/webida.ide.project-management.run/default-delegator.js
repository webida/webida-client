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
 * Delegators for "General Web Application"
 * @since 1.6.1
 * @author kyungmi.k@samsung.com
 * @todo It's better to change as a plugin with `default-view-controller` and `default-run-configuration.html`
 * @todo and implement extension points of 'run configuration plugin'.
 * @module RunConfiguration/defaultDelegator
 */

define([
    'dojo/i18n!./nls/resource',
    'dojo/topic',
    'webida-lib/app',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/path'
], function (
    i18n,
    topic,
    ide,
    workspace,
    pathUtil
) {
    'use strict';

    /**
     * @constant {string}
     */
    var VIEW_CONTROLLER = 'plugins/webida.ide.project-management.run/default-view-controller';
    /**
     * This module object
     * @type {Object}
     */
    var defaultDelegator = {};
    /**
     * @type {FSCache}
     */
    var fsMount = ide.getFSCache();
    /**
     * handler list for functionality "live reload"
     * It's only for the type of "General Web Application"
     * @type {Array.<Function>}
     */
    var liveReloadHandleList = [];

    /**
     * Release handler for live reload
     * @param {Object} handle - topic subscription handler
     * @private
     */
    function _releaseLiveReloadHandle(handle) {
        handle.remove();
        handle = null;
    }

    /**
     * Default save delegator
     * @param runConfName
     * @param callback
     * @memberof module:RunConfiguration/defaultDelegator
     */
    defaultDelegator.saveConf = function (runConfName, callback) {
        require([VIEW_CONTROLLER], function (viewController) {
            viewController.saveConf(runConfName, callback);
        });
    };

    /**
     * Default delete delegator
     * @param runConfName
     * @param callback
     * @memberof module:RunConfiguration/defaultDelegator
     */
    defaultDelegator.deleteConf = function (runConfName, callback) {
        require([VIEW_CONTROLLER], function (viewController) {
            viewController.deleteConf(runConfName, callback);
        });
    };

    /**
     * Default new delegator
     * @param {DojoWidget} content - dojo object of content widget
     * @param {Object} newRunConf - default run configuration
     * @param {contentCreationCallback} callback
     * @memberOf module:RunConfiguration/defaultDelegator
     */
    defaultDelegator.newConf = function (content, newRunConf, callback) {
        // draw ui
        newRunConf.path = '';   // initialize path value
        require([VIEW_CONTROLLER], function (viewController) {
            viewController.newConf(content, newRunConf, callback);
        });
    };

    /**
     * Default load delegator
     * @param {DojoWidget} content - dojo object of content widget
     * @param {Object} newRunConf - default run configuration
     * @param {contentCreationCallback} callback
     * @memberOf module:RunConfiguration/defaultDelegator
     */
    defaultDelegator.loadConf = function (content, newRunConf, callback) {
        // draw ui
        require([VIEW_CONTROLLER], function (viewController) {
            viewController.loadConf(content, newRunConf, callback);
        });
    };

    /**
     * Default run delegator
     * @param {Object} runObject - run configuration to execute
     * @param callback
     * @memberOf module:RunConfiguration/defaultDelegator
     */
    defaultDelegator.run = function (runObject, callback) {
        var projectPath = workspace.getRootPath() + runObject.project;
        var openName = pathUtil.attachSlash(projectPath) + runObject.name;
        var runningWin = window.open('', openName, runObject.openArgument);
        if (!runningWin) {
            callback(i18n.messageFailOpenWindow);
            return;
        }

        fsMount.addAlias(projectPath, 3600, function (err, data) {
            if (err) {
                return callback(err);
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
                var handle = topic.subscribe('fs/cache/file/set', function (fsURL, target, reason, maybeModified) {
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

    return defaultDelegator;
});