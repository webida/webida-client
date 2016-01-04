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
 * @file Manager for preferences
 * @since 1.4.0
 * @author kyungmi.k@samsung.com
 * @module Preference/Manager
 */

/* jshint unused:false */

define([
    'dojo/i18n!./nls/resource',
    'dojo/topic',
    'external/eventEmitter/EventEmitter',
    'external/lodash/lodash.min',
    'plugins/project-configurator/project-info-service',
    'webida-lib/app',
    'webida-lib/app-config',
    'webida-lib/plugin-manager-0.1',
    'webida-lib/plugins/workbench/ui/promiseMap',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './preference-store'
], function (
    i18n,
    topic,
    EventEmitter,
    _,
    projectService,
    ide,
    conf,
    pluginManager,
    promiseMap,
    genetic,
    Logger,
    Store
) {
    'use strict';
    /**
     * @type {Logger}
     */
    var logger = new Logger();
    /**
     * Single instance of manager
     * @type {module:Preference/Manager}
     */
    var _preferenceManager;
    /**
     * @type {FSCache}
     */
    var fsCache = ide.getFSCache();
    /**
     * @constant {string}
     */
    var EXTENSION_NAME = 'webida.preference:pages';
    /**
     * @constant {string}
     */
    var PREF_FILE_NAME = 'preferences.json';
    /**
     * Scope information
     * @alias scope
     * @todo `root` and `path` properties will be replaced with the "Resource" concept later.
     * @readonly
     * @enum {Object}
     * @memberof {module:Preference/Manager}
     */
    var SCOPE = Object.freeze({
        USER: {
            name: 'USER',
            displayName: i18n.labelUserScope,
            priority: 1,
            root: '/',
            path: conf.meta.user.dir + '/' + PREF_FILE_NAME
        },
        WORKSPACE: {
            name: 'WORKSPACE',
            displayName: i18n.labelWorkspaceScope,
            priority: 2,
            root: ide.getPath() + '/',
            path: conf.meta.workspace.dir + '/' + PREF_FILE_NAME
        },
        PROJECT: {
            name: 'PROJECT',
            displayName: i18n.labelProjectScope,
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

    /**
     * @callback errorCallback
     * @param {(Error|String)} [error]
     */

    /**
     * Preference Manager
     * @constructor
     */
    function PreferenceManager() {
        this.SCOPE = SCOPE;
        this.preferences = [];
        // Sort alphabetically
        this.extensions = _.sortBy(pluginManager.getExtensions(EXTENSION_NAME), function (item) {
            return (item.hierarchy ? (item.hierarchy + '/') : '') + item.id;
        });
        this.extensionsByScope = {};
        this.initialize();
    }

    genetic.inherits(PreferenceManager, EventEmitter, {
        /**
         * Initialize preference manager and its data
         * @return {Promise}
         * @private
         */
        initialize: function () {
            if (!promiseMap.get('preference/load')) {
                var self = this;
                self._addListeners();
                promiseMap.set('preference/load',
                    Promise.all([self._getAllPreferenceFiles(), self._getAllExtensions()]).then(function (values) {
                        return Promise.all(values[0].map(self._makeStoresForEachFile.bind(self)));
                    })
                );
            }
            return promiseMap.get('preference/load');
        },

        /**
         * Get preference store by preference id and scope
         * @param {string} preferenceId
         * @param {Object} scope
         * @param {Object} scopeInfo - additional information for scope
         * @return {module:Preference/Store}
         */
        getStore: function (preferenceId, scope, scopeInfo) {
            if (!preferenceId || !scope || SCOPE[scope.name] === undefined) {
                return null;
            }
            var targetFile = this._getFilePath(scope, scopeInfo);
            return _.find(this.preferences, {id: preferenceId, scope: scope.name, targetFile: targetFile});
        },

        /**
         * Get preference stores by scope
         * @param {Object} scope
         * @param {Object} scopeInfo - additional information for scope
         * @return {Array.<module:Preference/Store>}
         */
        getStoresByScope: function (scope, scopeInfo) {
            if (!scope || SCOPE[scope.name] === undefined) {
                return null;
            }
            var targetFile = this._getFilePath(scope, scopeInfo);
            return _.filter(this.preferences, {scope: scope.name, targetFile: targetFile});
        },

        /**
         * Get preference stores by preference id
         * @param {string} preferenceId
         * @return {Array.<module:Preference/Store>}
         */
        getStoresById: function (preferenceId) {
            if (!preferenceId) {
                return null;
            }
            return _.filter(this.preferences, {id: preferenceId});
        },

        /**
         * Get parent of provided preference store
         * @param {module:Preference/Store} store
         * @return {module:Preference/Store}
         */
        getParentStore: function (store) {
            var childPriority = SCOPE[store.scope].priority;
            var getStoresById = this.getStoresById(store.id);
            var parentStore;
            if (getStoresById.length > 0) {
                for (var i = 0; i < getStoresById.length; i++) {
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
        },

        /**
         * Get all preference id(type) list filtered by scope
         * @param {Object} scope
         * @return {Array.<Object>}
         */
        getAllPreferenceTypes: function (scope) {
            if (scope) {
                return _.filter(this.extensions, function (ext) {
                    return ext.scope.indexOf(scope.name) > -1;
                });
            } else {
                return [];
            }
        },

        /**
         * Save all preference stores checking valid
         * @param {Object} scope
         * @param {errorCallback} callback
         */
        saveAllPreference: function (scope, callback) {
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
        },

        /**
         * Flush all applied preference stores to the file
         * @param {Object} scope
         * @param {Object} scopeInfo
         * @param {errorCallback} [callback]
         */
        flushPreference: function (scope, scopeInfo, callback) {
            var storesByScope = this.getStoresByScope(scope, scopeInfo);
            var storesByScopeGroupedByFile = _.groupBy(storesByScope, 'targetFile');
            _.forEach(storesByScopeGroupedByFile, function (storesByFile, filePath) {
                var flushToFile = {};
                _.forEach(storesByFile, function (store) {
                    flushToFile[store.id] = store.appliedValues;
                });
                fsCache.writeFile(filePath, JSON.stringify(flushToFile), function (err) {
                    if (err) {
                        logger.error('failed to flushPreference: ', err);
                    }
                    if (callback) {
                        callback(err);
                    }
                });
            });
        },

        undoAllChanges: function (scope, scopeInfo) {
            var storesByScope = this.getStoresByScope(scope, scopeInfo);
            _.forEach(storesByScope, function (store) {
                store.undoChanges();
            });
        },

        /**
         * Get all preference file list
         * @return {Promise}
         * @private
         */
        _getAllPreferenceFiles: function () {
            var self = this;
            var files = [];
            return Promise.all(_.chain(SCOPE).mapValues(function (scope) {
                return new Promise(function (resolve) {
                    if (typeof scope.getScopeInfo === 'function') {
                        scope.getScopeInfo(function (scopeInfos) {
                            files = files.concat(scopeInfos.map(function (scopeInfo) {
                                return {
                                    filePath: self._getFilePath(scope, scopeInfo),
                                    scopeName: scope.name,
                                    scopeInfo: scopeInfo
                                };
                            }));
                            resolve();
                        });
                    } else {
                        files = files.concat({
                            filePath: self._getFilePath(scope),
                            scopeName: scope.name
                        });
                        resolve();
                    }
                });
            }).values().value()).then(function () {
                return files;
            });
        },

        /**
         * Get all object of extension(webida.preference:pages) and extract default values for each preference type
         * @return {Promise}
         * @private
         */
        _getAllExtensions: function () {
            var self = this;
            return Promise.all(self.extensions.map(function (extension) {
                return new Promise(function (resolve) {
                    if (extension.getDefault) {
                        require([extension.module], function (module) {
                            var defaultValues = module[extension.getDefault]();
                            extension.defaultValues = defaultValues;
                            resolve();
                        });
                    } else {
                        extension.defaultValues = {};
                        resolve();
                    }
                });
            }));
        },

        /**
         * Get extension object list by its scope
         * @param {module:Preference/Manager.scope} scopeName
         * @return {Array.<Object>}
         * @private
         */
        _getExtensionsByScope: function (scopeName) {
            var self = this;
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
        },

        /**
         * Create stores for each preference file
         * @param {Object} fileInfo - file information that include file path and scope information
         * @return {Promise}
         * @private
         */
        _makeStoresForEachFile: function (fileInfo) {
            var self = this;
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
                var extensionsForScope = self._getExtensionsByScope(fileInfo.scopeName);
                _.forEach(extensionsForScope, function (extension) {
                    var store = new Store(
                        extension.id,
                        fileInfo.scopeName,
                        fileInfo.scopeInfo,
                        fileInfo.filePath
                    );
                    var storeExist;
                    store.initialValues(extension.defaultValues, fileInfo.content[extension.id] || {});
                    storeExist = _.findIndex(self.preferences, function (ps) {
                        return ps.id === extension.id &&
                            ps.scope === fileInfo.scopeName &&
                            ps.targetFile === fileInfo.filePath;
                    });
                    if (storeExist > -1) {
                        self.preferences[storeExist] = store;
                    } else {
                        self.preferences.push(store);
                    }
                    store.on(Store.VALUE_CHANGED, function (store) {
                        self.emit(self.PREFERENCE_VALUE_CHANGED, store);
                    });
                });
            });
        },

        /**
         * Register needed listeners watching for preference files
         * @todo complete listeners for all cases
         * @private
         */
        _addListeners: function () {
            var self = this;
            topic.subscribe('project/config/changed', function (projectName) {
                logger.log('project/config/changed', projectName);
                self._makeStoresForEachFile({
                    filePath: self._getFilePath(SCOPE.PROJECT, {projectName: projectName}),
                    scopeName: 'PROJECT',
                    scopeInfo: {projectName: projectName}
                });
            });

            topic.subscribe('fs/cache/file/set', function (/*fsURL, target*/) {
                logger.log('fs/cache/file/set', arguments);
                //var store = getStoreByPath(target);
                // reloadPreference(SCOPE[store.scope], store.storeInfo);
            });

            topic.subscribe('fs/cache/node/deleted', function (/*fsURL, targetDir, name, type*/) {
                logger.log('fs/cache/node/deleted', arguments);
                //if (name === PREFERENCE_FILE_NAME) {
                //  var store = getStoreByPath(targetDir + name);
                //  flushPreferences(SCOPE[store.scope], store.scopeInfo, function (err) {});
                //}
            });
        },

        /**
         * Get the path headed for real preference file
         * @param {Object} scope - scope object {@link module:Preference/Manager.scope}
         * @param {Object} scopeInfo - more information
         * @return {string}
         * @private
         */
        _getFilePath: function (scope, scopeInfo) {
            var filePath = scope.root + scope.path;
            if (scopeInfo) {
                filePath = _.template(filePath)(scopeInfo);
            }
            return filePath;
        },

        /**
         * Event name for notifying changes on store of preference values
         * @constant {string}
         * @see {module:Preference/Store.VALUE_CHANGED}
         */
        PREFERENCE_VALUE_CHANGED: 'preferenceValueChanged'
    });

    if (!_preferenceManager) {
        _preferenceManager = new PreferenceManager();
    }
    return _preferenceManager;
});
