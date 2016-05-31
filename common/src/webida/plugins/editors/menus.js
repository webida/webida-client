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
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/path',
    './plugin'
], function (
    _,
    commandSystem,
    workbench,
    workspace,
    pathUtil,
    editors
) {
    'use strict';

    var commandService = commandSystem.service;

    function updateFileTopMenu(registry) {
        var currentEditorPart;
        var editorParts;
        var saveFileMenuItem = commandService.getTopMenuModel('save-file');
        var saveAllMenuItem = commandService.getTopMenuModel('save-all');
        var closeCurrentMenuItem = commandService.getTopMenuModel('close-current');
        var closeAllMenuItem = commandService.getTopMenuModel('close-all');
        var closeOthersMenuItem = commandService.getTopMenuModel('close-others');
        if (registry) {
            currentEditorPart = registry.getCurrentEditorPart();
            if (currentEditorPart) {
                if (currentEditorPart.isDirty()) {
                    saveFileMenuItem.disabled = false;
                } else {
                    saveFileMenuItem.disabled = true;
                }
            } else {
                saveFileMenuItem.disabled = true;
            }
            if (registry.getDirtyParts().length > 0) {
                saveAllMenuItem.disabled = false;
            } else {
                saveAllMenuItem.disabled = true;
            }
            editorParts = registry.getEditorParts();
            if (editorParts) {
                if (editorParts.length === 1) {
                    closeCurrentMenuItem.disabled = false;
                    closeAllMenuItem.disabled = false;
                } else if (editorParts.length > 1) {
                    closeCurrentMenuItem.disabled = false;
                    closeAllMenuItem.disabled = false;
                    closeOthersMenuItem.disabled = false;
                } else {
                    closeCurrentMenuItem.disabled = true;
                    closeAllMenuItem.disabled = true;
                    closeOthersMenuItem.disabled = true;
                }
            }
        }
        if (!registry || !editorParts) {
            if (!registry) {
                saveFileMenuItem.disabled = true;
                saveAllMenuItem.disabled = true;
            }
            closeCurrentMenuItem.disabled = true;
            closeAllMenuItem.disabled = true;
            closeOthersMenuItem.disabled = true;
        }
    }

    function updateRecentFilesTopMenu() {
        var fileList;
        var id;
        var itemIndex = 0;
        var menuItem = {
            id: '',
            name: '',
            commandId: ''
        };
        var commandItem = {
            id: '',
            plugin: ''
        };
        var recentListMenuItem = commandService.getTopMenuModel('recent-files');
        recentListMenuItem.items = [];
        if (editors.recentFiles.length > 0) {
            fileList = editors.recentFiles;
            _.each(fileList, function (item) {
                id = recentListMenuItem.id + ':' + itemIndex;
                menuItem.id = id;
                menuItem.name = item;
                menuItem.commandId = id;
                commandService.addMenuModel(menuItem, recentListMenuItem);
                commandItem.id = id;
                commandItem.plugin = 'webida-lib/plugins/editors';
                commandService.setCommandRegistry(commandItem);
                itemIndex++;
            });
        }
    }

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

    function updateEditSourceTopMenu(viewer) {
        var widget;
        var selected;
        var delegator;
        var sourceMenuItem = commandService.getTopMenuModel('source');
        var foldCodeMenuItem = commandService.getTopMenuModel('fold-code');
        var beautifyCodeMenuItem = commandService.getTopMenuModel('beautify-code');
        var beautifyAllCodeMenuItem = commandService.getTopMenuModel('beautify-all-code');
        var lineCommentMenuItem = commandService.getTopMenuModel('line-comment');
        var blockCommentMenuItem = commandService.getTopMenuModel('block-comment');
        var renameVariablesMenuItem = commandService.getTopMenuModel('rename-variables');
        if (viewer) {
            sourceMenuItem.disabled = false;
            foldCodeMenuItem.disabled = false;
            widget = viewer.getWidget();
            selected = widget.getSelection();
            if (widget.getMode().name === 'javascript') {
                if (selected) {
                    beautifyCodeMenuItem.disabled = false;
                } else {
                    beautifyCodeMenuItem.disabled = true;
                }
                beautifyAllCodeMenuItem.disabled = false;
            } else {
                beautifyCodeMenuItem.disabled = true;
                beautifyAllCodeMenuItem.disabled = true;
            }
            delegator = widget._contentAssistDelegator;
            if (delegator) {
                if (delegator.execCommand('isLineCommentable', widget)) {
                    lineCommentMenuItem.disabled = false;
                } else {
                    lineCommentMenuItem.disabled = true;
                }
                if (delegator.execCommand('isBlockCommentable', widget)) {
                    blockCommentMenuItem.disabled = false;
                } else {
                    blockCommentMenuItem.disabled = true;
                }
                if (delegator.canExecute('request')) {
                    delegator.exeCommand('request',
                                         widget,
                                         { type: 'rename', newName: 'someName', fullDocs: true },
                                         function (error) {
                        if (!error) {
                            renameVariablesMenuItem.disabled = false;
                        } else {
                            renameVariablesMenuItem.disabled = true;
                        }
                    });
                } else {
                    renameVariablesMenuItem.disabled = true;
                }
            } else {
                lineCommentMenuItem.disabled = true;
                blockCommentMenuItem.disabled = true;
                renameVariablesMenuItem.disabled = true;
            }
        } else {
            sourceMenuItem.disabled = true;
            foldCodeMenuItem.disabled = true;
            beautifyCodeMenuItem.disabled = true;
            beautifyAllCodeMenuItem.disabled = true;
            lineCommentMenuItem.disabled = true;
            blockCommentMenuItem.disabled = true;
            renameVariablesMenuItem.disabled = true;
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
        updateEditSourceTopMenu(viewer);
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

    function updateNavigateEditorsTopMenu(parts) {
        var splitContainer;
        var focusedViewContainer;
        var selectedView;
        var showedViewContainerList;
        var navigateEditorsMenuItem = commandService.getTopMenuModel('navigate-editors');
        var exSelectedTabMenuItem = commandService.getTopMenuModel('ex-selected-tab');
        var goPreviousTabMenuItem = commandService.getTopMenuModel('go-previous-tab');
        var goNextTabMenuItem = commandService.getTopMenuModel('go-next-tab');
        var switchEditorTabMenuItem = commandService.getTopMenuModel('switch-editor-tab');
        var switchNextTabContainerMenuItem = commandService.getTopMenuModel('switch-next-tab-container');
        var moveTabContainerMenuItem = commandService.getTopMenuModel('move-tab-container');
        if (parts.length >= 2) {
            navigateEditorsMenuItem.disabled = false;
            exSelectedTabMenuItem.disabled = false;
        } else {
            navigateEditorsMenuItem.disabled = true;
            exSelectedTabMenuItem.disabled = true;
        }
        splitContainer = editors.splitViewContainer;
        focusedViewContainer = splitContainer.getFocusedViewContainer();
        if (focusedViewContainer.getChildren().length > 1) {
            goPreviousTabMenuItem.disabled = false;
            goNextTabMenuItem.disabled = false;
        } else {
            goPreviousTabMenuItem.disabled = true;
            goNextTabMenuItem.disabled = true;
        }
        if (editors.editorTabFocustContainer) {
            if (editors.editorTabFocusContainer.getViewList().length > 1) {
                switchEditorTabMenuItem.disabled = false;
            } else {
                switchEditorTabMenuItem.disabled = true;
            }
        } else {
            switchEditorTabMenuItem.disabled = true;
        }
        if (splitContainer.getShowedViewContainers().legth > 1) {
            switchNextTabContainerMenuItem.disabled = false;
        } else {
            switchNextTabContainerMenuItem.disabled = true;
        }
        selectedView = focusedViewContainer.getSelectedView();
        showedViewContainerList = splitContainer.getShowedViewContainers();
        if (focusedViewContainer && selectedView) {
            if (showedViewContainerList.length === 1 &&
                showedViewContainerList[0].getChildren().length > 1) {
                moveTabContainerMenuItem.disabled = false;
            } else if (showedViewContainerList.length > 1) {
                moveTabContainerMenuItem.disabled = false;
            } else {
                moveTabContainerMenuItem.disabled = true;
            }
        } else {
            moveTabContainerMenuItem.disabled = true;
        }
    }

    function updateNavigateTopMenu(viewer) {
        var goToDefinitionMenuItem = commandService.getTopMenuModel('go-to-definition');
        var goToLineMenuItem = commandService.getTopMenuModel('go-to-line');
        var goToMatchingBraceMenuItem = commandService.getTopMenuModel('go-to-matching-brace');
        if (viewer) {
            goToDefinitionMenuItem.disabled = false;
            if (viewer.execute('isDefaultKeyMap')) {
                goToLineMenuItem.disabled = false;
            } else {
                goToLineMenuItem.disabled = true;
            }
            if (viewer.execute('isThereMatchingBracket')) {
                goToMatchingBraceMenuItem.disabled = false;
            } else {
                goToMatchingBraceMenuItem.disabled = true;
            }
        } else {
            goToDefinitionMenuItem.disabled = true;
            goToLineMenuItem.disabled = true;
            goToMatchingBraceMenuItem.disabled = true;
        }
    }

    function updateViewTopMenu(partRegistry) {
        var splitEditorsMenuItem = commandService.getTopMenuModel('split-editors');
        var splitVerticalMenuItem = commandService.getTopMenuModel('split-vertical');
        var splitHorizontalMenuItem = commandService.getTopMenuModel('split-horizontal');
        if (partRegistry.getEditorParts().length <= 1) {
            splitEditorsMenuItem.disabled = true;
            splitVerticalMenuItem.disabled = true;
            splitHorizontalMenuItem.disabled = true;
        } else {
            splitEditorsMenuItem.disabled = false;
            if (editors.splitViewContainer.getShowedViewContainers().length > 1) {
                if (editors.splitViewContainer.get('verticalSplit') === true) {
                    splitVerticalMenuItem.disabled = false;
                    splitHorizontalMenuItem.disabled = true;
                } else {
                    splitVerticalMenuItem.disabled = true;
                    splitHorizontalMenuItem.disabled = false;
                }
            } else {
                splitVerticalMenuItem.disabled = false;
                splitHorizontalMenuItem.disabled = false;
            }
        }
    }

    function updateFileContextMenu(registry) {
        var currentEditorPart;
        var editorParts;
        var closeOthersMenuItem = commandService.getContextMenuModel('close-others');
        var closeAllMenuItem = commandService.getContextMenuModel('close-all');
        var delimiterCloseAllMenuItem = commandService.getContextMenuModel('delimiter-close-all');
        var saveFileMenuItem = commandService.getContextMenuModel('save-file');
        if (registry) {
            currentEditorPart = registry.getCurrentEditorPart();
            if (currentEditorPart) {
                if (currentEditorPart.isDirty()) {
                    saveFileMenuItem.invisible = false;
                } else {
                    saveFileMenuItem.invisible = true;
                }
            } else {
                saveFileMenuItem.invisible = true;
            }
            editorParts = registry.getEditorParts();
            if (editorParts) {
                if (editorParts.length > 1) {
                    closeAllMenuItem.invisible = false;
                    closeOthersMenuItem.invisible = false;
                } else {
                    closeAllMenuItem.invisible = true;
                    closeOthersMenuItem.invisible = true;
                    delimiterCloseAllMenuItem.invisible = true;
                }
            }
        }
        if (!registry || !editorParts) {
            saveFileMenuItem.invisible = true;
            closeAllMenuItem.invisible = true;
            closeOthersMenuItem.invisible = true;
            delimiterCloseAllMenuItem.invisible = true;
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
            lineMenuItem.invisible = true;
            lineMoveUpMenuItem.invisible = true;
            lineMoveDownMenuItem.invisible = true;
        }
    }

    function updateEditSourceContextMenu(viewer) {
        var widget;
        var selected;
        var delegator;
        var sourceMenuItem = commandService.getContextMenuModel('source');
        var foldCodeMenuItem = commandService.getContextMenuModel('fold-code');
        var delimiterFoldMenuItem = commandService.getContextMenuModel('delimiter-fold');
        var beautifyCodeMenuItem = commandService.getContextMenuModel('beautify-code');
        var beautifyAllCodeMenuItem = commandService.getContextMenuModel('beautify-all-code');
        var delimiterBeautifyMenuItem = commandService.getContextMenuModel('delimiter-beautify');
        var lineCommentMenuItem = commandService.getContextMenuModel('line-comment');
        var blockCommentMenuItem = commandService.getContextMenuModel('block-comment');
        var delimiterCommentMenuItem = commandService.getContextMenuModel('delimiter-comment');
        var commentOutSelectionMenuItem = commandService.getContextMenuModel('comment-out-selection');
        var renameVariablesMenuItem = commandService.getContextMenuModel('rename-variables');
        if (viewer) {
            sourceMenuItem.invisible = false;
            foldCodeMenuItem.invisible = false;
            delimiterFoldMenuItem.invisible = false;
            widget = viewer.getWidget();
            selected = widget.getSelection();
            if (widget.getMode().name === 'javascript') {
                if (selected) {
                    beautifyCodeMenuItem.invisible = false;
                } else {
                    beautifyCodeMenuItem.invisible = true;
                }
                beautifyAllCodeMenuItem.invisible = false;
                delimiterBeautifyMenuItem.invisible = false;
            } else {
                beautifyCodeMenuItem.invisible = true;
                beautifyAllCodeMenuItem.invisible = true;
                delimiterBeautifyMenuItem.invisible = true;
            }
            delegator = widget._contentAssistDelegator;
            if (delegator) {
                if (delegator.execCommand('isLineCommentable', widget)) {
                    lineCommentMenuItem.invisible = false;
                } else {
                    lineCommentMenuItem.invisible = true;
                }
                if (delegator.execCommand('isBlockCommentable', widget)) {
                    blockCommentMenuItem.invisible = false;
                } else {
                    blockCommentMenuItem.invisible = true;
                }
                if (delegator.execCommand('isSelectionCommentable', widget)) {
                    commentOutSelectionMenuItem.invisible = false;
                } else {
                    commentOutSelectionMenuItem.invisible = true;
                }
                if (delegator.canExecute('request')) {
                    delegator.exeCommand('request',
                                         widget,
                                         { type: 'rename', newName: 'someName', fullDocs: true },
                                         function (error) {
                                            if (!error) {
                                                renameVariablesMenuItem.invisible = false;
                                            } else {
                                                renameVariablesMenuItem.invisible = true;
                                            }
                                        }
                    );
                } else {
                    renameVariablesMenuItem.invisible = true;
                }
                delimiterCommentMenuItem.invisible = false;
            } else {
                sourceMenuItem.invisible = false;
                lineCommentMenuItem.invisible = true;
                blockCommentMenuItem.invisible = true;
                commentOutSelectionMenuItem.invisible = true;
                delimiterCommentMenuItem.invisible = true;
                renameVariablesMenuItem.invisible = true;
            }
        } else {
            sourceMenuItem.invisible = true;
            foldCodeMenuItem.invisible = true;
            delimiterFoldMenuItem.invisible = true;
            beautifyCodeMenuItem.invisible = true;
            beautifyAllCodeMenuItem.invisible = true;
            delimiterBeautifyMenuItem.invisible = true;
            lineCommentMenuItem.invisible = true;
            blockCommentMenuItem.invisible = true;
            delimiterCommentMenuItem.invisible = true;
            commentOutSelectionMenuItem.invisible = true;
            renameVariablesMenuItem.invisible = true;
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
        updateEditSourceContextMenu(viewer);
    }

    function updateNavigateContextMenu(viewer) {
        var delimiterGoToMenuItem = commandService.getContextMenuModel('delimiter-go-to');
        var goToDefinitionMenuItem = commandService.getContextMenuModel('go-to-definition');
        var goToLineMenuItem = commandService.getContextMenuModel('go-to-line');
        var goToMatchingBraceMenuItem = commandService.getContextMenuModel('go-to-matching-brace');
        if (viewer) {
            delimiterGoToMenuItem.invisible = false;
            goToDefinitionMenuItem.invisible = false;
            if (viewer.execute('isDefaultKeyMap')) {
                goToLineMenuItem.invisible = false;
            } else {
                goToLineMenuItem.invisible = true;
            }
            if (viewer.execute('isThereMatchingBracket')) {
                goToMatchingBraceMenuItem.invisible = false;
            } else {
                goToMatchingBraceMenuItem.invisible = true;
            }
        } else {
            delimiterGoToMenuItem.invisible = true;
            goToDefinitionMenuItem.invisible = true;
            goToLineMenuItem.invisible = true;
            goToMatchingBraceMenuItem.invisible = true;
        }
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
        updateFileTopMenu(partRegistry);
        updateRecentFilesTopMenu();
        updateEditTopMenu(currentViewer);
        updateFindTopMenu(currentViewer);
        updateNavigateTopMenu(currentViewer);
        updateNavigateEditorsTopMenu(editorParts);
        updateViewTopMenu(partRegistry);
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
        updateFileContextMenu(partRegistry);
        updateEditContextMenu(currentViewer);
        updateNavigateContextMenu(currentViewer);
    }

    return {
        updateTopMenu: updateTopMenu,
        updateContextMenu: updateContextMenu
    };
});
