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

define([
    './plugin',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/app',
    'webida-lib/widgets/views/splitviewcontainer',
    'webida-lib/widgets/views/viewmanager',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
    'dojo/dom-style',
    'dojo/dom-geometry',
    'dojo/topic',
    'external/lodash/lodash.min',
    'webida-lib/util/logger/logger-client'
], function (
    editors,
    workbench,
    ide,
    SplitViewContainer,
    vm,
    ButtonedDialog,
    domStyle,
    geometry,
    topic,
    _,
    Logger
) {
    'use strict';

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    var paneElement = $('<div id="editor" tabindex="0" style="position:absolute; ' +
            'overflow:hidden; width:100%; height:100%; padding:0px; border:0"/>')[0];

    function getPanel() {
        var docFrag = document.createDocumentFragment();
        docFrag.appendChild(paneElement);
        return docFrag;
    }

    var QUIT = 'Quit';

    function createDialog(file, title, action, canceled) {
        var dialog = new ButtonedDialog({
            title: 'Unsaved Changes in the File to ' + title,
            buttons: [
                {
                    caption: 'Save and ' + title,
                    methodOnClick: 'saveAndAction'
                },
                {
                    caption: title + ' without Saving',
                    methodOnClick: 'actionWithoutSaving'
                },
                {
                    caption: 'Cancel',
                    methodOnClick: 'canceled'
                }
            ],
            methodOnEnter: 'saveAnd' + title,
            saveAndAction: function () {
                if (title === QUIT) {
                    var keys = Object.keys(editors.files);
                    var len = keys.length;
                    for (var i = 0; i < len; i++) {
                        var key = keys[i];
                        var savingFile = editors.files[key];
                        if (savingFile.isModified()) {
                            editors.saveFile({
                                path: savingFile.path,
                            });
                        }
                    }
                    action();
                    dialog.hide();
                } else {
                    editors.saveFile({
                        path: file.path,
                        callback: function () {
                            action();
                            dialog.hide();
                        }
                    });
                }
            },
            actionWithoutSaving: function () {
                action();
                this.hide();
            },
            canceled: function () {
                if (canceled) {
                    canceled();
                }
                this.hide();
            },
            buttonsWidth: '140px',
            onHide: function () {
                dialog.destroyRecursive();
            }
        });

        var name = file.name;
        if (title === QUIT) {
            name = file;
        }
        dialog.setContentArea('<span> File "' + name  + '" has unsaved changes. </span>' +
                '<span> Save and ' + title + ' this file? </span>');
        dialog.show();
    }

    function onPanelAppended() {
        var $elemTab = $('<div id="editor-tab" style="width:100%; height:100%" class="editor-tab"></div>');
        $(paneElement).append($elemTab);

        editors.splitViewContainer = new SplitViewContainer();
        editors.splitViewContainer.init({
            'splitCount': 2,
            'verticalSplit': false,
            'smartVisible': true,
            'rotatable': true
        }, 'editor-tab');
        vm.addToGroup(editors.splitViewContainer, 'editorView');

        topic.subscribe('editor-panel-resize', function () {
            var borderContainer = editors.splitViewContainer.widgetObject;
            var children = borderContainer.getChildren();
            var totalW = 5;  // including margin and splitter size
            var totalH = 5;  // including margin and splitter size
            var width, height;
            var child;
            var i;
            var ratioW, ratioH;
            for (i = 0; i < children.length; i++) {
                child = children[i];
                totalW += geometry.getMarginBox(child.domNode).w;
                totalH += geometry.getMarginBox(child.domNode).h;
            }

            for (i = 1; i < children.length; i++) {
                child = children[i];
                width = geometry.getMarginBox(child.domNode).w;
                height = geometry.getMarginBox(child.domNode).h;
                ratioW = ((width - 2) * 100 / totalW) + '%';
                ratioH = ((height - 2) * 100 / totalH) + '%';
                //console.log('total : ' +totalW+ ', content : '+ i  + ' : ' + width + ', ratio : '+ratioW);
                if (child.get('region') === 'right') {
                    if ($(child.domNode).css('width').split('%').length > 1) {
                        continue;
                    }
                    domStyle.set(child.domNode, 'width', ratioW);
                } else if (child.get('region') === 'bottom') {
                    if ($(child.domNode).css('height').split('%').length > 1) {
                        continue;
                    }
                    domStyle.set(child.domNode, 'height', ratioH);
                }
            }            
        
        });

        /* viewcontainer supports 'dblclick' event
        var vcList = editors.splitViewContainer.getViewContainers();
        _.forEach(vcList, function (vc) {
            dojo.connect(vc.tabContainer, 'onDblClick', function (ev) {
                if (ev.currentTarget === vc.tabContainer.domNode) {
                    var parent = ev.srcElement.parentNode;
                    while (parent && parent.parentNode) {
                        if (parent === vc.tabContainer.domNode.firstElementChild) {
                            workbench.toggleFullScreen();
                            break;
                        }
                        parent = parent.parentNode;
                    }
                }
            });
        });
        */

        topic.subscribe('view.selected', function (event) {
            var view = event.view;
            var vc = event.viewContainer;
            if (!vc || (vc.getParent() !== editors.splitViewContainer)) {
                return;
            }

            var file = editors.getFileByViewId(view.getId());
            if (file) {
                var changed = editors.currentFile !== file;
                if (changed) {
                    if (editors.currentFile && editors.getPart(editors.currentFile)) {
                        editors.getPart(editors.currentFile).hide();
                    }
                    editors.setCurrentFile(file);
                }

                editors.ensureCreated(file, true);
            }

            /*
            //TODO FIXME --> #issue 11937. resolved in a different way
            var viewList = vc.getViewList();
            file = null;
            for (var i = viewList.length - 1; i >= 0; i--) {
                if (view === viewList[i]) {
                    if (i > 0) {
                        file = editors.getFileByViewId(viewList[i - 1].getId());
                    } else if (viewList.length > 1) {
                        file = editors.getFileByViewId(viewList[i + 1].getId());
                    }
                    break;
                }
            }
            if (file) {
                editors.ensureCreated(file, false);
            }
             */
        });

        topic.subscribe('view.focused', function (event) {
            var view = event.view;
            var vc = event.viewContainer;
            if (!vc || (vc.getParent() !== editors.splitViewContainer)) {
                return;
            }

            var file = editors.getFileByViewId(view.getId());
            if (file) {
                if (editors.currentFile !== file) {
                    editors.setCurrentFile(file);
                }

                topic.publish('editors.focused', file.path, file);
            }
        });

        topic.subscribe('view.close', function (event, close) {

            var action = function closeFile() {
                if (event.closable) {
                    var editorPart = editors.getPart(file);
                    editorPart.hide();
                    editorPart.destroy();
                    editors.removeFile(file.path);

                    var i = editors.currentFiles.indexOf(file);
                    if (i >= 0) {
                        editors.currentFiles.splice(i, 1);
                    } else {
                        console.warn('unexpected');
                    }

                    if (editors.currentFile === file) {
                        editors.setCurrentFile(null);
                    }

                    workbench.unregistFromViewFocusList(view);

                    topic.publish('editors.closed', file.path);
                    close();
                }
            };

            var view = event.view;
            var vc = event.viewContainer;
            if (!vc || (vc.getParent() !== editors.splitViewContainer)) {
                return;
            }

            var file = editors.getFileByViewId(view.getId());

            editors.editorTabFocusController.unregisterView(view);

            if (!event.force && file.isModified()) {
                createDialog(file, 'Close', action);
            } else {
                action();
            }

        });

        topic.subscribe('view.quit', function () {

            ide.unregisterBeforeUnloadChecker('checkModifiedFiles');
            var keys = Object.keys(editors.files);
            var modifiedFileNames = [];
            var len = keys.length;
            for (var i = 0; i < len; i++) {
                var key = keys[i];
                var file = editors.files[key];
                if (file.isModified()) {
                    modifiedFileNames.push(file.name);
                }
            }

            var action = function closeWindow() {

                try {
                    window.focus();
                    window.opener = window;
                    window.close();
                } catch (e) {
                    logger.log('First try to close App failed', e);

                    try {
                        window.open('', '_self', '');
                        window.close();
                    } catch (e) {
                        logger.log('Second try to close App failed', e);
                    }
                }
            };

            var cancel = function cancelSaveBeforeUnload() {
                ide.registerBeforeUnloadChecker('checkModifiedFiles', checkModifiedFiles);
            };

            if (modifiedFileNames.length > 0) {
                createDialog(modifiedFileNames.join(', '), QUIT, action, cancel);
            } else {
                action();
            }
        });

        function checkModifiedFiles() {

            var keys = Object.keys(editors.files);
            var modifiedFileNames = [];
            var len = keys.length;
            for (var i = 0; i < len; i++) {
                var key = keys[i];
                var file = editors.files[key];
                if (file.isModified()) {
                    modifiedFileNames.push(file.name);
                }
            }

            if (modifiedFileNames.length > 0) {
                return 'You have unsaved changes in files: ' + modifiedFileNames.join(', ');
            }
        }

        ide.registerBeforeUnloadChecker('checkModifiedFiles', checkModifiedFiles);

        var lastStatus = ide.registerStatusContributorAndGetLastStatus('editor-view', function () {
            var status = {};
            var cursorDefault = {col: 0, row: 0};
            var splitVc = editors.splitViewContainer;
            var viewContainers = splitVc.getViewContainers();
            var vc, i, j;
            var totalW = 0;
            var totalH = 0;
            for (i = 0; i < viewContainers.length; i++) {
                vc = viewContainers[i];
                if (vc.getViewList().length > 0) {
                    totalW += geometry.getContentBox(vc.topContainer.domNode).w;
                    totalH += geometry.getContentBox(vc.topContainer.domNode).h;
                }
            }

            // status.viewContainers
            status.viewContainers = [];
            for (i = 0; i < viewContainers.length; i++) {
                vc = viewContainers[i];
                var viewList = vc.getViewList();
                var tabs = [];
                var selfile;
                var width = 0;
                var height = 0;
                if (viewList.length > 0) {
                    for (j = 0; j < viewList.length; j++) {
                        var view = viewList[j];
                        var file = editors.getFileByViewId(view.getId());
                        var cursor = editors.getCursor(file) || cursorDefault;
                        var foldings = file.viewer ? file.viewer.getFoldings() : [];
                                // temporary solution
                                // TODO: see why file.viewer sometimes is null.
                        tabs.push([cursor.col, cursor.row, file.path, foldings, file.editorName]);
                        console.log('--* path : ' + file.path);
                    }
                    selfile = editors.getFileByViewId(vc.getSelectedView().getId());
                    width = domStyle.get(vc.topContainer.domNode, 'width');
                    height = domStyle.get(vc.topContainer.domNode, 'height');

                    width = geometry.getContentBox(vc.topContainer.domNode).w;
                    height = geometry.getContentBox(vc.topContainer.domNode).h;
                    if (width > 0) {
                        width = parseInt((width * 100 / totalW), 10) + '%';
                    }
                    if (height > 0) {
                        height = parseInt((height * 100 / totalH), 10) + '%';
                    }
                }
                status.viewContainers.push({
                    tabs: tabs,
                    selected: selfile && selfile.path,
                    width: width,
                    height: height
                });
            }

            // status.viewLayout
            if (viewContainers.length > 0) {
                status.viewLayout = {
                    count: splitVc.get('splitCount'),
                    vertical: splitVc.get('verticalSplit')
                };
            }

            // status.recentFiles
            status.recentFiles = editors.recentFiles.exportToPlainArray();

            return status;
        });

        if (lastStatus && lastStatus.viewContainers) {
            setTimeout(function () {
                editors.onloadPendingFilesCount = _.reduce(lastStatus.viewContainers, function (memo, vc) {
                    return memo + vc.tabs.length;
                }, 0);

                var tab;
                var openFileWithNamespace = function (path, opt, pos, foldings) {
                    editors.openFile(path, opt, function (file) {
                        //console.log('hina: file opend. pos.col = ' + pos.col);
                        //console.log('hina: file opend. pos.row = ' + pos.row);

                        _.defer(function () {
                            if (file.viewer && file.viewer.setCursor) {
                                file.viewer.setCursor(pos);
                            }
                            if (file.viewer && foldings) {
                                _.each(foldings, function (fold) {
                                    file.viewer.foldCodeRange(fold);
                                });
                            }
                        });

                        logger.log('opened file "' + path + '"');
                    });
                };

                var path = null;
                var opt = null;
                var pos = null;
                var vc;

                if (lastStatus.viewLayout && lastStatus.viewLayout.vertical) {
                    if (lastStatus.viewLayout.vertical === true) {
                        editors.splitViewContainer.set('verticalSplit', true);
                    } else {
                        editors.splitViewContainer.set('verticalSplit', false);
                    }
                }

                for (var i = 0; i < lastStatus.viewContainers.length; i++) {
                    vc = lastStatus.viewContainers[i];
                    var siblingList = [];
                    var j;
                    for (j = 0; j < vc.tabs.length; j++) {
                        siblingList.push(vc.tabs[j][2]);
                    }

                    for (j = 0; j < vc.tabs.length; j++) {
                        tab = vc.tabs[j];
                        opt = {};
                        path = tab[2];
                        if (path === vc.selected) {
                            opt.show = true;
                        } else {
                            opt.show = false;
                        }
                        opt.cellIndex = i;
                        opt.siblingList = siblingList;
                        opt.editorName = tab[4];
                        pos = {};
                        pos.col = tab[0];
                        pos.row = tab[1];
                        openFileWithNamespace(path, opt, pos, tab[3]);
                    }

                    var viewContainers = editors.splitViewContainer.getViewContainers();
                    //console.log($(viewContainers[i].topContainer.domNode).css('width'));
                    if (i > 0 && (vc.tabs.length > 0)) {
                        $(viewContainers[i].topContainer.domNode).css('width', vc.width);
                        $(viewContainers[i].topContainer.domNode).css('height', vc.height);
                    }
                }

                if (lastStatus.recentFiles) {
                    editors.recentFiles.importFromPlainArray(lastStatus.recentFiles);
                }
            }, 50);
        }
    }

    return {
        getPanel: getPanel,
        onPanelAppended: onPanelAppended
    };
});
