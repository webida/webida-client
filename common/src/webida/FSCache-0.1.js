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

define(['webida-lib/server-api',
        'webida-lib/util/arrays/SortedArray',
        'webida-lib/util/path',
        'external/lodash/lodash.min',
        'external/URIjs/src/URI',
        'dojo/_base/declare',
        'dojo/topic'],
function (webida, SortedArray, pathUtil, _, URI, declare, topic) {
    'use strict';

    //---------------------------
    // utility functions
    //---------------------------

    var doNothing = function () {};

    function isValidAbsPath(path) {
        return (path.indexOf('/') === 0) && (path.indexOf('//') < 0);
    }


    function isError(obj) {
        return typeof obj === 'string';
    }


    //---------------------------
    // constants
    //---------------------------

    var EMPTY_PATH = '';

    var TYPE_FILE       = 'file';
    var TYPE_DIRECTORY  = 'dir';
    var TYPE_UNKNOWN    = 'unknown';

    // due to cyclc dependencies among FSNode/File/Directory class
    /*jshint latedef: false */
    function FSCache(fsURLArg, dirsToCacheArg) {

        //*******************************
        // class FSCacheInner
        //*******************************

        var fsCache;

        //--------------------------
        // private fields of FSCacheInner
        //--------------------------
        var fsURL;
        var fsURLParsed;
        var dirsToCache;
        var publishing;
        var mount;
        var root;


        //*******************************
        // inner class of FSCacheInner: FSNode
        //*******************************

        var FSNode = declare(null, {

            constructor : function (parent, name) {
                this.parent = parent;       // null iff this is the root node
                this.name = name;
                this.metadata = {};
                this.metadataInvalidated = {};
            },

            setMetadata: function (key, value, caseStr) {
                var origValue = this.metadata[key];
                this.metadata[key] = value;
                this.metadataInvalidated[key] = false;

                var path = this.getPath();
                switch (caseStr) {
                    case 'fetched':
                        onMetadataFetched(path, key);
                        break;
                    case 'written':
                        onMetadataSet(path, key, value !== origValue);
                        break;
                    case 'refreshed':
                        onMetadataRefreshed(path, key);
                        break;
                    default:
                        console.assert(false, 'Unreachable');
                }
            },

            refreshMetadata: function (key) {
                var self = this;
                Object.keys(this.metadata).forEach(function (k) {
                    if (key === undefined || key === k) {
                        var origVal = self.metadata[k];
                        var path = self.getPath();
                        mount.getMeta(path, k, function (err, newVal) {
                            if (err) {
                                console.error('Cannot get metadata ' + k + ' of ' + path +
                                    ' from server: ' + err);
                            } else {
                                if (origVal !== newVal) {
                                    this.setMetadata(k, newVal, 'refreshed');
                                }
                            }
                        });
                    }
                });
            },

            getParentPath : function () {
                return this.parent ? this.parent.getPath() : EMPTY_PATH;
            },

            getPath : function () {
                if (!this._path) {
                    // memoize
                    this._path = this.computePath();
                }
                return this._path;
            },

            computePath : function () {
                return this.getParentPath() + this.name;
            },

            getType : function () {
                return TYPE_UNKNOWN;
            },

            detach : function (movedTo) {
                if (this.parent) {
                    var detached = this.parent.removeSubnode(this.name, movedTo);
                    if (this !== detached) {
                        throw new Error('Detached node is wrong.');
                    }
                } else {
                    throw new Error('Cannot detach the root node');
                }
            },

            satisfyingCond : function (cond) {

                if (cond.types) {
                    if (cond.types.indexOf(this.getType()) < 0) {
                        return false;
                    }
                }

                return true;
            },

            collectNodes : function (arr, cond) {
                if (this.satisfyingCond(cond)) {
                    arr.push(this);
                }
            },

            getListInfo : function () {
                return {
                    name : this.name,
                    isDirectory : this instanceof Directory,
                    isFile : this instanceof File
                };
            },

            show : function (level) {   // for debugging
                var arr = [];
                for (var i = 0; i < level; i++) {
                    arr.push('| ');
                }

                arr.push(this.name);
                console.log(arr.join(''));
            },

            invalidateFileContents: function () {
                console.error('assertion fail: unreachable');
            },

            invalidateMetadata: function (key) {
                var keys = Object.keys(this.metadataInvalidated);
                var path = this.getPath();
                if (key === undefined) {
                    keys.forEach(function (k) {
                        if (this.metadata[k] !== undefined &&
                            !this.metadataInvalidated[k]) {
                            this.metadataInvalidated[k] = true;
                            onMetadataInvalidated(path, k);
                        }
                    });
                } else if (keys.indexOf(key) >= 0) {
                    if (this.metadata[key] !== undefined &&
                        !this.metadataInvalidated[key]) {
                        this.metadataInvalidated[key] = true;
                        onMetadataInvalidated(path, key);
                    }
                } else {
                    throw new Error('Metadata ' + key + ' is not set for "' +
                        this.getPath() +  '"');
                }
            }

        });

        //*******************************
        // inner class of FSCacheInner: File
        //*******************************

        var File = declare(FSNode, {
            constructor : function (/*parent, name*/) {
                this.contentInvalidated = false;
            },

            invalidateFileContents: function () {
                if (this.content !== undefined && !this.contentInvalidated) {
                    this.contentInvalidated = true;
                    onFileInvalidated(this.getPath());
                }
            },

            refreshFileContents : function () {

                // NOTE: refreshing contents is possible for invalidated contents too

                var origContent = this.content;
                if (origContent !== undefined) {
                    var path = this.getPath();
                    var self = this;
                    mount.readFile(path, function (err, newContent) {
                        if (err) {
                            console.log('Cannot get content of ' + path +
                                ' from server. cannot refresh the file content (' +
                                err + ')');
                        } else {
                            if (origContent !== newContent) {
                                self.setContent(newContent, 'refreshed');
                            }
                        }
                    });
                }
            },

            setContent : function (content, caseStr) {
                var origContent = this.content;
                this.content = content;
                this.contentInvalidated = false;

                var path = this.getPath();
                switch (caseStr) {
                    case 'fetched':
                        onFileFetched(path);
                        break;
                    case 'written':
                        onFileWritten(path, content === undefined || content !== origContent);
                        break;
                    case 'refreshed':
                        onFileRefreshed(path);
                        break;
                    default:
                        console.assert(false, 'Unreachable');
                }
            },

            getType : function () {
                return TYPE_FILE;
            },

            getSummary : function () {
                return this.name;
            }
        });

        //*******************************
        // inner class of FSCacheInner: Directory
        //*******************************

        var Directory = declare(FSNode, {
            constructor : function (/*parent, name*/) {
                this.dirs = new SortedArray('name');
                this.files = new SortedArray('name');
            },

            invalidateFileContents: function () {
                this.dirs.forEach(function (dir) {
                    dir.invalidateFileContents();
                });
                this.files.forEach(function (file) {
                    file.invalidateFileContents();
                });
            },

            invalidateMetadata: function (key) {
                FSNode.prototype.invalidateMetadata.call(this, key);
                this.dirs.forEach(function (dir) {
                    dir.invalidateMetadata(key);
                });
                this.files.forEach(function (file) {
                    file.invalidateMetadata(key);
                });
            },

            refreshFileContents : function (level) {
                if (typeof level !== 'number') {		// TODO: remove this check when stabilized
                    throw new Error('assertion fail: unrechable');
                }

                if (level) {
                    this.dirs.forEach(function (dir) {
                        dir.refreshFileContents(level - 1);
                    });
                    this.files.forEach(function (file) {
                        file.refreshFileContents();
                    });
                }
            },

            refreshMetadata: function (level, key) {
                if (typeof level !== 'number') {		// TODO: remove this check when stabilized
                    throw new Error('assertion fail: unrechable');
                }

                FSNode.prototype.refreshMetadata.call(this, key);
                if (level) {
                    this.dirs.forEach(function (dir) {
                        dir.refreshMetadata(level - 1, key);
                    });
                    this.files.forEach(function (file) {
                        file.refreshMetadata(key);
                    });
                }
            },

            computePath : function () {
                return this.getParentPath() + this.name + '/';
            },

            putByRelPath : function (relPath, caseStr) {
                console.assert(relPath,
                    'Directory.putByRelPath() was called with a falsy argument');

                var i = relPath.indexOf('/');
                if (i < 0) {
                    // base case
                    var file = this.putSubnode(relPath, false, caseStr);
                    return (file ? [file] : null);
                } else   {
                    console.assert(i > 0, 'i must be a positive integer');
                    var subdirName = relPath.substring(0, i);
                    var subdir = this.putSubnode(subdirName, true, caseStr);
                    var nextPath = relPath.substr(i + 1);
                    if (nextPath) {
                        if (subdir) {
                            // newly added
                            var addedArr = subdir.putByRelPath(nextPath, caseStr);
                            addedArr.unshift(subdir);
                            return addedArr;
                        } else {
                            // already there
                            subdir = this.getSubnode(subdirName);
                            return subdir.putByRelPath(nextPath, caseStr);
                        }
                    } else {
                        // base case
                        return (subdir ? [subdir] : null);
                    }
                }
            },

            // If a subnode exists with that name and type, then do nothing and return null.
            // Otherwise, create the subnode, add it, and return the added subnode.
            putSubnode : function (name, isDir, caseStr) {
                console.assert(name);
                console.assert(name.indexOf('/') === -1);

                var subnode = this.getSubnode(name);
                if (subnode && (subnode.isInstanceOf(Directory) === isDir)) {
                    return null;
                } else {
                    if (subnode) {
                        console.warn('A subnode with the same name "' + name +
                            '" but with different type was detected while putting a ' +
                            (isDir ? 'directory' : 'file') + ' to "' +
                            this.getPath() + '"');
                        return null;
                    } else {
                        var added = this.addSubnode(name, isDir, caseStr);
                        return added;
                    }
                }
            },

            addSubnode : function (name, isDir, caseStr) {
                if (this.getSubnode(name)) {  // TODO: remove this check if code is stabilized
                    console.error('Unreachable: Cannot overwrite existing subnode ' + name +
                        ' of ' + this.getPath() + ' by addSubnode()');
                    throw new Error('Unreachable: Cannot overwrite existing subnode ' + name +
                        ' of ' + this.getPath() + ' by addSubnode()');
                } else {
                    var C = isDir ? Directory : File;
                    var subnode = new C(this, name);
                    if (isDir) {
                        this.dirs.add(subnode);
                    } else {
                        this.files.add(subnode);
                    }

                    var maybeCreated;
                    switch (caseStr) {
                        case 'cache-root':
                        case 'inferred':
                        case 'fetched':
                        case 'restored':
                            maybeCreated = false;
                            break;
                        case 'copied':
                        case 'moved':
                        case 'dir-created':
                        case 'zip-created':
                        case 'zip-extracted':
                        case 'file-written':
                        case 'refreshed':
                            maybeCreated = true;
                            break;
                        default:
                            console.assert(false, 'Unreachable');
                    }

                    onNodeAdded(this.getPath(), name, subnode.getType(), maybeCreated, caseStr === 'moved');

                    return subnode;
                }
            },

            getByRelPath: function (relPath) {
                //console.log('hina temp: relPath = ' + relPath);
                console.assert(relPath,
                    'Directory.getByRelPath() was called ' +
                    'with falsy argument');

                var i = relPath.indexOf('/');
                if (i < 0) {
                    return this.getSubnode(relPath);
                } else {
                    console.assert(i > 0,
                        'Directory.getByRelPath() was called ' +
                        'with an absolute path: ' + relPath);
                    var nextPath;
                    var subnodeName = relPath.substring(0, i);
                    var subnode = this.getSubnode(subnodeName);
                    if (subnode) {
                        nextPath = relPath.substr(i + 1);
                        if (nextPath) {
                            if (subnode instanceof Directory) {
                                return subnode.getByRelPath(nextPath);
                            } else {
                                return null;
                            }
                        } else {
                            return subnode;
                        }
                    } else {
                        return subnode;
                    }
                }
            },

            getSubnode : function (name) {
                var queried = { name: name };
                var ret = this.dirs.query(queried) || this.files.query(queried);
                if (ret) {
                    return ret;
                } else {
                    return this.fetchedSubnodes ? null : undefined;
                }
            },

            removeSubnode : function (name, movedTo) {
                var ret = this.getSubnode(name);
                if (ret) {
                    var isDir = ret instanceof Directory;
                    var arr = isDir ? this.dirs : this.files;
                    var i = arr.indexOf(ret);
                    Array.prototype.splice.call(arr, i, 1);

                    onNodeDeleted(this.getPath(), name, ret.getType(), movedTo);
                }
                return ret;
            },

            getType : function () {
                return TYPE_DIRECTORY;
            },

            isEmpty : function () {
                return (this.dirs.length === 0) && (this.files.length === 0);
            },

            updateSubnodes : function (stats, isDir, caseStr) {
                var subnodes = isDir ? this.dirs : this.files;
                var names = subnodes.map(getName);
                var newNames = stats.map(getName);

                //console.log('hina temp: names = ' + names);
                //console.log('hina temp: newNames = ' + newNames);
                var toAdd = _.difference(newNames, names);
                var toDel = _.difference(names, newNames);
                //console.log('hina temp: toAdd = ' + toAdd);
                //console.log('hina temp: toDel = ' + toDel);
                var self = this;
                toDel.forEach(function (name) {
                    self.removeSubnode(name);
                });
                toAdd.forEach(function (name) {
                    self.addSubnode(name, isDir, caseStr);
                });
            },

            // refresh hierarchy level by level
            refreshHierarchy : function (level, doWhenAllDone) {
                //console.log('hina temp: entering refreshHierarchy dirPath = ' + this.getPath());

                // NOTE: getByAbsPath() must be invoked on the root.
                // Nodes (except for the root) can be detached at any time during an
                // asynchronous method call.

                if (level && this.fetchedSubnodes) {
                    var dirPath = this.getPath();
                    var self = this;
                    mount.list(dirPath, false, function (err, stats) {

                        var subnodeTypesDone = 0;
                        function oneTypeDone() {
                            subnodeTypesDone++;
                            //console.log('hina temp: oneTypeDone for ' + dirPath + ' ' +  subnodeTypesDone + ' time ');
                            if (subnodeTypesDone === 2) {  // two types (dirs and files)
                                //console.log('hina temp: ' + dirPath + ' is done');
                                doWhenAllDone();
                            }
                        }

                        if (err) {
                            console.warn('Error: FileSystem.list failed while refreshing "' +
                                dirPath + '" (' + err + ')');
                            doWhenAllDone();
                        } else {
                            var newDirs = stats.filter(isDir);
                            self.updateSubnodes(newDirs, true, 'refreshed');

                            var subdirsToRefresh = self.dirs.length;
                            var subdirsRefreshed = 0;
                            if (subdirsToRefresh) {
                                self.dirs.forEach(function (dir) {
                                    dir.refreshHierarchy(level - 1, function () {
                                        subdirsRefreshed++;
                                        if (subdirsRefreshed === subdirsToRefresh) {
                                            //console.log('hina temp: subdirs of ' + dirPath + ' are done');
                                            oneTypeDone();
                                        }
                                    });
                                });
                            } else {
                                oneTypeDone();
                            }

                            var newFiles = stats.filter(isFile);
                            self.updateSubnodes(newFiles, false, 'refreshed');
                            oneTypeDone();
                        }
                    });
                } else {
                    doWhenAllDone();
                }


            },

            collectNodes : function (arr, cond) {
                FSNode.prototype.collectNodes.call(this, arr, cond);    // super call
                this.dirs.forEach(function (dir) {
                    dir.collectNodes(arr, cond);
                });
                this.files.forEach(function (file) {
                    file.collectNodes(arr, cond);
                });
            },

            list : function () {
                if (this.fetchedSubnodes) {
                    var arr = [];

                    this.dirs.forEach(function (subnode) {
                        arr.push(subnode.getListInfo());
                    });

                    this.files.forEach(function (subnode) {
                        arr.push(subnode.getListInfo());
                    });

                    return arr;
                } else {
                    console.error('Unreachable: list should not be called on ' +
                        'a node which has never fetched subnodes: ' + this.getPath());
                    throw new Error('Unreachable: list should not be called on ' +
                        'a node which has never fetched subnodes: ' + this.getPath());
                }
            },

            show : function (level) {   // for debugging
                var arr = [];
                for (var i = 0; i < level; i++) {
                    arr.push('| ');
                }
                arr.push(this.name + '/');
                console.log(arr.join(''));

                this.dirs.forEach(function (subdir) {
                    subdir.show(level + 1);
                });

                this.files.forEach(function (subdir) {
                    subdir.show(level + 1);
                });
            },

            getSummary : function () {
                var subSummaries;
                if (this.listed || !withinCache(this.getPath())) {
                    subSummaries = [];
                    this.dirs.forEach(function (dir) {
                        var val = dir.getSummary();
                        console.assert(typeof val === 'object',
                            'Summary of a subdir must be an object');
                        subSummaries.push(val);
                    });
                    this.files.forEach(function (file) {
                        var val = file.getSummary();
                        console.assert(typeof val === 'string',
                            'Summary of a file must be a string');
                        subSummaries.push(val);
                    });
                } else {
                    subSummaries = null;
                }

                if (this.name) {
                    return { n: this.name, s: subSummaries };
                } else {
                    // only root can reach here
                    return subSummaries;
                }
            },

            restoreFromSummary : function (subSummaries) {
                if (subSummaries) {
                    console.assert(subSummaries instanceof Array,
                        'SubSummaries must be an array');

                    var self = this;
                    subSummaries.forEach(function (summary) {
                        var type = typeof summary;
                        if (type === 'object') {
                            var added = self.addSubnode(summary.n, true, 'restored');
                            added.restoreFromSummary(summary.s);
                        } else if (type === 'string') {
                            self.addSubnode(summary, false, 'restored');
                        } else {
                            console.assert(false,
                                'Summary must be an object or string');
                        }
                    });
                    this.fetchedSubnodes = true;
                }
            }
        });

        var FSCacheInner = declare(null, {

            constructor : function () {
                // dirsToCaches_ must be an array of valid absolute paths
                if (!dirsToCacheArg.every(function (dir) {
                    return isValidAbsPath(dir) && pathUtil.isDirPath(dir);
                })) {

                    throw new Error('The second argument must be an ' +
                                    'array of absolute directory paths');
                }

                // they must represent disjoin set of directories.
                var len = dirsToCacheArg.length;
                for (var i = 0; i < len - 1; i++) {
                    var di = dirsToCacheArg[i];
                    for (var j = i + 1; j < len; j++) {
                        if (di.indexOf(dirsToCacheArg[j]) === 0) {
                            throw new Error('Directories to cache are not disjoint');
                        }
                    }
                }

                // Now, it's ok to build an of object of FSCacheInner

                // set private fields
                fsURL = fsURLArg;
                fsURLParsed = parseWFSURL(fsURL);
                dirsToCache = dirsToCacheArg;
                publishing = false;
                mount = webida.fs.mountByFSID(fsURLParsed.fsid);

                root = new Directory(null, '');     // no parent, empty name
                root.getByAbsPath = function (absPath) {
                    //console.log('hina temp: absPath = ' + absPath);
                    if (absPath.indexOf('/') === 0) {
                        return absPath === '/' ? this : this.getByRelPath(absPath.substr(1));
                    } else {
                        console.error('Unreachable: cannot get "' + absPath + '" under "/"');
                        throw new Error('Unreachable: cannot get "' + absPath + '" under "/"');
                    }
                };
                root.putByAbsPath = function (absPath, caseStr) {
                    if (absPath.indexOf('/') === 0 && absPath.length > 1) {
                        return this.putByRelPath(absPath.substr(1), caseStr);
                    } else {
                        console.error('Unreachable: cannot put "' + absPath + '" under "/"');
                        throw new Error('Unreachable: cannot put "' + absPath + '" under "/"');
                    }
                };
                //root.show(0);
            },

            getSummary : function () {
                return root.getSummary();
            },

            start : function (summary) {
                if (summary) {
                    root.restoreFromSummary(summary);
                    root.fetchedSubnodes = false;	// TODO: generalize this.
                }

                // add nodes for cache roots
                dirsToCache.forEach(function (dir) {
                    root.putByAbsPath(dir, 'cache-root');
                });

                //console.log('Starting FS-Cache.');
                //root.show(0);
                publishing = true;

                subscribeToNotificationsOnFS(this);
            },

            invalidateFileContents: function (path) {
                if (isValidAbsPath(path) && withinCache(path)) {
                    var node = root.getByAbsPath(path);
                    if (!node) {
                        throw new Error('Not in the cache: ' + path);
                    }

                    node.invalidateFileContents();

                } else {
                    throw new Error('The path "' + path + '" is not a valid path being cached');
                }
            },

            invalidateMetadata: function (path, key) {
                if (isValidAbsPath(path) && withinCache(path)) {
                    var node = root.getByAbsPath(path);
                    if (!node) {
                        throw new Error('Not in the cache: ' + path);
                    }

                    node.invalidateMetadata(key);

                } else {
                    throw new Error('The path "' + path + '" is not a valid path being cached');
                }
            },

            refreshHierarchy: function (path, options, cb) {
                if (isValidAbsPath(path) && withinCache(path)) {
                    var node = root.getByAbsPath(path);
                    if (!node) {
                        throw new Error('Not in the cache: ' + path);
                    }

                    var level;
                    if (node.getType() === TYPE_FILE) {
                        node = node.parent;
                        level = 1;
                    } else {
                        if (options && 'level' in options) {
                            level = Math.floor(options.level);
                        } else {
                            throw new Error('Level must be given in the options argument');
                        }
                    }

                    cb = cb || doNothing;
                    node.refreshHierarchy(level, cb);

                } else {
                    throw new Error('The path "' + path + '" is not a valid path being cached');
                }
            },

            refreshFileContents: function (path, options) {
                if (isValidAbsPath(path) && withinCache(path)) {
                    var node = root.getByAbsPath(path);
                    if (!node) {
                        throw new Error('Not in the cache: ' + path);
                    }

                    if (node.getType() === TYPE_FILE) {	// only for files
                        node.refreshFileContents();
                    } else {
                        var level;
                        if (options && 'level' in options) {
                            level = Math.floor(options.level);
                        } else {
                            throw new Error('Level must be given in the \'options\' argument');
                        }
                        node.refreshFileContents(level);	//
                    }
                } else {
                    throw new Error('The path "' + path + '" is not a valid path being cached');
                }
            },

            refreshMetadata: function (path, key, options) {
                if (isValidAbsPath(path) && withinCache(path)) {
                    var node = root.getByAbsPath(path);
                    if (!node) {
                        throw new Error('Not in the cache: ' + path);
                    }

                    if (node.getType() === TYPE_FILE) {	// only for files
                        node.refreshMetadata(key);
                    } else {
                        var level;
                        if (options && 'level' in options) {
                            level = Math.floor(options.level);
                        } else {
                            throw new Error('Level must be given in the \'options\' argument');
                        }
                        node.refreshMetadata(level, key);	//
                    }
                } else {
                    throw new Error('The path "' + path + '" is not a valid path being cached');
                }
            },

            // convenience API: refresh all (hierarchy, file contents, and metadata)
            refresh : function (path, options, cbWhenHierarchyDone) {
                var opt = { level: 1 };
                if (options) {
                    _.extend(opt, options);
                }

                var self = this;
                this.refreshHierarchy(path, opt, function () {
                    if (cbWhenHierarchyDone) {
                        cbWhenHierarchyDone();
                    }

                    self.refreshFileContents(path, opt);
                    self.refreshMetadata(path, undefined/* every key */, opt);
                });
            },

            queryPaths : function (dirPath, condition) {
                if (isValidAbsPath(dirPath) && pathUtil.isDirPath(dirPath) && withinCache(dirPath)) {
                    var dirNode = root.getByAbsPath(dirPath);
                    if (!dirNode) {
                        return null;
                    }

                    var nodeArr = [];
                    dirNode.collectNodes(nodeArr, condition);
                    return nodeArr.map(function (node) {
                        return node.getPath();
                    });

                } else {
                    throw new Error('The path "' + dirPath +
                                    '" does not represent a directory being cached');
                }
            },

            //---------------------------
            // FS API wrapper - methods WITH update
            //---------------------------

            // copy
            copy : function (src, dst, recursive, cb) {

                var srcNode, dstNode;
                function checkValidCopy() {
                    var ret = checkTargetPath(src, true, true);
                    if (isError(ret)) {
                        return ret;
                    }
                    srcNode = ret;

                    ret = checkTargetPath(dst, null);
                    if (isError(ret)) {
                        return ret;
                    }
                    dstNode = ret;

                    if (src === dst) {
                        return 'Source and destination paths are identical: ' + src + '.';
                    }

                    if (dst.indexOf(src + '/') === 0) {
                        return 'Cannot copy a directory into its descendant';
                    }

                    if (srcNode instanceof Directory && !recursive) {
                        return 'Copying a directory with recursive option unset is disallowed.';
                    }

                    var divided = pathUtil.dividePath(dst);
                    if (root.getByAbsPath(divided[0]) === null) {
                        return 'Destination directory "' + divided[0] + '" does not exist.';
                    }

                    return null;
                }

                function callback(err) {

                    function handleCopySuccess(isDir) {
                        console.assert(srcNode === root.getByAbsPath(src),
                                       'A source node has been modified during a ' +
                                       'copy request to server: ' + src);
                        console.assert(dstNode === root.getByAbsPath(dst),
                                       'A destination node has been modified during a ' +
                                       'copy request to server: ' + dst);

                        var t = dst + (isDir ? '/' : '');
                        var addedNodes = root.putByAbsPath(t, 'copied');
                        if (!addedNodes) {  // because the target has been already present.
                            fsCache.refresh(t, { level: -1 });
                        }
                        cb(null);
                    }

                    if (err) {
                        /* TODO: continue 'serverless operations'
                        if (err === 'server unreachable' && srcNode && !dstNode) {
                        } else {
                            cb(err);
                            return;
                        }
                         */
                        cb(err);
                    } else {
                        if (srcNode) {
                            handleCopySuccess(srcNode instanceof Directory);
                        } else {
                            mount.isDirectory(dst, function (err, isDir) {
                                if (err) {
                                    cb(err);
                                } else {
                                    handleCopySuccess(isDir);
                                }
                            });
                        }
                    }
                }

                if (typeof recursive === 'function') {
                    cb = recursive;
                    recursive = false;   // false is default
                }

                src = pathUtil.detachSlash(src);
                var err = checkValidCopy();
                if (err) {
                    setTimeout(cb.bind(null, err), 0);
                } else {
                    mount.copy(src, dst, recursive, withinCache(dst) ? callback : cb);
                }
            },

            // move
            move : function (src, dst, cb) {

                var srcNode, dstNode;
                function checkValidMove() {
                    var ret = checkTargetPath(src, true, true);
                    if (isError(ret)) {
                        return ret;
                    }
                    srcNode = ret;

                    ret = checkTargetPath(dst, null);
                    if (isError(ret)) {
                        return ret;
                    }
                    dstNode = ret;

                    if (src === dst) {
                        return 'Source and destination paths are identical: ' + src + '.';
                    }

                    if (dst.indexOf(src + '/') === 0) {
                        return 'Cannot move a directory into its descendant';
                    }

                    var divided = pathUtil.dividePath(dst);
                    if (root.getByAbsPath(divided[0]) === null) {
                        return 'Destination directory "' + divided[0] + '" does not exist.';
                    }

                    return null;
                }

                function callback(err) {
                    function handleMoveSuccess(isDir) {
                        console.assert(srcNode === root.getByAbsPath(src),
                                       'A source node has been modified ' +
                                       'duirng a move request to server: ' +  src);
                        console.assert(dstNode === root.getByAbsPath(dst),
                                       'A destination node has been modified ' +
                                       'duirng a move request to server: ' +  dst);

                        if (withinCache(dst)) {
                            var t = dst + (isDir ? '/' : '');
                            var addedNodes = root.putByAbsPath(t, 'moved');
                            if (!addedNodes) {  // because the target has been already present.
                                fsCache.refresh(t, { level: -1 });
                            }
                        }
                        if (srcNode) {
                            srcNode.detach(withinCache(dst) ? dst : undefined);
                        }
                        cb(null);
                    }

                    if (err) {
                        cb(err);
                    } else {
                        if (srcNode) {
                            handleMoveSuccess(srcNode instanceof Directory);
                        } else {
                            mount.isDirectory(dst, function (err, isDir) {
                                if (err) {
                                    cb(err);
                                } else {
                                    handleMoveSuccess(isDir);
                                }
                            });
                        }
                    }
                }

                src = pathUtil.detachSlash(src);
                var err = checkValidMove();
                if (err) {
                    setTimeout(cb.bind(null, err), 0);
                } else {
                    mount.move(src, dst, (srcNode || withinCache(dst)) ? callback : cb);
                }
            },

            // createDirectory
            createDirectory : function (target, recursive, cb) {
                var targetNode;
                function checkValidCreateDirectory() {
                    var ret = checkTargetPath(target, false, true);
                    if (isError(ret)) {
                        return ret;
                    }
                    targetNode = ret;

                    if (!recursive) {
                        var parentPath = pathUtil.dividePath(target)[0];
                        var parentNode = root.getByAbsPath(parentPath);
                        if (parentNode === null) {
                            return 'Parent directory "' + parentPath +
                                '" does not exist and the recursive option is not set.';
                        }
                    }

                    return null;
                }

                function callback(err) {
                    console.assert(targetNode === root.getByAbsPath(target),
                                   'A target node has been modified during a ' +
                                   'createDirectory request to server: ' +  target);
                    if (err) {
                        cb(err);
                    } else {
                        root.putByAbsPath(target + '/', 'dir-created');
                        cb(null);
                    }
                }

                if (typeof recursive === 'function') {
                    cb = recursive;
                    recursive = false;   // false is default
                }

                target = pathUtil.detachSlash(target);
                var err = checkValidCreateDirectory();
                if (err) {
                    setTimeout(cb.bind(null, err), 0);
                } else {
                    mount.createDirectory(target, recursive, withinCache(target) ? callback : cb);
                }
            },

            createZip : function (sources, target, cb) {
                var targetNode;
                function checkValidCreateZip() {
                    if (sources.some(function (path) { return !isValidAbsPath(path); })) {
                        return 'List of sources contains a path which is not a valid absolute path.';
                    }

                    var ret = checkTargetPath(target, false);
                    if (isError(ret)) {
                        return ret;
                    }
                    targetNode = ret;

                    return null;
                }

                function callback(err) {
                    console.assert(targetNode === root.getByAbsPath(target),
                                   'A target node has been modified during a ' +
                                   'createZip request to server: ' +  target);
                    if (err) {
                        cb(err);
                    } else {
                        root.putByAbsPath(target, 'zip-created');
                        cb(null);
                    }
                }

                var err = checkValidCreateZip();
                if (err) {
                    setTimeout(cb.bind(null, err), 0);
                } else {
                    mount.createZip(sources, target, withinCache(target) ? callback : cb);
                }
            },

            // delete
            'delete' : function (target, recursive, cb) {
                var targetNode;
                function callback(err) {
                    console.assert(targetNode === root.getByAbsPath(target),
                                   'A target node has been modified duirng a ' +
                                   'delete request to server: ' +  target);
                    if (err) {
                        cb(err);
                    } else {
                        if (targetNode) {
                            targetNode.detach();
                        }
                        cb(null);
                    }
                }

                if (typeof recursive === 'function') {
                    cb = recursive;
                    recursive = false;   // false is default
                }

                var ret = checkTargetPath(target, true, true);
                if (isError(ret)) {
                    setTimeout(cb.bind(null, ret), 0);
                } else {
                    targetNode = ret;
                    mount.delete(target, recursive, withinCache(target) ? callback : cb);
                }
            },

            extractZip : function (source, target, cb) {
                var sourceNode, targetNode;
                function checkValidExtractZip() {
                    var ret = checkTargetPath(source, true);
                    if (isError(ret)) {
                        return ret;
                    }
                    sourceNode = ret;

                    ret = checkTargetPath(target, false, true);
                    if (isError(ret)) {
                        return ret;
                    }
                    targetNode = ret;

                    return null;
                }

                function callback(err) {
                    console.assert(sourceNode === root.getByAbsPath(source),
                                   'A source node has been modified duirng a ' +
                                   'extractZip request to server: ' +  source);
                    console.assert(targetNode === root.getByAbsPath(target),
                                   'A target node has been modified duirng a ' +
                                   'extractZip request to server: ' +  target);
                    if (err) {
                        cb(err);
                    } else {
                        root.putByAbsPath(target + '/', 'zip-extracted');
                        cb(null);
                    }
                }

                target = pathUtil.detachSlash(target);
                var err = checkValidExtractZip();
                if (err) {
                    setTimeout(cb.bind(null, err), 0);
                } else {
                    mount.extractZip(source, target, withinCache(target) ? callback : cb);
                }
            },

			_writeFile: function (target, data, cb) {
				var file;
                function checkValidWriteFile() {
                    var ret = checkTargetPath(target, undefined);
                    if (isError(ret)) {
                        return ret;
                    }
                    file = ret;

                    if (file && !(file instanceof File)) {
                        return 'The path "' + target + '" is not a path of a file';
                    }

                    return null;
                }

                function callback(err) {
                    console.assert(file === root.getByAbsPath(target),
                                   'A target node has been modified duirng a ' +
                                   'writeFile request to server: ' +  target);
                    if (err) {
                        cb(err);
                    } else {
                        if (!file) {
                            var added = root.putByAbsPath(target, 'file-written');
                            file = added[added.length - 1];
                        }
                        if (typeof data === 'string') {
                            file.setContent(data, 'written');
                        } else {
                            file.setContent(undefined, 'written');
                        }
                        cb(null);
                    }
                }

                var err = checkValidWriteFile();
                if (err) {
                    setTimeout(cb.bind(null, err), 0);
                } else {
                    mount.writeFile(target, data, withinCache(target) ? callback : cb);
                }
			},

            // writeFile
            writeFile : function (target, data, cb) {
                //console.log('writeFile('+target+', data, cb)');
                var that = this;
                var path, dir;
                path = target.split(/[\\/]/);
                path.pop();
                dir = path.join('/');
                this.isDirectory(dir, function (error, isDir) {
                    if (isDir === true) {
                        that._writeFile(target, data, cb);
                    } else {
                        //console.log('If dir not exists, create dir then write file');
                        that.createDirectory(dir, true, function (err) {
                            if (err) {
                                cb(err);
                            } else {
                                that._writeFile(target, data, cb);
                            }
                        });
                    }
                });
            },

            // setMeta
            setMeta : function (target, key, val, cb) {
                var targetNode;
                function checkValidSetMeta() {
                    var ret = checkTargetPath(target, true, true);
                    if (isError(ret)) {
                        return ret;
                    }
                    targetNode = ret;

                    if (!key || typeof key !== 'string') {
                        return 'Key must be a non-empty string';
                    }

                    if (typeof val !== 'string') {
                        return 'Value must be a string';
                    }

                    return null;
                }

                function callback(err) {
                    console.assert(targetNode === root.getByAbsPath(target),
                                   'Target node has been modified during a request of ' +
                                   'setMeta to server:' + target);
                    if (err) {
                        cb(err);
                    } else {
                        if (targetNode) {
                            targetNode.setMetadata(key, val, 'written');
                            cb(null);
                        } else {
                            mount.isDirectory(target, function (err, isDir) {
                                if (err) {
                                    console.error('Error in isDirectory call while setting metadata: ' + err);
                                } else {
                                    var added = root.putByAbsPath(
                                        (isDir ? pathUtil.attachSlash : pathUtil.detachSlash)(target), 'inferred');
                                    targetNode = added[added.length - 1];
                                    targetNode.setMetadata(key, val, 'written');
                                }
                                cb(null);
                            });
                        }
                    }
                }

                var err = checkValidSetMeta();
                if (err) {
                    setTimeout(cb.bind(null, err), 0);
                } else {
                    mount.setMeta(target, key, val, callback);
                }
            },

            lockFile: function (path, cb) {
                if (isValidAbsPath(path)) {
                    mount.lockFile.apply(mount, arguments);
                } else {
                    setTimeout(cb.bind(null, 'The path "' + path + '" is not a valid absolute path'), 0);
                }
            },

            unlockFile: function (path, cb) {
                if (isValidAbsPath(path)) {
                    mount.unlockFile.apply(mount, arguments);
                } else {
                    setTimeout(cb.bind(null, 'The path "' + path + '" is not a valid absolute path'), 0);
                }
            },

            //---------------------------
            // FS API wrapper - methods WITHOUT update
            //---------------------------

            getLockedFiles: function (path, cb) {
                if (isValidAbsPath(path)) {
                    mount.getLockedFiles.apply(mount, arguments);
                } else {
                    setTimeout(cb.bind(null, 'The path "' + path + '" is not a valid absolute path'), 0);
                }
            },

            addAlias: function (path, expireTime, cb) {
                if (isValidAbsPath(path)) {
                    mount.addAlias.apply(mount, arguments);
                } else {
                    setTimeout(cb.bind(null, 'The path "' + path + '" is not a valid absolute path'), 0);
                }
            },

            // deleteAlias
            deleteAlias : function () {
                mount.deleteAlias.apply(mount, arguments);
            },

            // exec
            exec : function (path, info, cb) {
                if (isValidAbsPath(path)) {
                    mount.exec.apply(mount, arguments);
                } else {
                    setTimeout(cb.bind(null, 'The path "' + path + '" is not a valid absolute path'), 0);
                }
            },

            // exportZip
            exportZip : function (sourceArr/*, fileName*/) {
                if (sourceArr.every(function (src) { return isValidAbsPath(src); })) {
                    mount.exportZip.apply(mount, arguments);
                }
            },

            // exists
            exists : function (target, cb) {
                var ret = checkTargetPath(target);
                if (isError(ret)) {
                    setTimeout(cb.bind(null, ret), 0);
                } else {
                    var targetNode = ret;
                    if (targetNode) {
                        setTimeout(cb.bind(null, null, true), 0);
                    } else if (targetNode === null) {
                        setTimeout(cb.bind(null, null, false), 0);
                    } else {
                        //console.log('hina temp: exists goes to server');
                        mount.exists(target, cb);
                    }
                }
            },

            getAliasInfo : function () {
                mount.getAliasInfo.apply(mount, arguments);
            },

            // getMeta
            getMeta : function (target, key, cb) {
                var targetNode;

                function checkValidGetMeta() {
                    var ret = checkTargetPath(target, true, true);
                    if (isError(ret)) {
                        return ret;
                    }
                    targetNode = ret;

                    return null;
                }

                function callback(err, val) {
                    console.assert(targetNode === root.getByAbsPath(target),
                                   'Target node has been modified during a ' +
                                   'getMeta request to server : ' + target);
                    if (err) {
                        cb(err);
                    } else {
                        if (targetNode) {
                            targetNode.setMetadata(key, val, 'fetched');
                            cb(null, val);
                        } else {
                            mount.isDirectory(target, function (err, isDir) {
                                if (err) {
                                    console.error('Error in isDirectory call while getting metadata: ' + err);
                                } else {
                                    var added = root.putByAbsPath(
                                        (isDir ? pathUtil.attachSlash : pathUtil.detachSlash)(target), 'inferred');
                                    targetNode = added[added.length - 1];
                                    targetNode.setMetadata(key, val, 'fetched');
                                }
                                cb(null, val);
                            });

                        }
                    }
                }

                var ret = checkValidGetMeta(); //checkTargetPath(target, true, true);
                if (isError(ret)) {
                    setTimeout(cb.bind(null, ret), 0);
                } else {
                    var val;
                    if (targetNode === undefined ||
                        (val = targetNode.metadata[key]) === undefined ||
                        targetNode.metadataInvalidated[key]) {
                        mount.getMeta(target, key, callback);
                    } else {
                        setTimeout(cb.bind(null, null, val), 0);
                    }
                }
            },

            // isDirectory
            isDirectory : function (target, cb) {
                var targetNode;
                function callback(err, isDir) {
                    console.assert(targetNode === root.getByAbsPath(target),
                                   'Target node has been modified during a ' +
                                   'isDirectory request to server : ' + target);
                    if (err) {
                        cb(err);
                    } else {
                        if (withinCache(target)) {
                            console.assert(targetNode === undefined);
                            var added = root.putByAbsPath(target + (isDir ? '/' : ''), 'inferred');
                            targetNode = added && added[added.length - 1];
                            console.assert(targetNode);
                        }
                        cb(null, isDir);
                    }
                }

                target = pathUtil.detachSlash(target);
                var ret = checkTargetPath(target, true, true);
                if (isError(ret)) {
                    setTimeout(cb.bind(null, ret), 0);
                } else {
                    targetNode = ret;
                    if (targetNode === undefined) {
                        mount.isDirectory(target, callback);
                    } else {
                        console.assert(targetNode);
                        setTimeout(cb.bind(null, null, targetNode instanceof Directory), 0);
                    }

                }
            },

            // isEmpty
            isEmpty : function (target, cb) {
                var targetNode;
                function checkValidIsEmpty() {
                    var ret = checkTargetPath(target, true, true);
                    if (isError(ret)) {
                        return ret;
                    }
                    targetNode = ret;

                    if (targetNode && !(targetNode instanceof Directory)) {
                        return 'The path "' + target + '" does not represent a directory';
                    }

                    return null;
                }

                function callback(err, isEmpty) {
                    console.assert(targetNode === root.getByAbsPath(target),
                                   'Target node has been modified during a ' +
                                   'isEmpty request to server : ' + target);
                    if (err) {
                        cb(err);
                    } else {
                        if (withinCache(target)) {
                            console.assert(targetNode === undefined);
                            var added = root.putByAbsPath(target + '/', 'inferred');
                            targetNode = added && added[added.length - 1];
                            console.assert(targetNode);
                        }
                        cb(null, isEmpty);
                    }
                }

                target = pathUtil.detachSlash(target);
                var err = checkValidIsEmpty();
                if (err) {
                    setTimeout(cb.bind(null, err), 0);
                } else {
                    if (targetNode === undefined) {
                        mount.isEmpty(target, callback);
                    } else {
                        console.assert(targetNode);
                        var isEmptyLocal = targetNode.isEmpty();
                        if (!isEmptyLocal || targetNode.fetchedSubnodes) {
                            setTimeout(cb.bind(null, null, isEmptyLocal), 0);
                        } else {
                            mount.isEmpty(target, cb);
                        }
                    }

                }
            },

            // isFile
            isFile : function (target, cb) {
                var targetNode;
                function callback(err, isFile) {
                    console.assert(targetNode === root.getByAbsPath(target),
                                   'Target node has been modified during a ' +
                                   'isFile request to server : ' + target);
                    if (err) {
                        cb(err);
                    } else {
                        if (withinCache(target)) {
                            console.assert(targetNode === undefined);
                            var added = root.putByAbsPath(target + (isFile ? '' : '/'), 'inferred');
                            targetNode = added && added[added.length - 1];
                            console.assert(targetNode);
                        }
                        cb(null, isFile);
                    }
                }

                var ret = checkTargetPath(target, true);
                if (isError(ret)) {
                    setTimeout(cb.bind(null, ret), 0);
                } else {
                    targetNode = ret;
                    if (targetNode === undefined) {
                        mount.isFile(target, callback);
                    } else {
                        console.assert(targetNode);
                        setTimeout(cb.bind(null, null, targetNode instanceof File), 0);
                    }

                }
            },

            // list
            /*
            list : function (target, recursive, cb) {
                if (typeof recursive === 'function') {
                    cb = recursive;
                    recursive = false;
                }

                this.listEx(target, { recursive: recursive }, cb);
            },
             */

            list : function (target, recursive, cb) {
                var node;
                function checkValidList() {
                    var ret = checkTargetPath(target, true, true);
                    if (isError(ret)) {
                        return ret;
                    }
                    node = ret;

                    if (node && !(node instanceof Directory)) {
                        return 'The path "' + target + '" does not represent a directory.';
                    }

                    return null;
                }

                function callback0(err, subnodes) {
                    console.assert(node === root.getByAbsPath(target),
                                   'Target node has been modified during a ' +
                                   'list request to server : ' + target);
                    if (err) {
                        cb(err);
                    } else {
                        node.updateSubnodes(subnodes.filter(isDir), true, 'fetched');
                        node.updateSubnodes(subnodes.filter(isFile), false, 'fetched');
                        node.fetchedSubnodes = true;
                        cb(null, subnodes);
                        node.listed = true;
                    }
                }

                function callback1(err, subnodes) {
                    console.assert(node === root.getByAbsPath(target),
                                   'Target node has been modified during a ' +
                                   'list request to server : ' + target);
                    if (err) {
                        cb(err);
                    } else {
                        var added = root.putByAbsPath(target, 'inferred');
                        node = added && added[added.length - 1];
                        node.updateSubnodes(subnodes.filter(isDir), true, 'fetched');
                        node.updateSubnodes(subnodes.filter(isFile), false, 'fetched');
                        node.fetchedSubnodes = true;
                        cb(null, subnodes);
                        node.listed = true;
                    }
                }

                if (typeof recursive === 'function') {
                    cb = recursive;
                    recursive = false;
                }

                target = pathUtil.attachSlash(target);
                var err = checkValidList();
                if (err) {
                    setTimeout(cb.bind(null, err), 0);
                } else {
                    if (withinCache(target)) {
                        if (node) {
                            if (node.fetchedSubnodes && !recursive) {
                                //console.log('hina temp: list from fs-cache: ' + target);
                                setTimeout(cb.bind(null, null, node.list()), 0);
                                node.listed = true;
                            } else {
                                //console.log('hina temp: list from server (case 0): ' + target);
                                mount.list(target, recursive, callback0);  // case 0
                            }
                        } else if (node === undefined) {
                            //console.log('hina temp: list from server (case 1): ' + target);
                            mount.list(target, recursive, callback1);  // case 1
                        } else {
                            console.assert(false, 'Unreachable');
                        }
                    } else {
                        //console.log('hina temp: list from server (case 2): ' + target);
                        mount.list(target, recursive, cb);
                    }
                }
            },


            // listEx
            listEx : function (target, options, cb) {
                var node;
                function checkValidListEx() {
                    var ret = checkTargetPath(target, true, true);
                    if (isError(ret)) {
                        return ret;
                    }
                    node = ret;

                    if (node && !(node instanceof Directory)) {
                        return 'The path "' + target + '" does not represent a directory.';
                    }

                    if (options.dirOnly && options.fileOnly) {
                        return 'Cannot simultaneously be dirOnly and fileOnly';
                    }

                    return null;
                }

                function callback(err, subnodes) {
                    console.assert(node === root.getByAbsPath(target),
                                   'Target node has been modified during a ' +
                                   'list request to server : ' + target);
                    if (err) {
                        cb(err);
                    } else {
                        if (!node) {
                            var added = root.putByAbsPath(target, 'inferred');
                            node = added && added[added.length - 1];
                        }
                        node.updateSubnodes(subnodes.filter(isDir), true, 'fetched');
                        node.updateSubnodes(subnodes.filter(isFile), false, 'fetched');
                        node.fetchedSubnodes = true;

                        if (options.dirOnly) {
                            subnodes = subnodes.filter(isDir);
                        } else if (options.fileOnly) {
                            subnodes = subnodes.filter(isFile);
                        }
                        cb(null, subnodes);
                        node.listed = true;
                    }
                }

                if (typeof options === 'function') {
                    cb = options;
                    options = {};
                }

                target = pathUtil.attachSlash(target);
                var err = checkValidListEx();
                if (err) {
                    setTimeout(cb.bind(null, err), 0);
                } else {
                    if (withinCache(target)) {
                        if (node && node.fetchedSubnodes && !options.recursive) {
                            //console.log('hina temp: list from fs-cache: ' + target);
                            var subnodes = node.list();
                            if (options.dirOnly) {
                                subnodes = subnodes.filter(isDir);
                            } else if (options.fileOnly) {
                                subnodes = subnodes.filter(isFile);
                            }
                            setTimeout(cb.bind(null, null, subnodes), 0);
                            node.listed = true;
                        } else {
                            //console.log('hina temp: list from server (inside cache): ' + target);
                            // ignore dirOnly and fileOnly options.
                            mount.listEx(target, { recursive: options.recursive }, callback);  // case 0
                        }
                    } else {
                        //console.log('hina temp: list from server (outside cache): ' + target);
                        mount.listEx(target, options, cb);
                    }
                }
            },

            // readFile
            readFile : function (target, responseType, cb) {
                var targetNode;
                if (!cb) {
                    cb = responseType;
                    responseType = '';
                }
                function checkValidReadFile() {
                    var ret = checkTargetPath(target, true);
                    if (isError(ret)) {
                        return ret;
                    }
                    targetNode = ret;

                    if (targetNode && !(targetNode instanceof File)) {
                        return 'The path "' + target + '" does not represent a file';
                    }

                    return null;
                }

                function callback(err, content) {
                    var targetNodeAfter = root.getByAbsPath(target);
                    console.assert(targetNode === targetNodeAfter,
                                   'Target node has been modified during a ' +
                                   'readFile request to server : ' + target +
                                   ', before(' + targetNode +
                                   '), after(' + targetNodeAfter + ')');
                    if (err) {
                        cb(err);
                    } else {
                        if (targetNode === undefined) {
                            var added = root.putByAbsPath(target, 'inferred');
                            targetNode = (added && added[added.length - 1]) || targetNodeAfter;
                        }
                        console.assert(targetNode);

                        targetNode.setContent(content, 'fetched');
                        cb(null, content);
                    }
                }

                var err = checkValidReadFile();
                if (err) {
                    setTimeout(cb.bind(null, err), 0);
                } else {
                    // FIXME: cache and compare responseType too
                    if (withinCache(target)) {
                        var content;
                        if (targetNode === undefined ||
                            (content = targetNode.content) === undefined ||
                            targetNode.contentInvalidated) {
                            mount.readFile(target, responseType, callback);
                        } else {
                            console.assert(content !== null);
                            setTimeout(cb.bind(null, null, content), 0);
                        }
                    } else {
                        mount.readFile(target, responseType, cb);
                    }
                }
            },

            // searchFiles
            searchFiles : function (keyword, where, options, cb) {
                if (isValidAbsPath(where)) {
                    mount.searchFiles.apply(mount, arguments);
                } else {
                    setTimeout(cb.bind(null, 'The path "' + where + '" is not a valid absolute path'), 0);
                }
            },

            // replaceFiles
            replaceFiles : function (keyword, replace, where, options, cb) {
                if (_.every(where, function (path) { return isValidAbsPath(path); })) {
                    mount.replaceFiles.apply(mount, arguments);
                } else {
                    setTimeout(cb.bind(null, 'The list of where contains a string which ' +
                        'is not a valid absolute path.'), 0);
                }
            },

            // stat
            stat : function (pathList, cb) {
                if (pathList.every(function (path) { return isValidAbsPath(path); })) {
                    mount.stat.apply(mount, arguments);
                } else {
                    setTimeout(cb.bind(null, 'The list of paths contains a string which ' +
                                       'is not a valid absolute path.'), 0);
                }
            }
        });

        //---------------------------
        //---------------------------
        // private methods of FSCacheInner
        //---------------------------
        //---------------------------

        //---------------------------
        // utility functions
        //---------------------------

        function parseWFSURL(fsURL) {
            var uri = new URI(fsURL);
            var ret = {
                fsServer: uri.host(),
                fsid: uri.segment(0)
            };
            uri.segment(0, '');	// drop the fsid
            ret.path = uri.path(true);

            return ret;
        }
        function subscribeToNotificationsOnFS(fsCache) {
            function isIgnoredNotification(data, checkedURLs) {
                // ignore changed caused by myself
                var mySessionID = webida.auth.getSessionID();
                if (!data.sid) {
                    console.error('The session id of a notification is unknown');
                    return true;
                }

                if (mySessionID === data.sid) {
                    console.log('notification ignored: changes by the current app');
                    return true;
                }

                if (checkedURLs.every(function (url) { return !withinCache(data[url]); })) {
                    console.log('notification ignored: changes outside cache');
                    return true;
                }

                return false;
            }

            topic.subscribe('sys.fs.file.written', function (data) {
                if (isIgnoredNotification(data, ['url'])) {
                    return;
                }

                var urlParsed = parseWFSURL(data.url);
                var existing = root.getByAbsPath(urlParsed.path);
                if (!existing) {
                    // file created
                    if (existing === null) {
                        root.putByAbsPath(urlParsed.path, 'file-written');
                        topic.publish('#REQUEST.log',
                                      'Handled a notification [sys.fs.file.written] for "' +
                                      urlParsed.path + '" (as a file creation)');
                        topic.publish('#REQUEST.log', '');
                    }
                } else if (existing.getType() === TYPE_FILE) {
                    // file written
                    existing.invalidateFileContents();
                    topic.publish('#REQUEST.log',
                                  'Handled a notification [sys.fs.file.written] for "' +
                                  urlParsed.path + '" (as a file cache invalidation)');
                    topic.publish('#REQUEST.log', '');
                } else {
                    console.error('sys.fs.file.written arrived for a non-file "' +
                                 urlParsed.path + '"');
                }

            });
            topic.subscribe('sys.fs.file.deleted', function (data) {
                if (isIgnoredNotification(data, ['url'])) {
                    return;
                }

                var urlParsed = parseWFSURL(data.url);
                var existing = root.getByAbsPath(urlParsed.path);
                if (!existing) {
                    if (existing === null) {
                        console.error('sys.fs.file.deleted arrived for an absent file "' +
                                     urlParsed.path + '"');
                    }
                } else if (existing.getType() === TYPE_FILE) {
                    existing.detach();
                    topic.publish('#REQUEST.log',
                                  'Handled a notification [sys.fs.file.deleted] for "' +
                                  urlParsed.path + '"');
                    topic.publish('#REQUEST.log', '');
                } else {
                    console.error('sys.fs.file.deleted arrived for a non-file "' +
                                 urlParsed.path + '"');
                }

            });
            topic.subscribe('sys.fs.dir.created', function (data) {
                if (isIgnoredNotification(data, ['url'])) {
                    return;
                }

                var urlParsed = parseWFSURL(data.url);
                var existing = root.getByAbsPath(urlParsed.path);
                if (!existing) {
                    if (existing === null) {
                        root.putByAbsPath(pathUtil.attachSlash(urlParsed.path), 'dir-created');
                        topic.publish('#REQUEST.log',
                                      'Handled a notification [sys.fs.dir.created] for "' +
                                      urlParsed.path + '"');
                        topic.publish('#REQUEST.log', '');
                    }
                } else if (existing.getType() === TYPE_DIRECTORY) {
                    console.error('sys.fs.dir.created arrived for an existing directory "' +
                                 urlParsed.path + '"');
                } else {
                    console.error('sys.fs.dir.created arrived for a non-directory "' +
                                 urlParsed.path + '"');
                }
            });
            topic.subscribe('sys.fs.dir.deleted', function (data) {
                if (isIgnoredNotification(data, ['url'])) {
                    return;
                }

                var urlParsed = parseWFSURL(data.url);
                var existing = root.getByAbsPath(urlParsed.path);
                if (!existing) {
                    if (existing === null) {
                        console.error('sys.fs.dir.deleted arrived for an absent directory "' +
                                     urlParsed.path + '"');
                    }
                } else if (existing.getType() === TYPE_DIRECTORY) {
                    existing.detach();
                    topic.publish('#REQUEST.log',
                                  'Handled a notification [sys.fs.dir.deleted] for "' +
                                  urlParsed.path + '"');
                    topic.publish('#REQUEST.log', '');
                } else {
                    console.error('sys.fs.dir.deleted arrived for a non-directory "' +
                                 urlParsed.path + '"');
                }
            });
            topic.subscribe('sys.fs.node.intractableChanges', function (data) {
                if (isIgnoredNotification(data, ['url'])) {
                    return;
                }

                var urlParsed = parseWFSURL(data.url);
                var existing = root.getByAbsPath(urlParsed.path);
                if (!existing) {
                    if (existing === null) {
                        console.error('sys.fs.dir.intractableChanges arrived for an absent directory "' +
                                     urlParsed.path + '"');
                    }
                } else if (existing.getType() === TYPE_DIRECTORY) {
                    fsCache.refresh(urlParsed.path, { level: -1 }, function () {
                        topic.publish('#REQUEST.log',
                                      'Handled a notification [sys.fs.node.intractableChanges] for "' +
                                      urlParsed.path + '"');
                        topic.publish('#REQUEST.log', '');

                        onNodeChanges(urlParsed.path);
                    });
                } else {
                    console.error('sys.fs.dir.intractable-changes arrived for a non-directory "' +
                                 urlParsed.path + '"');
                }

            });
            topic.subscribe('sys.fs.node.moved', function (data) {
                if (isIgnoredNotification(data, ['srcURL', 'dstURL'])) {
                    return;
                }

                var dstURLParsed;
                if (withinCache(data.dstURL)) {
                    dstURLParsed = parseWFSURL(data.dstURL);
                    mount.isDirectory(dstURLParsed.path, function (err, isDir) {
                        if (err) {
                            console.log('Cannot figure out whether the destination "' + dstURLParsed.path +
                                        '" of a notification sys.fs.node.moved is a directory or not: ' + err);
                            console.log('The notification is ignored.');
                        } else {
                            var existing = root.getByAbsPath(dstURLParsed.path);
                            if (existing) {
                                if ((existing.getType() === TYPE_DIRECTORY) === isDir) {
                                    if (isDir) {
                                        console.error('sys.fs.node.moved arraived for an existing "' +
                                                      dstURLParsed.path + '" as its destination');
                                    } else {
                                        existing.invalidateFileContents();
                                        topic.publish('#REQUEST.log',
                                                      'Handled a notification [sys.fs.node.moved] ' +
                                                      'for its overwritten target file "' + dstURLParsed.path + '"');
                                        topic.publish('#REQUEST.log', '');
                                    }
                                } else {
                                    console.error('The type of the destination of a notification sys.fs.node.moved ' +
                                        'does not match that of the corresponding node in the fs-cache for "' +
                                        dstURLParsed.path + '"');
                                }
                            } else {
                                if (existing === null) {
                                    root.putByAbsPath((isDir ?
                                                        pathUtil.attachSlash :
                                                        pathUtil.detachSlash)(dstURLParsed.path),
                                                      'moved');
                                    topic.publish('#REQUEST.log',
                                                  'Handled a notification [sys.fs.node.moved] for its target "' +
                                                  dstURLParsed.path + '"');
                                    topic.publish('#REQUEST.log', '');
                                }
                            }
                        }
                    });
                }

                if (withinCache(data.srcURL)) {
                    var srcURLParsed = parseWFSURL(data.srcURL);
                    var existing = root.getByAbsPath(srcURLParsed.path);
                    if (!existing) {
                        if (existing === null) {
                            console.error('sys.fs.node.moved arrived for an absent "' +
                                          srcURLParsed.path + '" as its source');
                        }
                    } else {
                        existing.detach(withinCache(data.dstURL) ? dstURLParsed.path : undefined);
                        topic.publish('#REQUEST.log',
                                      'Handled a notification [sys.fs.node.moved] for its source "' +
                                      srcURLParsed.path + '"');
                        topic.publish('#REQUEST.log', '');
                    }
                }

                // TODO: need to publish fs.cache.node.moved?
                // But the topic does not support the case when the source is out of the current file system.
            });
            topic.subscribe('sys.fs.node.copied', function (data) {
                if (isIgnoredNotification(data, ['dstURL'])) {
                    return;
                }

                var existing;
                var dstURLParsed = parseWFSURL(data.dstURL);
                if (withinCache(dstURLParsed.path)) {
                    mount.isDirectory(dstURLParsed.path, function (err, isDir) {
                        if (err) {
                            console.log('Cannot figure out whether the destination "' + dstURLParsed.path +
                                        '" of a notification sys.fs.node.copied is a directory or not: ' + err);
                            console.log('The notification is ignored.');
                        } else {
                            existing = root.getByAbsPath(dstURLParsed.path);
                            if (existing) {
                                if ((existing.getType() === TYPE_DIRECTORY) === isDir) {
                                    if (isDir) {
                                        fsCache.refresh(dstURLParsed.path, { level: -1 });
                                        topic.publish('#REQUEST.log',
                                                      'Handled a notification [sys.fs.node.copied] ' +
                                                      'for its merged target directory "' + dstURLParsed.path + '"');
                                        topic.publish('#REQUEST.log', '');
                                    } else {
                                        existing.invalidateFileContents();
                                        topic.publish('#REQUEST.log',
                                                      'Handled a notification [sys.fs.node.copied] ' +
                                                      'for its overwritten target file "' + dstURLParsed.path + '"');
                                        topic.publish('#REQUEST.log', '');
                                    }
                                } else {
                                    console.error('The type of the destination of a notification sys.fs.node.copied ' +
                                        'does not match that of the corresponding node in the fs-cache for "' +
                                        dstURLParsed.path + '"');
                                }
                            } else {
                                if (existing === null) {
                                    root.putByAbsPath((isDir ?
                                                        pathUtil.attachSlash :
                                                        pathUtil.detachSlash)(dstURLParsed.path),
                                                      'copied');
                                    topic.publish('#REQUEST.log',
                                                  'Handled a notification [sys.fs.node.copied] ' +
                                                  'for its target "' + dstURLParsed.path + '"');
                                    topic.publish('#REQUEST.log', '');
                                }
                            }
                        }
                    });
                }

                // TODO: need to publish fs.cache.node.copied?
                // But the topic does not support the case when the source is out of the current file system.
            });
        }

        function withinCache(path) {
            if (path.indexOf('wfs://') === 0) {
                // path is given in Webida File System URL
                var pathParsed = parseWFSURL(path);
                if (fsURLParsed.fsServer !== pathParsed.fsServer ||
                    fsURLParsed.fsid !== pathParsed.fsid) {
                    return false;
                }
                path = pathParsed.path;
            }
            return dirsToCache.some(function (cached) { return path.indexOf(cached) === 0; });
        }
        function getName(obj) { return obj.name; }
        function isDir(stat) { return stat.isDirectory; }
        function isFile(stat) { return stat.isFile; }
        function checkTargetPath(path, exists, allowsDirPath) {
            if (!isValidAbsPath(path)) {
                return 'The path "' + path + '" is not a valid absolute path';
            }

            var node = root.getByAbsPath(path);
            if (typeof exists === 'boolean') {
                if ((exists && node === null) || (!exists && node)) {
                    return 'The path "' + path + '" must be ' + (exists ? 'present' : 'absent');
                }
            }

            if (!allowsDirPath && pathUtil.isDirPath(path)) {
                return 'The path "' + path + '" ends with a slash, which is disallowed';
            }

            return node;
        }

        //---------------------------
        //---------------------------
        // end of private methods of FSCacheInner
        //---------------------------
        //---------------------------



        //---------------------------
        // event handlers
        //---------------------------

        function onNodeAdded(targetDir, name, type, maybeCreated, moved) {
            if (publishing) {
                topic.publish('fs/cache/node/added', fsURL, targetDir, name, type, maybeCreated, moved);
            }
        }

        function onNodeDeleted(targetDir, name, type, movedTo) {
            if (publishing) {
                topic.publish('fs/cache/node/deleted', fsURL, targetDir, name, type, movedTo);
            }
        }

        function onNodeChanges(targetDir) {
            if (publishing) {
                topic.publish('fs/cache/node/changes', fsURL, targetDir);
            }
        }

        function onFileInvalidated(target) {
            if (publishing) {
                topic.publish('fs/cache/file/invalidated', fsURL, target);
            }
        }

        function onFileWritten(target, maybeModified) {
            if (publishing) {
                topic.publish('fs/cache/file/set', fsURL, target, 'written', maybeModified);
            }
        }

        function onFileFetched(target) {
            if (publishing) {
                topic.publish('fs/cache/file/set', fsURL, target, 'fetched', false);
            }
        }

        function onFileRefreshed(target) {
            if (publishing) {
                topic.publish('fs/cache/file/set', fsURL, target, 'refreshed', true);
            }
        }

        function onMetadataInvalidated(target, key) {
            if (publishing) {
                topic.publish('fs/cache/metadata/invalidated', fsURL, target, key);
            }
        }

        function onMetadataSet(target, key, maybeModified) {
            if (publishing) {
                topic.publish('fs/cache/metadata/set', fsURL, target, key, 'written', maybeModified);
            }
        }

        function onMetadataFetched(target, key) {
            if (publishing) {
                topic.publish('fs/cache/metadata/set', fsURL, target, key, 'fetched', false);
            }
        }

        function onMetadataRefreshed(target, key) {
            if (publishing) {
                topic.publish('fs/cache/metadata/set', fsURL, target, key, 'refreshed', true);
            }
        }

        // finally, the object
        fsCache = new FSCacheInner();
        return fsCache;         // NOTE: 'this' is ignored for the constructor FSCache.
    }

    //---------------------------
    // events that this module publishes
    //---------------------------

    FSCache.NODE_TYPE_DIRECTORY = TYPE_DIRECTORY;
    FSCache.NODE_TYPE_FILE = TYPE_FILE;

    return FSCache;
});
