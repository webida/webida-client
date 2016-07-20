/*
 * Copyright (c) 2012-2016 S-Core Co., Ltd.
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
 * @file cache-db-manager.js
 * @since 1.7.0
 * @author jh1977.kim@samsung.com
 */

// we don't want cyclic dependencies between common and TokenManager.
//  so, instead of requiring just ./common, we require all dependencies directly
//  the only instance of TokenManager is saved in common
define([
    './common'
],  function (
    common
) {
    'use strict';

    var logger = common.logger;
    var CACHE_DB_STORAGE_KEY = 'webida-offline-cache-db';
    var CACHE_DB_VERSION = 1;
    var CACHE_DB_NAME_PREFIX = 'webida-offline-cache-';
    var ITEM_STORE_NAME = 'items';
    var CHANGE_STORE_NAME = 'changes';

    function rejector() {
        return Promise.reject(new Error('local storage is not available'));
    }

    if (!window.localStorage) {
        return {
            catalog: {},
            open : rejector,
            remove : rejector,
            clean : rejector
        };
    }

    var privates = {
        catalog : null,

        loadCatalog: function loadCaches() {
            var loaded = window.localStorage.getItem(CACHE_DB_STORAGE_KEY);
            if (loaded) {
                privates.catalog = JSON.parse(loaded);
            } else {
                privates.catalog = {};
                privates.saveCatalog();
            }
            return privates.catalog;
        },

        saveCatalog: function saveCaches(data) {
            var toWrite = data || privates.catalog || {};
            window.localStorage.setItem(CACHE_DB_STORAGE_KEY, JSON.strintify(toWrite));
        },

        getCacheDBName : function (workspaceId) {
            return CACHE_DB_NAME_PREFIX + workspaceId;
        },

        // makes IDBRequest object to call given resolve/reject, in a promise constructor
        // basically works on IDBRequest, but also supports IDBOpenDBRequest type.
        // setting a transaction object as request will not work.
        //  for transaction, use publics.util.begin() instead.
        swear: function (request, targetName, apiName, resolve, reject, isOpenDBRequest) {
            request.onerror = function (event) {
                if (isOpenDBRequest) {
                    logger.error(targetName + ' ' + apiName + ' error', event);
                }
                if (typeof reject === 'function') {
                    reject(request.error);
                }
            };

            request.onsuccess = function (event) {
                if (isOpenDBRequest) {
                    logger.debug(targetName + ' ' + apiName + ' success', event);
                }
                if (typeof resolve === 'function') {
                    resolve(request.result);
                }
            };

            if (isOpenDBRequest) {
                request.onblocked = function (event) {
                    logger.debug(targetName + ' ' + apiName + ' blocked', event);
                    if (typeof reject === 'function') {
                        reject(new Error(apiName + ' request ' + targetName + ' is blocked'));
                    }
                };
            }
        },

        createSchema: function createDBSchema(db, name) {
            // item { wfsPath,timestamp, data, stats }
            // timestamp is the time when data is updated, long int from Date.getTime() ;
            var itemStore = db.createObjectStore('items', { keyPath: 'wfsPath' });
            itemStore.createIndex('timestamp', 'timestamp', { unique:false });

            // change { wfsPath, timestamp, data }
            // We should separate data of change from item, to process upload/download in parallel.
            // If we don't, updating cache items can overwrite local change not uploaded yet.
            // That will be a really critical and hard-to-find bug.
            var changeStore = db.createObjectStore('changes', { keyPath: 'wfsPath' });
            changeStore.createIndex('timestamp', 'timestamp', { unique: false });
            logger.info('created cache db schema for ' + name);
        },

        // Usually, we need some 'serial' conversions, from 1 to version x.
        // Problem: if converting takes very long time, what should we do?
        // Since 'db' object will not wait for the tasks complete, and will fire success event
        //   when it has no pending tx, we can't support any upgrade tasks that need any async
        //   jobs other than db transaction. (for example, changing blob to string...)
        // SOLUTION : Do not upgrade if upgrading requires some external async tasks.
        //            Rename db and let open()/clean() handle the rest of our works.
        //            And, abandon data, sorry.
        upgradeSchema: function upgradeDBSchema(db, name, oldVersion, newVersion) {
            if (newVersion !== CACHE_DB_VERSION) {
                throw new Error('invalid db version ' + newVersion + ' to ' + name);
            }
            // no need to implement upgrade, yet.
        },

        openDB : function (workspaceId) {
            return new Promise(function (resolve, reject) {
                var name = privates.getCacheDBName(workspaceId);
                var openRequest = window.indexedDB.open(name, CACHE_DB_VERSION);
                openRequest.onupgradeneeded = function (event) {
                    var db = event.target.result;
                    // setting db.onsuccess, db.onerror does not work. request fires all events.
                    if (event.oldVersion) {
                        privates.upgradeSchema(db, name, event.oldVersion, event.newVersion);
                    } else {
                        privates.createSchema(db, name);
                    }
                };
                privates.swear(openRequest, name, 'open', resolve, reject, true);
            });
        },

        removeDB : function(workspaceId) {
            var name = privates.getCacheDBName(workspaceId);
            return new Promise(function (resolve, reject) {
                var delRequest = window.indexedDB.deleteDatabase(name);
                privates.swear(delRequest, name, 'deleteDatabase', resolve, reject, true);
            });
        }
    };

    var publics = {

        // resolves to IDBDatabase object
        open : function openCacheDB(workspaceId) {
            return privates.openDB(workspaceId).then(function(db) {
                var name = privates.getCacheDBName(workspaceId);
                if (!privates.catalog[name]) {
                    privates.catalog[name] = CACHE_DB_VERSION;
                    privates.saveCatalog();
                }
                return db;
            });
        },

        clean: function cleanCacheDB(workspaceIds) {
            var promises = [];
            workspaceIds.forEach(function(id) {
                var name = privates.getCacheDBName(id);
                promises.push(privates.removeDB(id).then( function() {
                    if (privates.catalog[name]) {
                        delete privates.catalog[name];
                        privates.saveCatalog();
                    }
                }));
            });
            return Promise.all(promises);
        },

        utils: {
            swear: function setPinkyFingers() {
                return privates.swear.apply(null, arguments);
            },

            begin: function beginCacheTransaction(db, txName, resolve, reject) {
                var tx = db.transaction(db.objectStoreNames, 'readwrite');
                tx.__name = txName;
                tx.onerror = function (event) {
                    logger.debug(txName + ' error', event);
                    reject(tx.error);
                };
                tx.oncomplete = function (event) {
                    logger.debug( txName + ' complete', event);
                    resolve(); // resolves null, on alwyas.
                };
                return tx;
            },
        },

        constants: {
            ITEM_STORE_NAME: ITEM_STORE_NAME,
            CHANGE_STORE_NAME: CHANGE_STORE_NAME
        }
    };

    privates.loadCatalog();

    // if we don't listen storage event, clean() may hit dangling db.
    //  There's no portable API like IDBFactory#getDatabaseNames(), we should avoid.

    window.addEventListener('storage', function(event) {
        if (event.storageArea === window.localStorage) {
            var value = event.newValue;
            logger.debug('DB catalog change', event);
            privates.catalog = value ? JSON.parse(value) : {};
        }
    });

    return publics;
});