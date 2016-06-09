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
 * @file This file manages dynamic menus.
 * @since 1.7.0
 * @author minsung.jin@samsung.com
 */

define([
    'external/lodash/lodash.min',
    'webida-lib/plugins/command-system/system/command-system',
    'webida-lib/plugins/workbench/plugin'
], function (
    _,
    commandSystem,
    workbench
) {
    'use strict';

    var commandService = commandSystem.service;

    function updateEditLineTopMenu(viewer) {
        var widget;
        var position;
        var lineMenuItem = commandService.getTopMenuModel('line');
        var lineMoveUpMenuItem = commandService.getTopMenuModel('line-move-up');
        var lineMoveDownMenuItem = commandService.getTopMenuModel('line-move-down');
        if (viewer) {
            lineMenuItem.disabled = false;
            widget = viewer.getWidget();
            position = widget.getCursor();
            if (position.line > 0) {
                lineMoveUpMenuItem.disabled = false;
            } else {
                lineMoveUpMenuItem.disabled = true;
            }
            if (position.line < widget.lastLine()) {
                lineMoveDownMenuItem.disabled = false;
            } else {
                lineMoveDownMenuItem.disabled = true;
            }
        } else {
            lineMenuItem.disabled = true;
            lineMoveUpMenuItem.disabled = true;
            lineMoveDownMenuItem.disabled = true;
        }
    }

    function updateEditTopMenu(viewer) {
        var widget;
        var history;
        var undoMenuItem = commandService.getTopMenuModel('undo');
        var redoMenuItem = commandService.getTopMenuModel('redo');
        var deleteMenuItem = commandService.getTopMenuModel('delete');
        var selectAllMenuItem = commandService.getTopMenuModel('select-all');
        var selectLineMenuItem = commandService.getTopMenuModel('select-line');
        if (viewer) {
            widget = viewer.getWidget();
            history = widget.getHistory();
            if (history) {
                if (history.done && history.done.length > 0) {
                    undoMenuItem.disabled = false;
                } else {
                    undoMenuItem.disabled = true;
                }
                if (history.undone && history.undone.length > 0) {
                    redoMenuItem.disabled = false;
                } else {
                    redoMenuItem.disabled = true;
                }
            } else {
                undoMenuItem.disabled = true;
                redoMenuItem.disabled = true;
            }
            deleteMenuItem.disabled = false;
            selectAllMenuItem.disabled = false;
            selectLineMenuItem.disabled = false;
        } else {
            undoMenuItem.disabled = true;
            redoMenuItem.disabled = true;
            deleteMenuItem.disabled = true;
            selectAllMenuItem.disabled = true;
            selectLineMenuItem.disabled = true;
        }
        updateEditLineTopMenu(viewer);
    }

    function updateFindTopMenu(viewer) {
        var replaceMenuItem = commandService.getTopMenuModel('replace');
        var findInFileMenuItem = commandService.getTopMenuModel('find-in-file');
        var highlightToFindMenuItem = commandService.getTopMenuModel('highlight-to-find');
        var findNextMenuItem = commandService.getTopMenuModel('find-next');
        var findPreviousMenuItem = commandService.getTopMenuModel('find-previous');
        if (viewer) {
            replaceMenuItem.disabled = false;
            findInFileMenuItem.disabled = false;
            highlightToFindMenuItem.disabled = false;
            if (viewer.execute('existSearchQuery')) {
                findNextMenuItem.disabled = false;
                findPreviousMenuItem.disabled = false;
            } else {
                findNextMenuItem.disabled = true;
                findPreviousMenuItem.disabled = true;
            }
        } else {
            replaceMenuItem.disabled = true;
            findInFileMenuItem.disabled = true;
            highlightToFindMenuItem.disabled = true;
            findNextMenuItem.disabled = true;
            findPreviousMenuItem.disabled = true;
        }
    }

    function updateEditLineContextMenu(viewer) {
        var widget;
        var position;
        var lineMenuItem = commandService.getContextMenuModel('line');
        var lineMoveUpMenuItem = commandService.getContextMenuModel('line-move-up');
        var lineMoveDownMenuItem = commandService.getContextMenuModel('line-move-down');
        if (viewer) {
            lineMenuItem.invisible = false;
            widget = viewer.getWidget();
            if (widget) {
                position = widget.getCursor();
                if (position.line > 0) {
                    lineMoveUpMenuItem.invisible = false;
                } else {
                    lineMoveUpMenuItem.invisible = true;
                }
                if (position.line < widget.lastLine()) {
                    lineMoveDownMenuItem.invisible = false;
                } else {
                    lineMoveDownMenuItem.invisible = true;
                }
            } else {
                lineMoveUpMenuItem.invisible = true;
                lineMoveDownMenuItem.invisible = true;
            }
        } else {
            lineMenuItem.invisible = true;
            lineMoveUpMenuItem.invisible = true;
            lineMoveDownMenuItem.invisible = true;
        }
    }

    function updateEditContextMenu(viewer) {
        var widget;
        var history;
        var undoMenuItem = commandService.getContextMenuModel('undo');
        var redoMenuItem = commandService.getContextMenuModel('redo');
        var delimiterRedoMenuItem = commandService.getContextMenuModel('delimiter-redo');
        var deleteMenuItem = commandService.getContextMenuModel('delete');
        var selectAllMenuItem = commandService.getContextMenuModel('select-all');
        var selectLineMenuItem = commandService.getContextMenuModel('select-line');
        var delimiterSelectMenuItem = commandService.getContextMenuModel('delimiter-select');
        if (viewer) {
            widget = viewer.getWidget();
            if (widget) {
                history = widget.getHistory();
                if (history) {
                    if (history.done && history.done.length > 0) {
                        undoMenuItem.invisible = false;
                    } else {
                        undoMenuItem.invisible = true;
                    }
                    if (history.undone && history.undone.length > 0) {
                        redoMenuItem.invisible = false;
                    } else {
                        redoMenuItem.invisible = true;
                    }
                } else {
                    undoMenuItem.invisible = true;
                    redoMenuItem.invisible = true;
                } 
            } else {
                undoMenuItem.invisible = true;
                redoMenuItem.invisible = true;
            }
            delimiterRedoMenuItem.invisible = false;
            deleteMenuItem.invisible = false;
            selectAllMenuItem.invisible = false;
            selectLineMenuItem.invisible = false;
            delimiterSelectMenuItem.invisible = false;
        } else {
            undoMenuItem.invisible = true;
            redoMenuItem.invisible = true;
            delimiterRedoMenuItem.invisible = true;
            deleteMenuItem.invisible = true;
            selectAllMenuItem.invisible = true;
            selectLineMenuItem.invisible = true;
            delimiterSelectMenuItem.invisible = true;
        }
        updateEditLineContextMenu(viewer);
    }

    function updateTopMenu() {
        var page;
        var partRegistry;
        var editorParts;
        var currentEditorPart;
        var currentViewer;
        page = workbench.getCurrentPage();
        if (page) {
            partRegistry = page.getPartRegistry();
            if (partRegistry) {
                editorParts = partRegistry.getEditorParts();
                currentEditorPart = partRegistry.getCurrentEditorPart();
                if (currentEditorPart) {
                    currentViewer = currentEditorPart.getViewer();
                }
            }
        }
        updateEditTopMenu(currentViewer);
        updateFindTopMenu(currentViewer);
    }

    function updateContextMenu() {
        var page;
        var partRegistry;
        var editorParts;
        var currentEditorPart;
        var currentViewer;
        page = workbench.getCurrentPage();
        if (page) {
            partRegistry = page.getPartRegistry();
            if (partRegistry) {
                editorParts = partRegistry.getEditorParts();
                currentEditorPart = partRegistry.getCurrentEditorPart();
                if (currentEditorPart) {
                    currentViewer = currentEditorPart.getViewer();
                }
            }
        }
        updateEditContextMenu(currentViewer);
    }

    return {
        updateTopMenu: updateTopMenu,
        updateContextMenu: updateContextMenu
    };
});
