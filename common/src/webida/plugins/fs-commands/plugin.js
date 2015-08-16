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

// @formatter:off
define([
    'webida-lib/plugins/workspace/plugin', // wv
    'webida-lib/plugins/editors/ExtensionManager', //ExtensionManager
    'external/lodash/lodash.min', //_
    'dojo/topic', // topic
    'webida-lib/util/path', // pathUtil
    'webida-lib/util/logger/logger-client',
    'plugins/webida.notification/notification-message' // Toastr
], function(
    wv,
    ExtensionManager,
    _,
    topic,
    pathUtil,
    Logger,
    toastr
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    var extensionManager = ExtensionManager.getInstance();
    var openWithEditorNames = [];
    var openWithParts = [];

    var module = {

        getViableItemsForWorkbenchAtFile: function() {
            var items = {
                '&Download Files': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleDownloadZip'],
                'Duplica&te': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleDuplicate']
            };

            // TODO: deselect the above items according to the selected nodes at
            // workspace.
            var selPaths = wv.getSelectedPaths();
            if (selPaths && selPaths.length > 0) {

                // 'Refresh' and 'Upload File' when every selected node is a
                // directory
                if (selPaths.every(function(path) {
                    return pathUtil.isDirPath(path);
                })) {
                    items['&Refresh'] = ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleRefresh'];
                    //items['&Upload Files'] =
                    // [ 'cmnd',
                    // 'webida-lib/plugins/fs-commands/fs-commands-upload',
                    // 'handleUploadFiles' ];
                }

                if (selPaths.length === 1) {
                    // 'Rename' when exactly one node is selected
                    items['Ren&ame'] = ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleRename'];

                    // 'New File' and 'New Directory' working on selected one
                    // node, And node is directory
                    var selPath = selPaths[0];
                    if (pathUtil.isDirPath(selPath)) {
                        items['&New'] = {};
                        items['&New']['&File'] = ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleNewFile'];
                        items['&New']['&Directory'] = ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleNewFolder'];
                    }
                }

                // 'Open File' when every selected node is a file
                if (selPaths.every(function(path) {
                    return !pathUtil.isDirPath(path);
                })) {
                    items['Open &File'] = ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleEdit'];
                }
            }

            return items;
        },

        getViableItemsForWorkbenchAtFind: function() {
            var items = {
                '&Find in Files': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'findInCurDir']
            };

            var paths = wv.getSelectedPaths();
            if (paths && paths.length === 1 && pathUtil.isDirPath(paths[0])) {
                return items;
            }

            return null;
        },

        getViableItemsForWorkbenchAtNavigate: function() {
            var items = {
                'Go to &File': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'gotoFileInCurDir']
            };

            var paths = wv.getSelectedPaths();
            if (paths && paths.length === 1 && pathUtil.isDirPath(paths[0])) {
                return items;
            }

            return null;
        },

        getOpenWithEditorsArray: function() {
            return openWithEditorNames;
        },

        getOpenWithParts: function() {
            return openWithParts;
        },

        getViableItemsForWorkspaceView: function() {
            var paths = wv.getSelectedPaths();
            var i = 0;
            var ext;

            // processing for open with
            openWithEditorNames = [];
            openWithParts = [];
            if (paths && paths.length > 0 && paths.every(function(n) {
                return !pathUtil.isDirPath(n);
            })) {
                var availableExtensions = extensionManager.getExtensionsForType(pathUtil.getFileExt(paths[0]));
                for ( i = 0; i < paths.length; i++) {
                    if (i > 0) {
                        if (availableExtensions) {
                            var availableExtensions2 = extensionManager.getExtensionsForType(pathUtil.getFileExt(paths[i]));
                            if (availableExtensions2) {
                                availableExtensions = _.intersection(availableExtensions, availableExtensions2);
                            } else {
                                availableExtensions = null;
                            }
                        } else {
                            break;
                        }
                    }
                }

                if (availableExtensions) {
                    for ( i = 0; i < availableExtensions.length; i++) {
                        ext = availableExtensions[i];
                        openWithEditorNames.push(ext.name);
                        openWithParts.push(ext.__plugin__.loc + '/' + ext.editorPart);
                    }
                }
            }

            var candidateItemSets = [
            // Open
            {
                isApplicableTo: function(paths) {
                    return paths.length > 0 && (paths.every(function(n) {
                        return !pathUtil.isDirPath(n);
                    }) || paths.every(function(n) {
                        return pathUtil.isDirPath(n);
                    }));
                },
                items: {
                    'Open': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleOpen']
                }
            },

            // Open with
            {
                isApplicableTo: function(paths) {
                    return paths.length > 0 && paths.every(function(n) {
                        return !pathUtil.isDirPath(n);
                    });
                },
                items: {
                    'Open with': ['enum', 'webida-lib/plugins/fs-commands/fs-commands', 'handleOpenWith', openWithEditorNames]
                }
            },

            // items for multiple selection
            {
                isApplicableTo: function(paths) {
                    return paths.length > 1;
                },
                items: {
                    //'Properti&es':
                    // [ 'cmnd', 'webida-lib/plugins/fs-commands/fs-commands',
                    // 'handleFileProperties' ],
                    'Dow&nload': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleDownloadZip']
                }
            }, {
                isApplicableTo: function(paths) {
                    return paths.length > 1 && paths.every(function(p) {
                        return pathUtil.getLevel(p) !== 1;
                    });
                },
                items: {
                    '&Copy': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleCopy'],
                    'Cu&t': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleCut'],
                    '&Delete': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleDelete']
                }
            },

            // items for single selection
            // folder items
            {
                isApplicableTo: function(paths) {
                    return paths.length === 1 && pathUtil.isDirPath(paths[0]);
                },
                items: {
                    'New': {
                        '&File': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleNewFile'],
                        '&Directory': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleNewFolder']
                    },
                    'Dow&nload': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleDownloadZip']
                }
            }, {
                isApplicableTo: function(paths) {
                    // folder && not workspace && not project
                    return paths.length === 1 && pathUtil.isDirPath(paths[0]) && (pathUtil.getLevel(paths[0]) !== 1);
                },
                items: {
                    //'Properti&es':
                    // [ 'cmnd', 'webida-lib/plugins/fs-commands/fs-commands',
                    // 'handleFileProperties' ],
                    'Dup&licate': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleDuplicate'],
                    '&Copy': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleCopy'],
                    'Cu&t': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleCut']
                }
            }, {
                isApplicableTo: function(paths) {
                    return paths.length === 1 && wv.isCopiedOrCut();
                },
                items: {
                    '&Paste': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handlePaste']
                }
            }, {
                isApplicableTo: function(paths) {
                    return paths.length === 1 && pathUtil.isDirPath(paths[0]) && pathUtil.getLevel(paths[0]) !== 1;
                    // folder && not workspace && not project
                },
                items: {
                    '&Delete': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleDelete'],
                    'Ren&ame': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleRename']
                }
            }, {
                isApplicableTo: function(paths) {
                    return paths.length === 1 && pathUtil.isDirPath(paths[0]);
                },
                items: {
                    //'&Upload Files':
                    // [ 'cmnd',
                    // 'webida-lib/plugins/fs-commands/fs-commands-upload',
                    // 'handleUploadFiles' ],
                    'Refres&h': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleRefresh'],
                    '&Find in Files': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'findInCurDir'],
                    'Go to File': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'gotoFileInCurDir']
                }
            },

            // file items
            {
                isApplicableTo: function(paths) {
                    return paths.length === 1 && !pathUtil.isDirPath(paths[0]);
                },
                items: {
                    //'Properti&es':
                    // [ 'cmnd', 'webida-lib/plugins/fs-commands/fs-commands',
                    // 'handleFileProperties' ],
                    'Dup&licate': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleDuplicate'],
                    '&Copy': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleCopy'],
                    'Cu&t': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleCut'],
                    '&Delete': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleDelete'],
                    'Refres&h': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleRefresh'],
                    'Ren&ame': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleRename'],
                    'Dow&nload': ['cmnd', 'webida-lib/plugins/fs-commands/fs-commands', 'handleDownloadZip']
                }
            }];

            // TODO: remove the following (too much complicated)
            function accumulateItems(target, source) {
                Object.keys(source).forEach(function(key) {
                    var val = source[key];
                    if (val) {
                        var valType = ( val instanceof Array) ? 'array' : typeof val;
                        if (valType === 'array') {
                            if (target[key]) {
                                toastr.error('This plug-in has a duplicate or inconsistent key: ' + key);
                                throw new Error();
                            } else {
                                target[key] = val;
                            }
                        } else if (valType === 'object') {
                            if (target[key]) {
                                if ( typeof target[key] === 'object') {
                                    accumulateItems(target[key], val);
                                } else {
                                    toastr.error('This plug-in has an inconsistent command hierarchy at ' + key);
                                    throw new Error();
                                }
                            } else {
                                accumulateItems(target[key] = {}, val);
                            }
                        } else if (val === '---') {
                            if (target[key]) {
                                toastr.error('This plug-in has a duplicate or inconsistent key: ' + key);
                                throw new Error();
                            } else {
                                target[key] = val;
                            }
                        } else {
                            toastr.error('Invalid specification of items at key ' + key + 'in the plug-in');
                            throw new Error();
                        }
                    } else {
                        toastr.error('Invalid specification of items at key ' + key + 'in the plug-in');
                        throw new Error();
                    }
                });
            }

            if (paths && paths.length > 0) {
                var items = {};
                var iEnd = candidateItemSets.length;
                for ( i = 0; i < iEnd; i++) {
                    var candidateItemSet = candidateItemSets[i];
                    if (candidateItemSet.isApplicableTo(paths)) {
                        if (candidateItemSet.items['Open with']) {
                            if (openWithEditorNames.length > 0) {
                                accumulateItems(items, candidateItemSet.items);
                            }
                        } else {
                            accumulateItems(items, candidateItemSet.items);
                        }
                    }
                }

                var itemOpen;
                if (( itemOpen = items.Open)) {
                    if (pathUtil.isDirPath(paths[0])) {
                        if (paths.every(function(p) {
                            return wv.isExpandedNode(p);
                        })) {
                            itemOpen.alternateLabel = 'Collapse';
                        } else if (paths.every(function(p) {
                            return !wv.isExpandedNode(p);
                        })) {
                            itemOpen.alternateLabel = 'Expand';
                        } else {
                            itemOpen.alternateLabel = 'Expand or Collapse';
                        }
                    } else {
                        itemOpen.alternateLabel = '&Open File';
                    }
                }

                return items;
            } else {
                return null;
            }
        },

        onNodeSelected: function(path) {
            setTimeout(function() {// Without this setTimeout, the following
                // getSelectedPaths sometimes wrongly returns an empty array
                // when the IDE starts and a node is selected for the first time.
                // Maybe this setTimeout has the effect of waiting for the
                // Workspace view tree to be, say, stabilized.
                var paths = wv.getSelectedPaths();
                if (paths.length === 1 && pathUtil.isDirPath(paths[0])) {
                    topic.publish('toolbar.newfile.enable');
                    topic.publish('toolbar.findinfiles.enable');
                    topic.publish('toolbar.gotofile.enable');
                } else {
                    topic.publish('toolbar.newfile.disable');
                    topic.publish('toolbar.findinfiles.disable');
                    topic.publish('toolbar.gotofile.disable');
                }
            }, 1);
        }
    };

    return module;
});
