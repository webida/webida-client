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
    'dojo/topic',
    'external/lodash/lodash.min',
    'plugins/project-configurator/project-info-service',
    'webida-lib/app',
    'webida-lib/app-config',
    'webida-lib/plugin-manager-0.1',
    'webida-lib/plugins/workbench/ui/promiseMap',
    'webida-lib/util/logger/logger-client',
    './preference-store'
], function (
    topic,
    _,
    projectService,
    ide,
    conf,
    pluginManager,
    promiseMap,
    Logger,
    Store
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
        var self = this;
        this.SCOPE = SCOPE;
        this.preferences = [];
        this.extensions = pluginManager.getExtensions(EXTENSION_NAME);
        this.extensionsByScope = {};

        function _getAllPreferenceFiles() {
            var files = [];
            return Promise.all(_.chain(SCOPE).mapValues(function (scope) {
                return new Promise(function (resolve) {
                    if (typeof scope.getScopeInfo === 'function') {
                        scope.getScopeInfo(function (scopeInfos) {
                            files = files.concat(scopeInfos.map(function (scopeInfo) {
                                return {
                                    filePath: _getFilePath(scope, scopeInfo),
                                    scopeName: scope.name,
                                    scopeInfo: scopeInfo
                                };
                            }));
                            resolve();
                        });
                    } else {
                        files = files.concat({
                            filePath: _getFilePath(scope),
                            scopeName: scope.name
                        });
                        resolve();
                    }
                });
            }).values().value()).then(function () {
                return files;
            });
        }

        function _getAllExtensions() {
            return Promise.all(self.extensions.map(function (extension) {
                return new Promise(function (resolve) {
                    require([extension.module], function (module) {
                        var defaultValues = module[extension.getDefault]();
                        extension.defaultValues = defaultValues;
                        resolve();
                    });
                });
            }));
        }

        function _getExtensionsByScope(scopeName) {
            if (self.extensionsByScope[scopeName]) {
                return self.extensionsByScope[scopeName];
            }
            self.extensionsByScope[scopeName] = _.filter(self.extensions, function (extension) {
                if (extension.scope) {
                    if (typeof extension.scope === 'string' && extension.scope === scopeName) {
                        return true;
                    } else if (extension.scope instanceof Array && extension.scope.indexOf(scopeName) > -1) {
                        return true;
                    }
                }
                return false;
            });
            return self.extensionsByScope[scopeName];
        }

        function _makeStoresForEachFile(fileInfo) {
            return new Promise(function (resolve) {
                fsCache.readFile(fileInfo.filePath, function (err, content) {
                    fileInfo.content = {};
                    if (err) {
                        logger.warn('[Preference] Read file error: ' + fileInfo.filePath, err);
                    } else {
                        try {
                            fileInfo.content = JSON.parse(content);
                        } catch (e) {
                            logger.warn('[Preference] Invalid form of preference file: ' + fileInfo.filePath, e);
                        }
                    }
                    resolve(fileInfo);
                });
            }).then(function (fileInfo) {
                    var extensionsForScope = _getExtensionsByScope(fileInfo.scopeName);
                    _.forEach(extensionsForScope, function (extension) {
                        var store = new Store(
                            extension.id,
                            fileInfo.scopeName,
                            fileInfo.scopeInfo,
                            fileInfo.filePath
                        );
                        store.initialValues(extension.defaultValues, fileInfo.content[extension.id] || {});
                        var storeExist = _.findIndex(self.preferences, function (ps) {
                            return ps.id === extension.id &&
                                ps.scope === fileInfo.scopeName &&
                                ps.targetFile === fileInfo.filePath;
                        });
                        if (storeExist > -1) {
                            self.preferences[storeExist] = store;
                        } else {
                            self.preferences.push(store);
                        }
                        store.addValueChangeListener(function () {
                            valueChangeListener(this);
                        });
                    });
                });
        }

        function _addListeners() {
            topic.subscribe('projectConfig.changed', function (projectName) {
                logger.log('projectConfig.changed', projectName);
                _makeStoresForEachFile({
                    filePath: _getFilePath(SCOPE.PROJECT, {projectName: projectName}),
                    scopeName: 'PROJECT',
                    scopeInfo: {projectName: projectName}
                });
            });

            topic.subscribe('fs.cache.file.set', function (fsURL, target) {
                logger.log('fs.cache.file.set', arguments);
                //var store = getStoreByPath(target);
                // reloadPreference(SCOPE[store.scope], store.storeInfo);
            });

            topic.subscribe('fs.cache.node.deleted', function (fsURL, targetDir, name, type) {
                logger.log('fs.cache.node.deleted', arguments);
                //if (name === PREFERENCE_FILE_NAME) {
                //  var store = getStoreByPath(targetDir + name);
                //  flushPreferences(SCOPE[store.scope], store.scopeInfo, function (err) {});
                //}
            });
        }

        function init() {
            _addListeners();
            return Promise.all([_getAllPreferenceFiles(), _getAllExtensions()])
                .then(function (values) {
                    return Promise.all(values[0].map(_makeStoresForEachFile));
                });
        }

        promiseMap.set('preference/load', init());
    }

    PreferenceManager.prototype.initialize = function () {
        return promiseMap.get('preference/load');
    };

    PreferenceManager.prototype.getStore = function (preferenceId, scope, scopeInfo) {
        if (!preferenceId || !scope || SCOPE[scope.name] === undefined) {
            return null;
        }
        var targetFile = _getFilePath(scope, scopeInfo);
        return _.find(this.preferences, {id: preferenceId, scope: scope.name, targetFile: targetFile});
    };

    PreferenceManager.prototype.getStoresByScope = function (scope, scopeInfo) {
        if (!scope || SCOPE[scope.name] === undefined) {
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
                if (!parentStore || SCOPE[parentStore.scope].priority < priority) {
                    parentStore = getStoresById[i];
                }
            }
        }
        return parentStore;
    };

    PreferenceManager.prototype.getAllPreferenceTypes = function (scope) {
        if (scope) {
            return _.filter(this.extensions, function (ext) {
                return ext.scope.indexOf(scope.name) > -1;
            });
        } else {
            return [];
        }
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
            callback(invalidMsgs.join(' '));
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
        promiseMap.get('preference/load').then(function () {
            valueChangeListener = listener;
        });
    };

    if (!_preferenceManager) {
        _preferenceManager = new PreferenceManager();
    }
    return _preferenceManager;
});
