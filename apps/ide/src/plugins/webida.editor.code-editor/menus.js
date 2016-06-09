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
], function (
    _,
    commandSystem,
    workbench
) {
    'use strict';

    var commandService = commandSystem.service;

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
                    delegator.exeCommand('request', widget,
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

    function updateEditSourceContextMenu(viewer) {
        var widget;
        var selected;
        var delegator;
        var sourceMenuItem = commandService.getContextMenuModel('source');
        var foldCodeMenuItem = commandService.getContextMenuModel('fold-code');
        var delimiterBeautifyMenuItem = commandService.getContextMenuModel('delimiter-beautify');
        var beautifyCodeMenuItem = commandService.getContextMenuModel('beautify-code');
        var beautifyAllCodeMenuItem = commandService.getContextMenuModel('beautify-all-code');
        var delimiterCommentMenuItem = commandService.getContextMenuModel('delimiter-comment');
        var lineCommentMenuItem = commandService.getContextMenuModel('line-comment');
        var blockCommentMenuItem = commandService.getContextMenuModel('block-comment');
        var delimiterSelectionMenuItem = commandService.getContextMenuModel('delimiter-selection');
        var commentOutSelectionMenuItem = commandService.getContextMenuModel('comment-out-selection');
        var renameVariablesMenuItem = commandService.getContextMenuModel('rename-variables');
        if (viewer) {
            sourceMenuItem.invisible = false;
            foldCodeMenuItem.invisible = false;
            widget = viewer.getWidget();
            if (widget) {
                selected = widget.getSelection();
                if (widget.getMode().name === 'javascript') {
                    if (selected) {
                        beautifyCodeMenuItem.invisible = false;
                    } else {
                        beautifyCodeMenuItem.invisible = true;
                    }
                    delimiterBeautifyMenuItem.invisible = false;
                    beautifyAllCodeMenuItem.invisible = false;

                } else {
                    delimiterBeautifyMenuItem.invisible = true;
                    beautifyCodeMenuItem.invisible = true;
                    beautifyAllCodeMenuItem.invisible = true;
                }
            } else {
                delimiterBeautifyMenuItem.invisible = true;
                beautifyCodeMenuItem.invisible = true;
                beautifyAllCodeMenuItem.invisible = true;
            }
            if (widget) {
                delegator = widget._contentAssistDelegator;
            } else {
                sourceMenuItem.invisible = false;
                delimiterCommentMenuItem.invisible = true;
                lineCommentMenuItem.invisible = true;
                blockCommentMenuItem.invisible = true;
                delimiterSelectionMenuItem.invisible = true;
                commentOutSelectionMenuItem.invisible = true;
                renameVariablesMenuItem.invisible = true;
            }
            if (delegator) {
                if (delegator.execCommand('isLineCommentable', widget)) {
                    delimiterCommentMenuItem.invisible = false;
                    lineCommentMenuItem.invisible = false;
                } else {
                    delimiterCommentMenuItem.invisible = true;
                    lineCommentMenuItem.invisible = true;
                }
                if (delegator.execCommand('isBlockCommentable', widget)) {
                    delimiterCommentMenuItem.invisible = false;
                    blockCommentMenuItem.invisible = false;
                } else {
                    delimiterCommentMenuItem.invisible = true;
                    blockCommentMenuItem.invisible = true;
                }
                if (delegator.execCommand('isSelectionCommentable', widget)) {
                    delimiterSelectionMenuItem.invisible = false;
                    commentOutSelectionMenuItem.invisible = false;
                } else {
                    delimiterSelectionMenuItem.invisible = true;
                    commentOutSelectionMenuItem.invisible = true;
                }
                if (delegator.canExecute('request')) {
                    delegator.exeCommand('request', widget,
                                         { type: 'rename', newName: 'someName', fullDocs: true },
                                         function (error) {
                        if (!error) {
                            renameVariablesMenuItem.invisible = false;
                        } else {
                            renameVariablesMenuItem.invisible = true;
                        }
                    });
                } else {
                    renameVariablesMenuItem.invisible = true;
                }
            } else {
                sourceMenuItem.invisible = false;
                delimiterCommentMenuItem.invisible = true;
                lineCommentMenuItem.invisible = true;
                blockCommentMenuItem.invisible = true;
                delimiterSelectionMenuItem.invisible = true;
                commentOutSelectionMenuItem.invisible = true;
                renameVariablesMenuItem.invisible = true;
            }
        } else {
            sourceMenuItem.invisible = true;
            foldCodeMenuItem.invisible = true;
            delimiterBeautifyMenuItem.invisible = true;
            beautifyCodeMenuItem.invisible = true;
            beautifyAllCodeMenuItem.invisible = true;
            delimiterCommentMenuItem.invisible = true;
            lineCommentMenuItem.invisible = true;
            blockCommentMenuItem.invisible = true;
            delimiterSelectionMenuItem.invisible = true;
            commentOutSelectionMenuItem.invisible = true;
            renameVariablesMenuItem.invisible = true;
        }
    }

    function updateNavigateContextMenu(viewer) {
        var delimiterGoToMenuItem = commandService.getContextMenuModel('delimiter-go-to');
        var goToDefinitionMenuItem = commandService.getContextMenuModel('go-to-definition');
        var goToLineMenuItem = commandService.getContextMenuModel('go-to-line');
        var goToMatchingBraceMenuItem = commandService.getContextMenuModel('go-to-matching-brace');
        if (viewer && viewer.mode) {
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
        updateEditSourceTopMenu(currentViewer);
        updateNavigateTopMenu(currentViewer);
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
        updateEditSourceContextMenu(currentViewer);
        updateNavigateContextMenu(currentViewer);
    }

    return {
        updateTopMenu: updateTopMenu,
        updateContextMenu: updateContextMenu
    };
});
