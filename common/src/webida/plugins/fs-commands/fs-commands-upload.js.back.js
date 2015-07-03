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
 * webida - file handle plugin
 *
 */

define(['other-lib/underscore/lodash.min',          // _
        'webida-lib/app',                           // ide
        'webida-lib/util/path',                           // pathUtil
        'external/async/dist/async.min',                                // async
        'webida-lib/util/arrays/BubblingArray',     // BubblingArray
        'webida-lib/plugins/workspace/plugin',                 // wv
        'webida-lib/plugins/workbench/plugin',      // workbench
        './CheckBoxTree',                           // CheckBoxTree
        'text!./layer/searchFilesForm.html',        // sFilesForm
        'text!./layer/filesSelectForm.html',        // fSelectForm
        'text!./layer/goToFile.html',               // goToFileForm
        'dojo',                                     // dojo
        'dojo/dom',                                 // dom
        'dojo/dom-class',                           // domClass
        'dojo/aspect',                              // aspect
        'dojo/topic',                               // topic
        'dojo/Deferred',                            // Deferred
        'dojo/store/Memory',                        // Memory
        'dojo/store/Observable',                    // Observable
        'dijit/tree/ObjectStoreModel',              // ObjectStoreModel
        'dijit/Tree',                               // Tree
        'dijit/registry',                           // reg
        'dijit/Tooltip',                            // Tooltip
        'other-lib/toastr/toastr',                  // Toastr
        'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',   // ButtonedDialog
        'webida-lib/widgets/dialogs/file-selection/FileSelDlg2States'  // FileDialog
        ],
function (_,
          ide,
           pathUtil,
          async,
          BubblingArray,
          wv,
          workbench,
          CheckBoxTree,
          sFilesForm,
          fSelectForm,
          goToFileForm,
          dojo,
          dom,
          domClass,
          aspect,
          topic,
          Deferred,
          Memory,
          Observable,
          ObjectStoreModel,
          Tree,
          reg,
          Tooltip,
          toastr,
          ButtonedDialog,
          FileDialog
         )
{
    'use strict';

    //console.log('hina: Loading fs-commands module');

    var fsMount = ide.getFSCache();

    //
    // handlers for folder commands
    //

    /**
     * Definitions relating to 'Upload to' command.
     */
    function handleUploadFiles() {
        function getIconClass(isDir, selection, opened) {
            switch (selection) {
            case 'selected':
                return isDir ? (opened ? 'selDirSelectedExpanded' : 'selDirSelectedCollapsed') : 'selFileSelected';
            case 'deselected' :
                return isDir ? (opened ? 'selDirDeselectedExpanded' : 'selDirDeselectedCollapsed') :
                                'selFileDeselected';
            case 'partial' :
                return isDir ? (opened ? 'selDirPartialExpanded' : 'selDirPartialCollapsed') : '';
            }
        }

        function getNode(store) {
            var Node = function (id, name, type, entry, pID) {
                this.id = id;
                this.name = name;
                this.type = type;
                this.entry = entry;
                this.parent = pID;
                this.selection = 'selected';
                this.size = 0;
                this.subDirCnt = 0;
                this.subFileCnt = 0;
                this.isInternal = (type === 'Dir' ? true : false);
            };

            Node.prototype.getSubnodes = function () {
                var queryResult = store.query({ parent: this.id });
                return queryResult;
            };

            Node.prototype.getSelectedAndPartialNodes = function (info) {
                if (!info) {
                    info = {selected: [], partial: []};
                }

                var partialSubNodes = store.query({ parent: this.id,
                                                    selection: 'partial' });
                info.partial = _.union(info.partial, partialSubNodes);
                _.each(partialSubNodes, function (sNode) {
                    var pNode = sNode.getParentNode();
                    info.partial = _.filter(info.partial, function (n) {
                        return n.id !== pNode.id;
                    });

                    var i = sNode.getSelectedAndPartialNodes(info);
                    info.partial = _.union(info.partial, i.partial);
                    info.selected = _.union(info.selected, i.selected);
                });

                var selectSubNodes = store.query({ parent: this.id,
                                                   selection: 'selected' });
                info.selected = _.union(info.selected, selectSubNodes);

                return info;
            };

            Node.prototype.getRecursiveDeselectedSubnodesInfo = function () {
                var info = { size: 0, dirCnt: 0, fileCnt: 0 };

                // partial nodes
                var partialSubNodes = store.query({ parent: this.id,
                                                    selection: 'partial' });
                _.each(partialSubNodes, function (sNode) {
                    var i = sNode.getRecursiveDeselectedSubnodesInfo();
                    info.size += i.size;
                    info.dirCnt += i.dirCnt;
                    info.fileCnt += i.fileCnt;
                });

                // deslected nodes
                var deselectSubNodes = store.query({ parent: this.id,
                                                     selection: 'deselected' });
                _.each(deselectSubNodes, function (sNode) {
                    info.size += sNode.size;
                    info.dirCnt += sNode.subDirCnt + (sNode.isInternal ? 1 : 0);
                    info.fileCnt += sNode.subFileCnt + (sNode.isInternal ? 0 : 1);
                });

                return info;
            };

            Node.prototype.updateRecursiveParentNodeInfo = function (size, dCnt, fCnt) {
                size = !size ? 0 : size;
                dCnt = !dCnt ? 0 : dCnt;
                fCnt = !fCnt ? 0 : fCnt;

                var pNode = this.getParentNode();
                if (pNode) {
                    pNode.size += size;
                    pNode.subDirCnt += dCnt;
                    pNode.subFileCnt += fCnt;
                    pNode.updateRecursiveParentNodeInfo(size, dCnt, fCnt);
                }
            };

            Node.prototype.getParentNode = function () {
                return store.get(this.parent);
            };

            Node.prototype.addSubNode = function (newNode) {
                store.add(newNode);

                var size = 0, dCnt = 0, fCnt = 0;
                if (this.isInternal) {
                    dCnt = 1;
                } else {
                    fCnt = 1;
                }
                this.updateRecursiveParentNodeInfo(size, dCnt, fCnt);
            };

            return Node;
        }

        if (!window.File || !window.FileReader) {
            toastr.error('The File APIs are not supported in this browser.');
            return;
        }

        var nodes = wv.getSelectedNodes();
        var targetNode = nodes && nodes[0];
        if (!targetNode) {
            toastr.error('Upload target is not selected.');
            return;
        }

        var bShownInfoTree = false;

        // upload file dialog
        var handleUploadFilesDlg = new ButtonedDialog({
            buttons: [
                {
                    caption: 'Upload',
                    methodOnClick: 'uploadFiles'
                },
                {
                    caption: 'Cancel',
                    methodOnClick: 'hide'
                }
            ],
            methodOnEnter: 'uploadFiles',

            _showErrMessage: function (msg) {
                var el = $('#pvContentsWarningPane');
                if (!!el) {
                    el.css('color', 'red')
                    .css('width', $('#pvUploadFilesInfoTopPane').width())
                    .text(msg)
                    .fadeIn(1000)
                    .fadeOut(5000);
                }
            },

            uploadFiles: function () {
                var that = this;
                function callUploadFile(uploadItems) {
                    // upload file
                    var entries = [];
                    _.each(uploadItems.selected, function (node) {
                        if (!!node.entry) {
                            entries.push(node.entry);
                        }
                    });
                    entries = _.uniq(entries);
                    targetNode.upload(entries);

                    that.hide();
                }

                var store = this._tree.model.store;
                if (store) {
                    var item = store.getRootItem();
                    var uploadItems = item.getSelectedAndPartialNodes();

                    if (uploadItems.partial && uploadItems.partial.length > 0) {
                        var paths = [];
                        _.each(uploadItems.partial, function (o) {
                            var path = (o.id.charAt(0) === '/' ? o.id.substr(1, o.id.length) : o.id);
                            paths.push(path);
                        });

                        // create partial directory
                        paths = _.uniq(paths);
                        targetNode.createMultipleDirectory(paths).then(
                            function (/*result*/) {
                                callUploadFile(uploadItems);
                            },
                            function (err) {
                                that._showErrMessage(err);
                            }
                        );
                    } else if (uploadItems.selected && uploadItems.selected.length > 0) {
                        callUploadFile(uploadItems);
                    } else {
                        toastr.error('No selection');
                    }
                }

                return;
            },

            title: 'Upload Files',
            refocus: false,
            selected : [],
            _self: null,
            _tree: null,
            _fileCnt: 0,
            _dirCnt: 0,
            _allSize: 0,
            _getSizeInfo: function (byte) {
                var sizesType = ['Byte', 'KB', 'MB', 'GB', 'TB'];
                var byteString = byte.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') +
                    ' ' + sizesType[0];
                var calString = byteString;

                if (byte === 0) {
                    return calString + ' (' + byteString + ')';
                }
                var i = parseInt(Math.floor(Math.log(byte) / Math.log(1024)));
                calString = Math.round((byte / Math.pow(1024, i)).toPrecision(3)) + ' ' + sizesType[i];

                return calString + ' (' + byteString + ')';
            },

            _updateInfo: function () {
                var _self = handleUploadFilesDlg._self;
                $('#pvContentsCnt').text(' -Files ' + _self._fileCnt +
                                         ', Directories ' + _self._dirCnt);
                $('#pvContentsSize').text(' -Size ' + _self._getSizeInfo(_self._allSize));
            },

            _createUploadFileTree: function () {
                if (!this._tree) {
                    // checkboxtree
                    var store = new Memory({
                        data: [
                            //{ id: 'root', name: 'root', type: 'Dir'}
                        ],
                        getRootItem: function () {
                            return this.getItem('root');
                        },
                        getItem: function (id) {
                            return this.query({id: id})[0];
                        },
                        getChildren: function (object) {
                            return this.query({parent: object.id});
                        },
                        isAllSelected: function () {
                            return this.query({selection: 'deselected'}).length > 0 ? false : true;
                        }
                    });

                    aspect.around(store, 'put', function (originalPut) {
                        return function (obj, options) {
                            if (options && options.parent) {
                                obj.parent = options.parent.id;
                            }
                            return originalPut.call(store, obj, options);
                        };
                    });

                    var observable = new Observable(store);

                    var model = new ObjectStoreModel({
                        store: observable,
                        query: {id: 'root'},
                        mayHaveChildren: function (item) {
                            var result = store.query({ parent: item.id });
                            return (result.total > 0 || item.type === 'Dir');
                        }
                    });

                    var Node = getNode(observable);
                    var rootNode = new Node('root', 'root', 'Dir');
                    observable.add(rootNode);

                    var tree = new CheckBoxTree({
                        id: 'uploadFileDialogTree',
                        model: model,
                        showRoot: false,
                        getIconClass: function (item, opened) {
                            item.isInternal = this.model.mayHaveChildren(item);
                            if (item) {
                                return getIconClass(item.isInternal, item.selection, opened);
                            } else {
                                return '';
                            }

                            return (!item || this.model.mayHaveChildren(item)) ?
                                (opened ? 'dijitFolderOpened' : 'dijitFolderClosed') : 'dijitLeaf';
                        },

                        getNodeByItem: function (item) {
                            var nodes = this.getNodesByItem(item);
                            return nodes && nodes[0];
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

                        selectAll : function () {
                            var that = this;
                            var item = that.model.store.getRootItem();
                            item.selection = 'deselected';
                            that.changeSelection(item);
                        },

                        clearAll : function () {
                            var that = this;
                            var item = that.model.store.getRootItem();
                            item.selection = 'selected';
                            that.changeSelection(item);
                        },

                        changeSelection : function (item) {
                            var parentNode;
                            var children;
                            var self = this;
                            var that = handleUploadFilesDlg._self;
                            switch (item.selection) {
                            case 'selected':
                                item.selection = 'deselected';
                                this.updateIcon(item);

                                var el = reg.byId('pvSelectOrClearCheckBox');
                                var checked = el.get('checked');
                                if (!!checked) {
                                    el.set('checked', false);
                                }

                                if (item.id !== 'root') {
                                    that._allSize -= item.size;
                                    that._dirCnt -= item.subDirCnt + (item.isInternal ? 1 : 0);
                                    that._fileCnt -= item.subFileCnt + (item.isInternal ? 0 : 1);
                                } else {
                                    that._allSize = 0;
                                    that._dirCnt = 0;
                                    that._fileCnt = 0;
                                }
                                that._updateInfo();

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
                                var info = item.getRecursiveDeselectedSubnodesInfo();
                                that._allSize += info.size;
                                that._dirCnt += info.dirCnt;
                                that._fileCnt += info.fileCnt;

                            case 'deselected':
                                if (item.selection === 'deselected') {
                                    if (item.id !== 'root') {
                                        that._allSize += item.size;
                                        that._dirCnt += item.subDirCnt + (item.isInternal ? 1 : 0);
                                        that._fileCnt += item.subFileCnt + (item.isInternal ? 0 : 1);
                                    } else {
                                        that._allSize = item.size;
                                        that._dirCnt = item.subDirCnt;
                                        that._fileCnt = item.subFileCnt;
                                    }
                                }
                                that._updateInfo();

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

                                // all selected then checkbox checked
                                if (!!this.model.store.isAllSelected()) {
                                    reg.byId('pvSelectOrClearCheckBox').set('checked', true);
                                }
                                break;
                            }
                        },
                    });
                    tree.dndController.singular = true;
                    tree.dndController.isSource = false;

                    aspect.around(tree.dndController, 'userSelect', function () {
                        return function (node) {
                            tree.changeSelection(node.item);
                        };
                    });

                    tree.placeAt('pvListOfSelectedPane');
                    tree.startup();

                    $('#uploadFileDialogTree').bind('DOMSubtreeModified', function () {
                        var childNodes = store.getChildren({id: 'root'});
                        var el = reg.byId('pvSelectOrClearCheckBox');

                        if (childNodes.length > 0 && el.get('disabled')) {
                            el.setAttribute('disabled', false);
                            $('#pvSelectOrClearCheckBoxText').css('color', 'black');
                            $('#uploadFileDialogTree').unbind('DOMSubtreeModified');
                        }
                    });

                    this._tree = tree;
                }

                return this._tree;
            },

            onHide: function (/*event*/) {
                handleUploadFilesDlg.destroyRecursive();
                workbench.focusLastWidget();
            },

            _getFileInfo : function (entry) {
                var _self = handleUploadFilesDlg._self;
                if (entry && entry.file) {
                    entry.file(
                        function (f) {
                            _self._allSize += f.size;
                            _self._updateInfo();

                            var store = _self._tree.model.store;
                            if (store) {
                                var item = store.getItem(entry.fullPath);
                                item.size = f.size;
                                item.updateRecursiveParentNodeInfo(f.size);
                            }
                        }
                    );
                }
            },
            _getDirectoryInfo : function (entry) {
                console.log('mira > Directory : ', entry.name, entry.fullPath);
                var _self = handleUploadFilesDlg._self;
                var pID = entry.fullPath;
                var reader = entry.createReader ? entry.createReader() : null;
                if (reader) {
                    // get sub directory and files entry
                    reader.readEntries(function (entries) {
                        _.each(entries, function (entry) {
                            _self._getDetailInfoAndAddToTree(entry, pID);
                        });
                    }, function (err) {
                        console.log(err);
                    });
                }
            },
            _getDetailInfoAndAddToTree: function (entry, pID) {
                var _self = handleUploadFilesDlg._self;

                if (!!entry && !!pID) {
                    var type = entry.isDirectory ? 'Dir' : 'File';
                    var o = {
                        id: entry.fullPath,
                        name: entry.name,
                        type: type,
                        sel: entry,
                        parent: pID
                    };

                    var Node = getNode(_self._tree.model.store);
                    var newNode = new Node(o.id, o.name, o.type, o.sel, o.parent);
                    newNode.addSubNode(newNode);
                    //tree.model.store.add();

                    switch (type) {
                    case 'Dir':
                        _self._dirCnt++;
                        _self._getDirectoryInfo(entry);
                        break;
                    case 'File':
                        _self._fileCnt++;
                        _self._getFileInfo(entry);
                        break;
                    }

                    _self._updateInfo();
                }
            },
            onDragDrop: function (event) {
                var selected = this.selected;

                event.stopPropagation();
                event.preventDefault();

                var dt = event.dataTransfer;
                var items = dt.items;
                var itemsLen = items.length;
                var bSupportFSAPI = false;
                var tree = null;

                // check support w3c filesystem API
                if (items[0]) {
                    bSupportFSAPI = items[0].webkitGetAsEntry ? true : false;
                    if (bSupportFSAPI) {
                        $('#pvContentsSimpleInfoPane').fadeIn();
                    }
                    tree = this._createUploadFileTree();
                }

                // collect
                for (var i = 0; i < itemsLen; i++) {
                    var item = items[i], sel;
                    if (item.kind === 'file') {
                        sel = bSupportFSAPI ? item.webkitGetAsEntry() : item.getAsFile();
                        if (sel) {
                            // check already drop in item
                            if (selected.some(function (s) {
                                return sel.name === s.name;
                            })) {
                                var errTxt = sel.name + '" as one of the already selected ones.';
                                this._showErrMessage(errTxt);
                                return;
                            } else {
                                // get detail info
                                if (bSupportFSAPI) {
                                    this._getDetailInfoAndAddToTree(sel, 'root');
                                }

                                selected.push(sel);
                            }
                        } else {
                            console.log(false);
                        }
                    }
                }
            }, // onDragDrop

            onBrowse : function () {
                var rootPath = wv.getRootPath();
                var dlg = new FileDialog({
                    mount : fsMount,
                    root: rootPath,
                    initialSelection: [targetNode.id],
                    title: 'Select a target directory',
                    singular: true,
                    dirOnly: true
                });
                dlg.open(function (selected) {
                    if (!!selected && _.isArray(selected) && selected.length > 0) {
                        var defaultTargetLocation = selected[0];
                        targetNode = wv.getNode(defaultTargetLocation);
                        $('#pvTargetInputBox').val(defaultTargetLocation);
                    }
                });
            }, // onBrowse

            onCheckBoxClick: function () {
                var that = this;
                var el = reg.byId('pvSelectOrClearCheckBox');
                var checked = el.get('checked');

                if (!!checked) {
                    that._tree.selectAll();
                } else if (!checked) {
                    that._tree.clearAll();
                }
            }, // onCheckBoxChange

            onLoad: function (/*data*/) {
                var that = this;

                // default value setting
                var el = reg.byId('pvTargetInputBox');
                el.setValue(targetNode.id);

                el = reg.byId('pvSelectOrClearCheckBox');
                el.setAttribute('disabled', true);
                el.on('click', dojo.hitch(that, that.onCheckBoxClick));

                el = $('#pvSelectOrClearCheckBoxText');
                el.css('color', 'gray');

                // event bind, browse button
                var browseBt = reg.byId('pvTargetBrowseBt');
                dojo.connect(browseBt, 'onClick', that.onBrowse);

                // event bind, normal element
                $('#drop_zone').on('dragover', function (evt) {
                    evt.stopPropagation();
                    evt.preventDefault();

                    if (!!evt.originalEvent &&
                        !!evt.originalEvent.dataTransfer &&
                        !!evt.originalEvent.dataTransfer.dropEffect) {
                        // Explicitly show this is a copy.
                        evt.originalEvent.dataTransfer.dropEffect = 'copy';
                    }
                }).on('drop', function (evt) {
                    if (!!evt.originalEvent) {
                        that.onDragDrop(evt.originalEvent);
                    }

                    if (!bShownInfoTree) {
                        bShownInfoTree = true;
                        $('#info_pane').fadeIn();
                    }
                    $('#drop_pane').fadeOut();

                    evt.stopPropagation();
                    evt.preventDefault();
                }).on('dragleave', function (evt) {
                    if (!!evt.originalEvent) {
                        var x = evt.originalEvent.x;
                        var y = evt.originalEvent.y;
                        var el = document.elementFromPoint(x, y);

                        if (el.id !== 'drop_zone_text' &&
                            el.id !== 'drop_zone' &&
                            !!bShownInfoTree) {
                            $('#drop_pane').fadeOut();
                        }
                    }

                    evt.stopPropagation();
                    evt.preventDefault();
                });

                $('#info_pane').on('dragenter', function (evt) {
                    $('#drop_pane').fadeIn();

                    evt.stopPropagation();
                    evt.preventDefault();
                });

                $('#pvFileInputBox').on('change', function (evt) {
                    var files = evt.target.files;
                    var mockEvt = {
                        stopPropagation: function () {},
                        preventDefault: function () {},
                    };
                    mockEvt.dataTransfer = {};
                    mockEvt.dataTransfer.items = [];
                    $.each(files, function (idx, file) {
                        var name = file.name;
                        var fn = function () {
                            // FileEntry {filesystem: DOMFileSystem,
                            // fullPath: "/webida-test.jar", name: "webida-test.jar", isDirectory: false, isFile: true…}
                            return {
                                name: name,
                                fullPath: '/' + name,
                                isDirectory: false,
                                isFile: true,
                                file: function (cb/*, errCb*/) {
                                    cb(file);
                                }
                            };
                        };
                        mockEvt.dataTransfer.items.push({
                            kind: 'file',
                            webkitGetAsEntry: fn,
                            getAsFile: fn
                        });
                    });
                    that.onDragDrop(mockEvt);
                    if (!bShownInfoTree) {
                        bShownInfoTree = true;
                        $('#info_pane').fadeIn();
                    }
                    $('#drop_pane').fadeOut();
                });
            } // onLoad
        });
        handleUploadFilesDlg._self = handleUploadFilesDlg;
        handleUploadFilesDlg.setContentArea(fSelectForm);
        handleUploadFilesDlg.show();
    }

    var module = {
        handleUploadFiles: handleUploadFiles,
    };

    return module;
});
