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
 * This plug-in manages EditorParts
 *
 * @see EditorPart
 */

// @formatter:off
define([
    'dojo/topic',
    'text!./ext-to-mime.json',
    'external/lodash/lodash.min',
    'external/URIjs/src/URI',
    'webida-lib/app',
    'webida-lib/util/path',
    'webida-lib/util/arrays/BubblingArray',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/notify',
    'webida-lib/plugin-manager-0.1',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/plugins/workbench/ui/EditorPart',
    'webida-lib/plugins/workbench/ui/PartContainer',
    'webida-lib/plugins/workbench/ui/Workbench',
    'webida-lib/widgets/views/view',
    'webida-lib/widgets/views/viewmanager',
    'webida-lib/widgets/views/viewFocusController',
    'external/async/dist/async.min',
    'plugins/webida.notification/notification-message',
    'plugins/webida.workspace.model.file/FileDataSource', //TODO : temp for 7.21
    './CompatibleTabPartContainer',
    './EditorManager'
], function (
    topic, 
    extToMime, 
    _, 
    URI, 
    ide, 
    pathUtil, 
    BubblingArray,
    Logger, 
    notify,
    pm, 
    workbench, 
    EditorPart,
    PartContainer,
    Workbench,
    View, 
    vm, 
    ViewFocusController,  
    async, 
    toastr,
    FileDataSource,
    CompatibleTabPartContainer,
    EditorManager
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    logger.log('loaded modules required by editors. initializing editors plugin');

    var editorManager = EditorManager.getInstance();

    function getFileManager() {// TODO: remove publish().
        var FileManager = {};
        var spaces = {
            '0': '',
            '1': ' ',
            '2': '  ',
            '3': '   ',
            '4': '    '
        };

        FileManager.saveFile = function(file, option) {
            logger.info('FileManager.saveFile(' + file + ', option)');
            function getSpaces(n) {
                if (spaces[n] === undefined) {
                    return (spaces[n] = ( n ? ' ' + getSpaces(n - 1) : ''));
                } else {
                    return spaces[n];
                }
            }

            var path = file.path;

            var value = editors.getPart(file).getValue();
            if (value === undefined) {// TODO: make this check unnecessary.
                throw new Error('tried to save a file "' + file.path + '" + whose value is not yet set');
            }

            console.assert(file.viewer);
            var viewer = file.viewer;

            if (viewer.trimTrailingWhitespaces || viewer.insertFinalNewLine || viewer.retabIndentations) {
                var v = value;
                if (viewer.trimTrailingWhitespaces && v.match(/( |\t)+$/m)) {
                    v = v.replace(/( |\t)+$/mg, '');
                }
                if (viewer.insertFinalNewLine && v.match(/.$/)) {
                    v = v + '\n';
                    // TODO: consider line ending mode
                }
                if (viewer.retabIndentations) {
                    //var spaces = getSpaces(viewer.options.indentUnit);
                    var unit = viewer.options.indentUnit, re = /^(( )*)\t/m, m;
                    while (( m = v.match(re))) {
                        v = v.replace(re, '$1' + getSpaces(unit - (m[0].length - 1) % unit));
                    }
                }

                if (v !== value) {
                    var cursor = viewer.getCursor();
                    var scrollInfo = viewer.getScrollInfo();
                    value = v;
                    viewer.setValue(value);
                    viewer.setCursor(cursor);
                    viewer.scrollToScrollInfo(scrollInfo);
                }
            }

            fsCache.writeFile(path, value, function(error) {
                if (error) {
                    toastr.error('Failed to write file "' + path + '" (' + error + ')');
                    editors.onFileError(file);
                } else {
                    file.getContents(value);
                    var editorPart = editors.getPart(file);
                    if (editorPart && editorPart.markClean) {
                        editorPart.markClean();
                    }

                    topic.publish('file.saved', file);

                    if (option && option.callback) {
                        option.callback();
                    }
                }
            });
        };

        return FileManager;
    }

    function subscribeToTopics() {

        function onSingleDeletion(path) {
            require(['popup-dialog'], function(PopupDialog) {
                PopupDialog.yesno({
                    title: 'Close "' + pathUtil.getFileName(path) + '"?',
                    message: 'File "' + path + '" was deleted. ' + 'Is it OK to close the editor tab for the file?'
                }).then(function() {
                    editors.closeFile({
                        path: path,
                        force: true
                    });
                }, function() {
                });
            });
        }

        function onMultiDeletion(paths) {
            var openedFilePaths = Object.keys(editors.files);
            var toClose = openedFilePaths.filter(function(p) {
                return paths.some(function(deleted) {
                    if (pathUtil.isDirPath(deleted)) {
                        return p.indexOf(deleted) === 0;
                    } else {
                        return p === deleted;
                    }
                });
            });

            if (toClose.length === 0) {
                return;
            }

            if (toClose.length === 1) {
                onSingleDeletion(toClose[0]);
                return;
            }

            require(['webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog'], function(ButtonedDialog) {
                var answer = {};
                async.eachSeries(toClose, function(filePath, cb) {
                    var file = editors.getFile(filePath);
                    if (file) {
                        var part = editors.getPart(file);
                        if (part.isDirty()) {
                            if (answer.yesToModified || answer.noToModified) {
                                if (answer.yesToModified) {
                                    editors.closeFile({
                                        path: filePath,
                                        force: true
                                    });
                                }
                                cb(null);
                                return;
                            }
                        } else {
                            if (answer.yesToUnmodified || answer.noToUnmodified) {
                                if (answer.yesToUnmodified) {
                                    editors.closeFile({
                                        path: filePath,
                                        force: true
                                    });
                                }
                                cb(null);
                                return;
                            }
                        }

                        var modified = part.isDirty();
                        var qualifier = modified ? 'Modified' : 'Unmodified';
                        var title = 'Close ' + qualifier + ' "' + pathUtil.getFileName(filePath) + '"?';
                        var msg = ['File "' + filePath + '" was deleted.', 'Is it OK to close the ' + qualifier.toLowerCase() + ' editor tab for the file?'];
                        msg = msg.join('</span><br><span>');

                        var dialog = new ButtonedDialog({
                            title: title,
                            //buttonsWidth: '120px',
                            buttons: [{
                                caption: 'Yes',
                                methodOnClick: 'onYes'
                            }, {
                                caption: 'Yes to All',
                                methodOnClick: 'onYesToAll'
                            }, {
                                caption: 'No',
                                methodOnClick: 'hide'
                            }, {
                                caption: 'No to All',
                                methodOnClick: 'onNoToAll'
                            }],
                            methodOnEnter: null,
                            onYes: function() {
                                editors.closeFile({
                                    path: filePath,
                                    force: true
                                });
                                this.hide();
                            },
                            onYesToAll: function() {
                                if (modified) {
                                    answer.yesToModified = true;
                                } else {
                                    answer.yesToUnmodified = true;
                                }
                                this.onYes();
                            },
                            onNoToAll: function() {
                                if (modified) {
                                    answer.noToModified = true;
                                } else {
                                    answer.noToUnmodified = true;
                                }
                                this.hide();
                            },
                            onHide: function() {
                                dialog.destroyRecursive();
                                workbench.focusLastWidget();
                                cb(null);
                            }
                        });
                        dialog.setContentArea('<span>' + msg + '</span>');
                        dialog.show();
                    } else {
                        cb(null);
                    }
                }, function() {
                });
            });
        }


        topic.subscribe('fs.cache.node.deleted', function(fsUrl, dir, name, type, movedTo) {

            function fileMoved(src, dst) {
                var file = editors.getFile(src);
                if (file) {
                    if (isDir) {
                        file.path = dst;
                        editors.removeFile(src);
                        editors.removePart(file);
                        editors.addFile(dst, file);
                    } else {
                        var newName = pathUtil.getFileName(dst);
                        var oldExt = pathUtil.getFileExt(file.name);
                        var newExt = pathUtil.getFileExt(newName);
                        if (oldExt === newExt) {
                            file.setPath(dst);
                            editors.removeFile(src);
                            editors.removePart(file);
                            editors.addFile(dst, file);
                            editors.refreshTabTitle(editors.getDataSource(file));
                        } else {

                            var view = vm.getView(file.viewId);
                            var vc = view.getParent();
                            var viewContainers = editors.splitViewContainer.getViewContainers();

                            var cellIndex = viewContainers.indexOf(vc);
                            console.assert(cellIndex >= 0);

                            var siblingList = [];
                            vc.getViewList().forEach(function(view) {
                                var f = editors.getFileByViewId(view.getId());
                                siblingList.push(f.path);
                            });
                            var idx = siblingList.indexOf(src);
                            siblingList.splice(idx, 0, dst);

                            var cursor = editors.getCursor(file);

                            topic.publish('#REQUEST.openFile', dst, {
                                cellIndex: cellIndex,
                                siblingList: siblingList,
                                show: editors.currentFile === file,
                                cursor: cursor
                            });

                            editors.closeFile({
                                path: src
                            });
                        }
                    }
                }
            }

            var isDir = type === 'dir';

            if (movedTo) {

                var src = dir + name;
                var dst = movedTo;

                if (isDir) {
                    if (!pathUtil.isDirPath(src)) {
                        src = src + '/';
                    }
                    if (!pathUtil.isDirPath(dst)) {
                        dst = dst + '/';
                    }
                    var paths = Object.keys(editors.files);
                    _.each(paths, function(path) {
                        if (path.substr(0, src.length) === src) {
                            var relpath = path.substr(src.length);
                            fileMoved(src + relpath, dst + relpath);
                        }
                    });
                } else {
                    fileMoved(src, dst);
                }
            } else {
                var path = dir + name + ( isDir ? '/' : '');
                var multiDel = getMultiDeletion(path);
                if (multiDel) {
                    console.assert(multiDel.deleted.indexOf(path) < 0);
                    multiDel.deleted.push(path);
                    if (multiDel.length === multiDel.deleted.length) {
                        var i = multipleDeletions.indexOf(multiDel);
                        if (i >= 0) {
                            multipleDeletions.splice(i, 1);
                            if (multiDel.deleted.length > 0) {
                                onMultiDeletion(multiDel.deleted);
                            }
                        } else {
                            console.assert(false, 'assertion fail: unreachable');
                        }
                    }
                } else if (isDir) {
                    onMultiDeletion([path]);
                } else {
                    Object.keys(editors.files).forEach(function(p) {
                        if (p === path) {
                            onSingleDeletion(p);
                        }
                    });
                }
            }
        });

        topic.subscribe('fs.cache.file.invalidated', function(fsURL, path) {
            var file = editors.getFile(path);
            if (file) {
                if (file === editors.currentFile) {
                    fsCache.refreshFileContents(path);
                } else {
                    file.toRefresh = true;
                }
            }
        });

        topic.subscribe('fs.cache.file.set', function(fsUrl, target, reason) {
            if (reason === 'refreshed') {
                var file = editors.getFile(target);
                if (file) {
                    if (file === editors.currentFile) {
                        _.defer(askAndReload.bind(null, file));
                    } else {
                        file.toAskAndReload = true;
                    }
                }
            }
        });

        topic.subscribe('workspace.nodes.deleting', function(paths) {
            multipleDeletions.push(paths);
            setTimeout(function() {
                var i = multipleDeletions.indexOf(paths);
                if (i >= 0) {
                    multipleDeletions.splice(i, 1);
                    if (paths.deleted.length > 0) {
                        onMultiDeletion(paths.deleted);
                    }
                } else {
                    console.assert(false, 'assertion fail: unreachable');
                }
            }, 10000);
        });

        topic.subscribe('#REQUEST.openFile', editorManager.requestOpen.bind(editorManager));
        topic.subscribe('#REQUEST.closeFile', editors.closeFile.bind(editors));
        topic.subscribe('#REQUEST.saveFile', editors.saveFile.bind(editors));
        topic.subscribe('#REQUEST.selectFile', function(path) {
            if (editors.getFile(path)) {
                topic.publish('#REQUEST.openFile', path);
            }
        });

        // TODO: remove the following subscriptions
        topic.subscribe('file.saved', editors.onFileSaved.bind(editors));
    }

    var multipleDeletions = [];
    function getMultiDeletion(path) {
        var filtered = multipleDeletions.filter(function(md) {
            return md.indexOf(path) >= 0;
        });

        if (filtered.length > 1) {
            console.assert(false, 'assertion fail: unreachable');
            return null;
        } else {
            return filtered[0] || null;
        }
    }


    topic.publish('editors.clean.current');
    topic.publish('editors.clean.all');

    var fsCache = ide.getFSCache();
    var fm = getFileManager();
    extToMime = JSON.parse(extToMime);

    var asked = [];
    function askAndReload(file) {
        require(['popup-dialog'], function(PopupDialog) {
            if (asked.indexOf(file) === -1) {
                console.assert(asked.length === 0, 'assertion fail: only one file is asked to reload at any point of time');
                asked.push(file);
                PopupDialog.yesno({
                    title: 'Reload File',
                    message: file.path + '<br><br>' + 'File \'' + file.name + '\' has changed. <br>' + 'Do you want to reload?',
                    type: 'warning'
                }).then(function() {
                    asked.pop();
                    topic.publish('#REQUEST.openFile', file.getPersistenceId());
                }, function() {
                    asked.pop();
                });
            }
        });
    }

    /** @module editors */
    var editors = {
        splitViewContainer: null,
        editorTabFocusController: new ViewFocusController({
            'Title': 'title',
            'Path': 'path'
        }),
        editorExtensions: pm.getExtensions('webida.common.editors:editor'),
        files: {},
        currentFile: null,
        currentFiles: new BubblingArray(),
        recentFiles: new BubblingArray(20), // keep history of 20 files
        onloadPendingFilesCount: 0,
        parts: new Map()
    };

    editors.setCurrentFile = function(file) {
        logger.trace();
        logger.info('editors.setCurrentFile(' + file + ')');

        if (editors.currentFile !== file) {
            var view;
            if (editors.currentFile) {
                view = vm.getView(editors.currentFile.viewId);
                if (view) {
                    workbench.unregistFromViewFocusList(view);
                    // TODO: do it with an extension and an extension point
                }
            }
            if (file) {
                view = vm.getView(file.viewId);
                if (view) {
                    var opt = {};
                    opt.title = 'Editor';
                    opt.key = 'E';
                    workbench.registToViewFocusList(view, opt);
                }
            }

            editors.currentFile = file;

            if (file) {
                editors.currentFiles.put(file);
                editors.recentFiles.put(file.path);
                if (file.tabTitle && file.tabTitle.indexOf('*') === 0) {
                    topic.publish('editors.dirty.current');
                } else {
                    topic.publish('editors.clean.current');
                }

                var editorPart = editors.getPart(file);
                if (editorPart) {
                    editorPart.focus(editors.currentFile);
                }

                if (file.toRefresh) {
                    file.toRefresh = false;
                    fsCache.refreshFileContents(file.path);
                }

                if (file.toAskAndReload) {
                    file.toAskAndReload = false;
                    _.defer(askAndReload.bind(null, file));
                }
                topic.publish('editors.selected', file.path, file);
            } else {
                topic.publish('editors.nofile.current');
            }
        }
    };

    editors.ensureCreated = function(file, bShowAndFocus, cb) {
        logger.info('ensureCreated()');
        function showAndFocus(file) {
            var editorPart = editors.getPart(file);
            if (editorPart) {
                editorPart.show();
                editorPart.focus();
            }
            if (cb) {
                cb();
            }
        }

        if (file.pendingCreator) {
            file.pendingCreator( bShowAndFocus ? showAndFocus : cb);
            delete file.pendingCreator;
        } else if (bShowAndFocus) {
            showAndFocus(file);
        } else {
            if (cb) {
                cb();
            }
        }
    };

    editors.getFileByViewId = function(viewId) {
        return _.findWhere(editors.files, {
            viewId: viewId
        });
    };

    function onloadFinalize() {
        logger.info('onloadFinalize()');
        var vcs = editors.splitViewContainer.getViewContainers();
        _.each(vcs, function(vc) {
            var selview = vc.getSelectedView();
            if (selview) {
                var selfile = editors.getFileByViewId(selview.getId());
                editors.ensureCreated(selfile);
            }
        });
    }

    // options === { path: string }
    editors.closeFile = function(options) {

        var file;
        if (options && options.path) {
            file = editors.getFile(options.path);
            if (!file) {
                toastr.error('Cannot close the file "' + options.path + '"');
                return;
            }
        } else {
            file = editors.currentFile;
            if (!file) {
                toastr.error('No files to close');
                return;
            }
        }

        var view = vm.getView(file.viewId);
        var vc = view.getParent();

        // event is hard-coded, because ViewContainerEvent is private.
        var event = {
            name: 'view.close',
            viewContainer: vc,
            view: view,
            closable: true,
            force: options && options.force,
            noClose: function() {
                this.closable = false;
            }
        };

        topic.publish('view.close', event, function() {
            if (event.closable) {
                vc._remove(event.view, true);
            }
        });
    };

    editors.quit = function() {

        topic.publish('view.quit');
    };

    editors.saveFile = function(option) {
        console.log('save');
        var file = editors.currentFile;
        if (option) {
            var path = option.path;
            file = editors.getFile(path);
        }
        var part = editors.getPart(file);
        if (file && part && part.isDirty()) {
            fm.saveFile(file, option);
        }
    };

    editors.hasModifiedFile = function() {
        logger.info('hasModifiedFile()');
        var opened = _.values(editors.files);
        var hasModified = false;
        var part, modelManager;

        _.each(opened, function(file) {
            var part = editors.getPart(file);
            if (part.isDirty()) {
                logger.info('here!');
                hasModified = true;
            }
        });
        logger.info('hasModifiedFile() --> ' + hasModified);
        return hasModified;
    };

    editors.setCursor = function(file, pos) {
        if (file.viewer) {
            if (file.viewer.setCursor) {
                file.viewer.setCursor(pos);
            }
        }
    };

    editors.getCursor = function(file) {
        if (file.viewer) {
            if (file.viewer.getCursor) {
                return file.viewer.getCursor();
            }
        }
    };

    function _findViewIndexUsingSibling(viewContainer, file, siblings) {
        var previousSiblings = [];
        var nextSiblings = [];
        var i, j, sibling, siblingFile, view;
        var index = -1;

        if (!siblings) {
            return index;
        }

        var found = false;
        for ( i = 0; i < siblings.length; i++) {
            sibling = siblings[i];
            if (sibling === file.path) {
                found = true;
                continue;
            }

            siblingFile = editors.files[sibling];
            if (found) {
                nextSiblings.push(siblingFile && siblingFile.viewId);
            } else {
                previousSiblings.push(sibling && siblingFile.viewId);
            }
        }

        var views = viewContainer.getChildren();

        //find from nextSilings
        found = false;
        for ( i = 0; i < nextSiblings.length; i++) {
            sibling = nextSiblings[i];
            if (found) {
                break;
            }
            for ( j = 0; j < views.length; j++) {
                view = views[j];
                if (sibling === view.getId()) {
                    index = j;
                    found = true;
                    break;
                }
            }
        }

        if (!found) {
            //find from previousSiblings
            for ( i = previousSiblings.length - 1; i >= 0; i--) {
                sibling = previousSiblings[i];
                if (found) {
                    break;
                }
                for ( j = 0; j < views.length; j++) {
                    view = views[j];
                    if (sibling === view.getId()) {
                        index = j + 1;
                        found = true;
                        break;
                    }
                }
            }
        }

        return index;
    }

    function getViewContainer(view, file, option) {
        //cellCount=2, cellIndex=-1
        var viewContainer;
        var cellCount = editors.splitViewContainer.get('splitCount');
        var cellIndex;
        if ((option.cellIndex >= 0) && (option.cellIndex < cellCount)) {
            cellIndex = option.cellIndex;
        } else {
            cellIndex = -1;
        }
        var opt = {};
        opt.fields = {
            title: view.getTitle(),
            path: file.path
        };
        editors.editorTabFocusController.registerView(view, opt);
        if (cellIndex === -1) {
            viewContainer = editors.splitViewContainer.getFocusedViewContainer();
        } else {
            viewContainer = editors.splitViewContainer.getViewContainer(cellIndex);
        }
        return viewContainer;
    }

    /**
     * @private
     * @Override
     * @TODO refactor by the proper logic
     */
    editorManager._showExistingPart = function(dataSource, options, callback) {
        logger.info('_showExistingPart(' + dataSource + ', ' + options + ', callback)');
        var persistence = dataSource.getPersistence();
        //Check persistence is already showing
        if (editors.currentFile && editors.currentFile === persistence) {
            if (options.pos) {
                editors.setCursor(editors.currentFile, options.pos);
            }
            editors.getCurrentPart().focus();
            if (callback) {
                callback(editors.currentFile);
            }
        }
    };

    /**
     * @private
     * @Override
     */
    editorManager._createPart = function(partClassPath, PartClass, dataSource, options, callback) {
        logger.info('_createPart(' + partClassPath + ', PartClass, ' + dataSource + ', ' + options + ', callback)');

		//Legacy codes start
        var persistence = dataSource.getPersistence();
        if (!editors.getFile(dataSource.getId())) {
            editors.addFile(dataSource.getId(), persistence);
        }
        persistence.openWithPart = partClassPath;
        //Legacy codes end

        var page = workbench.getCurrentPage();
        var registry = page.getPartRegistry();

        var show = options.show !== false;
        if (show) {
            if (editors.currentFile && editors.getCurrentPart()) {
                editors.getCurrentPart().hide();
            }
        }

        //View and ViewContainer
        var view = vm.getView(persistence.viewId);
        var viewContainer = null;
        if (view === null) {
            persistence.viewId = _.uniqueId('view_');
            //TODO persistence.viewId
            view = new View(persistence.viewId, persistence.name);
            viewContainer = getViewContainer(view, persistence, options);
        } else {
            if (view.getParent()) {
                view.getParent().select(view);
            }
        }

        //Check exsisting part
        var part = editors.getPart(persistence);
        logger.info('part = ', part);
        if (part) {
            logger.info('part already exists');
            if (options.pos) {
                editors.setCursor(persistence, options.pos);
            }
            if ( typeof callback === 'function') {
                callback(persistence);
            }
            editors.refreshTabTitle(dataSource);
            if (show) {
                editors.setCurrentFile(persistence);
                if (viewContainer) {
                    viewContainer.select(view, true);
                }
            }
            return;
        }

        // Create EditorPart and update content
        var editorPart = new PartClass(persistence, dataSource);
        editors.addPart(persistence, editorPart);

        var index = _findViewIndexUsingSibling(viewContainer, persistence, options.siblingList);

        logger.info('viewContainer = ', viewContainer);

        if (viewContainer) {
            view.set('tooltip', persistence.path);
            view.setContent('<div style="width:100%; height:100%; overflow:hidden"></div>');
            view.set('closable', true);
            if (index >= 0) {
                viewContainer.addAt(view, index);
            } else {
                viewContainer.addLast(view);
            }

            persistence.pendingCreator = function(c) {
                logger.info('persistence.pendingCreator(' + c + ')');
                function createEditor(persistence, editorPart, view, callback) {
                    editorPart.create(view.getContent(), function(persistence, viewer) {
                        persistence.viewer = viewer;
                        //TODO : persistence.viewer refactor
                        if (editorPart.addChangeListener) {
                            editorPart.addChangeListener(function(persistence) {
                                _.defer(function() {
                                    editors.refreshTabTitle(editors.getDataSource(persistence));
                                    topic.publish('persistence.content.changed', persistence.path, editors.getPart(persistence).getValue());
                                });
                            });
                        }

                        if (options.pos) {
                            editors.setCursor(persistence, options.pos);
                        }

                        if (callback) {
                            callback(persistence);
                        }
                    });
                }

                createEditor(persistence, editorPart, view, function(persistence) {
                    if (callback) {
                        callback(persistence);
                    }
                    if (c) {
                        c(persistence);
                    }
                });
            };

            if (show) {
                if (view.getParent()) {
                    view.getParent().select(view);
                }
                editors.ensureCreated(persistence, true);
            }

            editors.onloadPendingFilesCount--;
            if (editors.onloadPendingFilesCount === 0) {
                onloadFinalize();
            }
        } else {
            console.log('editor open failed : ' + persistence.path);
            view.destroy();
        }

        editors.refreshTabTitle(dataSource);
        if (show) {
            editors.setCurrentFile(persistence);
            editorPart.show();
        }
    };

    /**
     * @deprecated since version 1.3.0
     * This method will be remove from 1.4.0
     * Temp Code
     */
    editors.openFile = editorManager.requestOpen;

    editors.onFileSaved = function(file) {
        editors.refreshTabTitle(editors.getDataSource(file));
    };

    editors.onFileError = function(file) {
        editors.onloadPendingFilesCount--;
        if (editors.onloadPendingFilesCount === 0) {
            onloadFinalize();
        }
    };

    editors.refreshTabTitle = function(dataSource) {
        logger.info('refreshTabTitle(' + dataSource + ')');

        var persistence = dataSource.getPersistence();
        var part = this.getPart(persistence);
        var view = vm.getView(persistence.viewId);
        var title = dataSource.getTitle();
        var page = workbench.getCurrentPage();
        var registry = page.getPartRegistry();

        if (part.isDirty()) {
            view.setTitle('*' + title);
            if (persistence === editors.currentFile) {
                topic.publish('editors.dirty.current');
            }
            topic.publish('editors.dirty.some');
        } else {
            view.setTitle(title);
            if (persistence === editors.currentFile) {
                topic.publish('editors.clean.current');
            }
            if (registry.getDirtyParts().length === 0) {
                topic.publish('editors.clean.all');
            }
        }
    };

    editors.execCommandForCurrentEditorViewer = function(commandKey) {
        logger.info('execCommandForCurrentEditorViewer(' + commandKey + ')');
        // Command means a method of EditorViewer which have no arguments
        if (editors.currentFile && editors.currentFile.viewer) {
            var viewer = editors.currentFile.viewer;
            return viewer[commandKey]();
        }
    };

    editors.getCurrentEditorPart = function() {
        return this.currentEditorPart;
    };

    editors.getCurrentPart = function() {
        if (this.currentFile) {
            return this.getPart(this.currentFile);
        } else {
            return null;
        }
    };

    editors.addPart = function(file, part) {
        logger.info('editors.addPart(' + file + ', ' + part + ')');
        this.parts.set(file, part);
    };

    editors.getPart = function(file) {
        //logger.trace();
        //logger.info('getPart(' + file + ')');
        if (this.parts.get(file) instanceof EditorPart) {
            return this.parts.get(file);
        } else {
            return null;
        }
    };

    //TODO : call removePart() when destroy editor panel
    editors.removePart = function(file) {
        logger.info('removePart(' + file + ')');
        if (this.getPart(file)) {
            return this.parts['delete'](file);
        }
        return false;
    };

    editors.addFile = function(path, file) {
        this.files[path] = file;
    };

    editors.getFile = function(path) {
        return this.files[path];
    };

    editors.removeFile = function(path) {
        var file = editors.files[path];
        delete editors.files[path];
        return file;
    };

    //TODO remove
    editors.getDataSource = function(persistence) {
        var workbench = require('webida-lib/plugins/workbench/plugin');
        var dsRegistry = workbench.getDataSourceRegistry();
        var dataSource = dsRegistry.getDataSourceById(persistence.getPersistenceId());
        return dataSource;
    };

    subscribeToTopics();

    logger.log('initialized editors plugin\'s module');

    return editors;

});
