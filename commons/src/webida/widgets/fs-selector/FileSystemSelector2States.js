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

define(['dijit',
        'dijit/registry',
        'dijit/Tree',
        'dijit/tree/dndSource',
        'dijit/tree/ObjectStoreModel',
        'dojo/aspect',
        'dojo/_base/declare',
        'dojo/store/Memory',
        'dojo/store/Observable',
        'webida-lib/util/path',
        './dlg-content-template'],
function (dijit, registry, Tree, dndSource, ObjectStoreModel, aspect, declare,
            Memory, Observable, pathUtil, template) {
    'use strict';

    var serialNo = 0;
    var webidaHost = decodeURIComponent(
        document.cookie.replace(/(?:(?:^|.*;\s*)webida\.host\s*\=\s*([^;]*).*$)|^.*$/, '$1')
    );
    var systemResources = ['.workspace', '.git', '.gitignore'];

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

        var tree = new Tree({
            model: model,
            showRoot: ('showRoot' in ops) ? ops.showRoot : true,
            dndController: dndSource,
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
                item.fetchChildren(ops.mount, ops.dirOnly, ops.filter, ops.hideSystemResoureces,
                                   function () {
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

            selectNodes: function (paths) {
                var self = this;
                var doneCnt = 0;
                function notifyOnePathSucc() {
                    doneCnt++;
                    if (doneCnt === paths.length) {
                        selectNodes(paths);
                    }
                }
                function notifyOnePathFailed(failedPath) {
                    doneCnt++;
                    console.log('hina temp: fetching children failed at ' + failedPath);
                    if (doneCnt === paths.length) {
                        selectNodes();
                    }
                }
                function selectNodes(paths) {
                    var arr = [];
                    paths.forEach(function (path) {
                        var node = self.model.store.get(path);
                        if (node) {
                            arr.push(node);
                        }
                    });
                    self.set('selectedItems', arr);
                    var nodes = self.getNodesByItem(arr[0]);
                    if (nodes[0]) {
                        nodes[0].domNode.scrollIntoView(true);
                    }
                }

                var rootNode = this.model.store.get(ops.root);
                this.expandItem(rootNode);
                paths.forEach(function (id) {
                    self.expandTo(rootNode, id.substr(ops.root.length + 1),
                                  notifyOnePathSucc, notifyOnePathFailed);
                });
            },

            selectInitialNodes: function () {
                this.selectNodes(ops.initialSelection);
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
                return (!item || this.model.mayHaveChildren(item)) ?
                    (opened ? 'dijitFolderOpened' : 'dijitFolderClosed') :
                'fileIcon';
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
        }, 'FileSelectionTreeInWidget' + idPostfix);

       //console.log('hina temp: ops.singular = ' + ops.singular);
        tree.dndController.singular = ops.singular;
        tree.dndController.isSource = false;
        aspect.around(tree.dndController, 'userSelect', function (original) {
            return function () {
                function getSelectedNodes() {
                    return tree ? (tree.selectedItems || []) : [];
                }
                original.apply(this, arguments);
                if (ops.selectionListener) {
                    var paths = [];
                    var selectedNodes = getSelectedNodes();
                    for (var i = 0; i < selectedNodes.length; i++) {
                        var path = selectedNodes[i].getPath();
                        paths.push(path);
                    }
                    ops.selectionListener(paths);
                }
            };
        });

        tree.startup();

        tree.onOpen = function (item) {
            console.log('hina temp: opened item = ' + item.id);
            item.fetchChildren(ops.mount, ops.dirOnly, ops.filter, ops.hideSystemResoureces,
                               function (alreadyFetched) {
                if (alreadyFetched) {
                    console.log('hina temp: already fetched the children of ' + item.id);
                } else {
                    console.log('hina temp: succeeded fetching children of ' + item.id);
                }
            }, function () {
                console.log('hina temp: failed fetching children of ' + item.id);
            });
        };
        tree.selectInitialNodes();

        return tree;
    }

    function checkOptions(ops) {
        if (!ops.mount || !ops.root) {
            throw new Error('Error: mount and root are mandatory to create a file selection dialog');
        }

        if (!('singular' in ops)) {
            ops.singular = true;    // default is true.
        }

        if (!('dirOnly' in ops)) {
            ops.dirOnly = false;    // default is false
        }

        ops.root = pathToId(ops.root);
        if (!isValidAbsPath(ops.root)) {
            throw new Error('Error: root is not a valid absolute path: ' + ops.root);
        }

        if (ops.initialSelection && !(ops.initialSelection instanceof Array)) {
            throw new Error('Error: initialSelection must be an array of strings (absolute paths)');
        }

        var len;
        if (!ops.initialSelection || (len = ops.initialSelection.length) === 0) {
            ops.initialSelection = [ops.root];      // default value
        } else {

            if (ops.singular && ops.initialSelection.length > 1) {
                throw new Error('Error: initialSelection cannot have two or more items when singular');
            }

            for (var i = 0; i < len; i++) {
                var path = ops.initialSelection[i];
                if (!isValidAbsPath(path) || path.indexOf(ops.root)) {
                    throw new Error('Error: an element of initialSelection "' + path +
                                    '" is not a valid absolute paths under the root');
                }
            }
            ops.initialSelection = ops.initialSelection.map(function (path) {
                return pathToId(path);
            });
        }

        if (!('title' in ops)) {
            if (ops.singular) {
                ops.title = ops.dirOnly ? 'Select a Directory' : 'Select a File or Directory';
            } else {
                ops.title = ops.dirOnly ? 'Select Directories' : 'Select Files and/or Directories';
            }
        }

        if (!('hideSystemResources' in ops)) {
            ops.hideSystemResoureces = true;
        }
    }

    var widget = declare(null, {
        constructor: function (dom, ops) {
            checkOptions(ops);
            var idPostfix = '-2s-' + serialNo;
            serialNo++;
            template = template.replace(/<%webida-host%>/g, webidaHost);
            var markup = template.replace(/<%id-postfix%>/g, idPostfix);
            dom.innerHTML = markup;
            initializeTree(ops, idPostfix);
            this.getSelectedPaths = function () {
                var tree = registry.byId('FileSelectionTreeInWidget' + idPostfix);
                var items = tree.selectedItems;
                var paths = [];
                for (var i = 0; i < items.length; i++) {
                    paths.push(items[i].id);
                }
                return paths;
            };
            this.selectPaths = function (paths) {
                var tree = registry.byId('FileSelectionTreeInWidget' + idPostfix);
                tree.selectNodes(paths);
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
        };

        Node.prototype.getParentNode = function () {
            return store.get(this.parent);
        };

        Node.prototype.isDirectory = function () {
            return this.isInternal;
        };

        Node.prototype.addSubnode = function (newNode) {
            try {
                store.put(newNode);
            } catch (e) {
                // ignore TODO: do this
            }
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

        Node.prototype.fetchChildren = function (mount, dirOnly, filter, hideSystemResources, cb, eb) {
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
                                var newNode;
                                var bHide = false;
                                var i;
                                if (stat.isFile) {
                                    if (filter) {
                                        var filterStrings = filter.split(';');
                                        for (i = 0; i < filterStrings.length; i++) {
                                            var filterString = filterStrings[i];
                                            if (!pathUtil.endsWith(stat.name, filterString)) {
                                                bHide = true;
                                            }
                                        }
                                    }
                                    if (dirOnly) {
                                        bHide = true;
                                    }
                                }
                                if (hideSystemResources && !bHide) {
                                    for (i = 0; i < systemResources.length; i++) {
                                        var systemResource = systemResources[i];
                                        if (stat.name === systemResource) {
                                            bHide = true;
                                        }
                                    }
                                }
                                if (!bHide) {
                                    newNode = new Node(self.getPath() + stat.name, stat.isDirectory);
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

    return widget;
});
