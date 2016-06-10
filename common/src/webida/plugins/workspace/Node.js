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
 * @fileoverview workspace tree node
 * @version: 0.1.0
 * @since: 2014.01.22
 * @author minsung.jin@samsung.com
 * @author joogwan.kim@samsung.com
 */

/* global File: true */
define([
    'require',
    'external/lodash/lodash.min',
    'dijit/registry',
    'webida-lib/app',
    'webida-lib/FSCache-0.1',
    'dojo/dom',
    'dojo/dom-attr',
    'dojo/dom-style',
    'dojo/dom-class',
    'dojo/dom-geometry',
    'dojo/i18n!./nls/resource',
    'dojo/on',
    'dojo/string',
    'dojo/topic',
    'dojo/Deferred',
    'dojo/promise/all',
    'dojo/keys',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
    'webida-lib/util/path',
    'webida-lib/util/notify',
], function (
    require,
    _,
    registry,
    ide,
    FSCache,
    dom,
    domAttr,
    domStyle,
    domClass,
    domGeom,
    i18n,
    on,
    string,
    topic,
    Deferred,
    all,
    keys,
    workbench,
    ButtonedDialog,
    pathUtil,
    notify
) {
    'use strict';

    var creationDialog;
    var tr;
    /**
     * get tree of node
     * @inner
     */
    function tree() {
        if (!tr) {
            tr = registry.byId('wv-tree');
        }
        return tr;
    }
    var st;
    /**
     * get model of tree
     * @inner
     */
    function store() {
        if (!st) {
            st = tree().model.store;
        }
        return st;
    }
    /**
     * detach the trailing slash if any
     * @inner
     */
    function pathToId(path) {
        return pathUtil.detachSlash(path);
    }
    var fsCache = ide.getFSCache();
    /**
     * module object
     * @type {Object}
     */
    function Node(path, isInternal) {

        var id = pathToId(path);
        var pair = pathUtil.dividePath(id); // divide into parentPath and name
        this.id = id;
        this.parent = pathToId(pair[0]);
        this.name = decodeURI(pair[1]).replace(/ /g, '&nbsp;');
        this.isInternal = isInternal;
        this.overlayIconInfo = {};
    }
    /**
     * This method delete node recursively
     * @method
     */
    Node.prototype.deleteRecursively = function () {
        var subnodes = this.getSubnodes();
        if (subnodes) {
            subnodes.forEach(function (subnode) {
                subnode.deleteRecursively();
            });
        }
        store().remove(this.id);
    };
    /**
     * Get node of parent
     * @method
     */
    Node.prototype.getParentNode = function () {
        return store().get(this.parent);
    };
    /**
     * Get level of parent
     * @method
     */
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
    /**
     * Verify that the node is a directory
     * @method
     */
    Node.prototype.isDirectory = function () {
        return this.isInternal;
    };
    /**
     * Add a subnode
     * @param newNode
     * @param maybeCreated
     * @method
     */
    Node.prototype.addSubnode = function (newNode, maybeCreated) {
        store().put(newNode);
        topic.publish('workspace/node/added', newNode.getPath(), maybeCreated);
    };
    /**
     * Get a subnodes
     * @method
     */
    Node.prototype.getSubnodes = function () {
        var queryResult = store().query({ parent: this.id });
        return queryResult;
    };
    /**
     * Get a subnode
     * @param path
     * @method
     */
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
    /**
     * Get a subnode for using path
     * @param path
     * @method
     */
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
    /**
     * Verify that the node is expanded
     * @method
     */
    Node.prototype.isExpanded = function () {
        if (this.isInternal) {
            var nodes = tree().getNodesByItem(this);
            var node = nodes[0];
            return node && node.isExpanded;
        } else {
            return false;
        }
    };
    /**
     * The node expand in tree
     * @method
     */
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
    /**
     * The node collpase in tree
     * @method
     */
    Node.prototype.collapseItem = function () {
        var nodes = tree().getNodesByItem(this);
        tree()._collapseNode(nodes[0]);
    };
    /**
     * The node refresh in tree
     * @method
     */
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
        setToRefresh(this);
        refreshExpandedHierarchy(this, function () {
            fsCache.invalidateFileContents(path);
            fsCache.invalidateMetadata(path);
        });

    };
    /**
     * Verify that the ancestor of node
     * @param other - other node
     * @method
     */
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
    /**
     * Verify that the node is root
     * @method
     */
    Node.prototype.isRoot = function () {
        return this.parent === '';
    };
    /**
     * Verify that the node is in tree.
     * @method
     */
    Node.prototype.isInTree = function () {
        return !!store().get(this.id);
    };
    /**
     * Verify that the node has subnode.
     * @method
     */
    Node.prototype.hasSubnode = function (path) {
        // if path param is null, then hasSunode method check Node's subnode exist
        if (!path) {
            return (this.getSubnodes().length > 0 ? true : false);
        }
        return !!this.getSubnode(path);
    };
    /**
     * Get path of node
     * @method
     */
    Node.prototype.getPath = function () {
        var path = this.id;
        if (this.isInternal) {
            path = path + '/';
        }
        return path;
    };
    /**
     * Get name of file in the path.
     * @param node
     * @param relPath
     * @param oriName
     * @inner
     */
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
    /**
     * Duplicate file in the same path
     * @method
     */
    Node.prototype.duplicate = function () {
        var parentNode = this.getParentNode();
        if (parentNode) {
            parentNode.paste(this, 'duplicate');
        } else {
            throw new Error('assertion fail: duplicate was called on the root node');
        }
    };
    /**
     * Ask policy for file name
     * @param targetPath
     * @param name
     * @param isFile
     * @param moving
     * @param cb
     */
    function askPolicyToUser(targetPath, name, isFile, moving, cb) {
        var buttonSpec = [
            { caption: i18n.askPolicyDialogSkip, methodOnClick: 'skip' },
            { caption: i18n.askPolicyDialogSkipAll, methodOnClick: 'skipAll' },
            { caption: isFile ?
                i18n.askPolicyDialogOverwrite: i18n.askPolicyDialogMerge,
                methodOnClick: 'overwrite' },
            {
                caption: isFile ?
                    i18n.askPolicyDialogOverwriteAll: i18n.askPolicyDialogMergeAll,
                methodOnClick: 'overwriteAll'
            },
            {
                caption: i18n.askPolicyDialogRename,
                methodOnClick: 'rename'
            },
            { caption: i18n.askPolicyDialogRenameAll, methodOnClick: 'renameAll' },
            { caption: i18n.askPolicyDialogAbort, methodOnClick: 'abort' }
        ];
        var style = 'width: 700px';

        if (!isFile && moving) {
            buttonSpec.splice(2, 2);
            style = 'width: 500px';
        }

        var dialog = new ButtonedDialog({
            title: (isFile ? i18n.askPolicyDialogTitleForFile : i18n.askPolicyDialogTitleForDir),
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

        var markup = isFile ?
            string.substitute(i18n.askPolicyDialogMarkUpForFile, {
                targetPath: targetPath,
                name: name
            }) :
            string.substitute(i18n.askPolicyDialogMarkUpForDir, {
                targetPath: targetPath,
                name: name
            });
        dialog.setContentArea(markup);
        dialog.show();
    }
    /**
     * Set focus in the selected node
     * @param node
     * @inner
     */
    function setFocus(node) { // TODO: why not a method?
        var nodes = tree().getNodesByItem(node);
        if (nodes && nodes[0]) {
            tree().focusNode(nodes[0]);
        }
        $('#wv-tree').focus();
    }
    var nodeToSelect;
    /**
     * Select a node
     * @inner
     */
    function selectNode(node) {
        require(['./plugin'], function (wv) {
            wv.selectNode(node);
            setFocus(node);
        });
    }
    /**
     * Set a node to selected
     * @param nodeId
     * @inner
     */
    function setNodeToSelect(nodeId) {
        if (nodeToSelect && nodeId) {
            console.warn('Unexpected: trying to set node "' + nodeId +
                         '" to select next while previous one "' + nodeToSelect +
                         '" is not handled');
        }
        nodeToSelect = nodeId;
    }
    /**
     * Select a new node
     * @param nodeId
     * @inner
     */
    function selectNewNode(nodeId) {
        var node = store().get(nodeId);
        if (node) {
            selectNode(node);
        } else {
            setNodeToSelect(nodeId);
        }
    }
    /**
     * Select a node after the work
     * @method
     */
    function selectAfterWork() {
        if (nodeToSelect) {
            var node = store().get(nodeToSelect);
            if (node) {
                var parentNode = node.getParentNode();
                if (parentNode && !parentNode.isExpanded()) {
                    var nodes = tree().getNodesByItem(parentNode);
                    tree()._expandNode(nodes[0]).then(function () {
                        selectNode(node);
                        nodeToSelect = null;
                    });
                } else {
                    selectNode(node);
                    nodeToSelect = null;
                }
            }
        }
    }
    /**
     * Paste file in the selected path
     * @param srcNodes
     * @param action
     * @method
     */
    Node.prototype.paste = function (srcNodes, action) {

        var policyForAllFiles, policyForAllDirs;
        var nodeToSelectSet = false;

        function printResult(completed, errMsg) {
            var cap;
            if (completed) {
                cap = action === 'copy' ? 'Copied' : 'Moved';
                notify.success('', string.substitute(i18n.notifyDoneSuccessfully, {cap: cap}));
            } else {
                cap = action === 'copy' ? 'Copy' : 'Move';
                if (errMsg) {
                    notify.error(errMsg, string.substitute(i18n.notifyAbortedByAnErrorTitle, {cap: cap}));
                } else {
                    notify.info('', string.substitute(i18n.notifyAborted, {cap: cap}));
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
                        finalName = finalName.replace(/&nbsp;/g, ' ');
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
                            finalName = finalName.replace(/&nbsp;/g, ' ');
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
                        handleEntry(entries.shift());
                        return;
                    case 'overwrite': // only for files
                        break;
                    case 'merge': // only for directories
                        break;
                    case 'rename':
                        anotherName = getConflictFreeName(target, '', entry.name);
                        // (entry.isDirectory ? '/' : '') + '   (renamed)');
                        break;
                    case 'none':
                        break;
                    case 'abort':
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
                                printResult(false,  string.substitute(i18n.printResultCannotOveriteWithSameName, {
                                    type1: existingType,
                                    id: existing.id,
                                    type2: entryType
                                }));
                            }

                        } else {
                            handleEntryWithConflictPolicy('none');
                        }
                    } else {
                        printResult(false, i18n.printResultCannotHandleSomethingNeitherDirNorFile);
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
            notify.error(string.substitute(i18n.notifyCannotActionToNonDirectory,
                                           {action: action, path: this.getPath()}));
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
                    notify.error(string.substitute(i18n.notifyCannotActionDirectoryToItselfOrItsDescendant,
                                                   {action: action, path1: srcNode.getPath(), path2: this.getPath()}));
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
    /**
     * Upload file in the selected items
     * @param items
     * @method
     */
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

            var targetPath;
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

            targetPath = target.getPath();
            target.fetchChildren(uploadFile.bind(null, files.shift()));
        }

        function uploadEntries(target, entries, nextJob) {

            var targetPath;
            function uploadEntry(entry) {

                var entryPath, existing;
                var entryName;
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
                                        var handle = topic.subscribe('workspace/node/added', function (newNodePath) {
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
                    entryName = entry.name || '';
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
                notify.error(i18n.notifyCannotUploadSomethingThatIsNeitherDirNorFile);
                deferred.resolve(false);
            }
        } else {
            deferred.resolve(false);
        }

        return deferred;
    };
    /**
     * Compare a node
     * @param a
     * @param b
     * @function
     */
    Node.compare = function nodeCompare(a, b) {
        var loweredA;
        var loweredB;
        if (a.isInternal === b.isInternal) {
            loweredA = a.name.toLowerCase();
            loweredB = b.name.toLowerCase();
            if (loweredA < loweredB) {
                return -1;
            } else if (loweredA > loweredB) {
                return 1;
            } else if (a.name < b.name) {
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
    /**
     * Verify new name
     * @param dirNode
     * @param newName
     * @inner
     */
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
            notify.warning(i18n.notifyEnterAName);
            return false;
        } else if (newName.indexOf('/') > -1) {
            notify.warning(i18n.notifySlashesAreNotAllowedInFileOrDirName);
            return false;
        } else if (/^(\.|\.\.)$/.test(newName)) {
            notify.warning(string.substitute(i18n.notifyNewNameIsNotAllowedAsFileOrDirName,
                                           {newName: newName}));
        } else if (dirNode && dirNode.hasSubnode(newName)) {
            notify.error(string.substitute(i18n.notifyFileOrDirWithTheNameAlreadyExists,
                                           {newName: newName}));
            return false;
        } else if (getByteLength(newName) > 255) {
            notify.error(string.substitute(i18n.notifyFileOrDirCannotHaveTheNameExeeds255Bytes,
                                           {newName: newName}));
            return false;
        } else if (!consistsOfValidChars(newName)) {
            notify.warning(string.substitute(i18n.notifyFileOrDirCannotHaveTheNameWithDisallowedCharacter,
                                             {newName: newName}));
            return false;
        } else {
            return true;
        }
    }
    /**
     * Create multiple directory
     * @param paths
     * @method
     */
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
    /**
     * Create directory
     * @param path
     * @method
     */
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
    /**
     * Create a node on the input path
     * @param kind
     * @method
     */
    Node.prototype.createInteractively = function (kind) {
        if (!this.isInternal) {
            console.assert(false);
            return;
        }
        var self = this;
        require(['text!./layer/new-node.html'], function (markup) {
            function doCreation(newName) {
                var newPath;
                function callback(err) {
                    if (err) {
                        notify.error(string.substitute(i18n.notifyFailedToCreateFileOrDir,
                                                       {err: err}));
                    } else {
                        selectNewNode(newPath);
                        notify.success(string.substitute(i18n.notifySuccessfullyCreated,
                                                       {newName: newName}));
                    }
                }
                newPath = self.getPath() + newName;
                if (kind === 'file') {
                    fsCache.writeFile(newPath, '', callback);
                } else {
                    fsCache.createDirectory(newPath, callback);
                }
                creationDialog.hide();
            }

            markup = markup.replace(
                '...',
                string.substitute(i18n.creationDialogInstructionLabel, {kind: kind})
            );
            var inputTextBox, instructionLabel;
            if (!creationDialog) {
                creationDialog = new ButtonedDialog({
                    buttons: [
                        {
                            caption: i18n.creationDialogCreate,
                            methodOnClick: 'checkAndCreate'
                        },
                        {
                            caption: i18n.creationDialogCancel,
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

                    title: (kind === 'file' ?
                            i18n.creationDialogTitleForFile :
                            i18n.creationDialogTitleForDir),

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
    /**
     * Rename a node
     * @method
     */
    Node.prototype.renameInteractively = function (newName) {
        var self = this;
        var box;
        var parentNode = store().get(self.parent);
        var nodes = tree().getNodesByItem(self);
        if (nodes && nodes[0] && nodes[0].labelNode) {
            box = domGeom.position(nodes[0].labelNode, true);
        }

        function checkAndRename(newName, reselect) {
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
                var newPath = self.parent + '/' + newName;
                fsCache.move(self.id, newPath, function (err) {
                    if (err) {
                        console.log('Failed to rename (' + err + ')');
                        notify.error('Failed to rename');
                        notify.error(i18n.notifyFailedToRename);
                    } else {
                        if (reselect) {
                            selectNewNode(newPath);
                        }
                        topic.publish('fs/cache/node/rename', newPath);
                    }
                });
            }
        }

        if (newName) {
            checkAndRename(newName, true);
            return;
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
        } else if (extLength === -1) {
            $input[0].setSelectionRange(0, self.name.length);
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
    };
    /**
     * Create a node by a subnode
     * @param cb
     * @method
     */
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
                        notify.error('Failed to list ' + myId + ' (' + err + ')');
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
    /**
     * Hide a node
     * @method
     */
    Node.prototype.hide = function () {
        var nodes = tree().getNodesByItem(this);
        var node = nodes[0];
        if (node && node.domNode) {
            domStyle.set(node.domNode, 'display', 'none');
        }
    };
    /**
     * Display a node
     * @method
     */
    Node.prototype.show = function () {
        var nodes = tree().getNodesByItem(this);
        var node = nodes[0];
        if (node && node.domNode) {
            domStyle.set(node.domNode, 'display', 'inline');
        }
    };
    /**
     * Subscribe to the event for file system
     * @function
     */
    Node.subscribeToFSEvents = function () {
        topic.subscribe('fs/cache/node/added', function (fsURL, targetDir, name, type, maybeCreated) {
            var id = targetDir + name;
            var existingNode;
            if ((existingNode = store().get(id))) {
                console.warn('Mismatch from fsCache detected at ' + id);
                console.warn('Workspace already had added the node');
                // but, this can happen for an initial set.

                var path = existingNode.getPath();
                existingNode.deleteRecursively();
                topic.publish('workspace/node/deleted', path);
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

        topic.subscribe('fs/cache/node/deleted', function (fsURL, targetDir, name, type) {
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
                topic.publish('workspace/node/deleted', path);
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
    /**
     * Verify the shown a node
     * @method
     */
    Node.prototype.isShown = function () {
        if (this.isRoot()) {
            return true;
        } else {
            var parentNode = this.getParentNode();
            return parentNode.isExpanded() && parentNode.isShown();
        }
    };
    /**
     * Set state for overlay icon
     * @param stateSet
     * @param state
     * @method
     */
    Node.prototype.setOverlayIconInfo = function (stateSet, state) {
        if (!this.overlayIconInfo.hasOwnProperty(stateSet)) {
            this.overlayIconInfo[stateSet] = undefined;
        }
        if (this.overlayIconInfo[stateSet] !== state) {
            this.overlayIconInfo[stateSet] = state;

            this.updateOverlayIcon();
        }
    };
    /**
     * Upate overlay icon
     * @method
     */
    Node.prototype.updateOverlayIcon = function () {
        var nodes = tree().getNodesByItem(this);
        var node = nodes && nodes[0];
        if (node && node.iconNode) {
            var that = this;
            require(['./plugin'], function (wv) {
                node.iconNode.innerHTML = '';
                var stateSetIconClassMap = wv.getStateSetIconClassMap();
                for (var stateSet in stateSetIconClassMap) {
                    if (stateSetIconClassMap.hasOwnProperty(stateSet)) {
                        var overlayIconClass = stateSetIconClassMap[stateSet][that.overlayIconInfo[stateSet]];
                        if (overlayIconClass) {
                            var overlayElement = document.createElement('span');
                            overlayElement.className = overlayIconClass;
                            node.iconNode.appendChild(overlayElement);
                        }
                    }
                }
            });
        }
    };

    topic.subscribe('workspace/node/added', selectAfterWork);

    return Node;
});
