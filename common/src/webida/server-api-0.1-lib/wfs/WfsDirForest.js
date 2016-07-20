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
 * @file WfsDirForest.js
 * @since 1.7.0
 * @author jh1977.kim@samsung.com
 */

define([
    '../common',
    './WfsDirTree',
    './WfsEntry',
    './wfs-utils'
], function(
    common,
    WfsDirTree,
    WfsEntry,
    wfsUtils
) {
    'use strict';

    var logger = common.logger;
    var wfsApi = new common.api.WfsApi();

    function WfsDirForest(wfsId, roots) {
        this.dirs = {};
        this.wfsId = wfsId;
        var myself = this;

        // TODO: reduce roots if one of them is a sub-tree of other tree.
        roots.forEach(function(dir) {
            myself.dirs[dir] = null;
        });
    }

    WfsDirForest.prototype = {
        build: function buildForest() {
            var myself = this;
            var promises = [];
            this.dirs.forEach(function(dir) {
                promises.push(myself.addTreeAsync(dir));
            });
            return Promise.all(promises);
        },

        getTree : function getTree(rootPath) {
            return this.dirs[rootPath];
        },

        addTreeAsync : function addTree(rootPath) {
            var myself = this;
            return new Promise( function(resolve, reject) {
                try {
                    if(!myself.dirs[rootPath]) {
                        var wfsPath = wfsUtils.normalizePath(rootPath);
                        wfsApi.dirTree(myself.wfsId, wfsPath, -1,
                            function (err, apiResult) {
                                if (err) {
                                    logger.error('adding tree ' + rootPath + ' failed ', err);
                                    reject(err);
                                } else {
                                    var rootEntry = WfsEntry.fromJson(apiResult);
                                    rootEntry.path = rootPath;
                                    myself.dirs[rootPath] = new WfsDirTree(rootEntry);
                                    resolve(myself.dirs[rootPath]);
                                }
                            }
                        );
                    } else {
                        resolve(this.dirs[rootPath]);
                    }
                } catch(e) {
                    logger.error('adding tree ' + rootPath + ' failed ', e);
                    reject(e);
                }
            });
        },

        removeTree : function removeTree(rootPath) {
            delete this.dirs[rootPath];
        },

        findTree : function findTree(wfsPath) {
            var found = null;
            var dirs = this.dirs;
            Object.keys(dirs).some( function(rootPath) {
                if (wfsPath.indexOf(rootPath) === 0) {
                    found = dirs[rootPath];
                    return true;
                }
            });
            return found;
        }
    };

    return WfsDirForest;
}); 
        
