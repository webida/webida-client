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
 * @file Workspace is an individual tree for each user in which you can access personal of information.
 * @since 1.0.0
 * @author minsung.jin@samsung.com
 * @author joogwan.kim@samsung.com
 */

/* jshint unused:false */

// @formatter:off
define([
    'webida-lib/app',
    'webida-lib/plugin-manager-0.1',
    //'webida-lib/plugins/workbench/preference-system/store',    // TODO: issue #12055
    'plugins/webida.preference/preference-service-factory',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/webida-0.3',
    'dijit',
    'dijit/registry',
    'dijit/Tree',
    'dijit/tree/ObjectStoreModel',
    'dojo/aspect',
    'dojo/_base/array',
    'dojo/_base/connect',
    'dojo/_base/lang',
    'dojo/_base/declare',
    'dojo/Deferred',
    'dojo/dom',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/dom-geometry',
    'dojo/dom-style',
    'dojo/i18n!./nls/resource',
    'dojo/on',
    'dojo/promise/all',
    'dojo/store/Memory',
    'dojo/store/Observable',
    'dojo/string',
    'dojo/topic',
    'dojo/window',
    './Node',
    'text!./layer/workspace.html',
    'webida-lib/widgets/views/view',
    'webida-lib/util/path',
    'webida-lib/util/loadCSSList',
    'popup-dialog',
    'webida-lib/util/notify',
    'plugins/project-configurator/project-info-service',
    'external/lodash/lodash.min',
    'external/async/dist/async.min',
    'external/URIjs/src/URI',
    'require',
    'webida-lib/plugins/command-system/system/command-system',
    'webida-lib/util/logger/logger-client'
], function (
    ide,
    pluginManager,
    PreferenceFactory,
    workbench,
    webida,
    dijit,
    registry,
    Tree,
    ObjectStoreModel,
    aspect,
    array,
    connect,
    lang,
    declare,
    Deferred,
    dom,
    domAttr,
    domClass,
    domConstruct,
    domGeom,
    domStyle,
    i18n,
    on,
    all,
    Memory,
    Observable,
    string,
    topic,
    win,
    Node,
    markup,
    View,
    pathUtil,
    loadCSSList,
    PopupDialog,
    notify,
    projectInfo,
    _,
    async,
    URI,
    require,
    commandSystem,
    Logger
) {
    'use strict';
// @formatter:on

    var singleLogger = new Logger.getSingleton();
    //var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();
    singleLogger.log('loaded modules required by workspace. initializing workspace plugin\'s module');

    var view, tree;
    var rootNode;
    var workspacePath;
    var syncingWithEditor = false;
    var toggleFlags = {};
    var dragEnterNode = null;
    var fsCache = ide.getFSCache();
    var copied, cut;
    var wvfilterFuncs = [];
    var isTimerInstalled = false;
    var editorsSelection;
    var preferences = PreferenceFactory.get('WORKSPACE');
    var MIME_TYPE_WEBIDA_RESOURCE_PATH = 'text/x-webida-resource-path';
    var extensionPoints = {
        WORKSPACE_NODE_ICONS: 'webida.common.workspace:icons',
        WORKSPACE_NODE_OVERLAY_ICONS: 'webida.common.workspace:overlayIcons'
    };
    var iconsExtensions = pluginManager.getExtensions(extensionPoints.WORKSPACE_NODE_ICONS);
    var overlayIconsExtensions = pluginManager.getExtensions(extensionPoints.WORKSPACE_NODE_OVERLAY_ICONS);
    var defaultFileExtensionIconClassMap = {};
    var defaultFileNameIconClassMap = {};
    var projectTypeFileExtensionIconClassMap = {};
    var projectTypeFileNameIconClassMap = {};
    var stateSetIconClassMap = {};
    var cssFilePathList = [];
    /**
     * Get registry for current page
     * @inner
     */
    function _getPartRegistry() {
        var page = workbench.getCurrentPage();
        return page.getPartRegistry();
    }
    /**
     * Extract path of file for css
     * @param ext
     * @param cssFilePathList
     * @inner
     */
    function _extractCssFilePathList(ext, cssFilePathList) {
        if (typeof ext.iconCssFilePath === 'string') {
            if (ext.iconCssFilePath !== '') {
                var cssPath = URI(ext.iconCssFilePath).absoluteTo(ext.__plugin__.loc + '/').toString();
                var resolvedCssPath = require.toUrl(cssPath);
                cssFilePathList.push(resolvedCssPath);
            }
        } else {
            console.error('Type of iconCssFilePath should be string.');
        }
    }
    /**
     * Get icon class of item
     * @param item
     * @inner
     */
    function getItemIconClass(item) {
        var fileExtensionIconClassMap = defaultFileExtensionIconClassMap;
        var fileNameIconClassMap = defaultFileNameIconClassMap;
        var projectInfoObj = projectInfo.getByPath(item.getPath());
        var projectType = projectInfoObj ? projectInfoObj.type : '';

        if (projectType !== '' && projectTypeFileExtensionIconClassMap.hasOwnProperty(projectType)) {
            fileExtensionIconClassMap = projectTypeFileExtensionIconClassMap[projectType];
            fileNameIconClassMap = projectTypeFileNameIconClassMap[projectType];
        }

        if (fileNameIconClassMap.hasOwnProperty(item.name)) {
            return fileNameIconClassMap[item.name];
        } else if (defaultFileNameIconClassMap.hasOwnProperty(item.name)) {
            return defaultFileNameIconClassMap[item.name];
        } else {
            var fileExt = item.name.indexOf('.') >= 0 ? item.name.split('.').pop() : '';
            if (fileExtensionIconClassMap.hasOwnProperty(fileExt)) {
                return fileExtensionIconClassMap[fileExt];
            } else if (defaultFileExtensionIconClassMap.hasOwnProperty(fileExt)) {
                return defaultFileExtensionIconClassMap[fileExt];
            } else {
                return 'wvFile';
            }
        }
    }
    /**
     * Extract path of file for css
     * @param ext
     */
    iconsExtensions.forEach(function (ext) {
        var projectType = ext.projectType;

        if (typeof projectType === 'string') {

            var targetFileExtensionIconClassMap = null;
            var targetFileNameIconClassMap = null;
            if (projectType === '') {
                targetFileExtensionIconClassMap = defaultFileExtensionIconClassMap;
                targetFileNameIconClassMap = defaultFileNameIconClassMap;
            } else {
                if (!projectTypeFileExtensionIconClassMap.hasOwnProperty(projectType)) {
                    projectTypeFileExtensionIconClassMap[projectType] = {};
                    projectTypeFileNameIconClassMap[projectType] = {};
                }
                targetFileExtensionIconClassMap = projectTypeFileExtensionIconClassMap[projectType];
                targetFileNameIconClassMap = projectTypeFileNameIconClassMap[projectType];
            }

            for (var fileExt in ext.fileExtension) {
                if (typeof fileExt === 'string') {
                    targetFileExtensionIconClassMap[fileExt] = ext.fileExtension[fileExt];
                }
            }

            for (var fileName in ext.specificFileName) {
                if (typeof fileName === 'string') {
                    targetFileNameIconClassMap[fileName] = ext.specificFileName[fileName];
                }
            }
            _extractCssFilePathList(ext, cssFilePathList);
        } else {
            console.error('Type of projectType should be string.');
        }
    });
    /**
     * Extract path of file for css
     * @param ext
     */
    overlayIconsExtensions.forEach(function (ext) {
        for (var stateSet in ext.stateMap) {
            if (typeof stateSet === 'string') {
                stateSetIconClassMap[stateSet] = ext.stateMap[stateSet];
            }
        }
        _extractCssFilePathList(ext, cssFilePathList);
    });
    /**
     * Manage a CSS and a module
     * @member
     */
    loadCSSList(cssFilePathList, function () {
    });
    /**
     * Get a node
     * @param path
     * @method
     */
    function getNode(path) {
        var relPath = path.substr(rootNode.getPath().length);
        return rootNode.getSubnode(relPath);
    }
    /**
     * Select a node
     * @param node
     * @param blockTopic
     * @inner
     */
    function selectNode(node, blockTopic) {
        singleLogger.info('selectNode(node)');
        singleLogger.trace();
        if (typeof node === 'string') {
            node = getNode(node);
        }
        if (!node) {
            return;
        }
        var nodes = tree.getNodesByItem(node);
        if (nodes && nodes.length > 0 && nodes[0] && nodes[0].domNode) {
            tree.dndController.anchor = nodes[0];
            win.scrollIntoView(nodes[0].domNode, domGeom.position(nodes[0].domNode));
            tree.set('paths', [nodes[0].getTreePath()]);
            if (blockTopic !== true) {
                topic.publish('workspace/node/selected', node.getPath());
            }
        }
    }
    /**
     * Get a nodes is expanded
     * @inner
     */
    function getExpandedNodes() {
        var data = tree.model.store.data;
        var expandedNodes = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i] === rootNode) {
                continue;
            }
            var isExpanded = data[i].isExpanded();
            if (isExpanded) {
                expandedNodes.push(data[i].id);
            }
        }
        return expandedNodes;
    }
    /**
     * Get paths of selected node
     * @method
     */
    function getSelectedPaths() {
        var arr = tree ? (tree.selectedItems || []) : [];
        return arr.map(function (i) {
            return i.getPath();
        });
    }
    /**
     * Get the path of selected node
     * @method
     */
    function getSelectedPath() {
        return getSelectedPaths()[0] || null;
    }
    /**
     * Get a selected node
     * @method
     */
    function getSelectedNodes() { // TODO: remove the following and its uses in the IDE
        return tree ? (tree.selectedItems || []) : [];
    }
    function updateMenu() {
        var commandService = commandSystem.service;
        commandService.updateTopMenuModel(function () {
            var model = commandService.getTopMenuModel();
            topic.publish('command-system/menu/update', model.items);
        });
    }
    /**
     * initialize the tree
     * @inner
     */
    function initializeTree() {

        var lastSelected;
        var lastExpanded;
        workspacePath = ide.getPath();

        // get last status
        var lastStatus = ide.registerStatusContributorAndGetLastStatus('workspace', function () {
            var ret = {};

            var selected = getSelectedPath();
            if (selected) {
                ret.selected = pathUtil.detachSlash(selected);
                // TODO: keep multi-selection
            }

            var expanded = getExpandedNodes();
            if (expanded && expanded.length > 0) {
                ret.expanded = expanded;
            }

            return ret;
        });

        if (lastStatus) {
            lastExpanded = lastStatus.expanded;
            lastSelected = lastStatus.selected;
        } else {
            console.warn('Workspace last status was NOT restored');
        }

        rootNode = new Node(workspacePath, true);
        var data = [rootNode];

        // set store and observable
        var store = new Memory();
        //store.setData([tempRoot]);
        store.setData(data);
        store.getChildren = function (node) {
            return this.query({
                parent: node.id
            }, {
                sort: Node.compare
            });
        };
        var observableModel = new Observable(store);

        // set model
        var model = new ObjectStoreModel({
            store: observableModel,
            query: {
                id: workspacePath
            },
            mayHaveChildren: function (node) {
                return node.isInternal;
            }
        });

        var focusedNode = null;

        // Custom TreeNode class (based on dijit.TreeNode) that allows rich text
        // labels
        var TreeNode = declare(Tree._TreeNode, {
            _setLabelAttr: {
                node: 'labelNode',
                type: 'innerHTML'
            }
        });

        // create tree
        tree = new Tree({
            model: model,
            _createTreeNode: function (args) {
                return new TreeNode(args);
            },
            openOnDblClick: true,
            tabindex: 0,
            getIconClass: function (item, opened) {
                //console.log('hina temp: entered getIconClass() with ' + (item ?
                // item.id: item));
                setTimeout(function () {
                    item.updateOverlayIcon();
                }, 0);
                if (!item || item.isInternal) {
                    // directory
                    return (opened ? 'dijitFolderOpened' : 'dijitFolderClosed');
                } else {
                    // file
                    return getItemIconClass(item);
                }
            },

            refreshItemClasses: function () {
                function refreshItemClassesRecursively(treeNode) {
                    treeNode._updateItemClasses(treeNode.item);
                    array.forEach(treeNode.getChildren(), function (childNode) {
                        refreshItemClassesRecursively(childNode);
                    });
                }
                refreshItemClassesRecursively(this.rootNode);
            },

            onDblClick: function (item) {
                if (item) {
                    if (item.isInternal) {
                        var nodes = this.getNodesByItem(item);
                        var node = nodes[0];
                        if (node.isExpanded) {
                            this._collapseNode(node);
                        } else {
                            this._expandNode(node);
                        }
                    } else {
                        topic.publish('editor/open', item.getPath());
                    }
                }
            },

            onBlur: function () {
                if (focusedNode) {
                    $(focusedNode).removeClass('focused');
                }
            },

            checkItemAcceptance: function (target, source) {
                var treeNode = registry.byId(dijit.getEnclosingWidget(target).id);
                if (treeNode && treeNode.item) {
                    var targetNode = treeNode.item;
                    var sourceNode = source.tree.selectedItem;
                    if (targetNode.isInternal && targetNode.id !== sourceNode.parent) {
                        return true;
                    }
                } else {
                    return false;
                }
            },

            onMouseDown: function (event) {
                var id = dijit.getEnclosingWidget(event.target).id;
                if (id === 'wv-tree' || id === 'workspace') {
                    return;
                }

                var treeNode = registry.byId(id);
                if (treeNode && treeNode.domNode) {
                    domAttr.set(treeNode.domNode, 'draggable', 'true');
                }
                if (event.button === 2) {
                    if (treeNode && treeNode.item && treeNode.getTreePath) {
                        var selectedNodes = getSelectedNodes();
                        if (selectedNodes && selectedNodes.length > 0) {
                            var currentNode = treeNode.item;
                            if (selectedNodes.indexOf(currentNode) === -1) {
                                this.set('paths', [treeNode.getTreePath()]);
                                topic.publish('workspace/node/selected', currentNode.getPath());
                            }
                            this.set('lastFocusedChild', treeNode);
                        }
                    }
                } else {
                    this.set('lastFocusedChild', treeNode);
                }
            }
        }, 'wv-tree');

        aspect.after(tree, 'focusNode', function () {
            if (focusedNode) {
                $(focusedNode).removeClass('focused');
            }

            if (tree.focusedChild && tree.focusedChild.rowNode) {
                $(tree.focusedChild.rowNode).addClass('focused');
                focusedNode = tree.focusedChild.rowNode;
            }

            var nodes = tree.selectedNodes;
            if (!nodes || nodes.length < 1) {
                topic.publish('workspace/node/selected/none');
            }
        });

        var dragstartEventHandlerHandle = tree.dndController.events[4][0];
        var selectstartEventHandlerHandle = tree.dndController.events[4][0];
        dragstartEventHandlerHandle.remove();
        selectstartEventHandlerHandle.remove();
        tree.dndController.events[4].splice(0, 1);
        tree.dndController.events[4].splice(0, 1);
        tree.dndController.events.splice(4, 1);

        aspect.around(tree, '_getNext', function () {
            return function (node) {
                if (node.isExpandable && node.isExpanded && node.hasChildren()) {
                    // if this is an expanded node, get the first child
                    var children = node.getChildren();
                    for (var i = 0; i < children.length; i++) {
                        if (children[i].isFocusable()) {
                            return children[i];
                        }
                    }
                    return null;
                    // TreeNode
                } else {
                    // find a parent node with a sibling
                    while (node && node.isTreeNode) {
                        var returnNode = node.getNextSibling();
                        if (returnNode) {
                            while (!returnNode.isFocusable()) {
                                returnNode = returnNode.getNextSibling();
                            }
                            return returnNode;
                            // TreeNode
                        }
                        node = node.getParent();
                    }
                    return null;
                }
            };
        });

        aspect.around(tree, '_onRightArrow', function () {
            return function (event, node) {
                if (node.isExpandable && !node.isExpanded) {
                    this._expandNode(node);
                } else if (node.hasChildren()) {
                    var children = node.getChildren();
                    for (var i = 0; i < children.length; i++) {
                        if (children[i].isFocusable()) {
                            node = children[i];
                            break;
                        }
                    }
                    if (node && node.isTreeNode) {
                        this.focusNode(node);
                    }
                }
            };
        });

        aspect.around(tree, '_onUpArrow', function () {
            return function (event, node) {
                var previousSibling = node.getPreviousSibling();
                if (previousSibling) {
                    while (!previousSibling.isFocusable()) {
                        previousSibling = previousSibling.getPreviousSibling();
                        if (!previousSibling) {
                            break;
                        }
                    }
                }
                if (previousSibling) {
                    node = previousSibling;
                    // if the previous node is expanded, dive in deep
                    while (node.isExpandable && node.isExpanded && node.hasChildren()) {
                        // move to the last child
                        var children = node.getChildren();
                        for (var i = children.length - 1; i >= 0; i--) {
                            if (children[i].isFocusable()) {
                                node = children[i];
                                break;
                            }
                        }
                    }
                } else {
                    // if this is the first child, return the parent
                    // unless the parent is the root of a tree with a hidden root
                    var parent = node.getParent();
                    if (!(!this.showRoot && parent === this.rootNode)) {
                        node = parent;
                    }
                }

                if (node && node.isTreeNode) {
                    this.focusNode(node);
                }
            };
        });

        aspect.around(tree.dndController, 'onClickPress', function () {
            return function (e) {
                // summary:
                //		Event processor for onmousedown/ontouchstart/onkeydown
                // corresponding to a click event
                // e: Event
                //		onmousedown/ontouchstart/onkeydown event
                // tags:
                //		protected

                // ignore mouse or touch on expando node
                if (this.current && this.current.isExpandable && this.tree.isExpandoNode(e.target, this.current)) {
                    return;
                }

                var treeNode = e.type === 'keydown' ? this.tree.focusedChild : this.current;

                if (!treeNode) {
                    // Click must be on the Tree but not on a TreeNode, happens
                    // especially when Tree is
                    // stretched to fill a pane of a BorderContainer, etc.
                    return;
                }

                var copy = connect.isCopyKey(e), id = treeNode.id;

                // if shift key is not pressed, and the node is already in the
                // selection,
                // delay deselection until onmouseup so in the case of DND,
                // deselection
                // will be canceled by onmousemove.
                if (!this.singular && !e.shiftKey && this.selection[id]) {
                    this._doDeselect = true;
                    return;
                } else {
                    this._doDeselect = false;
                }
                this.userSelect(treeNode, copy, e.shiftKey);
            };
        });

        aspect.around(tree.dndController, '_onDragMouse', function (original) {
            return function () {
                if (this.current.item && this.current.item.isInternal) {
                    var currentItem = this.current.item;
                    if (dragEnterNode !== this.current.item) {
                        dragEnterNode = this.current.item;
                        setTimeout(function () {
                            if (dragEnterNode === currentItem) {
                                currentItem.expandItem();
                            }
                        }, 1500);
                    }
                }
                original.apply(this, arguments);
            };
        });

        aspect.around(tree.dndController, 'onMouseUp', function (original) {
            return function () {
                if (this.mouseDown) {
                    dragEnterNode = null;
                }
                original.apply(this, arguments);
            };
        });

        // multi selection limit : all selected nodes have a same parent.
        aspect.around(tree.dndController, 'userSelect', function (original) {
            return function (node, multi, range) {
                if (multi || range) {
                    var anchorItem;
                    if (this.anchor) {
                        anchorItem = this.anchor.item;
                    } else {
                        var nodes = getSelectedNodes();
                        var sel;
                        if (nodes && nodes.length > 0) {
                            sel = nodes[0];
                        }
                        if (sel) {
                            anchorItem = sel;
                        } else {
                            return;
                        }
                    }
                    var currentItem = node.item;
                    if (anchorItem.parent !== currentItem.parent) {
                        return;
                    }

                    // can't range select from below node if selected node was
                    // expanded
                    if (range) {
                        var result = this._compareNodes(this.anchor.rowNode, node.rowNode),
                                     begin, end, anchor = this.anchor;

                        if (result < 0) {//current is after anchor
                            begin = anchor;
                            end = node;
                        } else {//current is before anchor
                            begin = node;
                            end = anchor;
                        }
                        //check everything betweeen begin and end inclusively
                        while (begin !== end) {
                            if (begin.item.isInternal && begin.isExpanded) {
                                return;
                            }
                            begin = this.tree._getNext(begin);
                        }
                    }
                }
                original.apply(this, arguments);
                topic.publish('workspace/node/selected', node.item.getPath());
                updateMenu();
            };
        });

        // context menu handle
        on(tree, 'contextmenu', function (event) {
            var id = dijit.getEnclosingWidget(event.target).id;
            var treeNode = registry.byId(id);
            if (!treeNode || !treeNode.item) {
                // prevent system context menu
                event.preventDefault();
                event.stopPropagation();
            }
        });

        tree.startup();

        if (!lastSelected || rootNode.id === lastSelected) {
            if (lastSelected) {
                workbench.setContext([lastSelected]);
            }
            lastSelected = null;
            selectNode(rootNode);
        }

        tree.onOpen = function (item) {
            var self = this;
            function expandNode() {

                if (!item.isInternal) {
                    return;
                }

                //logger.info('expanding directory "' + item.id + '"');
                item.fetchChildren(function (/*alreadyFetched*/) {
                    //console.log('hina temp: callback of fetchChildren ');
                    /*
                     switch (alreadyFetched) {
                     case 0:
                     logger.info('newly fetched the children of directory "' + item.id + '"');
                     break;
                     case 1:
                     logger.info('already fetched the children of directory "' + item.id + '"');
                     break;
                     case 2:
                     logger.info('already fetched the children of directory (case 2) "' + item.id + '"');
                     break;
                     default:
                     console.assert(false, 'unreachable');
                     }
                     */
                    if (item.isShown()) {
                        var children = self.model.store.getChildren(item);
                        for (var i = 0; i < children.length; i++) {
                            var child = children[i];
                            topic.publish('workspace/node/shown', child.getPath());

                            if (child.isInternal) {
                                child.fetchChildren();
                            }

                            var j;
                            if (lastExpanded && lastExpanded.length > 0 && (j = lastExpanded.indexOf(child.id)) >= 0) {
                                lastExpanded.splice(j, 1);
                                child.expandItem();
                            }

                            if (lastSelected && child.id === lastSelected) {
                                workbench.setContext([lastSelected]);
                                lastSelected = null;
                                selectNode(child);
                            }
                        }
                    }
                });
            }

            if (item.toRefresh) {
                item.toRefresh = false;
                fsCache.refreshHierarchy(item.getPath(), {
                    level: 1
                }, expandNode);
            } else {
                expandNode();
            }
        };

        rootNode.expandItem();
        Node.subscribeToFSEvents();
    }
    /**
     * initialize a drag and a drop
     * @inner
     */
    function initializeDnd() {

        function onDragOver(event) {

            function getDnDCase(types) {

                if (types && types.length) {
                    for (var i = 0; i < types.length; i++) {
                        if (types[i] === MIME_TYPE_WEBIDA_RESOURCE_PATH) {
                            return 'innerToInner';
                        }
                        if (types[i] === 'Files') {
                            return 'outerToInner';
                        }
                    }
                }
                return 'unknown';
            }

            var dt = event.dataTransfer;
            dt.dropEffect = 'none';

            var treeNode = dijit.getEnclosingWidget(event.target);
            if (treeNode && treeNode.item) {

                var target = treeNode.item;
                if (!target.isInternal) {
                    target = target.getParentNode();
                }

                var dragged, c = getDnDCase(dt.types);
                switch (c) {
                    case 'innerToInner':
                        dragged = getSelectedNodes();
                        var droppable = dragged && dragged.length && dragged.every(function (n) {
                            return n !== target && n.getParentNode() !== target && !n.isAncestorOf(target);
                        });
                        if (!droppable) {
                            return;
                        }

                        if (event.ctrlKey) {
                            dt.dropEffect = 'copy';
                        } else {
                            dt.dropEffect = 'move';
                        }

                    /*falls through*/
                    case 'outerToInner':
                        if (c === 'outerToInner') {
                            dt.dropEffect = 'copy';
                        }

                        if (treeNode.item.isInternal) {
                            dragEnterNode = treeNode;
                            if (!isTimerInstalled) {
                                setTimeout(function () {
                                    if (dragEnterNode === treeNode) {
                                        dragEnterNode.item.expandItem();
                                    }
                                }, 1000);
                                isTimerInstalled = true;
                            }
                        } else {
                            var parent = treeNode.item.getParentNode();
                            var nodes = tree.getNodesByItem(parent);
                            if (nodes[0]) {
                                treeNode = nodes[0];
                            }
                        }

                        if (treeNode && treeNode.domNode.className.indexOf('dijitTree') !== -1) {
                            domClass.add(treeNode.domNode.firstChild, 'dijitTreeRowHover');
                        }

                        break;
                    default:
                        // download by dragging falls to this default case.
                        break;
                }
            }
        }

        function onDragLeave(event) {

            var treeNode = dijit.getEnclosingWidget(event.target);
            if (treeNode && treeNode.item) {
                var target = treeNode.item;
                dragEnterNode = null;
                isTimerInstalled = false;
                if (!target.isInternal) {
                    var parent = target.getParentNode();
                    var nodes = tree.getNodesByItem(parent);
                    if (nodes[0]) {
                        treeNode = nodes[0];
                    }
                }

                if (treeNode && treeNode.domNode.className.indexOf('dijitTree') !== -1) {
                    domClass.remove(treeNode.domNode.firstChild, 'dijitTreeRowHover');
                }
            }
        }

        function onDragDrop(event) {

            function uploadContentsOfDataTransfer(targetNode, dt) {

                var type;
                function paste(str) {
                    if (type.indexOf(MIME_TYPE_WEBIDA_RESOURCE_PATH) === 0) {
                        var mode = (dt.dropEffect !== 'move') ? 'copy' : 'move';
                        str = str.substring(0, str.lastIndexOf(':'));
                        var paths = str.split(':');

                        var delimIndex = paths[0].indexOf('/');
                        var srcPath = paths[0].substr(delimIndex);
                        srcPath = pathUtil.detachSlash(srcPath);

                        var srcNodes = [], quit = false;
                        paths.forEach(function (path) {
                            if (quit) {
                                return;
                            }
                            var delimIndex = path.indexOf('/');
                            var srcFsid = path.substring(0, delimIndex);
                            if (srcFsid === ide.getFsid()) {
                                var srcPath = path.substr(delimIndex);
                                srcPath = pathUtil.detachSlash(srcPath);
                                var srcNode = tree.model.store.query({id: srcPath})[0];
                                if (srcNode.getParentNode() === targetNode) {
                                    notify.error(string.substitute(i18n.notifyCannotCopyOrMoveToParentDirectory,
                                                                   {path: srcNode.getPath()}));
                                    quit = true;
                                } else {
                                    srcNodes.push(srcNode);
                                }
                            } else {
                                notify.info(i18n.notifySourceFsidIsDifferentFromTheCurrentOne);
                                quit = true;
                            }
                        });
                        if (!quit && srcNodes.length > 0) {
                            targetNode.paste(srcNodes, mode);
                        }
                    } else {
                        console.log('unhandled type of an item in an DataTransfer object: ' + type);
                    }
                }

                if (event.ctrlKey) {
                    dt.dropEffect = 'copy';
                } else {
                    dt.dropEffect = 'move';
                }

                if (dt.types.length > 0) {
                    if (dt.types[0].indexOf(MIME_TYPE_WEBIDA_RESOURCE_PATH) === 0) {
                        // DnD from the workspace to worksapce
                        type = dt.types[0];
                        paste(dt.getData(MIME_TYPE_WEBIDA_RESOURCE_PATH));
                    } else {
                        // DnD from the outside to worksapce
                        var i, selected = [];
                        if (dt.items && dt.items[0] && dt.items[0].webkitGetAsEntry && dt.items[0].kind === 'file') {

                            // Chrome or future Firefox
                            for (i = 0; i < dt.items.length; i++) {
                                selected.push(dt.items[i].webkitGetAsEntry());
                            }
                            targetNode.upload(selected);
                        } else {

                            // Firefox 31.x
                            for (i = 0; i < dt.files.length; i++) {
                                selected.push(dt.files[i]);
                            }
                            targetNode.upload(selected);
                        }
                    }
                }
            }

            var treeNode = dijit.getEnclosingWidget(event.target);
            if (treeNode && treeNode.item) {
                event.preventDefault();
                event.stopPropagation();

                var targetNode = treeNode.item;
                if (!targetNode.isInternal) {
                    targetNode = targetNode.getParentNode();
                }
                var dt = event.dataTransfer;
                if (dt) {
                    uploadContentsOfDataTransfer(targetNode, dt);
                }

                var item = treeNode.item;
                if (!item.isInternal) {
                    var parent = item.getParentNode();
                    var nodes = tree.getNodesByItem(parent);
                    if (nodes[0]) {
                        treeNode = nodes[0];
                    }
                }

                if (treeNode && treeNode.domNode.className.indexOf('dijitTree') !== -1) {
                    domClass.remove(treeNode.domNode.firstChild, 'dijitTreeRowHover');
                }
            }
        }

        function onDragStart(event) {

            function getDragImageElem(/*nodes*/) {
                var elem = document.createElement('img');
                // just replace the wrong image with a blank pixel image.
                // TODO: use an appropriate image for each cases of nodes
                // (only files, only dirs, or a mixture of files and dirs, etc).
                elem.width = '1';
                elem.height = '1';
                elem.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
                return elem;
            }

            function setContentsForInternalDnD(nodes, dt) {
                var nodePath = '';
                var fsid = ide.getFsid();
                nodes.forEach(function (node) {
                    nodePath += fsid + node.getPath() + ':';
                });
                dt.setData(MIME_TYPE_WEBIDA_RESOURCE_PATH, nodePath);
            }

            function setContentsForExternalDnD(nodes, dt) {
                var len = nodes.length;
                var sources = '';
                var downloadFileName = '';
                //console.log('hina temp: auth token used in download by dragging
                // = ' + authToken);
                if (len > 1) {
                    nodes.forEach(function (node) {
                        sources += node.getPath() + ';';
                    });
                    sources = sources.substring(0, sources.lastIndexOf(';'));
                    downloadFileName = nodes[0].getParentNode().name + '.zip';
                } else {
                    sources = nodes[0].getPath();
                    downloadFileName = nodes[0].name;
                    if (nodes[0].isInternal) {// directory
                        downloadFileName += '.zip';
                    }
                }
                ide.getMount().makeDnDDownloadUrl(
                    (len > 1 || nodes[0].isInternal), sources, downloadFileName,
                    function (err, downloadUrl) {
                    dt.setData('DownloadURL', downloadUrl);
                });
            }

            var nodes = getSelectedNodes();
            if (nodes && nodes.length > 0) {
                var treeNode = dijit.getEnclosingWidget(event.target);
                if (treeNode && treeNode.item) {
                    if (nodes.indexOf(treeNode.item) >= 0) {
                        if (!event.shiftKey && !event.metaKey) {
                            var dt = event.dataTransfer;
                            dt.setDragImage(getDragImageElem(nodes), 0, 0);
                            if (!event.altKey) {
                                dt.effectAllowed = 'copyMove';
                                setContentsForInternalDnD(nodes, dt);
                            } else if (!event.ctrlKey) {
                                dt.effectAllowed = 'copy';
                                setContentsForExternalDnD(nodes, dt);
                            }
                        }
                    }
                }
            }
        }

        var wvTree = dom.byId('wv-tree');
        wvTree.addEventListener('drop', onDragDrop, false);
        wvTree.addEventListener('dragover', onDragOver, false);
        wvTree.addEventListener('dragleave', onDragLeave, false);
        wvTree.addEventListener('dragstart', onDragStart, false);
    }
    /**
     * Remove a node interactively
     * @method
     */
    function removeInteractively() {
        var nodes = getSelectedNodes();
        if (!nodes || !nodes.length) {
            console.warn('Tried to remove no nodes');
            return;
        }

        var paths = [];
        for (var i = 0; i < nodes.length; i++) {
            paths.push(nodes[i].name);
        }
        paths = paths.join(', ');
        var msg = 'Are you sure you want to delete \'' + paths + '\'?';

        PopupDialog.yesno({
            title: 'Delete',
            message: msg,
            type: 'error'
        }).then(function () {
            if (nodes.length > 1) {
                var toDelete = nodes.map(function (n) {
                    return n.getPath();
                });
                toDelete.deleted = [];
                topic.publish('workspace/nodes/deleting', toDelete);
            }
            var parentNode = nodes[0].getParentNode();
            async.each(nodes, function (node, callback) {
                fsCache['delete'](node.id, node.isInternal, function (err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback();
                    }
                });
            }, function (err) {
                if (err) {
                    console.log('Failed to delete (' + err + ')');
                    notify.error(i18n.notifyFailedToDelete);
                } else {
                    if (parentNode) {
                        selectNode(parentNode);
                    }
                    notify.success(i18n.notifyAllFilesHaveBeenDeletedSuccessfully);
                }
            });
        }, function () {
            workbench.focusLastWidget();
        });
    }
    /**
     * Copy a node is selected
     * @method
     */
    function copySelected() {
        var targetNodes = getSelectedNodes();
        if (targetNodes && targetNodes.length > 0 && targetNodes.every(function (node) {
            return !node.isRoot();
        })) {
            copied = targetNodes;
            cut = null;
        }
    }
    /**
     * Cut a node is selected
     * @method
     */
    function cutSelected() {
        var targetNodes = getSelectedNodes();
        if (targetNodes && targetNodes.length > 0 && targetNodes.every(function (node) {
            return !node.isRoot();
        })) {
            copied = null;
            cut = targetNodes;
        }
    }
    /**
     * Paste a node is selected
     * @method
     */
    function pasteToSelected() {
        var targetNodes = getSelectedNodes();
        if (targetNodes && targetNodes.length === 1) {// TODO: remove length 1
            // constraint later
            var targetNode = targetNodes[0];
            if (!targetNode.isInternal) {
                targetNode = targetNode.getParentNode();
            }
            if (targetNode) {
                if (copied && cut) {
                    console.assert(false, 'copied and cut simultaneously when pasting');
                } else if (copied || cut) {
                    var srcs = copied || cut;
                    if (targetNode === srcs[0].getParentNode()) {
                        srcs.forEach(function (value) {
                            value.duplicate();
                        });
                    } else {
                        targetNode.paste(srcs, copied ? 'copy' : 'move');
                    }
                    if (cut) {
                        cut = null;
                    }
                }
            }
        }
    }
    /**
     * Verify that the node is exist
     * @method
     */
    function exists(path) {
        var relPath = path.substr(rootNode.getPath().length);
        return !!rootNode.getSubnode(relPath);
    }
    /**
     * Get a root path
     * @method
     */
    function getRootPath() {
        return rootNode.getPath();
    }
    /**
     * Expand ancestors
     * @param path
     * @method
     */
    function expandAncestors(path) {

        function expandAncestorInner(node, segments) {

            var deferred = new Deferred();
            node.expandItem().then(function (result) {
                if (result === true) {
                    if (segments.length > 0) {
                        var s = node.getSubnode(segments[0]);
                        if (s) {
                            segments.shift();
                            expandAncestorInner(s, segments).then(function (val) {
                                deferred.resolve(val);
                            });
                        } else {
                            deferred.resolve(node.getPath() + ' does not have a child named ' + segments[0]);
                        }
                    } else {
                        deferred.resolve(true);
                    }
                } else {
                    deferred.resolve(result);
                }
            });

            return deferred;
        }

        var segments = _.compact(path.split('/'));
        if (segments.length > 1) {
            console.assert(segments[0] === rootNode.name);
            segments.pop();
            segments.shift();
            return expandAncestorInner(rootNode, segments);
        }
    }
    /**
     * Upload a files
     * @param path
     * @param files
     * @method
     */
    function upload(path, files) {
        var targetNode = getNode(path);
        return targetNode.upload(files);
    }
    /**
     * Initialize a editor for focus
     * @method
     */
    function initializeSyncEditorFocus() {
        topic.subscribe('part/editor/selected', function (oldPart, newPart) {
            if (!newPart) {
                return;
            }
            var persistence = newPart.getDataSource().getPersistence();
            var path = persistence.getPath();
            if (syncingWithEditor) {
                expandAncestors(path).then(function (result) {
                    if (result === true) {
                        var node = tree.model.store.get(path);
                        if (node) {
                            selectNode(node, true);
                        } else {
                            notify.error(string.substitute(i18n.notifyNoSuchFile, {path: path}));
                        }
                    } else {
                        notify.error(string.substitute(i18n.notifyErrorWhileExpandingTo,
                                                       {path: path, result: result}));
                    }
                });
            }
            editorsSelection = path;
        });

        topic.subscribe('part/container/removed', function (container) {
            var dataSource = container.getDataSource();
            if (dataSource && dataSource.getPersistence()) {
                if (editorsSelection === dataSource.getPersistence().getPath()) {
                    editorsSelection = null;
                }
            }
        });

        // File should be shown for the following cases
        // 1) The file has been opened already (Part exists in the registry)
        // 2) If the file is opened, the part should be hidden.
        // TODO : Can workspace view plugin know PartRegistry and EditorPart?
        topic.subscribe('workspace/node/selected', function (path) {
            if (syncingWithEditor && !pathUtil.isDirPath(path) && getSelectedNodes().length === 1) {
                var partRegistry = _getPartRegistry();
                var dsRegistry = workbench.getDataSourceRegistry();
                var dataSource = dsRegistry.getDataSourceById(path);
                if (dataSource) {
                    var parts = partRegistry.getPartsByDataSource(dataSource);
                    if (parts.length > 0) {
                        var currentPart = _getPartRegistry().getCurrentEditorPart();
                        var currentPath = currentPart.getDataSource().getId();
                        if (path !== currentPath) {
                            topic.publish('editor/open', path);
                        }
                    }
                }
            }
        });
    }
    /**
     * Create a item
     * @param options
     * @inner
     */
    function createItem(options) {
        var toolbar = dom.byId('wv-toolbar');
        var item = domConstruct.create('div');
        if (options.isToggle) {
            toggleFlags[options.id] = options.toggled;
        }

        // default tooltip
        var tooltip = '';
        if (options.isToggle) {
            tooltip = (toggleFlags[options.id] === true) ? options.tooltip.toggle : options.tooltip.normal;
        } else {
            tooltip = options.tooltip.normal;
        }
        domAttr.set(item, 'rel', 'tooltip');
        domAttr.set(item, 'title', tooltip);

        // default icon
        if (options.isToggle) {
            if (toggleFlags[options.id]) {
                domClass.replace(item, options.iconNormal + 'Toggled');
            } else {
                domClass.replace(item, options.iconNormal);
            }
        } else {
            domClass.replace(item, options.iconNormal);
        }

        // default position & default cursor
        domStyle.set(item, 'width', '20px');
        domStyle.set(item, 'height', '20px');
        domStyle.set(item, 'float', 'right');
        domStyle.set(item, 'margin-left', '0px');
        domStyle.set(item, 'cursor', 'pointer');
        domStyle.set(item, 'margin-top', '4px');
        domStyle.set(item, 'margin-right', '4px');

        on(item, 'mouseover', function () {
            if (options.isToggle) {
                if (toggleFlags[options.id]) {
                    domClass.replace(item, options.iconHover + 'Toggled');
                } else {
                    domClass.replace(item, options.iconHover);
                }
            } else {
                domClass.replace(item, options.iconHover);
            }
        });
        on(item, 'mouseout', function () {
            if (options.isToggle) {
                if (toggleFlags[options.id]) {
                    domClass.replace(item, options.iconNormal + 'Toggled');
                } else {
                    domClass.replace(item, options.iconNormal);
                }
            } else {
                domClass.replace(item, options.iconNormal);
            }
        });
        on(item, 'mousedown', function () {
            if (options.isToggle) {
                toggleFlags[options.id] = !toggleFlags[options.id];
                var tooltip = (toggleFlags[options.id] === true) ? options.tooltip.toggle : options.tooltip.normal;
                domAttr.set(item, 'rel', 'tooltip');
                domAttr.set(item, 'title', tooltip);

                if (toggleFlags[options.id]) {
                    domClass.replace(item, options.iconPushed + 'Toggled');
                } else {
                    domClass.replace(item, options.iconPushed);
                }
            } else {
                domClass.replace(item, options.iconPushed);
            }
            item._mousePushed = true;
        });
        on(item, 'mouseup', function () {
            item.mousepushed = false;
            if (options.isToggle) {
                if (toggleFlags[options.id]) {
                    domClass.replace(item, options.iconNormal + 'Toggled');
                } else {
                    domClass.replace(item, options.iconNormal);
                }
            } else {
                domClass.replace(item, options.iconNormal);
            }
        });
        on(item, 'click', function () {
            options.onClick();
        });

        toolbar.appendChild(item);
    }
    /**
     * Initialize the toolbar
     * @inner
     */
    function initializeToolbar() {

        var lastStatus = ide.registerStatusContributorAndGetLastStatus('workspace:Toolbar', function () {
            var ret = {};
            ret.syncingWithEditor = syncingWithEditor;
            return ret;
        });

        if (lastStatus) {
            syncingWithEditor = lastStatus.syncingWithEditor;
        }

        createItem({
            id: 'sync',
            iconNormal: 'wvIconSyncNormal',
            iconPushed: 'wvIconSyncClicked',
            iconHover: 'wvIconSyncHover',
            isToggle: true,
            toggled: !syncingWithEditor,
            tooltip: {
                normal: i18n.toolBarTootipStopSync,
                toggle: i18n.toolBarTootipSyncWithEditor
            },
            onClick: function () {
                syncingWithEditor = !syncingWithEditor;
                if (syncingWithEditor && editorsSelection) {
                    expandAncestors(editorsSelection).then(function (result) {
                        if (result === true) {
                            var node = tree.model.store.get(editorsSelection);
                            if (node) {
                                selectNode(node);
                            } else {
                                notify.error(string.substitute(i18n.notifyNoSuchFileInTheWorkspace,
                                                               {selection: editorsSelection}));
                            }
                        } else {
                            notify.error(string.substitute(i18n.notifyErrorWhileExpandingToSelection,
                                                           {selection: editorsSelection, result: result}));
                        }
                    });
                }
            }
        });
        createItem({
            id: 'collapseall',
            iconNormal: 'wvIconCollapseAll',
            iconPushed: 'wvIconCollapseAll',
            iconHover: 'wvIconCollapseAll',
            isToggle: false,
            tooltip: {
                normal: i18n.toolBarTooltipCollapseAll,
                toggle: i18n.toolBarTooltipCollapseAll
            },
            onClick: function () {
                tree.collapseAll();
            }
        });
    }
    /**
     * Initialize the focus
     * @inner
     */
    function initializeFocus() {
        topic.subscribe('workspace/node/selected', function () {
            var nodes = getSelectedNodes();
            if (nodes && nodes.length > 0) {
                var paths = [];
                nodes.forEach(function (node) {
                    paths.push(node.id);
                });
                workbench.setContext(paths);
            }
        });
    }
    /**
     * Initialize the filtering
     * @inner
     */
    function initializeFiltering() {
        function hideNodes(filterFunc, bHide) {
            var data = tree.model.store.data;
            data.forEach(function (elem) {
                if (filterFunc(elem)) {
                    if (bHide) {
                        elem.hide();
                    } else {
                        elem.show();
                    }
                }
            });
        }

        function filterDotResources(node) {
            if (node.name.indexOf('.') === 0) {
                return true;
            } else {
                return false;
            }
        }

        function filterIDEResources(node) {
            if (node.name === '.workspace' || node.name === '.project') {
                return true;
            } else {
                return false;
            }
        }

        var filters = {
            filterFuncs: {
                'workspace:filter:.*': filterDotResources,
                'workspace:filter:.w.p': filterIDEResources
            },
            'workspace:filter:.*': false,
            'workspace:filter:.w.p': true
        };

        function isFiltered(node) {
            var len = wvfilterFuncs.length;
            for (var i = 0; i < len; i++) {
                if (wvfilterFuncs[i](node)) {
                    return true;
                }
            }
            return false;
        }

        function filter(path) {
            var node = getNode(path);
            if (isFiltered(node)) {
                node.hide();
            }
        }

        function applyPreferences(values, contextInfo) {
            function addFilterFunc(func) {
                wvfilterFuncs.push(func);
                hideNodes(func, true);
            }

            function removeFilterFunc(func) {
                var i = wvfilterFuncs.indexOf(func);
                wvfilterFuncs.splice(i, 1);
                hideNodes(func, false);
            }

            for (var key in values) {
                if (key.indexOf('workspace:filter:') === 0) {
                    if (values[key]) {
                        addFilterFunc(filters.filterFuncs[key]);
                    } else {
                        removeFilterFunc(filters.filterFuncs[key]);
                    }
                }
            }
        }

        function initPreferences() {
            preferences.getValues('workspace.preference', function (values) {
                var isHidden = values['workspace:filter:.*'];
                var isSystemRes = values['workspace:filter:.w.p'];
                if (isHidden === undefined || isHidden === null) {
                    isHidden = filters['workspace:filter:.*'];
                }
                if (isSystemRes === undefined || isSystemRes === null) {
                    isSystemRes = filters['workspace:filter:.w.p'];
                }
                filters['workspace:filter:.*'] = isHidden;
                filters['workspace:filter:.w.p'] = isSystemRes;
                applyPreferences(values);
            });
            /*var isHidden = preferences.getValue('workspace:filter:.*');
            var isSystemRes = preferences.getValue('workspace:filter:.w.p');
            if (isHidden === undefined || isHidden === null) {
                isHidden = filters['workspace:filter:.*'];
            }
            if (isSystemRes === undefined || isSystemRes === null) {
                isSystemRes = filters['workspace:filter:.w.p'];
            }
            filters['workspace:filter:.*'] = isHidden;
            filters['workspace:filter:.w.p'] = isSystemRes;
            var keys = Object.keys(filters);
            keys.forEach(function (key) {
                if (key !== 'filterFuncs') {
                    applyPreferences(filters[key], key);
                }
            });*/
        }
        /*function applyPreferences(value, id) {
            function addFilterFunc(func) {
                wvfilterFuncs.push(func);
                hideNodes(func, true);
            }

            function removeFilterFunc(func) {
                var i = wvfilterFuncs.indexOf(func);
                wvfilterFuncs.splice(i, 1);
                hideNodes(func, false);
            }

            filters[id] = value;

            if (value) {
                addFilterFunc(filters.filterFuncs[id]);
            } else {
                removeFilterFunc(filters.filterFuncs[id]);
            }
        }*/

        //console.log('addLoadedListener');
        //preferences.addLoadedListener(function () {
        initPreferences();
        preferences.addFieldChangeListener('workspace.preference', applyPreferences);
            //preferences.addFieldChangeListener('workspace:filter:.*', applyPreferences);
            //preferences.addFieldChangeListener('workspace:filter:.w.p', applyPreferences);
        //});
        topic.subscribe('workspace/node/shown', filter);
    }
    /**
     * Create a node interactively
     * @method
     */
    function createNodeInteractively(path, kind) {
        var node = getNode(path);
        if (node) {
            node.createInteractively(kind);
        } else {
            throw new Error('assertion fail: unreachable');
        }
    }
    /**
     * Duplicate a node
     * @param path
     * @method
     */
    function duplicateNode(path) {
        var node = getNode(path);
        if (node) {
            node.duplicate();
        } else {
            throw new Error('assertion fail: unreachable');
        }
    }
    /**
     * Verify that a node is expanded
     * @param path
     * @method
     */
    function isExpandedNode(path) {
        var node = getNode(path);
        if (node) {
            return node.isExpanded();
        } else {
            throw new Error('assertion fail: unreachable');
        }
    }
    /**
     * Collpase a node
     * @param path
     * @method
     */
    function collapseNode(path) {
        var node = getNode(path);
        if (node) {
            return node.collapseItem();
        } else {
            throw new Error('assertion fail: unreachable');
        }
    }
    /**
     * Expand a node
     * @param path
     * @method
     */
    function expandNode(path) {
        var node = getNode(path);
        if (node) {
            return node.expandItem();
        } else {
            throw new Error('assertion fail: unreachable');
        }
    }
    /**
     * Refresh a node recursively
     * @param path
     * @param blink
     */
    function refreshRecursively(path, blink) {
        var node = getNode(path);
        if (node) {
            return node.refresh(blink);
        } else {
            throw new Error('assertion fail: unreachable');
        }
    }
    /**
     * Rename a node interactively
     * @param path
     * @param newName
     * @method
     */
    function renameNodeInteractively(path, newName) {
        var node = getNode(path);
        if (node) {
            node.renameInteractively(newName);
        } else {
            throw new Error('assertion fail: unreachable');
        }
    }
    /**
     * Set a node for overlay icon
     * @param path
     * @param stateSet
     * @param state
     * @method
     */
    function setNodeOverlayIconInfo(path, stateSet, state) {
        var node = getNode(path);
        if (node) {
            node.setOverlayIconInfo(stateSet, state);
        } else {
            throw new Error('assertion fail: unreachable');
        }
    }
    /**
     * Get a node for overlay icon
     * @param path
     * @param stateSet
     * @method
     */
    function getNodeOverlayIconInfo(path, stateSet) {
        var node = getNode(path);
        if (node) {
            if (stateSetIconClassMap.hasOwnProperty(stateSet)) {
                return node.overlayIconInfo[stateSet];
            } else {
                return undefined;
            }

        } else {
            throw new Error('assertion fail: unreachable');
        }
    }
    /**
     * Get the path of children
     * @param path
     * @method
     */
    function getChildrenPaths(path) {
        var node = getNode(path);
        if (node) {
            return (node.getSubnodes() || []).map(function (n) {
                return n.getPath();
            });
        } else {
            throw new Error('assertion fail: unreachable');
        }
    }
    /**
     * @module workspaceView
     */
    var workspaceView = {
        // for webida.common.workbench:views extension point
        getView: function () {
            if (!view) {
                view = new View('workspaceView', 'Workspace');
                view.setContent(domConstruct.toDom(markup));
            }
            return view;
        },

        // for webida.common.workbench:views extension point
        onViewAppended: function () {
            function _loadCss(url) {
                var link = document.createElement('link');
                link.type = 'text/css';
                link.rel = 'stylesheet';
                link.href = url;
                document.getElementsByTagName('head')[0].appendChild(link);
            }

            _loadCss(require.toUrl('webida-lib/plugins/workspace/style/wv.css'));

            initializeTree();
            initializeFocus();
            initializeToolbar();
            initializeDnd();
            initializeSyncEditorFocus();
            initializeFiltering();

            var opt = {};
            opt.title = 'Workspace';
            opt.key = 'W';
            workbench.registToViewFocusList(view, opt);

            topic.subscribe('view.selected', function (event) {
                var view = event.view;
                if (view.getId() === 'workspaceView') {
                    tree.focus();
                }
            });

            topic.subscribe('project/config/changed', function () {
                tree.refreshItemClasses();
            });
            topic.subscribe('project/config/load-completed', function () {
                tree.refreshItemClasses();
            });
            topic.subscribe('workspace/node/status/changed', function (path, stateSet, state) {
                setNodeOverlayIconInfo(path, stateSet, state);
            });
            updateMenu();
        },

        // copy, cut, and paste
        copySelected: copySelected,
        cutSelected: cutSelected,
        pasteToSelected: pasteToSelected,
        isCopiedOrCut: function () {
            return copied || cut;
        },
        getSelectedPath: getSelectedPath,
        getSelectedPaths: getSelectedPaths,
        getRootPath: getRootPath,
        exists: exists,
        createNodeInteractively: createNodeInteractively,
        duplicateNode: duplicateNode,
        isExpandedNode: isExpandedNode,
        collapseNode: collapseNode,
        expandNode: expandNode,
        refreshRecursively: refreshRecursively,
        getNodeOverlayIconInfo: getNodeOverlayIconInfo,
        getChildrenPaths: getChildrenPaths,
        removeInteractively: removeInteractively,
        renameNodeInteractively: renameNodeInteractively,
        selectNode: selectNode,
        expandAncestors: expandAncestors,
        upload: upload,
        getStateSetIconClassMap: function () {
            return stateSetIconClassMap;
        }
    };

    singleLogger.log('initialized workspace plugin\'s module');

    return workspaceView;
});
