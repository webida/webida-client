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
 * @file WfsEntry.js
 * @since 1.7.0
 * @author jh1977.kim@samsung.com
 */

define([
    '../common',
    '../cache-db-manager',
    '../workspace-service',
    './WfsDirForest',
    './WfsStats',
    './wfs-utils'
], function (
    common,
    cacheDbManager,
    workspaceService,
    WfsDirForest,
    WfsStats,
    wfsUtils
) {
    'use strict';

    // provides subset of legacy FileSystem object
    // some methods are not supported, completely
    // we should create better interface in next api 0.2 with cleaner spec and Promise
    
    var logger = common.logger;
    var wfsApi =  new common.api.WfsApi();
    var dbUtils = cacheDbManager.utils;
    var CACHE_TTL = 86400*1000;

    function WfsOfflineCache(wfsId, session) {
        this.wfsId = wfsId;
        this.session = session;
        this.db = null;

        this.dirForest = null;     // become truthy after init
        this._initPromise = null;  // become truthy when init() is not complete yet.
        this._shouldEmitWfsEvents = false;  // writeToCache sends events

        session.on('wfs', this._onWatcherEvent.bind(this));
            // do we have to listen all wfs events?
            // if an 'off-line cache dir' is removed then
            //  we should delete all cached info for the directory.
        workspaceService.on('available',  this._onWorkspaceAvailable.bind(this));
        workspaceService.on('unavailable', this.this._onWorkspaceUnavailable.bind(this));
    }

    WfsOfflineCache.prototype = {

        _onWatcherEvent: function onWatcherEvent(wfsId, type, path, stats) {
            if (wfsId !== this.wfsId) {
                return;
            }
            logger.debug('wfs event got', type, path, stats);
            // is this one to be fetched?
        },

        // this method assumes workspace id is same to wfs id.
        // if not, should check with ws.hasWfs() or something similar
        _onWorkspaceAvailable: function _onWorkspaceAvailable() {
            var ws = workspaceService.getWorkspace();
            if (ws.id !== this.wfsId) {
                return;
            }
            // if this cache is not initialized nor initializing,
            if (this.dirForest) {
                this._uploadLocalChanges();
            } else {
                if (!this._initPromise) {
                    this.init().then( function() {
                        logger.debug('initialized by workspace service event');
                    });
                }
            }
            this._shouldEmitWfsEvents = false;
        },

        _onWorkspaceUnavailable: function _onWorkspaceUnavailable() {
            var ws = workspaceService.getWorkspace();
            if (ws.id !== this.wfsId) {
                return;
            }
            this._shouldEmitWfsEvents = true;
        },

        init: function init() {
            var myself = this;
            if (!workspaceService.isAvailable()) {
                return Promise.reject(new Error ('workspace is not available yet'));
            }
            var initPromise = cacheDbManager.openDB(this.wfsId)
                .then( function(db) {
                    this.db = db;
                    return myself._buildForest();
                })
                .then( function() {
                    myself._initPromise = null;
                    this._prefetch();
                    this._uploadLocalChanges();
                    // resolves nothing
                });
            this._initPromise = initPromise;
            return initPromise;
        },

        isAvailable : function isAvailable() {
            return (this.db && this.dirForest);
        },

        // returns a promise that resolves data
        readFromCache: function readFromCache(wfsPath) {
            var myself = this;
            return new Promise(function (resolve, reject) {
                var tx = dbUtils.begin(myself.db, 'getItem');
                var itemStore = tx.objectStore('items');
                var req = itemStore.get(wfsPath);
                dbUtils.swear(req, 'items', 'getSingleItem', resolve, reject);
                // we don't have to care about tx events for now.
            });
        },

        cleanOldItems: function cleanOldItems() {
            var myself = this;
            return new Promise(function (resolve, reject) {
                var tx = dbUtils.begin(myself.db, 'getItem');
                var itemStore = tx.objectStore('items');
                var index = itemStore.index('timestamp');
                var timestampUpperBound = new Date().getTime() - CACHE_TTL;
                var keyRange = window.IDBKeyRange.upperBound(timestampUpperBound, true);
                var req = index.openCursor(keyRange);
                req.onsuccess = function(event) {
                    var cursor = event.target.result;
                    if (cursor) {
                        logger.debug('clean old item', cursor.value.wfsPath);
                        cursor.delete();
                        cursor.continue();
                    }
                };
                dbUtils.swear(tx, 'items', 'cleanOldItems', resolve, reject);
            });
        },

        // returns a promise that resolves nothing
        writeToCache: function writeToCache(wfsPath, data) {
            var myself = this;
            return new Promise(function (resolve, reject) {
                var tx = dbUtils.begin(myself.db, 'writeChange', resolve, reject);
                var itemStore = tx.objectStore('items');
                var changeStore = tx.objectStore('changes');
                var now = new Date();
                this.readFromCache(wfsPath).then( function(item) {
                    if (item) {
                        item.stats.mtime = now;
                        item.stats.size = data.size || data.length;
                    } else {
                        item.stats = WfsStats.createFakeStats(now.getTime(), data);
                    }
                    item.data = data;
                    item.timestamp = now.getTime();
                    itemStore.put(item);
                    changeStore.put({
                        wfsPath: wfsPath,
                        data:data,
                        timestamp: now.getTime()
                    });
                    if (myself._shouldEmitWfsEvents) {
                        myself.session.emit('wfs', '_change', this.wfsId, item.stats);
                    }
                }).catch( function(err) {
                    logger.error('writeToCacache failed while reading existing cache item', err);
                    reject(err);
                });
            });
        },

        _buildForest: function _buildForest() {
            var workspace = workspaceService.getWorkspace();
            var offlineCachePaths = workspace.offlineCachePaths;
            var forest = new WfsDirForest(offlineCachePaths);
            return forest.build().then( function() {
                this.dirForest = forest;
            });
        },

        _updateItem: function(wfsPath, entry) {
            var myself = this;
            return new Promise( function(resolve, reject) {
                wfsApi.readFile(this.wfsId, this.wfsPath, function(err, apiResult) {
                    if(err) {
                        logger.error('update cache item failed', err);
                        return reject(err);
                    }
                    var tx = dbUtils.begin(myself.db, 'getItem');
                    var itemStore = tx.objectStore('items');
                    var req = itemStore.put(wfsPath, {
                        wfsPath : wfsPath,
                        timestamp : new Date().getTime(),
                        data:apiResult,
                        stats: entry.stats
                    });
                    dbUtils.swear(req, 'items', 'updateItem', resolve, reject);
                });
            });
            // wfsApi should fix read file as blob
        },

        _prefetch: function _prefetch() {
            var dirs = this.dirForest.dirs;
            var myself = this;
            Object.keys(dirs).forEach( function(dir) {
                var tree = myself.dirForest.getTree(dir);
                var files = tree.walk({}, null, function (entry) {
                    return entry.isFile;
                });
                myself._prefetchFiles(files);
            });
        },

        _prefetchFiles: function _prefetchFiles(files) {
            var myself = this;
            var promises = [];
            Object.keys(files).forEach( function(filePath) {
                var fileEntry = files[filePath];
                var wfsFilePath = wfsUtils.normalizePath(filePath);
                // 1) check we have one or not
                // 2) if we have one, then compare mtime
                // 3) if fileEntry.stats.mtime is newer than cache, call updateItem.
                var promise = myself.readFromCache(wfsFilePath)
                    .then( function(item) {
                        if(!item || item.stats.mtime < fileEntry.stats.mtime.getTime()) {
                            return myself._updateItem(wfsFilePath, fileEntry);
                        } else {
                            logger.debug('skip prefetching fresh one ' + wfsFilePath);
                        }
                    })
                    .catch( function (err) {
                        logger.error(wfsFilePath + ' prefetching failed', err);
                        // catch should not rethrow err, to make promise resolved, always.
                        return Promise.resolve();
                    });
                promises.push(promise);
            });
            return Promise.all(promises);
        },

        _getChanges: function _getChanges() {
            var myself = this;
            var changes = [];
            return new Promise(function (resolve, reject) {
                var tx = dbUtils.begin(myself.db, 'getItem');
                var changeStore = tx.objectStore('changes');
                var index = changeStore.index('timestamp');
                var req = index.openCursor(null);
                req.onsuccess = function(event) {
                    var cursor = event.target.result;
                    if (!cursor) {  // cursor reached to end of index
                        resolve(changes);
                    } else {
                        changes.push(cursor.value);
                        cursor.continue();
                    }
                };
                req.onerror = function (event) {
                    reject(event.target.error);
                };
            });
        },

        _removeChanges: function _removeChanges(removables) {
            var myself = this;
            return new Promise( function(resolve, reject) {
                var tx = dbUtils.begin(myself.db, 'removeChanges', resolve, reject);
                var changeStore = tx.objectStore('changes');
                removables.forEach( function(rmPath) {
                    changeStore.delete(rmPath);
                });
            });
        },

        _uploadChangeIfNeeded: function _uploadChangeIfNeeded(change) {
            var myself = this;
            // this promise never rejects. if having error, resolves nothing, or, path to remove.
            // 1) get server stat
            // 2) if server's stat is older than change.timestamp, invoke writeFile()
            // 3) resolve path or nothing
            return new Promise( function (resolve) {
                wfsApi.stat(myself.wfsId, change.wfsPath, {
                    ignoreError:true
                }, function(err, apiResult) {
                    if (err) {
                        // this path should not removed
                        return resolve(null);
                    }
                    if (apiResult.type === 'FILE') {
                        // change.data should be blob!
                        wfsApi.writeFile(myself.wfsId, change.wfsPath, {
                            ensureParents : true
                        }, change.data, function(err) {
                            if(err) {
                                // hey, do we have to continue on error?
                                // should not reject here, to upload other changed files
                                logger.warn('uploading ' + change.wfsPath + 'failed', err);
                                resolve(null);
                            } else {
                                resolve(change.wfsPath);
                            }
                        });
                    } else {
                        resolve(change.wfsPath);
                    }
                });
            });
        },

        _uploadLocalChanges: function _uploadLocalChanges() {
            var myself = this;
            var removables = [];
            return this._getChanges()
                .then( function(changes) {
                    var promises = changes.map( function(change) {
                        return myself._uploadChangeIfNeeded(change);
                    });
                    return Promise.all(promises);
                })
                .then( function(removablePaths) {
                    removables = {};
                    removablePaths.forEach(function(rmPath) {
                        if (rmPath) {
                            removables[rmPath] = true;
                        }
                    });
                    return myself._removeChanges(Object.keys(removables));
                });
        }
    };

    return WfsOfflineCache;
});