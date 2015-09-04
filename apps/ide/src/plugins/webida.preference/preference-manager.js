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
 *
 * @since: 15. 8. 18
 * @author: Koong Kyungmi (kyungmi.k@samsung.com)
 */

define([
    'external/lodash/lodash.min',
    'dojo/topic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/app',
    'webida-lib/app-config',
    'webida-lib/plugin-manager-0.1',
    './preference-store',
    'plugins/project-configurator/project-info-service'
], function (
    _,
    topic,
    Logger,
    ide,
    conf,
    pluginManager,
    Store,
    projectService
) {
    'use strict';

    var logger = new Logger();
    var _preferenceManager;
    var fsCache = ide.getFSCache();
    var valueChangeListener;

    var EXTENSION_NAME = 'webida.preference:pages';
    var PREF_FILE_NAME = 'preferences.json';
    var SCOPE = Object.freeze({
        USER: {
            name: 'USER',
            priority: 1,
            root: '/',
            path: conf.meta.user.dir + '/' + PREF_FILE_NAME
        },
        WORKSPACE: {
            name: 'WORKSPACE',
            priority: 2,
            root: ide.getPath() + '/',
            path: conf.meta.workspace.dir + '/' + PREF_FILE_NAME
        },
        PROJECT: {
            name: 'PROJECT',
            priority: 3,
            getScopeInfo: function (callback) {
                return projectService.getAll(function (projects) {
                    callback(projects.map(function (value) {
                        return {projectName: value.name};
                    }));
                });
            },
            root: ide.getPath() + '/<%=projectName%>/',
            path: conf.meta.project.dir + '/' + PREF_FILE_NAME
        }
    });

    function _getFilePath(scope, scopeInfo) {
        var filePath = scope.root + scope.path;
        if (scopeInfo) {
            filePath = _.template(filePath)(scopeInfo);
        }
        return filePath;
    }

    function PreferenceManager() {
        this.SCOPE = SCOPE;
        this.preferences = [];
        this.extensions = [];

        var self = this;

        function fillStoreValues(scope, extension, scopeInfo) {
            return new Promise(function (resolve) {
                var filePath = _getFilePath(scope, scopeInfo);
                var store = new Store(extension.id, scope.name, scopeInfo, filePath);
                self.preferences.push(store);
                store.addValueChangeListener(function (appliedValues) {
                    valueChangeListener(this);
                });

                fsCache.readFile(filePath, function (err, content) {
                    if (err) {
                        logger.warn('[Preference] Read file error: ' + filePath, err);
                        store.initialValues(extension.defaultValues, {});
                    } else {
                        try {
                            var prefFromFile = JSON.parse(content);
                            store.initialValues(extension.defaultValues, prefFromFile[store.id] || {});
                        } catch (e) {
                            logger.warn('[Preference] Invalid form of preference file: ' + filePath, e);
                            store.initialValues(extension.defaultValues, {});
                        }
                    }
                    resolve();
                });
            });
        }

        function makeStores(scope, extension) {
            return Promise.resolve().then(function () {
                if (scope.getScopeInfo) {
                    scope.getScopeInfo(function (scopeInfos) {
                        return Promise.all(scopeInfos.map(function (scopeInfo) {
                            console.log('fillStoreValues', scope, extension, scopeInfo);
                            return fillStoreValues(scope, extension, scopeInfo);
                        }));
                    });
                } else {
                    return fillStoreValues(scope, extension);
                }
            });
        }

        function traverseScopes(extension) {
            var scopes = extension.scope;
            if (typeof extension.scope === 'string') {
                scopes = [extension.scope];
            }
            return new Promise(function (resolve) {
                // retrieve default values for each extension
                require([extension.module], function (module) {
                    var defaultValues = module[extension.getDefault]();
                    extension.defaultValues = defaultValues;
                    resolve();
                });
            }).then(function () {
                // traverse all scopes per extension and make store objects for each scope
                var handledScopes = _.chain(SCOPE).pick(scopes).values().value();
                return Promise.all(handledScopes.map(function (scope) {
                    return makeStores(scope, extension);
                }));
            });
        }

        function init () {
            self.extensions = pluginManager.getExtensions(EXTENSION_NAME);
            return Promise.all(self.extensions.map(traverseScopes));
        }

        this.initialized = init();

    }

 /*   function addListeners() {
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

        topic.subscribe('fs.cache.file.set', function (fsURL, target *//*, type, maybeModified*//* ) {
            logger.log('fs.cache.file.set', arguments);
            var targetPathInfo = _getPathInfo(target);
            if (targetPathInfo.type === 'runConfig') {
                require(['plugins/webida.ide.project-management.run/view-controller'], function (
                    viewController) {
                    if (!viewController.getWindowOpened()) {
                        loadRunConfigurations();
                    }
                });
            }
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
    }*/


    PreferenceManager.prototype.initialize = function () {
        return this.initialized;
    };

    PreferenceManager.prototype.getStore = function (preferenceId, scope, scopeInfo) {
        if(!preferenceId || !scope || SCOPE[scope.name] === undefined) {
            return null;
        }
        var targetFile = _getFilePath(scope, scopeInfo);
        return _.find(this.preferences, {id: preferenceId, scope: scope.name, targetFile: targetFile});
    };

    PreferenceManager.prototype.getStoresByScope = function (scope, scopeInfo) {
        if(!scope || SCOPE[scope.name] === undefined) {
            return null;
        }
        var targetFile = _getFilePath(scope, scopeInfo);
        return _.filter(this.preferences, {scope: scope.name, targetFile: targetFile});
    };

    PreferenceManager.prototype.getStoresById = function (preferenceId) {
        if (!preferenceId) {
            return null;
        }
        return _.filter(this.preferences, {id: preferenceId});
    };

    PreferenceManager.prototype.getParentStore = function (store) {
        var childPriority = SCOPE[store.scope].priority;
        var getStoresById = this.getStoresById(store.id);
        var parentStore;
        if (getStoresById.length > 0) {
            for (var i=0; i<getStoresById.length; i++) {
                var priority = SCOPE[getStoresById[i].scope].priority;
                if (priority >= childPriority) {
                   continue;
                }
                if(!parentStore || SCOPE[parentStore.scope].priority < priority) {
                    parentStore = getStoresById[i];
                }
            }
        }
        return parentStore;
    };

    PreferenceManager.prototype.getAllPreferenceTypes = function (scope) {
        return _.filter(this.extensions, function (ext) {
            return ext.scope.indexOf(scope.name) > -1;
        });
    };

    PreferenceManager.prototype.saveAllPreference = function (scope, callback) {
        var storesByScope = this.getStoresByScope(scope);
        Promise.all(storesByScope.map(function (store) {
            return new Promise(function (resolve) {
                store.apply(function (invalid) {
                    resolve(invalid);
                });
            });
        })).then(function (invalidMsgs) {
            // TODO handle invalid messages
            callback(invalidMsgs);
        });
    };

    PreferenceManager.prototype.flushPreference = function (scope, scopeInfo, callback) {
        var storesByScope = this.getStoresByScope(scope, scopeInfo);
        var storesByScopeGroupedByFile = _.groupBy(storesByScope, 'targetFile');
        _.forEach(storesByScopeGroupedByFile, function (storesByFile, filePath) {
            var flushToFile = {};
            _.forEach(storesByFile, function (store) {
                flushToFile[store.id] = store.appliedValues;
            });
            fsCache.writeFile(filePath, JSON.stringify(flushToFile), callback);
        });
    };

    PreferenceManager.prototype.setValueChangeListener = function (listener) {
        this.initialized.then(function () {
            valueChangeListener = listener;
        });
    }

    if(!_preferenceManager) {
        _preferenceManager = new PreferenceManager();
    }
    return _preferenceManager;
});
