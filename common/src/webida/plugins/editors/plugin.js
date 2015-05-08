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
 * required methods for editor module
 * - create(file, parentElem : HTMLElement, callback)
 * - show(file)
 * - hide(file)
 * - destroy(file)
 * - getValue(file)
 *
 * optional methods  for editor module
 * - focus(file)
 * - addChangeListener(file, callback : Function)
 **/

/* global timedLogger: true */

var time;
define([(time = timedLogger.getLoggerTime(), 'text!./ext-to-mime.json'),
        'other-lib/underscore/lodash.min',
        'webida-lib/util/path',
        'webida-lib/util/arrays/BubblingArray',
        'webida-lib/app',
        'webida-lib/plugin-manager-0.1',
        'webida-lib/plugins/workbench/plugin',
        'webida-lib/widgets/views/view',
        'webida-lib/widgets/views/viewmanager',
        'webida-lib/widgets/views/viewFocusController',
        'dojo/topic',
        'other-lib/async',
        'other-lib/toastr/toastr'
], function (extToMime, _, pathUtil, BubblingArray, ide, pm, workbench,
              View, vm, ViewFocusController,  topic, async, toastr) {
    'use strict';

    time = timedLogger.log('loaded modules required by editors-view. initializing editors-view plugin\'s module', time);

    function getFileClass() {
        var File = function (path) {
            this.path = path;
            this.name = pathUtil.getFileName(path);
            this.tabTitle = this.name;
            this.editor = null;
            this.editorName = null;
            this.savedValue = null;
        };
           
        File.prototype.isModified = function () {
            if (this.editorModule) {
                var val = this.editorModule.getValue(this);
                var modifiedInEditor = false;
                if (this.editorModule.isClean) {
                    modifiedInEditor = !this.editorModule.isClean(this);
                }
                // TODO: remove the first clause
                return  val !== undefined && val !== this.savedValue && modifiedInEditor;
            } else {
                return false;	// not yet even initialized.
            }
        };

        return File;
    }

    function getFileManager() { // TODO: remove publish().
        var FileManager = {};
        var spaces = {
            '0': '',
            '1': ' ',
            '2': '  ',
            '3': '   ',
            '4': '    '
        };

        FileManager.openFile = function (file) {
            fsCache.readFile(file.path, function (error, content) {
                if (error) {
                    toastr.error('Failed to read file "' + file.path + '" (' + error + ')');
                    editors.onFileError(file);
                } else {
                    file.savedValue = content;
                    editors.onFileOpened(file);
                    topic.publish('file.opened', file, content);
                }
            });
        };

        FileManager.saveFile = function (file, option) {
            function getSpaces(n) {
                if (spaces[n] === undefined) {
                    return (spaces[n] = (n ? ' ' + getSpaces(n - 1) : ''));
                } else {
                    return spaces[n];
                }
            }

            var path = file.path;

            var value = file.editorModule.getValue(file);
            if (value === undefined) {		// TODO: make this check unnecessary.
                throw new Error('tried to save a file "' + file.path +
                                '" + whose value is not yet set');
            }

            console.assert(file.editor);
            var codeEditor = file.editor;

            if (codeEditor.trimTrailingWhitespaces ||
                codeEditor.insertFinalNewLine ||
                codeEditor.retabIndentations) {
                var v = value;
                if (codeEditor.trimTrailingWhitespaces && v.match(/( |\t)+$/m)) {
                    v = v.replace(/( |\t)+$/mg, '');
                }
                if (codeEditor.insertFinalNewLine && v.match(/.$/)) {
                    v = v + '\n';	// TODO: consider line ending mode
                }
                if (codeEditor.retabIndentations) {
                    //var spaces = getSpaces(codeEditor.options.indentUnit);
                    var unit = codeEditor.options.indentUnit, re = /^(( )*)\t/m, m;
                    while ((m = v.match(re))) {
                        v = v.replace(re, '$1' +  getSpaces(unit - (m[0].length - 1) % unit));
                    }
                }

                if (v !== value) {
                    var cursor = codeEditor.getCursor();
                    var scrollInfo = codeEditor.editor.getScrollInfo();
                    value = v;
                    codeEditor.setValue(value);
                    codeEditor.setCursor(cursor);
                    codeEditor.editor.scrollTo(scrollInfo.left, scrollInfo.top);
                }
            }

            fsCache.writeFile(path, value, function (error) {
                if (error) {
                    toastr.error('Failed to write file "' + path + '" (' + error + ')');
                    editors.onFileError(file);
                } else {
                    file.savedValue = value;
                    if (file.editorModule && file.editorModule.markClean) {
                        file.editorModule.markClean(file);
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
            require(['popup-dialog'], function (PopupDialog) {
                PopupDialog.yesno({
                    title: 'Close "' + pathUtil.getFileName(path) + '"?',
                    message: 'File "' + path + '" was deleted. ' +
                        'Is it OK to close the editor tab for the file?'
                }).then(function () {
                    editors.closeFile({ path: path, force: true });
                }, function () {
                });
            });
        }

        function onMultiDeletion(paths) {
            var openedFilePaths = Object.keys(editors.files);
            var toClose = openedFilePaths.filter(function (p) {
                return paths.some(function (deleted) {
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

            require(['webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog'], function (ButtonedDialog) {
                var answer = {};
                async.eachSeries(toClose, function (filePath, cb) {
                    var file = editors.files[filePath];
                    if (file) {
                        if (file.isModified()) {
                            if (answer.yesToModified || answer.noToModified) {
                                if (answer.yesToModified) {
                                    editors.closeFile({ path: filePath, force: true });
                                }
                                cb(null);
                                return;
                            }
                        } else {
                            if (answer.yesToUnmodified || answer.noToUnmodified) {
                                if (answer.yesToUnmodified) {
                                    editors.closeFile({ path: filePath, force: true });
                                }
                                cb(null);
                                return;
                            }
                        }

                        var modified = file.isModified();
                        var qualifier = modified ? 'Modified' : 'Unmodified';
                        var title = 'Close ' + qualifier + ' "' +
                            pathUtil.getFileName(filePath) + '"?';
                        var msg = ['File "' + filePath + '" was deleted.',
                                   'Is it OK to close the ' + qualifier.toLowerCase() +
                                   ' editor tab for the file?'];
                        msg = msg.join('</span><br><span>');

                        var dialog = new ButtonedDialog({
                            title: title,
                            //buttonsWidth: '120px',
                            buttons: [
                                {
                                    caption: 'Yes',
                                    methodOnClick: 'onYes'
                                },
                                {
                                    caption: 'Yes to All',
                                    methodOnClick: 'onYesToAll'
                                },
                                {
                                    caption: 'No',
                                    methodOnClick: 'hide'
                                },
                                {
                                    caption: 'No to All',
                                    methodOnClick: 'onNoToAll'
                                }
                            ],
                            methodOnEnter: null,
                            onYes: function () {
                                editors.closeFile({ path: filePath, force: true });
                                this.hide();
                            },
                            onYesToAll: function () {
                                if (modified) {
                                    answer.yesToModified = true;
                                } else {
                                    answer.yesToUnmodified = true;
                                }
                                this.onYes();
                            },
                            onNoToAll: function () {
                                if (modified) {
                                    answer.noToModified = true;
                                } else {
                                    answer.noToUnmodified = true;
                                }
                                this.hide();
                            },
                            onHide: function () {
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
                }, function () {});
            });
        }

        topic.subscribe('fs.cache.node.deleted', function (fsUrl, dir, name, type, movedTo) {

            function fileMoved(src, dst) {
                var file = editors.files[src];
                if (file) {
                    if (isDir) {
                        file.path = dst;
                        delete editors.files[src];
                        editors.files[dst] = file;
                    } else {
                        var newName = pathUtil.getFileName(dst);
                        var oldExt = pathUtil.getFileExt(file.name);
                        var newExt = pathUtil.getFileExt(newName);
                        if (oldExt === newExt) {
                            file.path = dst;
                            delete editors.files[src];
                            editors.files[dst] = file;
                            file.name = newName;
                            editors.refreshTabTitle(file);
                        } else {
                            //var isModified = file.isModified();

                            var view = vm.getView(file.viewId);
                            var vc = view.getParent();
                            var viewContainers = editors.splitViewContainer.getViewContainers();

                            var cellIndex = viewContainers.indexOf(vc);
                            console.assert(cellIndex >= 0);

                            var siblingList = [];
                            vc.getViewList().forEach(function (view) {
                                var f = editors.getFileByViewId(view.getId());
                                siblingList.push(f.path);
                            });
                            var idx = siblingList.indexOf(src);
                            siblingList.splice(idx, 0, dst);

                            var cursor = editors.getCursor(file);

                            editors.openFile(dst,
                                             {cellIndex: cellIndex,
                                              siblingList: siblingList,
                                              show: editors.currentFile === file,
                                              cursor: cursor});
                            editors.closeFile({path: src});
                        }
                    }

                    /* replace the above procedure when codeeditor.setMode is done.
                    file.path = dst;
                    if (!isDir) {
                        file.name = pathUtil.getFileName(dst);
                        file.editor.setMode(pathUtil.getFileExt(file.name));
                        //file.editorModule.setMode(file.editor, pathUtil.getFileExt(file.name));
                            // The above line is not enough for linters and hinters
                    }
                    delete editors.files[src];
                    editors.files[dst] = file;
                    editors.refreshTabTitle(file);
                     */
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
                    _.each(paths, function (path) {
                        if (path.substr(0, src.length) === src) {
                            var relpath = path.substr(src.length);
                            fileMoved(src + relpath, dst + relpath);
                        }
                    });
                } else {
                    fileMoved(src, dst);
                }
            } else {
                var path = dir + name + (isDir ? '/' : '');
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
                    Object.keys(editors.files).forEach(function (p) {
                        if (p === path) {
                            onSingleDeletion(p);
                        }
                    });
                }
            }
        });

        topic.subscribe('fs.cache.file.invalidated', function (fsURL, path) {
            var file = editors.files[path];
            if (file) {
                if (file === editors.currentFile) {
                    fsCache.refreshFileContents(path);
                } else {
                    file.toRefresh = true;
                }
            }
        });

        topic.subscribe('fs.cache.file.set', function (fsUrl, target, reason) {
            if (reason === 'refreshed') {
                var file = editors.files[target];
                if (file) {
                    if (file === editors.currentFile) {
                        _.defer(askAndReload.bind(null, file));
                    } else {
                        file.toAskAndReload = true;
                    }
                }
            }
        });

        topic.subscribe('workspace.nodes.deleting', function (paths) {
            multipleDeletions.push(paths);
            setTimeout(function () {
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

        topic.subscribe('#REQUEST.openFile', _.bind(editors.openFile, editors));
        topic.subscribe('#REQUEST.closeFile', _.bind(editors.closeFile, editors));
        topic.subscribe('#REQUEST.saveFile', _.bind(editors.saveFile, editors));
        topic.subscribe('#REQUEST.selectFile', function (path) {
            if (editors.files[path]) {
                editors.openFile(path);
            }
        });

        // TODO: remove the following subscriptions
        topic.subscribe('file.saved', _.bind(editors.onFileSaved, editors));
        topic.subscribe('file.error', _.bind(editors.onFileError, editors));
    }
    var multipleDeletions = [];
    function getMultiDeletion(path) {
        var filtered = multipleDeletions.filter(function (md) {
            return md.indexOf(path) >= 0;
        });

        if (filtered.length > 1) {
            console.assert(false, 'assertion fail: unreachable');
            return null;
        } else {
            return filtered[0] || null;
        }
    }

    var dirtyFileCount = 0;
    topic.publish('editors.clean.current');
    topic.publish('editors.clean.all');

    var fsCache = ide.getFSCache();
    var File = getFileClass();
    var fm = getFileManager();
    extToMime = JSON.parse(extToMime);

    var asked = [];
    function askAndReload(file) {
        require(['popup-dialog'], function (PopupDialog) {
            if (asked.indexOf(file) === -1) {
                console.assert(asked.length === 0,
                               'assertion fail: only one file is asked to reload at any point of time');
                asked.push(file);
                PopupDialog.yesno({
                    title: 'Reload File',
                    message: file.path + '<br><br>' +
                        'File \'' + file.name + '\' has changed. <br>' +
                        'Do you want to reload?',
                    type: 'warning'
                }).then(function () {
                    asked.pop();
                    fm.openFile(file);
                }, function () {
                    asked.pop();
                });
            }
        });
    }

    var editors = {
        elem: $('<div id="editor" tabindex="0" style="position:absolute; ' +
            'overflow:hidden; width:100%; height:100%; padding:0px; border:0"/>')[0],
        splitViewContainer : null,
        editorTabFocusController : new ViewFocusController({'Title' : 'title', 'Path' : 'path'}),
        editorExtensions: pm.getExtensions('webida.common.editors:editor'),
        files: {},
        currentFile: null,
        currentFiles: new BubblingArray(),
        recentFiles: new BubblingArray(20),	// keep history of 20 files
        onloadPendingFilesCount: 0
    };

    editors.setCurrentFile = function (file) {
        if (editors.currentFile !== file) {
            var view;
            if (editors.currentFile) {
                view = vm.getView(editors.currentFile.viewId);
                if (view) {
                    workbench.unregistFromViewFocusList(view);  // TODO: do it with an extension and an extension point
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

                if (file.editorModule) {
                    file.editorModule.focus(editors.currentFile);
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

    editors.ensureCreated = function (file, bShowAndFocus, cb) {
        function showAndFocus(file) {
            if (file.editorModule) {
                file.editorModule.show(file);
                file.editorModule.focus(file);
            }
            if (cb) {
                cb();
            }
        }

        if (file.pendingCreator) {
            file.pendingCreator(bShowAndFocus ? showAndFocus : cb);
            delete file.pendingCreator;
        } else if (bShowAndFocus) {
            showAndFocus(file);
        } else {
            if (cb) {
                cb();
            }
        }
    };

    editors.getFileByViewId = function (viewId) {
        return _.findWhere(editors.files, {viewId: viewId});
    };

    function onloadFinalize() {
        var vcs = editors.splitViewContainer.getViewContainers();
        _.each(vcs, function (vc) {
            var selview = vc.getSelectedView();
            if (selview) {
                var selfile = editors.getFileByViewId(selview.getId());
                editors.ensureCreated(selfile);
            }
        });
    }


    // options === { path: string }
    editors.closeFile = function (options) {

        var file;
        if (options && options.path) {
            file = editors.files[options.path];
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
            noClose: function () {
                this.closable = false;
            }
        };

        topic.publish('view.close', event, function () {
            if (event.closable) {
                vc._remove(event.view, true);
            }
        });
    };

    editors.saveFile = function (option) {
        console.log('save');
        var file = editors.currentFile;
        if (option) {
            var path = option.path;
            file = editors.files[path];
        }

        if (file) {
            fm.saveFile(file, option);
        }
    };

    editors.getAvailableEditorExtensions = function (path, editorName) {
        var thisFileExt = path.indexOf('.') >= 0 ? path.split('.').pop() : '';
        var thisMimeType = extToMime[thisFileExt];

        var viable1 = editors.editorExtensions.filter(function (extension) {
            return extension.handledFileExt.some(function (fileExtension) {
                return thisFileExt.match('^' + fileExtension + '$');
            });
        });
        var viable2 = editors.editorExtensions.filter(function (extension) {
            return extension.handledMimeTypes.some(function (fileMimeType) {
                return thisMimeType && thisMimeType.match('^' + fileMimeType + '$');
            });
        });
        var unviable1 = editors.editorExtensions.filter(function (extension) {
            return extension.unhandledFileExt.some(function (fileExtension) {
                return thisFileExt.match('^' + fileExtension + '$');
            });
        });
        var unviable2 = editors.editorExtensions.filter(function (extension) {
            return extension.unhandledMimeTypes.some(function (fileMimeType) {
                return thisMimeType && thisMimeType.match('^' + fileMimeType + '$');
            });
        });

        var editorExtensions = _.union(viable1, viable2);
        editorExtensions = _.difference(editorExtensions, unviable1, unviable2);

        if (editorExtensions.length === 0) {
            return null;
        } else {
            if (editorName) {
                var exts2 = _.filter(editorExtensions, function (ext) {
                    return (ext.name === editorName);
                });
                if (exts2.length > 0) {
                    return exts2;
                } else {
                    return null;
                }
            }
            return editorExtensions;
        }
    };

    function checkFileNameHandleExtension(path) {
        var fileName = pathUtil.getFileName(path);
        console.info(fileName);
        var extensions = pm.getExtensions('webida.common.editors:editor');
        console.info(extensions);
        if (extensions instanceof Array && extensions.length) {
            for (var i = 0; i < extensions.length ; i++) {
                if (extensions[i].handledFileNames instanceof Array && 
                   extensions[i].handledFileNames.indexOf(fileName) >= 0) {
                    return extensions[i];
                }
            }
        }
        return null;
    }
    
    editors.openFile = function (path, options, callback) {
        options = options || {};

        if (editors.currentFile && editors.currentFile.path === path) {
            if (options.pos) {
                editors.setCursor(editors.currentFile, options.pos);
            }

            editors.currentFile.editorModule.focus(editors.currentFile);

            if (callback) {
                callback(editors.currentFile);
            }
        } else {
            var file = editors.files[path];
            var fileExt = path.indexOf('.') >= 0 ? path.split('.').pop() : '';
            
            var fileNameHandleExtension = checkFileNameHandleExtension(path);
            console.info(fileNameHandleExtension);
            //for handledFileNames
            if (!options.editorName && fileNameHandleExtension) {
                options.extension = fileNameHandleExtension;
            //for handledFileNames or handledMimeTypes
            } else {
                var extensions = editors.getAvailableEditorExtensions(path, options.editorName);
                options.extension = extensions && extensions[0];
            }

            if (!options.extension) {
                toastr.error('No editors found for the file extension "' + fileExt + '"');
                return;
            }

            var openFile = !file;

            if (!file) {
                file = new File(path);
                file.editorName = options.extension.name;
                editors.files[path] = file;
            }

            file._openFileOption = options;
            file._openFileCallback = callback;

            if (openFile && options.extension.fileValueRequired) {
                fm.openFile(file);
            } else {
                editors.onFileOpened(file);
            }
        }
    };

    editors.hasModifiedFile = function () {
        var opened = _.values(editors.files);
        var hasModified = false;

        _.each(opened, function (file) {
            //if (editors.isModifiedFile(file)) {
            if (file.isModified()) {
                hasModified = true;
            }
        });

        return hasModified;
    };

    editors.setCursor = function (file, pos) {
        if (file.editor) {
            if (file.editor.setCursor) {
                file.editor.setCursor(pos);
            }
        }
    };

    editors.getCursor = function (file) {
        if (file.editor) {
            if (file.editor.getCursor) {
                return file.editor.getCursor();
            }
        }
    };

    editors.onFileOpened = function (file) {
        // TODO: remove the following check if possible
        if (!file._openFileOption) {
            return;
        }

        var option = file._openFileOption;
        var callback = file._openFileCallback;
        delete file._openFileOption;
        delete file._openFileCallback;

        var show = option.show !== false;

        var cellCount = editors.splitViewContainer.get('splitCount');
        var cellIndex;

        if ((option.cellIndex >= 0) && (option.cellIndex < cellCount)) {
            cellIndex = option.cellIndex;
        } else {
            cellIndex = -1;
        }

        var extension = option.extension;

        // Create editor and update editor content
        if (show) {
            if (editors.currentFile && editors.currentFile.editorModule) {
                editors.currentFile.editorModule.hide(editors.currentFile);
            }
        }

        console.info(extension.module);
        
        require([extension.module], function (editorModule) {
            function _findViewIndexUsingSibling(viewContainer, file, siblings) {
                var previousSiblings = [];
                var nextSiblings = [];
                var i, j, sibling, siblingFile, view;
                var index = -1;

                if (!siblings) {
                    return index;
                }

                var found = false;
                for (i = 0; i < siblings.length; i++) {
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
                for (i = 0; i < nextSiblings.length; i++) {
                    sibling = nextSiblings[i];
                    if (found) {
                        break;
                    }
                    for (j = 0 ; j < views.length; j++) {
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
                    for (i = previousSiblings.length - 1; i >= 0; i--) {
                        sibling = previousSiblings[i];
                        if (found) {
                            break;
                        }
                        for (j = 0 ; j < views.length; j++) {
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

            var view = null;
            var viewContainer = null;
            var needToAdd = false;

            view = vm.getView(file.viewId);

            if (view === null) {
                file.viewId = _.uniqueId('view_');
                view = new View(file.viewId, file.name);
                var opt = {};
                opt.fields = {title: view.getTitle(), path: file.path};
                editors.editorTabFocusController.registerView(view, opt);
                if (cellIndex === -1) {
                    viewContainer = editors.splitViewContainer.getFocusedViewContainer();
                } else {
                    viewContainer = editors.splitViewContainer.getViewContainer(cellIndex);
                }
                needToAdd = true;
            } else {
                if (view.getParent()) {
                    view.getParent().select(view);
                }
            }

            /*
            if (show || view) {
                editors.setCurrentFile(file);
            }
             */

            if (file.editorModule !== editorModule) {
                file.editorModuleName = extension.module;
                file.editorModule = editorModule;

                var index = _findViewIndexUsingSibling(viewContainer, file, option.siblingList);

                if (viewContainer && needToAdd) {
                    view.set('tooltip', file.path);
                    view.setContent('<div style="width:100%; height:100%; overflow:hidden"></div>');
                    view.set('closable', true);
                    if (index >= 0) {
                        viewContainer.addAt(view, index);
                    } else {
                        viewContainer.addLast(view);
                    }

                    file.pendingCreator = function (c) {

                        function createEditor(file, editorModule, view, callback) {
                            editorModule.create(file, file.savedValue, view.getContent(), function (file, instance) {
                                file.editor = instance;
                                if (editorModule.addChangeListener) {
                                    editorModule.addChangeListener(file, function (file) {
                                        _.defer(function () {
                                            editors.refreshTabTitle(file);
                                            topic.publish('file.content.changed', file.path,
                                                          file.editorModule.getValue(file));
                                        });
                                    });
                                }

                                if (option.pos) {
                                    editors.setCursor(file, option.pos);
                                }

                                if (callback) {
                                    callback(file);
                                }
                            });
                        }

                        createEditor(file, editorModule, view, function (file) {
                            if (callback) {
                                callback(file);
                            }
                            if (c) {
                                c(file);
                            }
                        });
                    };

                    if (show) {
                        view.getParent().select(view);
                        editors.ensureCreated(file, true);
                    }

                    editors.onloadPendingFilesCount--;
                    if (editors.onloadPendingFilesCount === 0) {
                        onloadFinalize();
                    }
                } else {
                    console.log('editor open failed : ' + file.path);
                    view.destroy();
                }
            } else {
                if (option.pos) {
                    editors.setCursor(file, option.pos);
                }

                if (callback) {
                    callback(file);
                }
            }

            editors.refreshTabTitle(file);
            if (show) {
                editors.setCurrentFile(file);
                editorModule.show(file);
            }
        });
    };

    editors.onFileSaved = function (file) {
        editors.refreshTabTitle(file);
    };

    editors.onFileError = function (file) {
        editors.onloadPendingFilesCount--;
        if (editors.onloadPendingFilesCount === 0) {
            onloadFinalize();
        }
        if (file._openFileOption) {
            if (editors.files[file.path]) {
                delete editors.files[file.path];
            }
        }
    };

    editors.refreshTabTitle = function (file) {
        var title = file.name;
        //if (editors.isModifiedFile(file)) {
        if (file.isModified()) {
            title = '*' + title;
        }

        if (file.tabTitle !== title) {
            var view = vm.getView(file.viewId);
            if (view) {
                var modified0 = file.tabTitle.indexOf('*') === 0;
                var modified1 = title.indexOf('*') === 0;

                view.setTitle(title);
                file.tabTitle = title;

                if (!modified0 && modified1) {
                    // unmodified --> modified
                    dirtyFileCount++;
                    if (file === editors.currentFile) {
                        topic.publish('editors.dirty.current');
                    }
                    topic.publish('editors.dirty.some');
                } else if (modified0 && !modified1) {
                    // modified --> unmodified
                    dirtyFileCount--;
                    console.assert(dirtyFileCount >= 0);
                    if (file === editors.currentFile) {
                        topic.publish('editors.clean.current');
                    }
                    if (dirtyFileCount === 0) {
                        topic.publish('editors.clean.all');
                    }
                }
            }
        }
    };

    editors.doWithCurrentEditor = function (cb) {
        if (editors.currentFile && editors.currentFile.editor && editors.currentFile.editor.editor) {
            var instance = editors.currentFile.editor;
            return cb(instance, instance.editor);
        }
    };

    subscribeToTopics();

    timedLogger.log('initialized editors-view plugin\'s module', time);

    return editors;



});
