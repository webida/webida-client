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

define(['dijit/Dialog',
        'dijit/form/TextBox',
        'dijit/registry',
        'dijit/Tree',
        'dijit/tree/dndSource',
        'dijit/tree/ObjectStoreModel',
        'dojo/dom-class',
        'dojo/aspect',
        'dojo/_base/declare',
        'dojo/store/Memory',
        'dojo/store/Observable',
        'webida-lib/util/path',
        './dlg-content-template'
], function (Dialog, TextBox, registry, Tree, dndSource, ObjectStoreModel, domClass,
             aspect, declare,  Memory, Observable, pathUtil, template) {
    'use strict';

    var serialNo = 0;
    var webidaHost = decodeURIComponent(
        document.cookie.replace(/(?:(?:^|.*;\s*)webida\.host\s*\=\s*([^;]*).*$)|^.*$/, '$1')
    );


    function getIconClass(isDir, selection, opened) {
        switch (selection) {
        case 'selected':
            return isDir ? (opened ? 'selDirSelectedExpanded' : 'selDirSelectedCollapsed') : 'selFileSelected';
        case 'deselected' :
            return isDir ? (opened ? 'selDirDeselectedExpanded' : 'selDirDeselectedCollapsed') : 'selFileDeselected';
        case 'partial' :
            return isDir ? (opened ? 'selDirPartialExpanded' : 'selDirPartialCollapsed') : '';
        }
    }

    function isValidAbsPath(path) {
        return (typeof path === 'string') && (path.indexOf('/') === 0) && (path.indexOf('//') < 0);
    }

    function pathToId(path) {
        var len = path.length;
        if (path.lastIndexOf('/') === len - 1) {
            return path.substr(0, len - 1);
        } else {
            return path;
        }
    }

    function initializeTree(ops, idPostfix) {

        var store = new Memory({data: []});
        store.getChildren = function (node) {
            return this.query({ parent: node.id }, { sort: Node.compare });
        };

        var observableModel = new Observable(store);

        var model = new ObjectStoreModel({
            store: observableModel,
            query: { id: ops.root },
            mayHaveChildren: function (node) {
                return node.isInternal;
            }
        });

        var Node = getNode(observableModel);
        var rootNode = new Node(ops.root, true);
        observableModel.put(rootNode);

        /*
        var store = new Memory();
        store.setData([]);
        store.getChildren = function (node) {
            return this.query({ parent: node.id }, { sort: Node.compare });
        };

        var observableModel = new Observable(store);
        var Node = getNode(observableModel);
        var rootNode = new Node(ops.root, true);
        observableModel.put(rootNode);

        var model = new ObjectStoreModel({
            store: observableModel,
            query: { id: ops.root },
            mayHaveChildren: function (node) {
                return node.isInternal;
            }
        });
         */

        var tree = new Tree({
            model: model,
            //openOnDblClick: true,     This doesn't work in dojo 1.9.0
            dndController: dndSource,

            showRoot: ('showRoot' in ops) ? ops.showRoot : true,

            expandTo: function (item, relPath, cb, eb) {

                //console.log('hina temp: entering expandTo()');

                var i = relPath.indexOf('/');
                var childName = i < 0 ? relPath : relPath.substring(0, i);
                if (!childName) {
                    return;
                }

                if (typeof item === 'string') {
                    item = this.model.store.get(item);
                }

                if (!item || !item.isInternal) {
                    return;
                }

                this.expandItem(item);

                //console.log('hina temp: expanding item ' + item.id + ' to ' + relPath);

                var self = this;
                item.fetchChildren(ops.mount, ops.dirOnly, function () {
                    if (i > 0) {
                        var nextItem = item.getSubnode(childName);
                        self.expandTo(nextItem, relPath.substr(i + 1), cb, eb);
                    } else {
                        if (cb) {
                            cb(item.getPath() + relPath);
                        }
                    }
                }, eb);

            },

            expandItem: function (item) {
                var node;
                if (item.isInternal && (node = this.getNodeByItem(item))) {
                    this._expandNode(node);
                }
            },

            getNodeByItem: function (item) {
                var nodes = this.getNodesByItem(item);
                return nodes && nodes[0];
            },

            getIconClass: function (item, opened) {
                //return (!item || this.model.mayHaveChildren(item)) ?  ('selDirSelected') : 'selFileSelected'; },
                if (item) {
                    return getIconClass(item.isInternal, item.selection, opened);
                } else {
                    return '';
                }
            },

            deselectInitialNodes: function () {
                var self = this;

                var doneCnt = 0;
                function notifyOnePathSucc() {
                    doneCnt++;
                    if (doneCnt === ops.initialDeselection.length) {
                        initialDeselect();
                    }
                }
                function notifyOnePathFailed(failedPath) {
                    doneCnt++;
                    console.log('hina temp: fetching children failed at ' + failedPath);
                    if (doneCnt === ops.initialDeselection.length) {
                        initialDeselect();
                    }
                }
                function initialDeselect() {
                    ops.initialDeselection.forEach(function (path) {
                        // Workaround cannot find item problem when initial deselect terminal tree node.
                        // Problem will occur if children fetched but item does not added to 'tree.model.store' yet.
                        setTimeout(function () {
                            var item = self.model.store.get(path);
                            if (item) {
                                self.changeSelection(item);
                            }
                        }, 0);
                    });
                }

                var rootNode = this.model.store.get(ops.root);
                this.expandItem(rootNode);
                ops.initialDeselection.forEach(function (id) {
                    self.expandTo(rootNode, id.substr(ops.root.length + 1),
                                  notifyOnePathSucc, notifyOnePathFailed);
                });

            },

            changeSelection : function (item) {
                var parentNode;
                var children;
                var self = this;
                switch (item.selection) {
                case 'selected':
                    item.selection = 'deselected';
                    this.updateIcon(item);
                    parentNode = item.getParentNode();
                    if (parentNode) {
                        this.bubbleSelection(parentNode);
                    }
                    children = item.getSubnodes();
                    if (children) {
                        children.forEach(function (child) {
                            self.deselectRecursively(child);
                        });
                    }
                    break;

                case 'partial':
                case 'deselected':
                    item.selection = 'selected';
                    this.updateIcon(item);
                    parentNode = item.getParentNode();
                    if (parentNode) {
                        this.bubbleSelection(parentNode);
                    }
                    children = item.getSubnodes();
                    if (children) {
                        children.forEach(function (child) {
                            self.selectRecursively(child);
                        });
                    }
                    break;
                }
            },

            bubbleSelection : function (item) {
                var modified = false;
                var curSelection = item.selection;
                var children = item.getSubnodes();
                if (children.every(function (child) {
                        return child.selection === 'selected';
                    })) {
                    console.assert(curSelection !== 'selected');
                    item.selection = 'selected';
                    modified = true;
                } else if (children.every(function (child) {
                        return child.selection === 'deselected';
                    })) {
                    console.assert(curSelection !== 'deselected');
                    if (curSelection === 'selected') {
                        item.selection = 'partial';
                        modified = true;
                    }
                } else if (curSelection !== 'partial') {
                    item.selection = 'partial';
                    modified = true;
                }

                if (modified) {
                    this.updateIcon(item);
                    var parentNode = item.getParentNode();
                    if (parentNode) {
                        this.bubbleSelection(parentNode);
                    }
                }
            },

            selectRecursively : function (item) {
                var children;
                if (item.selection !== 'selected') {
                    item.selection = 'selected';
                    this.updateIcon(item);
                    children = item.getSubnodes();
                    if (children) {
                        var self = this;
                        children.forEach(function (child) {
                            self.selectRecursively(child);
                        });
                    }
                }
            },

            deselectRecursively : function (item) {
                var children;
                if (item.selection !== 'deselected') {
                    item.selection = 'deselected';
                    this.updateIcon(item);
                    children = item.getSubnodes();
                    if (children) {
                        var self = this;
                        children.forEach(function (child) {
                            self.deselectRecursively(child);
                        });
                    }
                }
            },

            updateIcon : function (item) {
                var node = this.getNodeByItem(item);
                if (node && node.iconNode) {
                    var oldClasses = node.iconNode.className;
                    var newClass = getIconClass(item.isInternal, item.selection, node.isExpanded);
                    var classToRemove = oldClasses.split(' ').filter(function (c) {
                        return c.indexOf('dijit') !== 0;
                    });
                    if (classToRemove.length !== 1 || classToRemove[0] === newClass) {
                        throw new Error('assertion fail: icon updated with the same one');
                    }
                    domClass.replace(node.iconNode, newClass, classToRemove);
                }
            },

            onDblClick: function (item) {
                if (item) {
                    if (item.isInternal) {
                        var nodes = this.getNodesByItem(item);
                        var node = nodes && nodes[0];
                        if (node) {

                            if (node.isExpanded) {
                                this._collapseNode(node);
                            } else {
                                this._expandNode(node);
                            }
                        }
                    }
                }
            }
        }, 'FileSelectionTree' + idPostfix);

        tree.dndController.singular = false;
        tree.dndController.isSource = false;
        aspect.around(tree.dndController, 'userSelect', function () {
            return function (node) {
                tree.changeSelection(node.item);
                /*
                var deselected = [];
                tree.model.store.get(ops.root).collectDeselected(deselected);
                registry.byId('FileDialogSelection' + idPostfix).set('value', deselected.join(', '));
                 */
            };
        });


        tree.startup();

        tree.onOpen = function (item) {
            console.log('hina temp: opened item = ' + item.id);

            item.fetchChildren(ops.mount, ops.dirOnly, function (alreadyFetched) {
                if (alreadyFetched) {
                    console.log('hina temp: already fetched the children of ' + item.id);
                } else {
                    console.log('hina temp: succeeded fetching children of ' + item.id);
                }
            }, function () {
                console.log('hina temp: failed fetching children of ' + item.id);
            });
        };
        tree.deselectInitialNodes();

        return tree;
    }

    function checkOptions(ops) {
        if (!ops.mount || !ops.root) {
            throw new Error('Error: mount and root are mandatory to create a file selection dialog');
        }

        ops.root = pathToId(ops.root);
        if (!isValidAbsPath(ops.root)) {
            throw new Error('Error: root is not a valid absolute path: ' + ops.root);
        }

        if (ops.initialDeselection && !(ops.initialDeselection instanceof Array)) {
            throw new Error('Error: initialDeselection must be an array of strings (absolute paths)');
        }

        var len;
        if (!ops.initialDeselection) {
            ops.initialDeselection = [];
        } else if ((len = ops.initialDeselection.length) > 0) {
            for (var i = 0; i < len; i++) {
                var path = ops.initialDeselection[i];
                if (!isValidAbsPath(path) || path.indexOf(ops.root)) {
                    throw new Error('Error: an element of initialDeselection "' + path +
                                    '" is not a valid absolute paths under the root');
                }
            }
            ops.initialDeselection = ops.initialDeselection.map(function (path) {
                return pathToId(path);
            });
        }

        if (!('dirOnly' in ops)) {
            ops.dirOnly = false;    // default is false
        }

        if (!('title' in ops)) {
            ops.title = ops.dirOnly ? 'Deselect Directories' : 'Deselect Files and/or Directories';
        }
    }

    var FileDialog = declare(null, {
        constructor: function (ops) {
            /*
                ops = {
                    mount: FileSystem (or compatible)
                    root: string (absolute path),
                    initialDeselection : [string (absolute path)],
                    dirOnly: boolean,
                    title: string
                }
             */

            // Error checks of mount, root, and initialDeselection, and
            // default values of initialDeselection, dirOnly, and title
            checkOptions(ops);

            this.open = function (callback) {
                require(['//library.' + webidaHost +
                         '/webida/widgets/dialogs/buttoned-dialog/ButtonedDialog.js'], function (ButtonedDialog) {
                    var isOk;
                    var idPostfix = '-3s-' + serialNo;
                    serialNo++;

                    template = template.replace(/<%webida-host%>/g, webidaHost);
                    var markup = template.replace(/<%id-postfix%>/g, idPostfix);

                    var dialog = new ButtonedDialog({
                        buttons: [
                            {
                                id: 'ok-button-in-file-dialog-' + idPostfix,
                                caption: 'OK',
                                methodOnClick: 'onSubmit'
                            },
                            {
                                id: 'cancel-button-in-file-dialog-' + idPostfix,
                                caption: 'Cancel',
                                methodOnClick: 'hide'
                            }
                        ],
                        methodOnEnter: 'onSubmit',
                        onSubmit: function () {
                            isOk = true;
                            dialog.hide();
                        },

                        title : ops.title,
                        onHide : function () {
                            if (isOk) {
                                var tree = registry.byId('FileSelectionTree' + idPostfix);
                                var deselected = [];
                                tree.model.store.get(ops.root).collectDeselected(deselected);
                                callback(deselected);
                            } else {
                                callback();
                            }

                            dialog.destroyRecursive();
                        }
                    });
                    dialog.setContentArea(markup);
                    initializeTree(ops, idPostfix);
                    dialog.show();
                });
            };
        }
    });

    function getNode(store) {

        // TODO:
        var Node = function (path, isInternal) {

            var id = decodeURI(pathToId(path));
            if (!isValidAbsPath(id)) {
                throw new Error('assertion fail: given path is not an valid absolute path: ' + path);
            }

            var pair = pathUtil.dividePath(id);      // divide into parentPath and name

            this.id = id;
            this.parent = pathToId(pair[0]);
            this.name = pair[1];
            this.isInternal = isInternal;
            this.selection = 'selected';
        };

        Node.prototype.getParentNode = function () {
            return store.get(this.parent);
        };

        Node.prototype.isDirectory = function () {
            return this.isInternal;
        };

        Node.prototype.addSubnode = function (newNode) {
            store.put(newNode);
        };

        Node.prototype.getSubnodes = function () {
            var queryResult = store.query({ parent: this.id });
            return queryResult;
        };

        Node.prototype.getSubnode = function (path) {
            var subnodes = store.query({ parent: this.id });
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
                if (subnodes[i].name === name) {
                    if (rest.length > 0) {
                        return subnodes[i].getSubnode(rest);
                    } else {
                        return subnodes[i];
                    }
                }
            }
            return null;
        };

        Node.prototype.isAncestorOf = function (other) {
            if (other.parent === '') { // rootnode.parent is empty string
                return false;
            } else if (this.id === other.parent) {
                return true;
            } else {
                var parentNode = store.get(other.parent);
                return this.isAncestorOf(parentNode);
            }
        };

        Node.prototype.getRootNode = function () {
            return store.query({ parent: '' })[0];
        };

        Node.prototype.isRoot = function () {
            return this.parent === '';
        };

        Node.prototype.isInTree = function () {
            var rootNode = this.getRootNode();
            return this.isRoot() || rootNode.isAncestorOf(this);
        };

        Node.prototype.hasSubnode = function (path) {
            return !!this.getSubnode(path);
        };

        Node.prototype.getPath = function () {
            var path = this.id;
            if (this.isInternal) {
                path = path + '/';
            }
            return path;
        };

        Node.prototype.collectDeselected = function (bag) {
            if (this.selection === 'deselected') {
                bag.push(this.id);
            } else if (this.selection === 'partial') {
                var children = this.getSubnodes();
                children.forEach(function (child) {
                    child.collectDeselected(bag);
                });
            }
        };

        Node.prototype.fetchChildren = function (mount, dirOnly, cb, eb) {
            var self = this;
            if (self.isFetched) {
                if (cb) {
                    cb(true);
                }
            } else {
                var subnodes = this.getSubnodes();
                if (subnodes.length > 0) {
                    throw new Error('assertion fail: a node ' + this.id + ' has subnodes before fetching them');
                }

                var myId = this.id;
                mount.list(myId, false, function (err, stats) {
                    if (err) {
                        alert('Failed to list ' + myId + ' (' + err + ')');
                        if (eb) {
                            eb(myId);
                        }
                    } else {
                        stats.forEach(function (stat) {
                            if (stat.isDirectory && stat.isFile) {
                                throw new Error('assertion fail: something named ' + stat.name +
                                            ' that is both a file and a directory returned' +
                                            ' while fetching subnodes of ' + myId);
                            } else if (stat.isDirectory || stat.isFile) {
                                if (!dirOnly || stat.isDirectory) {
                                    var newNode = new Node(self.getPath() + stat.name, stat.isDirectory);
                                    newNode.selection = self.selection;
                                    self.addSubnode(newNode);
                                }
                            } else {
                                throw new Error('assertion fail: something named ' + stat.name +
                                            ' that is neither a file nor a directory returned' +
                                            ' while fetching subnodes of ' + myId);
                            }
                        });
                        self.isFetched = true;
                        if (cb) {
                            cb(false);
                        }
                    }
                });
            }
        };

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

        return Node;
    }

    return FileDialog;
});
