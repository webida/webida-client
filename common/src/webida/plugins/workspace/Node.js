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
 * @fileoverview webida - workspace tree node
 *
 * @version: 0.1.0
 * @since: 2014.01.22
 *
 */

/* global timedLogger: true */
/* global File: true */

define(['require',
        'external/lodash/lodash.min',
        'dijit/registry',
        'webida-lib/app',
        'webida-lib/FSCache-0.1',
        'dojo/dom',
        'dojo/dom-attr',
        'dojo/dom-style',
        'dojo/dom-class',
        'dojo/dom-geometry',
        'dojo/on',
        'dojo/topic',
        'dojo/Deferred',
        'dojo/promise/all',
        'dojo/keys',
        'webida-lib/plugins/workbench/plugin',
        'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
        'webida-lib/util/path',
        'plugins/webida.notification/notification-message'
], function (require, _, registry, ide, FSCache, dom, domAttr, domStyle, domClass,
              domGeom, on, topic, Deferred, all, keys, workbench, ButtonedDialog,
              pathUtil, toastr) {
    'use strict';

    //var lastRenamedNodeId;
    //var movedNodes = [];
    var creationDialog;

    var tr;
    function tree() {
        if (!tr) {
            tr = registry.byId('wv-tree');
        }
        return tr;
    }

    var st;
    function store() {
        if (!st) {
            st = tree().model.store;
        }
        return st;
    }

    function pathToId(path) {
        return pathUtil.detachSlash(path);
    }

    var fsCache = ide.getFSCache();

    // TODO:
    function Node(path, isInternal) {

        var id = pathToId(path);
        var pair = pathUtil.dividePath(id); // divide into parentPath and name

        this.id = id;
        this.parent = pathToId(pair[0]);
        this.name = decodeURI(pair[1]).replace(/ /g, '&nbsp;');
        this.isInternal = isInternal;
    }

    Node.prototype.deleteRecursively = function () {
        var subnodes = this.getSubnodes();
        if (subnodes) {
            subnodes.forEach(function (subnode) {
                subnode.deleteRecursively();
            });
        }
        store().remove(this.id);
    };

    Node.prototype.getParentNode = function () {
        return store().get(this.parent);
    };

    Node.prototype.getLevel = function () {
        if (this.isRoot()) {
            return 0;
        } else {
            var parent = this.getParentNode();
            if (parent) {
                return parent.getLevel() + 1;
            } else {
                return -1;
            }
        }
    };

    Node.prototype.isDirectory = function () {
        return this.isInternal;
    };

    Node.prototype.addSubnode = function (newNode, maybeCreated) {
        store().put(newNode);
        topic.publish('workspace.node.added', newNode.getPath(), maybeCreated);
    };

    Node.prototype.getSubnodes = function () {
        var queryResult = store().query({ parent: this.id });
        return queryResult;
    };

    Node.prototype.getSubnode = function (path) {
        if (path === '') {
            return this;
        }

        var subnodes = store().query({ parent: this.id });
        var name, rest;
        var delimIndex = path.indexOf('/');
        if (delimIndex >= 0) {
            name = path.substring(0, delimIndex);
            rest = path.substr(delimIndex + 1);
        } else {
            name = path;
            rest = '';
        }

        var iEnd = subnodes.length;
        for (var i = 0; i < iEnd; i++) {
            if (subnodes[i].name === name.replace(/ /g, '&nbsp;')) {
                if (rest.length > 0) {
                    return subnodes[i].getSubnode(rest);
                } else {
                    return subnodes[i];
                }
            }
        }
        return null;
    };

    Node.prototype.getSubnodeUsingPath = function (path) {
        if (!path) {
            return null;
        }

        var id = this.id + (path.charAt(0) === '/' ? path : '/' + path);
        var subnodes = store().query({ id: id });
        if (!!subnodes) {
            return subnodes[0];
        }
        return null;
    };

    Node.prototype.isExpanded = function () {
        if (this.isInternal) {
            var nodes = tree().getNodesByItem(this);
            var node = nodes[0];
            return node && node.isExpanded;
        } else {
            return false;
        }
    };

    Node.prototype.expandItem = function () {
        var self = this;
        var nodes = tree().getNodesByItem(this);
        var promiseToExpand = tree()._expandNode(nodes[0]);
        var promiseToFetch = new Deferred();
        if (this.isFetched) {
            promiseToFetch.resolve(true);
        } else {
            this.promiseToFetch = promiseToFetch;
        }

        return all([promiseToExpand, promiseToFetch]).then(function (promises) {
            if (promises[0] !== true) {
                return 'unable to expand ' + self.getPath();
            } else if (promises[1] !== true) {
                return 'unable to fetch children of ' + self.getPath();
            } else {
                return true;
            }
        });
    };

    Node.prototype.collapseItem = function () {
        var nodes = tree().getNodesByItem(this);
        tree()._collapseNode(nodes[0]);
    };

    Node.prototype.refresh = function (blink) {
        function setToRefresh(node) {
            if (node.isInternal) {
                var subnodes = node.getSubnodes();
                subnodes.forEach(function (subnode) {
                    setToRefresh(subnode);
                });
                node.toRefresh = true; // toRefresh is used when a collapsed node is expanded
                //console.log('hina temp: set toRefresh for node ' + node.id);
            }
        }

        function refreshExpandedHierarchy(node, doWhenAllDone) {
            if (node.isInternal && node.isExpanded()) {
                fsCache.refreshHierarchy(node.getPath(), { level: 1 }, function () {
                    node.toRefresh = false;
                    var subnodes = node.getSubnodes();
                    var todo = subnodes && subnodes.length, done = 0;
                    if (todo) {
                        subnodes.forEach(function (subnode) {
                            refreshExpandedHierarchy(subnode, function () {
                                done++;
                                if (todo === done) {
                                    doWhenAllDone();
                                }
                            });
                        });
                    } else {
                        doWhenAllDone();
                    }
                });
            } else {
                doWhenAllDone();
            }
        }

        if (blink && this.isExpanded()) {
            this.collapseItem();
            this.expandItem();
        }

        var path = this.getPath();
        var t = timedLogger.log('wv: refreshing the hierarchy of expanded nodes under ' + path);
        setToRefresh(this);
        refreshExpandedHierarchy(this, function () {
            timedLogger.log('wv: refreshed the hierarchy of expanded nodes under ' + path, t);
            fsCache.invalidateFileContents(path);
            fsCache.invalidateMetadata(path);
        });

    };

    Node.prototype.isAncestorOf = function (other) {
        function isAncestorOf(n1, n2) {
            var n2Parent = n2.getParentNode();
            return n2Parent && (n1 === n2Parent || isAncestorOf(n1, n2Parent));
        }

        if (this !== other && this.isInTree() && other.isInTree()) {
            return isAncestorOf(this, other);
        } else {
            return false;
        }
    };

    Node.prototype.isRoot = function () {
        return this.parent === '';
    };

    Node.prototype.isInTree = function () {
        return !!store().get(this.id);
    };

    Node.prototype.hasSubnode = function (path) {
        // if path param is null, then hasSunode method check Node's subnode exist
        if (!path) {
            return (this.getSubnodes().length > 0 ? true : false);
        }
        return !!this.getSubnode(path);
    };

    Node.prototype.getPath = function () {
        var path = this.id;
        if (this.isInternal) {
            path = path + '/';
        }
        return path;
    };

    function getConflictFreeName(node, relPath, origName) {

        if (!node.hasSubnode(relPath + origName)) {
            return origName;
        } else {
            var fileName, extName;
            var num = 1;
            var i;
            if ((i = origName.lastIndexOf('.')) > 0) {
                fileName = origName.substring(0, i);
                extName = '.' + origName.substring(i + 1);
            } else {
                fileName = origName;
                extName = '';
            }

            var ret;
            while (node.hasSubnode(relPath + (ret = fileName + ' (' + num + ')' + extName))) {
                num++;
            }

            return ret;
        }

    }

    Node.prototype.duplicate = function () {
        var parentNode = this.getParentNode();
        if (parentNode) {
            parentNode.paste(this, 'duplicate');
        } else {
            throw new Error('assertion fail: duplicate was called on the root node');
        }
    };

    function askPolicyToUser(targetPath, name, isFile, moving, cb) {
        var buttonSpec = [
            { caption: 'Skip', methodOnClick: 'skip' },
            { caption: 'Skip All', methodOnClick: 'skipAll' },
            { caption: isFile ? 'Overwrite' : 'Merge', methodOnClick: 'overwrite' },
            { caption: isFile ? 'Overwrite All' : 'Merge All', methodOnClick: 'overwriteAll' },
            { caption: 'Rename', methodOnClick: 'rename' },
            { caption: 'Rename All', methodOnClick: 'renameAll' },
            { caption: 'Abort', methodOnClick: 'abort' }
        ];
        var style = 'width: 700px';

        if (!isFile && moving) {
            buttonSpec.splice(2, 2);
            style = 'width: 500px';
        }

        var dialog = new ButtonedDialog({
            title: (isFile ? 'File' : 'Directory') + ' Names Conflict',
            buttons: buttonSpec,
            methodOnEnter: null,
            buttonsWidth: '80px',

            skip: function () { this.recordPolicy('skip', false); },
            skipAll: function () { this.recordPolicy('skip', true); },
            overwrite: function () { this.recordPolicy(isFile ? 'overwrite' : 'merge', false); },
            overwriteAll: function () { this.recordPolicy(isFile ? 'overwrite' : 'merge', true); },
            rename: function () { this.recordPolicy('rename', false); },
            renameAll: function () { this.recordPolicy('rename', true); },
            abort: function () { this.recordPolicy('abort', false); },

            recordPolicy: function (policy, forAll) {
                this._policy = policy;
                this._forAll = forAll;
                this.hide();
            },

            refocus: false,
            style: style,
            onHide: function () {
                dialog.destroyRecursive();
                workbench.focusLastWidget();
                cb(this._policy || 'abort', this._forAll);
            }
        });
        var markup = '<span>The target directory "' + targetPath + '" already has a ' +
            (isFile ? 'file' : 'subdirectory') + ' "' + name + '". </span>';
        dialog.setContentArea(markup);
        dialog.show();
    }

    Node.prototype.paste = function (srcNodes, action) {

        var policyForAllFiles, policyForAllDirs;
        var nodeToSelectSet = false;

        //var dirsSkipped, dirsMerged, dirsRenamed, dirsNoConflict;

        function printResult(completed, errMsg) {
            var cap;
            if (completed) {
                cap = action === 'copy' ? 'Copied' : 'Moved';
                toastr.success('', cap + ' successfully');
            } else {
                cap = action === 'copy' ? 'Copy' : 'Move';
                if (errMsg) {
                    toastr.error(errMsg, cap + ' was aborted by an error');
                } else {
                    toastr.info('', cap + ' was aborted');
                }
            }
        }

        function handleEntries(target, entries, nextJob) {

            var targetPath;
            function handleEntry(entry) {

                var entryPath, existing;
                function handleEntryWithConflictPolicy(policy) {

                    var finalName;
                    function handleFile() {
                        var fn = action === 'move' ? fsCache.move: fsCache.copy;
                        var newFile = targetPath + finalName;
                        fn(entry.path, newFile, function (err) {
                            if (err) {
                                printResult(false, err);
                            } else {
                                if (!nodeToSelectSet) {
                                    selectNewNode(newFile);
                                    nodeToSelectSet = true;
                                }
                                
                                switch (policy) {
                                case 'overwrite':
                                    selectAfterWork();
                                    /*falls through*/
                                case 'rename':
                                case 'none':
                                    break;
                                default:
                                    throw new Error('assertion fail: unreachable');
                                }
                                handleEntry(entries.shift());
                            }
                        });
                    }

                    function handleDirectory() {

                        if (policy === 'merge') {
                            console.assert(finalName === entry.name);
                            console.assert(existing);
                            console.assert(action !== 'move');

                            fsCache.list(entry.path, function (err, subentries) {
                                if (err) {
                                    printResult(false, err);
                                } else {
                                    if (!nodeToSelectSet) {
                                        var n = store().get(target.getPath() + finalName);
                                        selectNode(n);
                                        nodeToSelectSet = true;
                                    }
                                    if (subentries.length > 0) {
                                        subentries.forEach(function (e) {
                                            e.path = entry.path + e.name + (e.isDirectory ? '/' : '');
                                        });
                                        handleEntries(existing, subentries, function () {
                                            handleEntry(entries.shift());
                                        });
                                    } else {
                                        handleEntry(entries.shift());
                                    }
                                }
                            });
                        } else {
                            var newDir = target.getPath() + finalName;
                            switch (action) {
                                case 'copy':
                                    fsCache.copy(entry.path, newDir, true, function (err) {
                                        if (err) {
                                            printResult(false, err);
                                        } else {
                                            if (!nodeToSelectSet) {
                                                selectNewNode(newDir);
                                                nodeToSelectSet = true;
                                            }
                                            handleEntry(entries.shift());
                                        }
                                    });
                                    break;
                                case 'move':
                                    fsCache.move(entry.path, newDir, function (err) {
                                        if (err) {
                                            printResult(false, err);
                                        } else {
                                            if (!nodeToSelectSet) {
                                                selectNewNode(newDir);
                                                nodeToSelectSet = true;
                                            }
                                            handleEntry(entries.shift());
                                        }
                                    });
                                    break;
                                default:
                                    throw new Error('assertion fail: unreachable');
                            }
                        }

                    }

                    var anotherName;
                    switch (policy) {
                    case 'skip':
                        //console.log('skipping ' + entryPath);
                        handleEntry(entries.shift());
                        return;
                    case 'overwrite': // only for files
                        //console.log('overwriting ' + entryPath);
                        break;
                    case 'merge': // only for directories
                        //console.log('merging ' + entryPath);
                        break;
                    case 'rename':
                        anotherName = getConflictFreeName(target, '', entry.name);
                        //console.log('creating ' + targetPath + anotherName +
                        // (entry.isDirectory ? '/' : '') + '   (renamed)');
                        break;
                    case 'none':
                        //console.log('creating ' + entryPath);
                        break;
                    case 'abort':
                        //console.log('aborting');
                        printResult(false);
                        return;
                    default:
                        console.assert(false);
                        throw new Error('unreachable');
                    }

                    // Now, policy is overwrite, merge, rename, or none.

                    finalName = anotherName || entry.name;

                    if (entry.isFile) {
                        handleFile();
                    } else if (entry.isDirectory) {
                        handleDirectory();
                    } else {
                        throw new Error('assertion fail: unreachable');
                    }

                }

                if (!entry) {
                    nextJob();
                } else {
                    if (entry.isDirectory || entry.isFile) {
                        entryPath = targetPath + entry.name + (entry.isDirectory ? '/' : '');
                        existing = target.getSubnode(entry.name);
                        if (existing) {
                            var entryType = entry.isDirectory ? 'directory' : 'file';
                            var existingType = existing.isInternal ? 'directory' : 'file';
                            if (entryType === existingType) {
                                var policy = (entry.isFile ? policyForAllFiles : policyForAllDirs);
                                if (policy) {
                                    handleEntryWithConflictPolicy(policy, true);
                                } else {
                                    askPolicyToUser(target.getPath(), entry.name, entry.isFile,
                                                    action === 'move', function (policy, forAll) {
                                        if (forAll) {
                                            if (entry.isFile) {
                                                policyForAllFiles = policy;
                                            } else {
                                                policyForAllDirs = policy;
                                            }
                                        }
                                        handleEntryWithConflictPolicy(policy, forAll);
                                    });
                                }
                            } else {
                                printResult(false, 'cannot overwrite a ' + existingType + ' "' +
                                            existing.id + '" with a ' + entryType + ' of the same name');
                            }

                        } else {
                            handleEntryWithConflictPolicy('none');
                        }
                    } else {
                        printResult(false, 'cannot handle something that is neither a directory nor a file');
                    }
                }
            }

            // pre-condition
            if (!target.isInternal || !entries || !nextJob) {
                throw new Error('assertion fail: unreachable');
            }

            targetPath = target.getPath();
            target.fetchChildren(handleEntry.bind(null, entries.shift()));
        }

        if (!this.isInternal) {
            toastr.error('Cannot ' + action + ' to a non-directory "' + this.getPath() + '"');
            return;
        }

        if (srcNodes) {

            if (!_.isArray(srcNodes)) {
                srcNodes = [srcNodes];
            }

            if (srcNodes.length <= 0) {
                return;
            }

            for (var i = 0; i < srcNodes.length; i++) {
                var srcNode = srcNodes[i];
                if (srcNode.isInternal && this.getPath().indexOf(srcNode.getPath()) === 0) {
                    toastr.error('Cannot ' + action + ' a directory "' + srcNode.getPath() +
                                 '" to itself or to its descendant "' +  this.getPath() + '"');
                    return;
                }
            }

            if (action === 'duplicate') {
                policyForAllFiles = policyForAllDirs = 'rename';
                action = 'copy';
            }

            var entries = srcNodes.map(function (node) {
                return {
                    name: node.name,
                    path: node.getPath(),
                    isFile: !node.isInternal,
                    isDirectory: node.isInternal
                };
            });
            handleEntries(this, entries, printResult.bind(null, true));
        }
    };

    Node.prototype.upload = function (items) {

        var policyForAllFiles, policyForAllDirs;
        var filesSkipped, filesOverwritten, filesRenamed, filesNoConflict;
        var dirsSkipped, dirsMerged, dirsRenamed, dirsNoConflict;
        var nodeToSelectSet = false;

        var deferred = new Deferred();
        
        function printResults(completed) {
            function printInner(type, skipped, overwritten, merged, renamed, noConflict) {
                topic.publish('#REQUEST.log', '	' + type + ' created' +
                              (renamed ? ' without renaming: ' : ': ') + noConflict);
                if (skipped) {
                    topic.publish('#REQUEST.log', '	' + type + ' skipped: ' + skipped);
                }
                if (overwritten) {
                    topic.publish('#REQUEST.log', '	' + type + ' overwritten: ' + overwritten);
                }
                if (merged) {
                    topic.publish('#REQUEST.log', '	' + type + ' merged: ' + merged);
                }
                if (renamed) {
                    topic.publish('#REQUEST.log', '	' + type + ' created with renaming: ' + renamed);
                }
            }

            topic.publish('#REQUEST.log', (completed ? 'completed' : 'not completed'));
            if (dirsSkipped + dirsMerged + dirsRenamed + dirsNoConflict > 0) {
                topic.publish('#REQUEST.log', '	--------------------------------------------------');
                printInner('directories', dirsSkipped, 0, dirsMerged, dirsRenamed, dirsNoConflict);
            }
            topic.publish('#REQUEST.log', '	--------------------------------------------------');
            printInner('files', filesSkipped, filesOverwritten, 0, filesRenamed, filesNoConflict);
            topic.publish('#REQUEST.log', '	--------------------------------------------------');
            topic.publish('#REQUEST.log', '');
            
            deferred.resolve(completed);
        }

        function produceFileName(file, target) {
            var prefix, ext;

            // TODO: generalize the following with a function for type to extension conversion
            if (file.type.indexOf('image/') === 0) {
                prefix = 'image-';
                ext = '.' + file.type.substr(6);
            } else {
                prefix = 'unnamed-';
                ext = '';
            }

            var i = 0, name;
            while (target.hasSubnode(name = prefix + i + ext)) {
                i++;
            }

            return name;
        }

        function uploadFiles(target, files, nextJob) {

            function uploadFile(file) {

                var fileName;

                function uploadFileWithConflictPolicy(policy) {

                    // Now, policy is overwrite, merge, rename, or none.

                    var finalName;
                    if (fileName === '') {
                        // File names are absent when clipboard images are uploaded.
                        // Of course, there may be other undetected cases for absent file names.

                        console.assert(policy === 'none');
                        finalName = produceFileName(file, target);
                    } else {
                        finalName = fileName;
                        switch (policy) {
                        case 'skip':
                            topic.publish('#REQUEST.log', '	skipping ' + targetPath + fileName);
                            filesSkipped++;
                            uploadFile(files.shift());
                            return;
                        case 'overwrite': // only for files
                            topic.publish('#REQUEST.log', '	overwriting ' + targetPath + fileName);
                            break;
                        case 'rename':
                            finalName = getConflictFreeName(target, '', fileName);
                            topic.publish('#REQUEST.log', '	creating ' + targetPath + finalName +
                                          '   (renamed)');
                            break;
                        case 'none':
                            topic.publish('#REQUEST.log', '	creating ' + targetPath + fileName);
                            break;
                        case 'abort':
                            topic.publish('#REQUEST.log', 'aborting');
                            printResults(false);
                            return;
                        default:
                            console.assert(false);
                            throw new Error('unreachable');
                        }
                    }

                    var filePath = target.getPath() + finalName;
                    fsCache.writeFile(filePath, file, function (err) {
                        if (err) {
                            topic.publish('#REQUEST.log',
                                          '		ERROR: failed to write a file "' +
                                          filePath + '" (' + err + '). aborting');
                            printResults(false);
                        } else {
                            if (!nodeToSelectSet) {
                                selectNewNode(filePath);
                                nodeToSelectSet = true;
                            }

                            switch (policy) {
                            case 'overwrite':
                                selectAfterWork();
                                filesOverwritten++;
                                break;
                            case 'rename':
                                filesRenamed++;
                                break;
                            case 'none':
                                filesNoConflict++;
                                break;
                            default:
                                throw new Error('assertion fail: unreachable');
                            }
                            uploadFile(files.shift());
                        }
                    });
                }

                if (!file) {
                    nextJob();
                } else {

                    fileName = file.name || '';
                    var reader = new FileReader();
                    reader.onload = function () {

                        var existing = target.getSubnode(fileName);
                        if (existing) {
                            if (existing.isInternal) {
                                topic.publish('#REQUEST.log', '	ERROR: cannot overwrite a directory "' +
                                              existing.id + '" with a file of the same name');
                                printResults(false);
                            } else {
                                if (policyForAllFiles) {
                                    uploadFileWithConflictPolicy(policyForAllFiles);
                                } else {
                                    askPolicyToUser(target.getPath(), fileName, true,
                                                    false, function (policy, forAll) {
                                        if (forAll) {
                                            policyForAllFiles = policy;
                                        }
                                        uploadFileWithConflictPolicy(policy);
                                    });
                                }
                            }

                        } else {
                            uploadFileWithConflictPolicy('none');
                        }
                    };
                    reader.onerror = function () {
                        topic.publish('#REQUEST.log', '	failed to read a file "' +
                                      fileName + '". ignored');
                        uploadFile(files.shift());
                    };
                    reader.readAsArrayBuffer(file);
                }
            }

            // pre-condition
            if (!target.isInternal || !files || !nextJob) {
                throw new Error('assertion fail: unreachable');
            }

            var targetPath = target.getPath();
            target.fetchChildren(uploadFile.bind(null, files.shift()));
        }

        function uploadEntries(target, entries, nextJob) {

            var targetPath;
            function uploadEntry(entry) {

                var entryPath, existing;
                function uploadEntryWithConflictPolicy(policy) {

                    var finalName;
                    function uploadFile() {
                        entry.file(function (file) {

                            if (!file.name) {
                                // File names are absent when clipboard images are uploaded.
                                console.assert(!finalName);
                                finalName = produceFileName(file, target);
                            }

                            var filePath = target.getPath() + finalName;
                            fsCache.writeFile(filePath, file, function (err) {
                                if (err) {
                                    topic.publish('#REQUEST.log',
                                                  '		ERROR: failed to write the file (' + err + '). aborting');
                                    printResults(false);
                                } else {
                                    if (!nodeToSelectSet) {
                                        selectNewNode(filePath);
                                        nodeToSelectSet = true;
                                    }
                                    switch (policy) {
                                    case 'overwrite':
                                        selectAfterWork();
                                        filesOverwritten++;
                                        break;
                                    case 'rename':
                                        filesRenamed++;
                                        break;
                                    case 'none':
                                        filesNoConflict++;
                                        break;
                                    default:
                                        throw new Error('assertion fail: unreachable');
                                    }
                                    uploadEntry(entries.shift());
                                }
                            });
                        }, function (e) {
                            topic.publish('#REQUEST.log',
                                          '		ERROR: failed to get a file reference (' + e + '). aborting');
                            printResults(false);
                        });
                    }

                    function uploadDirectory() {

                        var dirReader = entry.createReader();
                        var subentries = [];
                        function readAndUploadSubentries() {
                            // console.log('hina temp: entering readSubentries(): reading subentries of ' + entryName);
                            dirReader.readEntries(function (results) {
                                if (results.length > 0) {
                                    var len = results.length;
                                    for (var i = 0; i < len ; i++) {
                                        subentries.push(results[i]);
                                    }
                                    readAndUploadSubentries();
                                } else {
                                    if (policy === 'merge') {
                                        console.assert((finalName === entryName) && existing);
                                        dirsMerged++;
                                        if (!nodeToSelectSet) {
                                            selectNode(existing);
                                            nodeToSelectSet = true;
                                        }
                                        uploadEntries(existing, subentries, function () {
                                            uploadEntry(entries.shift());
                                        });
                                    } else {
                                        // create a subdirectory whose name is uploaded,
                                        // fetch subnodes of the subdirectory, and then
                                        // upload subentries to the subdirectory.
                                        var newDir = target.getPath() + finalName;
                                        var handle = topic.subscribe('workspace.node.added', function (newNodePath) {
                                            newNodePath = pathUtil.detachSlash(newNodePath);
                                            if (newNodePath === newDir) {
                                                handle.remove();
                                                if (!nodeToSelectSet) {
                                                    selectNode(newNodePath);
                                                    nodeToSelectSet = true;
                                                }
                                                uploadEntries(store().get(newNodePath), subentries, function () {
                                                    uploadEntry(entries.shift());
                                                });
                                            }
                                        });
                                        fsCache.createDirectory(newDir, function (err) {
                                            if (err) {
                                                topic.publish('#REQUEST.log',
                                                              '		ERROR: failed to create the directory (' +
                                                              err + '). aborting');
                                                printResults(false);
                                            } else {
                                                switch (policy) {
                                                case 'rename':
                                                    dirsRenamed++;
                                                    break;
                                                case 'none':
                                                    dirsNoConflict++;
                                                    break;
                                                default:
                                                    throw new Error('assertion fail: unreachable');
                                                }
                                            }
                                        });
                                    }
                                }
                            }, function (e) {
                                topic.publish('#REQUEST.log',
                                              '		ERROR: failed to read subentries from the uploaded directory (' +
                                              e + '). aborting');
                                printResults(false);
                            });
                        }

                        readAndUploadSubentries();
                    }

                    var anotherName;
                    switch (policy) {
                    case 'skip':
                        topic.publish('#REQUEST.log', '	skipping ' + entryPath);
                        if (entry.isFile) {
                            filesSkipped++;
                        } else {
                            dirsSkipped++;
                        }
                        uploadEntry(entries.shift());
                        return;
                    case 'overwrite': // only for files
                        topic.publish('#REQUEST.log', '	overwriting ' + entryPath);
                        break;
                    case 'merge': // only for directories
                        topic.publish('#REQUEST.log', '	merging ' + entryPath);
                        break;
                    case 'rename':
                        anotherName = getConflictFreeName(target, '', entryName);
                        topic.publish('#REQUEST.log', '	creating ' + targetPath + anotherName +
                                      (entry.isDirectory ? '/' : '') + '   (renamed)');
                        break;
                    case 'none':
                        topic.publish('#REQUEST.log', '	creating ' + entryPath);
                        break;
                    case 'abort':
                        topic.publish('#REQUEST.log', 'aborting');
                        printResults(false);
                        return;
                    default:
                        console.assert(false);
                        throw new Error('unreachable');
                    }

                    // Now, policy is overwrite, merge, rename, or none.

                    finalName = anotherName || entryName;

                    if (entry.isFile) {
                        uploadFile();
                    } else if (entry.isDirectory) {
                        uploadDirectory();
                    } else {
                        throw new Error('assertion fail: unreachable');
                    }

                }

                if (!entry) {
                    nextJob();
                } else {
                    var entryName = entry.name || '';
                    if (entry.isDirectory || entry.isFile) {
                        entryPath = targetPath + entryName + (entry.isDirectory ? '/' : '');
                        existing = target.getSubnode(entryName);
                        if (existing) {
                            var entryType = entry.isDirectory ? 'directory' : 'file';
                            var existingType = existing.isInternal ? 'directory' : 'file';
                            if (entryType === existingType) {
                                var policy = (entry.isFile ? policyForAllFiles : policyForAllDirs);
                                if (policy) {
                                    uploadEntryWithConflictPolicy(policy);
                                } else {
                                    askPolicyToUser(target.getPath(), entryName, entry.isFile,
                                                    false, function (policy, forAll) {
                                        if (forAll) {
                                            if (entry.isFile) {
                                                policyForAllFiles = policy;
                                            } else {
                                                policyForAllDirs = policy;
                                            }
                                        }
                                        uploadEntryWithConflictPolicy(policy);
                                    });
                                }
                            } else {
                                topic.publish('#REQUEST.log', '	ERROR: cannot overwrite a ' + existingType + ' "' +
                                              existing.id + '" with a ' + entryType + ' of the same name');
                                printResults(false);
                            }

                        } else {
                            uploadEntryWithConflictPolicy('none');
                        }
                    } else {
                        topic.publish('#REQUEST.log',
                                      '	ERROR: cannot upload something that is neither a directory nor a file');
                        printResults(false);
                    }
                }
            }

            // pre-condition
            if (!target.isInternal || !entries || !nextJob) {
                throw new Error('assertion fail: unreachable');
            }

            targetPath = target.getPath();
            target.fetchChildren(uploadEntry.bind(null, entries.shift()));
        }

        if (items && items.length > 0) {

            topic.publish('#REQUEST.log', 'uploading files to ' + this.getPath());

            filesSkipped = filesOverwritten = filesRenamed = filesNoConflict = 0;
            dirsSkipped = dirsMerged = dirsRenamed = dirsNoConflict = 0;

            if (items[0] instanceof File) {

                // Old DnD API supported by Firefox (and Chrome)
                // It does not support uploading directories.

                uploadFiles(this, items, printResults.bind(null, true));
            } else if (items[0].isDirectory || items[0].isFile) {

                // Newer DnD API supported by Chrome
                // It supports uploading directories.

                uploadEntries(this, items, printResults.bind(null, true));
            } else {
                toastr.error('Cannot upload something that is neither a directory nor a file');
                deferred.resolve(false);
            }
        } else { 
            deferred.resolve(false);
        } 
        
        return deferred;
    };


    function setFocus(node) { // TODO: why not a method?
        var nodes = tree().getNodesByItem(node);
        if (nodes && nodes[0]) {
            tree().focusNode(nodes[0]);
        }
        $('#wv-tree').focus();
    }

    Node.compare = function nodeCompare(a, b) {
        if (a.isInternal === b.isInternal) {
            if (a.name < b.name) {
                return -1;
            } else if (a.name > b.name) {
                return 1;
            } else {
                return 0;
            }
        } else {
            if (a.isInternal) { // directory node precedes a file node.
                return -1;
            } else {
                return 1;
            }
        }
    };

    var validRE = /^[^\\/:\*\?"<>\|]+$/;
    function validateNewName(dirNode, newName) {
        function getByteLength(str) {
            var b, i, c;
            /* jshint bitwise: false */
            for (b = i = 0; (c = str.charCodeAt(i)); b += c >> 11 ? 3: c >> 7 ? 2 : 1) { i++; }
            /* jshint bitwise: true */
            return b;
        }

        function consistsOfValidChars(str) {
            return validRE.test(str);
        }

        if (!newName) {
            toastr.warning('Enter a name.');
            return false;
        } else if (newName.indexOf('/') > -1) {
            toastr.warning('Slashes are not allowed in a file or directory name.');
            return false;
        } else if (dirNode && dirNode.hasSubnode(newName)) {
            toastr.error('A file or directory with the name "' + newName + '" already exists.');
            return false;
        } else if (getByteLength(newName) > 255) {
            toastr.error('A file or directory cannot have the name "' + newName +
                         '" whose byte-length exceeds 255.');
            return false;
        } else if (!consistsOfValidChars(newName)) {
            toastr.warning('A file or directory cannot have the name "' + newName +
                           '" which contains a disallowed character.');
            return false;
        } else {
            return true;
        }
    }

    Node.prototype.createMultipleDirectory = function (paths) {
        var deferred = new Deferred();
        var self = this;
        var checkSum = paths.length;
        var cnt = 0;

        function resolve() {
            cnt++;
            if (cnt === checkSum) {
                deferred.resolve();
            }
        }

        function err(e) {
            deferred.reject(e);
        }

        paths.forEach(function (path) {
            self.createDirectory(path)
            .then(resolve, err);
        });

        return deferred.promise;
    };

    Node.prototype.createDirectory = function (path) {
        var deferred = new Deferred();
        var newPath = this.getPath() + path;

        function callback(err) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        }

        function callback2(err, flag) {
            if (err) {
                deferred.reject(err);
            } else {
                if (!flag) {
                    fsCache.createDirectory(newPath, true, callback);
                } else {
                    deferred.resolve();
                }
            }
        }

        fsCache.exists(newPath, callback2);

        return deferred.promise;
    };

    Node.prototype.createInteractively = function (kind) {
        if (!this.isInternal) {
            console.assert(false);
            return;
        }
        var self = this;
        require(['text!./layer/new-node.html'], function (markup) {
            function doCreation(newName) {
                function callback(err) {
                    if (err) {
                        toastr.error('Failed to create a file or directory (' + err + ')');
                    } else {
                        selectNewNode(newPath);
                        toastr.success('\'' + newName + '\' successfully created');
                    }
                }

                var newPath = self.getPath() + newName;
                if (kind === 'file') {
                    fsCache.writeFile(newPath, '', callback);
                } else {
                    fsCache.createDirectory(newPath, callback);
                }

                creationDialog.hide();
            }

            markup = markup.replace('...', kind);
            var inputTextBox, instructionLabel;
            if (!creationDialog) {
                creationDialog = new ButtonedDialog({
                    buttons: [
                        {
                            caption: 'Create',
                            methodOnClick: 'checkAndCreate'
                        },
                        {
                            caption: 'Cancel',
                            methodOnClick: 'hide'
                        }
                    ],

                    methodOnEnter: 'checkAndCreate',

                    checkAndCreate: function () {
                        var newName = inputTextBox.get('value');
                        if (validateNewName(self, newName)) {
                            doCreation(newName);
                        }
                    },

                    title: 'New ' + (kind === 'file' ? 'File' : 'Directory'),

                    refocus: false,

                    onHide: function () {
                        creationDialog.destroyRecursive();
                        creationDialog = null;
                        workbench.focusLastWidget();
                    }
                });
                creationDialog.setContentArea(markup);
                inputTextBox = registry.byId('nnNameInput');
                instructionLabel = dom.byId('nnInstructionLabel');
                creationDialog.show();
            }
        });
    };

    Node.prototype.renameInteractively = function () {
        var self = this;
        var box;
        var parentNode = store().get(self.parent);
        var nodes = tree().getNodesByItem(self);
        if (nodes && nodes[0] && nodes[0].labelNode) {
            box = domGeom.position(nodes[0].labelNode, true);
        }

        self.name = self.name.replace(/&nbsp;/g, ' ');
        var $input = $('<input id="renameInputTemp" type="text" style="position: absolute"></input>')
                        .css('left', 0)
                        .css('top', 0)
                        .css('width', box.w > 100 ?
                             (box.w % 50 > 0 ?  box.w + (50 - (box.w % 50)) : box.w + 50) + 'px' : '100px')
                        .css('height', box.h + 'px')
                        .attr('value', self.name);

        $(nodes[0].labelNode).append($input).css('position', 'relative');
        $input.focus();

        var extLength = self.name.lastIndexOf('.');
        if (extLength > 0 && extLength < (self.name.length - 1)) {
            $input[0].setSelectionRange(0, extLength);
        }

        $input.on('focusout', function () {
            checkAndRename($input[0].value, false);
            $input.remove();
        }).on('click', function (evt) {
            evt.stopPropagation();

            return true;
        }).on('mousedown', function (evt) {
            evt.stopPropagation();

            return true;
        }).on('mouseup', function (evt) {
            evt.stopPropagation();

            return true;
        }).on('dblclick', function (evt) {
            evt.stopPropagation();

            return true;
        }).on('contextmenu', function (evt) {
            evt.preventDefault();
            evt.stopPropagation();

            return true;
        }).on('keypress', function (evt) {
            evt.stopPropagation();
            return true;
        }).on('keydown', function (evt) {
            switch (evt.keyCode) {
            case keys.ENTER:
                checkAndRename($input[0].value, true);
                /*falls through*/
            case keys.ESCAPE:
                $input.remove();
                setFocus(self);
            }

            evt.stopPropagation();
            return true;
        }).on('copy', function (evt) {
            evt.stopPropagation();
        }).on('cut', function (evt) {
            evt.stopPropagation();
        }).on('paste', function (evt) {
            evt.stopPropagation();
        });

        self.name = self.name.replace(/ /g, '&nbsp;');
        function checkAndRename(newName, /* boolean */ reselect) {
            function sliceDotString(name) {
                var newName = name;
                var extLength = newName.lastIndexOf('.');
                while (extLength === (newName.length - 1)) {
                    newName = newName.slice(0, extLength);
                    extLength = newName.lastIndexOf('.');
                }
                return newName;
            }

            newName = (newName || '').trim();
            if (!newName || newName.length === 0) {
                return;
            }

            newName = sliceDotString(newName);

            if (self.name !== newName && validateNewName(parentNode, newName)) {
                //lastRenamedNodeId = self.id;

                var newPath = self.parent + '/' + newName;
                fsCache.move(self.id, newPath, function (err) {
                    if (err) {
                        console.log('Failed to rename (' + err + ')');
                        toastr.error('Failed to rename');
                    } else {
                        if (reselect) {
                            selectNewNode(newPath);
                        }
                        toastr.success('Renamed successfully');
                    }
                });
            }
        }
    };

    Node.prototype.fetchChildren = function (cb) {
        var self = this;
        if (self.isFetched) {
            if (cb) {
                cb(1); // case 1
            }
        } else {
            var subnodes = this.getSubnodes();
            if (subnodes.length > 0) {
                throw new Error('assertion fail: a node ' + this.id + ' has subnodes before fetching them');
            }

            var myId = this.id;
            fsCache.list(myId, false, function (err, stats) {
                if (self.isFetched) {
                    // the result of second list is ignored
                    if (cb) {
                        cb(2); // case 2
                    }
                } else {

                    if (err) {
                        toastr.error('Failed to list ' + myId + ' (' + err + ')');
                    } else {
                        stats.forEach(function (stat) {

                            if (stat.isDirectory && stat.isFile) {
                                throw new Error('assertion fail: something named ' + stat.name +
                                            ' that is both a file and a directory returned' +
                                            ' while fetching subnodes of ' + myId);
                            } else  if (stat.isDirectory || stat.isFile) {
                                var newNode = new Node(self.getPath() + stat.name, stat.isDirectory);
                                self.addSubnode(newNode, false);
                            } else {
                                throw new Error('assertion fail: something named ' + stat.name +
                                            ' that is neither a file nor a directory returned' +
                                            ' while fetching subnodes of ' + myId);
                            }
                        });
                        self.isFetched = true;
                        if (self.promiseToFetch) {
                            self.promiseToFetch.resolve(true);
                            self.promiseToFetch = null;
                        }
                        if (cb) {
                            cb(0);
                        }
                    }
                }
            });
        }
    };

    Node.prototype.hide = function () {
        var nodes = tree().getNodesByItem(this);
        var node = nodes[0];
        if (node && node.domNode) {
            domStyle.set(node.domNode, 'display', 'none');
        }
    };

    Node.prototype.show = function () {
        var nodes = tree().getNodesByItem(this);
        var node = nodes[0];
        if (node && node.domNode) {
            domStyle.set(node.domNode, 'display', 'inline');
        }
    };

    Node.subscribeToFSEvents = function () {
        topic.subscribe('fs.cache.node.added', function (fsURL, targetDir, name, type, maybeCreated) {
            var id = targetDir + name;
            var existingNode;
            if ((existingNode = store().get(id))) {
                console.warn('Mismatch from fsCache detected at ' + id);
                console.warn('Workspace already had added the node');
                // but, this can happen for an initial set.

                var path = existingNode.getPath();
                existingNode.deleteRecursively();
                topic.publish('workspace.node.deleted', path);
            }

            var dirId = pathToId(targetDir);
            var dirNode = store().get(dirId);
            if (dirNode && dirNode.isFetched) {
                var added = new Node(targetDir + name, type === FSCache.NODE_TYPE_DIRECTORY);
                dirNode.addSubnode(added, maybeCreated);
                if (dirNode.isExpanded()) {
                    dirNode.expandItem();
                }
            }

        });

        topic.subscribe('fs.cache.node.deleted', function (fsURL, targetDir, name, type) {
            var id = targetDir + name;
            var existingNode;
            if ((existingNode = store().get(id))) {
                if (existingNode.isInternal !== (type === FSCache.NODE_TYPE_DIRECTORY)) {
                    console.warn('Mismatch from fsCache detected at ' + id);
                    console.warn('Node to delete has a mismatching type');
                    // but, this can happen for an initial set.
                }

                var path = existingNode.getPath();
                existingNode.deleteRecursively();
                topic.publish('workspace.node.deleted', path);
            } else {
                var dirId = pathToId(targetDir);
                var dirNode = store().get(dirId);
                if (dirNode && dirNode.isFetched) {
                    console.warn('Mismatch from fsCache detected at ' + id);
                    console.warn('Workspace does not have the node to delete');
                    // this cannot happen even for an initial set.
                }
            }
        });
    };

    Node.prototype.isShown = function () {
        if (this.isRoot()) {
            return true;
        } else {
            var parentNode = this.getParentNode();
            return parentNode.isExpanded() && parentNode.isShown();
        }
    };

    Node.prototype.setIconInfo = function (iconInfo) {
        if (this.iconInfo !== iconInfo) {
            this.iconInfo = iconInfo;
            var iconClass;
            if (iconInfo) {
                iconClass = iconInfo +
                    (!this.isInternal ? 'File' : this.isExpanded() ? 'DirExpanded' : 'DirCollapsed');
            } else if (iconInfo === undefined) {
                iconClass = (!this.isInternal) ? 'wvFile' :
                            this.isExpanded() ? 'dijitFolderOpened' : 'dijitFolderClosed';
            } else {
                console.error('unreachable');
                throw new Error('unreachable');
            }
            this.updateIcon(iconClass);
        }
    };

    var defaultDirIconClasses = ['dijitFolderOpened', 'dijitFolderClosed'];
    Node.prototype.updateIcon = function (newIconClass) {
        var nodes = tree().getNodesByItem(this);
        var node = nodes && nodes[0];
        if (node && node.iconNode) {
            var splitClasses = node.iconNode.className.split(' ');
            var classesToRemove = splitClasses.filter(function (cl) {
                return cl.indexOf('dijit') !== 0 || defaultDirIconClasses.indexOf(cl) >= 0;
            });
            domClass.replace(node.iconNode, newIconClass, classesToRemove);
        }
    };

    var nodeToSelect;

    function selectNode(node) {
        require(['./plugin'], function (wv) {
            wv.selectNode(node);
            setFocus(node);
        });
    }

    function selectNewNode(nodeId) {
        var node = store().get(nodeId);
        if (node) {
            selectNode(node);
        } else {
            setNodeToSelect(nodeId);
        }
    }

    function selectAfterWork() {
        if (nodeToSelect) {
            var node = store().get(nodeToSelect);
            if (node) {
                var parentNode = node.getParentNode();
                if (parentNode && !parentNode.isExpanded()) {
                    var nodes = tree().getNodesByItem(parentNode);
                    tree()._expandNode(nodes[0]).then(function () {
                        selectNode(node);
                        //console.log('hina temp: nullifying nodeToSelect - A');
                        nodeToSelect = null;
                    });
                } else {
                    selectNode(node);
                    //console.log('hina temp: nullifying nodeToSelect - B');
                    nodeToSelect = null;
                }
            }
        }
    }

    function setNodeToSelect(nodeId) {
        //console.log('hina temp: entering setNodeToSelect with nodeToSelect = ' + nodeToSelect);
        //console.log('hina temp: entering setNodeToSelect with nodeId = ' + nodeId);
        if (nodeToSelect && nodeId) {
            console.warn('Unexpected: trying to set node "' + nodeId +
                         '" to select next while previous one "' + nodeToSelect +
                         '" is not handled');
        }
        nodeToSelect = nodeId;
    }

    topic.subscribe('workspace.node.added', selectAfterWork);

    return Node;
});
