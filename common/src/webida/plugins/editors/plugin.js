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
    'external/lodash/lodash.min',
    'external/URIjs/src/URI',
    'webida-lib/app',
    'webida-lib/util/path',
    'webida-lib/util/arrays/BubblingArray',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/notify',
    'webida-lib/plugin-manager-0.1',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/plugins/workbench/ui/CompatibleTabPartContainer',
    'webida-lib/plugins/workbench/ui/EditorPart',
    'webida-lib/plugins/workbench/ui/LayoutPane',
    'webida-lib/plugins/workbench/ui/PartContainer',
    'webida-lib/plugins/workbench/ui/Workbench',
    'webida-lib/widgets/views/view',
    'webida-lib/widgets/views/viewmanager',
    'webida-lib/widgets/views/viewFocusController',
    'external/async/dist/async.min',
    'plugins/webida.notification/notification-message',
    'plugins/webida.workspace.model.file/FileDataSource', //TODO : temp for 7.21
    './EditorManager'
], function (
    topic, 
    _, 
    URI, 
    ide, 
    pathUtil, 
    BubblingArray,
    Logger, 
    notify,
    pm, 
    workbench, 
    CompatibleTabPartContainer,
    EditorPart,
    LayoutPane,
    PartContainer,
    Workbench,
    View, 
    vm, 
    ViewFocusController,  
    async, 
    toastr,
    FileDataSource,
    EditorManager
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    logger.log('loaded modules required by editors. initializing editors plugin');

    var dsRegistry = workbench.getDataSourceRegistry();
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
                    viewer.refresh(value);
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
                    topic.publish('editor/close/data-source-id', path, {
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
                                    topic.publish('editor/close/data-source-id', filePath, {
                                        force: true
                                    });
                                }
                                cb(null);
                                return;
                            }
                        } else {
                            if (answer.yesToUnmodified || answer.noToUnmodified) {
                                if (answer.yesToUnmodified) {
                                    topic.publish('editor/close/data-source-id', filePath, {
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
                                topic.publish('editor/close/data-source-id', filePath, {
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


        topic.subscribe('editors.closed', function(dataSourceId, view) {
            editors.editorTabFocusController.unregisterView(view);
        });

        topic.subscribe('fs.cache.node.deleted', function(fsUrl, dir, name, type, movedTo) {

            logger.info('fs.cache.node.deleted', fsUrl, dir, name, type, movedTo);
            logger.trace();

            function fileMoved(src, dst) {
                var dataSource = editors.getDataSourceById(src);
                dataSource.setId(dst);
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

        // TODO: remove the following subscriptions
        topic.subscribe('file.saved', editors.onFileSaved.bind(editors));

        topic.subscribe('editor/not-exists', function() {
            topic.publish('editors.clean.all');
            topic.publish('editors.clean.current');
        });

        //Compatibility
        topic.subscribe('current-part-changed', function(oldPart, newPart) {

            console.log('current-part-changed');

            if (oldPart !== newPart) {

                if (oldPart) {
                    var oldContainer = oldPart.getContainer();
                    if (oldContainer) {
                        var oldView = oldContainer.getWidgetAdapter().getWidget();
                        workbench.unregistFromViewFocusList(oldView);
                    }
                }

                if (newPart) {
                    var newContainer = newPart.getContainer();
                    var newView = newContainer.getWidgetAdapter().getWidget();
                    workbench.registToViewFocusList(newView, {
                        title: 'Editor',
                        key: 'E'
                    });

                    /////////////////////// TODO refactor

                    var file = newPart.getDataSource().getPersistence();

                    editors.currentFile = file;

                    if (file) {
                        editors.currentFiles.put(file);
                        editors.recentFiles.put(file.path);

                        if (file.toRefresh) {
                            file.toRefresh = false;
                            fsCache.refreshFileContents(file.path);
                        }

                        if (file.toAskAndReload) {
                            file.toAskAndReload = false;
                            _.defer(askAndReload.bind(null, file));
                        }
                        topic.publish('editors.selected', file.path, file);
                    }
                } else {
                    editors.currentFile = null;
                }
            }
        });
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
                    topic.publish('editor/open', file.getPersistenceId());
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

    editors.ensureCreated = function(file, bShowAndFocus, cb) {
        function showAndFocus(file) {
            var editorPart = editors.getPart(file);
            if (editorPart) {
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


    editors.quit = function() {
        topic.publish('view.quit');
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
     */
    editorManager._showExistingPart = function(PartClass, dataSource, options, callback) {
        logger.info('_showExistingPart(PartClass, ' + dataSource + ', ' + options + ', callback)');

        var page = workbench.getCurrentPage();
        var registry = page.getPartRegistry();
        var part = registry.getRecentEditorPart(dataSource, PartClass);

        //Compatibility start
        var persistence = dataSource.getPersistence();
        var view = part.getContainer().getWidgetAdapter().getWidget();
        var viewContainer = getViewContainer(view, persistence, options);
        if (view.getParent()) {
            view.getParent().select(view);
            part.focus();
        }
        //Compatibility end

        if ( typeof callback === 'function') {
            callback(part);
        }
    };

    /**
     * @private
     * @Override
     */
    editorManager._createPart = function(PartClass, dataSource, options, callback) {
        logger.info('%c_createPart(PartClass, ' + dataSource + ', ' + options + ', callback)', 'color:green');

        //Compatibility start
        //editors.files[dataSource.getId()] = dataSource.getPersistence();
        //Compatibility end

        var page = workbench.getCurrentPage();
        var layoutPane = page.getChildById('webida.layout_pane.center');

        //3. create Tab & add to Pane
        var tabPartContainer = new CompatibleTabPartContainer(dataSource);
        layoutPane.addPartContainer(tabPartContainer, options, editors);

        //4. create Part
        tabPartContainer.createPart(PartClass, callback);
    };

    /**
     * @deprecated since version 1.3.0
     * This method will be remove from 1.4.0
     * Temp Code
     */
    editors.openFile = editorManager._openDataSource;

    editors.onFileSaved = function(file) {
        logger.info('onFileSaved(' + file + ')');
        var dataSource = dsRegistry.getDataSourceById(file.getPath());
        var page = workbench.getCurrentPage();
        var registry = page.getPartRegistry();
        var parts = registry.getPartsByDataSource(dataSource);
        parts.forEach(function(part) {
            editors.refreshTabTitle(part);
        });
    };

    editors.onFileError = function(file) {
        editors.onloadPendingFilesCount--;
        if (editors.onloadPendingFilesCount === 0) {
            onloadFinalize();
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
        logger.info('getCurrentPart()');
        if (this.currentFile) {
            return this.getPart(this.currentFile);
        } else {
            return null;
        }
    };

    editors.getPart = function(file) {
        var dataSource = dsRegistry.getDataSourceById(file.getPath());
        var registry = workbench.getCurrentPage().getPartRegistry();
        var parts = registry.getPartsByDataSource(dataSource);

        if (parts && parts.length > 0) {
            for (var i in parts) {
                if (parts[i] instanceof EditorPart) {
                    return parts[i];
                }
            }
        } else {
            return null;
        }
    };

    //Compatibility
    //TODO remove
    editors.getFile = function(dataSourceId) {
        logger.info('getFile(' + dataSourceId + ')');
        var dataSource = dsRegistry.getDataSourceById(dataSourceId);
        if (dataSource) {
            return dataSource.getPersistence();
        }
    };

    //TODO remove
    editors.getDataSourceById = function(dsId) {
        return dsRegistry.getDataSourceById(dsId);
    };

    //TODO remove
    editors.getDataSource = function(persistence) {
        return dsRegistry.getDataSourceById(persistence.getPersistenceId());
    };

    editors.getPartRegistry = function() {
        var page = workbench.getCurrentPage();
        return page.getPartRegistry();
    };

    subscribeToTopics();

    logger.log('initialized editors plugin\'s module');

    return editors;

});
