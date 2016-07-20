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
    'external/lodash/lodash.min',
    'external/URIjs/src/URI',
    'dojo/_base/lang',
    'dojo/topic',
    'webida-lib/app-config',
    'webida-lib/FSCache-0.1',
    'webida-lib/server-pubsub',
    'webida-lib/plugin-manager-0.1',
    'webida-lib/util/browserInfo',
    'webida-lib/util/loading-screen',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/notify',
    'webida-lib/server-api',
    'webida-lib/widgets/dialogs/popup-dialog/PopupDialog',
    'dojo/domReady!'
], function (
    _,
    URI,
    lang,
    topic,
    appConfig,
    FSCache,
    msgAgent,
    pm,
    brInfo,
    loadingScreen,
    Logger,
    notify,
    webida,
    PopupDialog
) {
    'use strict';

	var singleLogger = new Logger.getSingleton();
	var logger = new Logger();
	//logger.setConfig('level', Logger.LEVELS.log);
	//logger.off();

    var exports = {};
    var fsid = null;
    var path = null;
    var fsCache = null;
    var mount = null;
    var wellOpened = false;

    // loading screen
    topic.subscribe('workbench/load', function () {
        setTimeout(function () {
            topic.publish('workbench/loading/started');
            loadingScreen.hideLoadingScreen();
        }, 200);
    });

    // beforeunload checkers
    var beforeUnloadCheckers = {};
    window.addEventListener('beforeunload', function (e) {

        var msg = '';
        Object.keys(beforeUnloadCheckers).forEach(function (key) {
            var thisMsg = beforeUnloadCheckers[key]();
            if (thisMsg) {
                msg = msg + (msg ? '\n' : '') + thisMsg;
            }
        });

        if (msg) {
            e.returnValue = msg;
        } else {
            msg = saveStatusSync();
            if (msg) {
                e.returnValue = 'Error while saving the current status of this app: ' +
                    msg + '\n(You can explicitly save the status with "File/Save Status")';
            }
        }
    });

    // last status
    var lastSaved;
    var appLastStatus;
    var lastStatusContributors = {};
    var ERROR_KEY_PREFIX = 'ERROR-IN-';
    var lastStatusFile = '/.workspace/last-status<%user-id%>.json';

    function getStatusStringToSave() {
        logger.info('getStatusStringToSave()');
        var accum = {};
        Object.keys(lastStatusContributors).sort().forEach(function (key) {
            var contributor = lastStatusContributors[key];
            var lastStatus = null;
            var failed = false;

            try {
                lastStatus = contributor();
            } catch (e) {
                lastStatus = { message: e.message,
                               stack: e.stack.toString() || 'not available' };
                failed = true;
            }

            accum[(failed ? ERROR_KEY_PREFIX : '') + key] = lastStatus;
        });
        var statusString = JSON.stringify(accum);

        return lastSaved === statusString ? null : statusString;
    }

    function saveStatusSync() {
        if (webida.VERSION && webida.VERSION === '0.1') {
            logger.info('current server api does not support synchronous file writing');
            return;
        }

        var statusString = getStatusStringToSave();
        if (statusString) {
            var formData = new FormData();
            var url = webida.conf.fsApiBaseUrl + '/file/' + fsid + '/' + encodeURI(path + lastStatusFile);
            var blob = new Blob([statusString], { type: 'application/octet-stream' });
            formData.append('file', blob);

            var retData, xhr = new XMLHttpRequest();
            try {
                xhr.open('POST', url, false);
                //xhr.withCredentials = true;
                    // This causes an error in Firefox  (Synchronous CO requests are not allowed in Firefox?)
                xhr.setRequestHeader('Authorization', webida.auth.getToken());
                xhr.send(formData);
            } catch (e) {
                console.debug(e);
                return 'XHR error: ' + e;
            }

            try {
                retData = JSON.parse(xhr.responseText);
            } catch (e) {
                logger.error('error while parsing responseText ' + xhr.responseText);
                retData = { result: 'failed',
                            reason: 'Invalid server return (' + xhr.responseText + ')' };
            }

            if (retData.result === 'ok') {
                lastSaved = statusString;
                return null;    // 'ok';
            } else {
                return retData.reason;
            }
        } else {
            return null;    // 'status not modified';
        }
    }

    function saveStatus(cb, eb) {
        logger.info('saveStatus(cb, eb)');
        var statusString = getStatusStringToSave();
        if (statusString) {
            mount.writeFile(path + lastStatusFile, statusString, function (err) {
                if (err) {
                    notify.error('Saving App status failed: ' + err);
                    if (eb) {
                        eb();
                    }
                } else {
                    logger.log('Saving App status succeeded');
                    lastSaved = statusString;
                    if (cb) {
                        cb();
                    }
                }
            });
        } else {
            if (cb) {
                cb();
            }
        }
    }
    setInterval(saveStatus, 1800000); // every 30 minutes

    /**
     * boots Webida App with given paths of this module and a workspace.
     * It checks if the given workspace path really represents a workspace,
     * invokes plugin manager's initialization procedure,
     * restores the last status of the App, and
     * loads start plugins into memory.
     *
     * @callback open_workspace
     * @returns {undefined}
     */
    function startup(options) {
        singleLogger.log('%c*** Starting Open Development Platform ***', 'color:green');
        function proceed() {
            var currentURI = URI(window.location.href);
            var workspaceInfo = currentURI.search(true).workspace;
            if (!workspaceInfo || workspaceInfo.length === 0 || workspaceInfo.split('/').length < 2) {
                require(['popup-dialog'], function (PopupDialog) {
                    PopupDialog.alert({
                        title: 'Error',
                        message: 'Workspace is not specified or wrong',
                        type: 'error'
                    });
                    return;
                });
            } else {
                var appPathname = currentURI.segment(-1, '').pathname();
                webida.auth.initAuth(appConfig.clientId, appConfig.redirectUrl, null, function () {
                    init(appPathname, workspaceInfo, options);
                });
            }
        }

        // check the browser
        var browser = brInfo.browser;
        var brVer = brInfo.browserVer;
        var majorVer = brVer.split('.')[0];
        majorVer = (majorVer && parseInt(majorVer, 10)) || -1;

        if ((/chrome/i.test(browser) && majorVer >= 31) ||
            (/firefox/i.test(browser) && majorVer >= 31) ||
            (/ie/i.test(browser) && majorVer >= 10)) {
            proceed();
        } else {
            require(['popup-dialog'], function (PopupDialog) {
                PopupDialog.confirm({
                    title: 'Confirm',
                    message: 'Currently, Webida App only supports lastest versions of Chrome, Firefox and IE ' +
                             '(you are using ' + browser + ' ' + brVer + '). ' +
                             'Do you want to proceed anyway?'
                }).then(proceed);
            });
        }

    }

    function init(appPath, workspacePath, options) {

        singleLogger.log('(A) initializing app');

        //console.log('hina temp: appPath = <' + appPath + '>');
        //console.log('hina temp: workspacePath = <' + workspacePath + '>');

        var segments = workspacePath.split('/');
        fsid = segments.shift();
        path = '/' + segments.join('/');

        var fsURL = (new URI(webida.conf.fsServer)).protocol('wfs').path('/' + fsid).href();
        fsCache = new FSCache(fsURL, [path + '/']);
        mount = webida.fs.mountByFSID(fsid);

        var defaultOptions = {
            multiUserWorkspace: false
        };
        options = lang.mixin(defaultOptions, options || {});

        // validate workspace : test the existence of '.workspace' in workspace
        mount.exists(path + '/.workspace', function (err, exists) {
            if (err) {
                PopupDialog.alert({
                    title: 'Error',
                    message: 'Failed to find a directory named \'.workspace\' in the workspace (' + err + ')',
                    type: 'error'
                });
            } else {
                if (exists) {
                    if (options.multiUserWorkspace) {
                        webida.auth.getMyInfo(function (err, info) {
                            if (err) {
                                PopupDialog.alert({
                                    title: 'Error',
                                    message: 'Failed to get my account info (' + err + ')',
                                    type: 'error'
                                });
                            } else {
                                lastStatusFile = lastStatusFile.replace('<%user-id%>', '-' + info.uid);
                                restoreLastStatusOfApp();
                            }
                        });
                    } else {
                        lastStatusFile = lastStatusFile.replace('<%user-id%>', '');
                        restoreLastStatusOfApp();
                    }
                } else {
                    PopupDialog.alert({
                        title: 'Error',
                        message: 'A directory named \'.workspace\' does not exist in the workspace',
                        type: 'error'
                    });
                }
            }
        });

        // read last status file and set appLastStatus
        // (this must be done before loading any plugin)
        function restoreLastStatusOfApp() {
            logger.info('restoreLastStatusOfApp()');
            singleLogger.log('(B) verified the workspace');
            mount.readFile(path + lastStatusFile, function (err, content) {
                //logger.info('content = ', content);
                if (err) {
                    singleLogger.log('(C) not read last status file (' + err + ')');
                } else {
                    try {
                        appLastStatus = JSON.parse(content);
                        lastSaved = content;
                    } catch (e) {
                        logger.log('An exception while parsing last status of the App: ' + e.toString());
                    }
                    singleLogger.log('(C) read and parsed last status file');
                }

                if (appLastStatus) {
                    Object.keys(appLastStatus).forEach(function (key) {
                        if (key.indexOf(ERROR_KEY_PREFIX) === 0) {
                            logger.log('lastStatus[' + key + '] = ', appLastStatus[key]);
                        }
                    });
                }

                startFSCache();
            });
        }

        function startFSCache() {
            var lastStatus = registerStatusContributorAndGetLastStatus('fsCache', function () {
                return fsCache.getSummary();
            });

            fsCache.start(lastStatus);
            singleLogger.log('(D) started fs-cache');

            fsCache.refreshHierarchy(path + '/', { level: -1 }, function () {
                singleLogger.log('(Z) refreshed fs-cache');
                connectToConnServer();
            });

            initPlugins();
        }

        function initPlugins() {
            // initialize plug-ins
            pm.initPlugins(appPath, workspacePath, function () {

                singleLogger.log('(E) initialized plug-ins');

                // TODO: is the following necessary?
                // suppress DnD on the window (but, an inner element can accept DnD).
                window.ondragenter = window.ondragover = window.ondrop = function () {
                    return false;
                };

                wellOpened = true;
            });
        }

        function connectToConnServer() {

            webida.auth.getMyInfo(function (e, data) {
                if (e) {
                    logger.error('getMyInfo error: ' + e);
                } else {
                    var loginCB = function (err, user) {
                        if (err) {
                            logger.error('failed to connect to conn server');
                        } else {
                            logger.log('connected to conn server');
                            
                            // note from webida-desktop
                            //  new server-api-*.js has no acl service and does not require 
                            //  explicit subscription for default server events like fs.change 
                            //  So, msgAgent.init() actually do nothing but returns some dummy
                            //  stuffs & real event processing will be handled without app.js

                            if (typeof webida.acl !== 'object') {
                                logger.log('no need to subscribe and topic relay with new api ');
                                return; 
                            }
                            
                            webida.acl.getAuthorizedRsc('fs:readFile', function (err, topics) {
                                if (err) {
                                    logger.error('getAuthorizedRsc: ', err);
                                } else {
                                    var scope = 'sys.fs.change:';
                                    topics.forEach(function (value, index) {
                                        topics[index] = scope + value;
                                    });
                                    msgAgent.sub2(user, topics, function (err, msg) {
                                        //logger.log(JSON.stringify(msg));
                                        if (err) {
                                            logger.error('failed to subacribe topics with ' + JSON.stringify(msg));
                                        }
                                    });
                                }
                            });

                            // sys.acl.change notification subscribe
                            var workspaceInfo = URI(window.location.href).search(true).workspace;
                            var aclScope = 'sys.acl.change:fs:';
                            var aclTopics = [];
                            aclTopics.push(aclScope + workspaceInfo);
                            aclTopics.push(aclScope + workspaceInfo.split('/')[0] + '/*');
                            msgAgent.sub2(user, aclTopics, function (err, msg) {
                                //logger.log(JSON.stringify(msg));
                                if (err) {
                                    logger.error('failed to subacribe acl topics with ' + JSON.stringify(msg));
                                }
                            });
                        }
                    };

                    var callbacks = {
                        usermsg: null,
                        topicsysnotify: function (_, data) {
                            //Might be contributed by any plugin
                            topic.publish('webida/server/event/dispatched', data);
                        },
                        topicusernotify: null
                    };

                    try {
                        msgAgent.init(data.uid, webida.auth.getTokenObj().data,
                            webida.conf.connServer, callbacks, loginCB);
                    } catch (e) {
                        logger.error('Failed to initialize message agent', e);
                    }
                }
            });
        }
    }

    /**
     * returns the file system's id in which current workspace resides
     *
     * @callback get_fsid
     * @returns {string} id of the file system
     */
    function getFsid() {
        return fsid;
    }

    /**
     * returns the path of current workspace beginnig with a slash (/),
     * that is, with the file system id detached
     *
     * @callback get_path
     * @returns {path} the path of current workspace
     */
    function getPath() {
        return path;
    }

    function getFSCache() {
        return fsCache;
    }

    /**
     * returns a FileSystem object by which one can invoke file system operations
     * such as copy, move, list, remove, etc.
     *
     * @callback get_mount
     * @returns {FileSystem} the FileSystem object
     */
    function getMount() {
        return mount;
    }

    /**
     * the type of the callback function given to app.registerBeforeUnloadChecker method
     *
     * @callback before_unload_checker
     * @returns {string|null} a non-empty string (message) that describes a reason
     *      why Webida App should not be unloaded (e.g. "File ... has unsaved changes").
     *      This string will be shown in the confirmation dialog which asks a user
     *      whether he/she really wants to unload the App.
     */

    /**
     * provides a mean to check if Webida App can be safely unloaded when a user
     * initiates the App unload.
     * By this method, a part of the App (usually, a module or plug-in) can register
     * a callback function which will be called when the App is about to be unloaded
     * (in 'beforeunload' event handler).
     * The unload can be canceled depending on the results of the callback functions
     * registered by this method and the user's reaction to the confirmation dialog.
     * Such a callback function should eturn a non-empty string if the App part has any reason
     * to prevent the App unload.
     *
     * @callback register_before_unload_checker
     * @param {before_unload_checker} checker - a callback function whoich will be called
     *      in the 'beforeunload' event handler and should return a non-empty string
     *      which describes the reason, if any, to prevent the page unload.
     *      The string (message) will be shown to the user in a dialog which confirms
     *      that the user really wants to unload the App in spite of the reason
     *      (e.g. unsaved changes in a file).
     * @returns {undefined}
     */
    function registerBeforeUnloadChecker(key, checker) {
        beforeUnloadCheckers[key] = checker;
    }

    function unregisterBeforeUnloadChecker(key) {
        delete beforeUnloadCheckers[key];
    }

    /**
     * the type of the callback function given to app.registerStatusContributorAndGetLastStatus
     * method
     *
     * @callback status_contributor
     * @returns {object} any JSON-serializable object that encodes the status of the App part
     *      that registers this callback function
     */

    /**
     * provides a mean to save and restore the status of a part (usually, a module or plug-in)
     * of Webida App.
     * The effect of this method is twofold: (1) it registers a callback function which
     * returns the status of the App part which a user wants to save when the App is unloaded,
     * and (2) it returns the last status of the part which was saved when the App was
     * unloaded last time.
     *
     * @callback register_status_contributor
     * @param {string} key - a key string to identify the App part whose status is
     *      to be saved when the App is unloaded and restored when the App is loaded next time.
     * @param {status_contributor} contributor - a callback function that returns an object
     *      which encodes the last status of the App part. The object has
     *      no constraint except that it must be JSON-serializable. This callback function
     *      is called when the App is unloaded (in 'unload' event handler)
     * @returns {object} the object which the callback function returned at the last unload of the App.
     */
    function registerStatusContributorAndGetLastStatus(key, contributor) {
        logger.log('registerStatusContributorAndGetLastStatus(' + key + ', contributor)');

        if (lastStatusContributors[key]) {
            logger.log('A last status contributor function was already registed with the key \'' + key + '\'');
            return null;
        } else {
            lastStatusContributors[key] = contributor;
        }

        if (appLastStatus) {
            return appLastStatus[key];
        } else {
            return null;
        }
    }

    function quit() {
        // only support NON-IE browser
        try {
            window.focus();
            window.opener = window;
            window.close();
        } catch (e) {
            logger.log('First try to close App failed', e);

            try {
                window.open('', '_self', '');
                window.close();
            } catch (e) {
                logger.log('Second try to close App failed', e);
            }
        }
    }


    function reload() {
        window.location.reload();
    }

    function getWorkspaceInfo(callback) {
        var fsCache = getFSCache();
        var workspacePath = getPath();
        var result = {
            name: workspacePath.substring(1)
        };
        if (fsCache && workspacePath) {
            fsCache.list(workspacePath, function (err, files) {
                if (err) {
                    callback(err);
                } else {
                    result.projects = _.filter(files, function (file) {
                        return file.isDirectory && file.name.charAt(0) !== '.';
                    });
                    result.projects = result.projects.map(function (project) {
                        return project.name;
                    });
                    callback(null, result);
                }
            });
        } else {
            callback('Cannot find workspace info.');
        }
    }


    function _checkProjectInfoDir(projectName, callback) {
        var fsCache = getFSCache();
        var projectPath = getPath() + '/' + projectName;
        var projectInfoDir = projectPath + '/.project';
        fsCache.exists(projectPath, function (err, exist) {
            if (err) {
                return callback(err);
            } else {
                if (exist) {
                    fsCache.exists(projectInfoDir, function (err, exist) {
                        if (err) {
                            return callback(err);
                        } else {
                            if (exist) {
                                return callback();
                            } else {
                                fsCache.createDirectory(projectInfoDir, function (err) {
                                    return callback(err);
                                });
                            }
                        }
                    });
                } else {
                    return callback(projectName + ' is not valid project name.');
                }
            }
        });
    }

    function _addProjectInfo(projectName, callback) {
        var fsCache = getFSCache();
        var projectInfoPath = getPath() + '/' + projectName + '/.project/project.json';
        _checkProjectInfoDir(projectName, function (err) {
            if (err) {
                return callback(err);
            } else {
                //make project.json file
                var projectInfo = {
                    'name': projectName,
                    'description': '',
                    'created': new Date().toGMTString(),
                    'type': '',
                    'path': projectInfoPath,
                    'isProject' : true
                };

                fsCache.writeFile(projectInfoPath, JSON.stringify(projectInfo), function (err) {
                    if (err) {
                        return callback(err);
                    } else {
                        return callback(null, projectInfo);
                    }
                });
            }
        });
    }

    function getProjectInfo(projectName, callback) {
        var fsCache = getFSCache();
        var projectInfoPath = getPath() + '/' + projectName + '/.project/project.json';
        fsCache.exists(projectInfoPath, function (err, exist) {
            if (err) {
                return callback(err);
            } else {
                if (exist) {
                    fsCache.readFile(projectInfoPath, function (err, content) {
                        if (err) {
                            return callback(err);
                        } else {
                            return callback(null, JSON.parse(content));
                        }
                    });
                } else {
                    _addProjectInfo(projectName, function (err, projectInfo) {
                        return callback(err, projectInfo);
                    });
                }
            }
        });
    }

    /**
     * A function that boots Webida App with given workspace
     * @type {open_workspace}
     */
    exports.startup = startup;

    /**
     * A function that returns the id of the file system in which current workspace of Webida App resides
     * @type {get_fsid}
     */
    exports.getFsid = getFsid;

    /**
     * A function that returns the path of current workspace of Webida App
     * @type {get_path}
     */
    exports.getPath = getPath;

    exports.getFSCache = getFSCache;

    /**
     * A function that returns the mounted file system in which current workspace of Webida App resides
     * @type {get_mount}
     */
    exports.getMount = getMount;

    /**
     * A function that registers a callback which checks whether Webida App can safely be unloaded
     * @type {register_before_unload_checker}
     */
    exports.registerBeforeUnloadChecker = registerBeforeUnloadChecker;


    /**
     * A function that unregisters a callback which checks whether Webida App can safely be unloaded
     * @type {unregister_before_unload_checker}
     */
    exports.unregisterBeforeUnloadChecker = unregisterBeforeUnloadChecker;

    /**
     * A function that registers a callback which produces an object encoding a status of a part of Webida App.
     * This function also returns the last status (saved when the App was unlaoded last time) of the App part
     * @type {register_status_contributor}
     */
    exports.registerStatusContributorAndGetLastStatus = registerStatusContributorAndGetLastStatus;

    /**
     * A function that quits the App. TODO: document
     */
    exports.quit = quit;

    /**
     * A function that quits the App. TODO: document
     */
    exports.reload = reload;

    /**
     * A function that quits the App. TODO: document
     */
    exports.saveStatus = saveStatus;

   /**
    * A function that get workspace information and its project list
    * @type {getWorkspaceInfo}
    */
    exports.getWorkspaceInfo = getWorkspaceInfo;

   /**
    * A function that get project information by project name
    * @type {getProjectInfo}
    */
    exports.getProjectInfo = getProjectInfo;

    return exports;
});

