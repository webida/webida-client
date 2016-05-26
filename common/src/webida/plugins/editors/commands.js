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

// @formatter:off
define([
    'dojo/topic',
    'webida-lib/plugins/command-system/system/command-system',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/widgets/views/viewmanager',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './plugin',
], function (
    topic,
    commandSystem,
    workbench,
    vm,
    genetic,
    Logger,
    editors
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    var Command = commandSystem.Command;

    function execCommand(command) {
        logger.info('execCommand(' + command + ')');
        var registry = workbench.getCurrentPage().getPartRegistry();
        var part = registry.getCurrentEditorPart();
        var viewer = part.getViewer();
        if (viewer.canExecute(command)) {
            viewer.execute(command);
        }
    }

    function UndoCommand(id) {
        UndoCommand.id = id;
    }
    genetic.inherits(UndoCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('undo');
                resolve();
            });
        }
    });

    function RedoCommand(id) {
        RedoCommand.id = id;
    }
    genetic.inherits(RedoCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('redo');
                resolve();
            });
        }
    });

    function CursorLineToMiddleCommand(id) {
        CursorLineToMiddleCommand.id = id;
    }
    genetic.inherits(CursorLineToMiddleCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('cursorLineToMiddle');
                resolve();
            });
        }
    });

    function CursorLineToTopCommand(id) {
        CursorLineToTopCommand.id = id;
    }
    genetic.inherits(CursorLineToTopCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('cursorLineToTop');
                resolve();
            });
        }
    });

    function CursorLineToBottomCommand(id) {
        CursorLineToBottomCommand.id = id;
    }
    genetic.inherits(CursorLineToBottomCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('cursorLineToBottom');
                resolve();
            });
        }
    });

    function DeleteCommand(id) {
        DeleteCommand.id = id;
    }
    genetic.inherits(DeleteCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('del');
                resolve();
            });
        }
    });

    function SelectAllCommand(id) {
        SelectAllCommand.id = id;
    }
    genetic.inherits(SelectAllCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('selectAll');
                resolve();
            });
        }
    });

    function SelectLineCommand(id) {
        SelectLineCommand.id = id;
    }
    genetic.inherits(SelectLineCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('selectLine');
                resolve();
            });
        }
    });

    function LineIndentCommand(id) {
        LineIndentCommand.id = id;
    }
    genetic.inherits(LineIndentCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('lineIndent');
                resolve();
            });
        }
    });

    function LineDedentCommand(id) {
        LineDedentCommand.id = id;
    }
    genetic.inherits(LineDedentCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('lineDedent');
                resolve();
            });
        }
    });

    function LineMoveUpCommand(id) {
        LineMoveUpCommand.id = id;
    }
    genetic.inherits(LineMoveUpCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('lineMoveUp');
                resolve();
            });
        }
    });

    function LineMoveDownCommand(id) {
        LineMoveDownCommand.id = id;
    }
    genetic.inherits(LineMoveDownCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('lineMoveDown');
                resolve();
            });
        }
    });

    function LineDeleteCommand(id) {
        LineDeleteCommand.id = id;
    }
    genetic.inherits(LineDeleteCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('lineDelete');
                resolve();
            });
        }
    });

    function LineCommentCommand(id) {
        LineCommentCommand.id = id;
    }
    genetic.inherits(LineCommentCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('lineComment');
                resolve();
            });
        }
    });

    function BlockCommentCommand(id) {
        BlockCommentCommand.id = id;
    }
    genetic.inherits(BlockCommentCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('blockComment');
                resolve();
            });
        }
    });

    function CommentOutSelectionCommand(id) {
        CommentOutSelectionCommand.id = id;
    }
    genetic.inherits(CommentOutSelectionCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('commentOutSelection');
                resolve();
            });
        }
    });

    function FoldCodeCommand(id) {
        FoldCodeCommand.id = id;
    }
    genetic.inherits(FoldCodeCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('foldCode');
                resolve();
            });
        }
    });

    function BeautifyCodeCommand(id) {
        BeautifyCodeCommand.id = id;
    }
    genetic.inherits(BeautifyCodeCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('beautifyCode');
                resolve();
            });
        }
    });

    function BeautifyAllCodeCommand(id) {
        BeautifyAllCodeCommand.id = id;
    }
    genetic.inherits(BeautifyAllCodeCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('beautifyAllCode');
                resolve();
            });
        }
    });

    function RenameVariablesCommand(id) {
        RenameVariablesCommand.id = id;
    }
    genetic.inherits(RenameVariablesCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('rename');
                resolve();
            });
        }
    });

    function ReplaceCommand(id) {
        ReplaceCommand.id = id;
    }
    genetic.inherits(ReplaceCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('replace');
                resolve();
            });
        }
    });

    function FindInFileCommand(id) {
        FindInFileCommand.id = id;
    }
    genetic.inherits(FindInFileCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('find');
                resolve();
            });
        }
    });

    function HighlightToFindCommand(id) {
        HighlightToFindCommand.id = id;
    }
    genetic.inherits(HighlightToFindCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('quickFind');
                resolve();
            });
        }
    });

    function FindNextCommand(id) {
        FindNextCommand.id = id;
    }
    genetic.inherits(FindNextCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('findNext');
                resolve();
            });
        }
    });

    function FindPreviousCommand(id) {
        FindPreviousCommand.id = id;
    }
    genetic.inherits(FindPreviousCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('findPrev');
                resolve();
            });
        }
    });

    function GoToDefinitionCommand(id) {
        GoToDefinitionCommand.id = id;
    }
    genetic.inherits(GoToDefinitionCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('gotoDefinition');
                resolve();
            });
        }
    });

    function GoToLineCommand(id) {
        GoToLineCommand.id = id;
    }
    genetic.inherits(GoToLineCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('gotoLine');
                resolve();
            });
        }
    });

    function GoToMatchingBraceCommand(id) {
        GoToMatchingBraceCommand.id = id;
    }
    genetic.inherits(GoToMatchingBraceCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                execCommand('gotoMatchingBrace');
                resolve();
            });
        }
    });

    function ExSelectTabCommand(id) {
        ExSelectTabCommand.id = id;
    }
    genetic.inherits(ExSelectTabCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                var exFile = editors.currentFiles[1];
                if (exFile) {
                    var view = vm.getView(exFile.viewId);
                    if (view) {
                        view.select(true);
                    } else {
                        console.warn('unexpected');
                    }
                }
                resolve();
            });
        }
    });

    function GoPreviousTabCommand(id) {
        GoPreviousTabCommand.id = id;
    }
    genetic.inherits(GoPreviousTabCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                var focusedViewContainer = editors.splitViewContainer.getFocusedViewContainer();
                if (focusedViewContainer) {
                    var view = focusedViewContainer.getSelectedView();
                    var viewCount = focusedViewContainer.getNumOfViews();
                    if (view && (viewCount > 1)) {
                        var newIndex = focusedViewContainer.getViewIndex(view) - 1;
                        if (newIndex < 0) {
                            newIndex = viewCount - 1;
                        }
                        var targetView = focusedViewContainer.getViewByIndex(newIndex);
                        if (targetView) {
                            targetView.select(true);
                        }
                    }
                }
                resolve();
            });
        }
    });

    function GoNextTabCommand(id) {
        GoNextTabCommand.id = id;
    }
    genetic.inherits(GoNextTabCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                var focusedViewContainer = editors.splitViewContainer.getFocusedViewContainer();
                if (focusedViewContainer) {
                    var view = focusedViewContainer.getSelectedView();
                    var viewCount = focusedViewContainer.getNumOfViews();
                    if (view && (viewCount > 1)) {
                        var newIndex = focusedViewContainer.getViewIndex(view) + 1;
                        if (newIndex >= viewCount) {
                            newIndex = 0;
                        }
                        var targetView = focusedViewContainer.getViewByIndex(newIndex);
                        if (targetView) {
                            targetView.select(true);
                        }
                    }
                }
                resolve();
            });
        }
    });

    function SwitchEditorTabCommand(id) {
        SwitchEditorTabCommand.id = id;
    }
    genetic.inherits(SwitchEditorTabCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                var fieldLayout = [{
                    'name': 'Name',
                    'field': 'title',
                    'width': '200'
                }, {
                    'name': 'Path',
                    'field': 'path',
                    'width': '500'
                }];
                editors.editorTabFocusController.showViewList(fieldLayout, 'Select Editor Tab from List');
                resolve();
            });
        }
    });

    function SwitchNextTabContainerCommand(id) {
        SwitchNextTabContainerCommand.id = id;
    }
    genetic.inherits(SwitchNextTabContainerCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                var sp = editors.splitViewContainer;
                var focusedVc = sp.getFocusedViewContainer();
                var nextVc = null;
                //TODO FIXME
                if (focusedVc) {
                    var showedVcList = sp.getShowedViewContainers();
                    if (showedVcList.length > 1) {
                        for (var i = 0; i < showedVcList.length; i++) {
                            if (showedVcList[i] === focusedVc) {
                                if (i >= showedVcList.length - 1) {
                                    nextVc = showedVcList[0];
                                } else {
                                    nextVc = showedVcList[i + 1];
                                }
                                if (nextVc.getSelectedView()) {
                                    nextVc.getSelectedView().select(true);
                                }
                            }
                        }

                    }
                }
                resolve();
            });
        }
    });

    function moveToOtherTabContainer() {
        var spContainer = editors.splitViewContainer;
        var vc = spContainer.getFocusedViewContainer();
        var view = vc.getSelectedView();
        if (vc && view) {
            var viewContainers = spContainer.getViewContainers();
            var i = viewContainers.indexOf(vc);
            console.assert(i >= 0);
            var targetView = (i < viewContainers.length - 1 ? viewContainers[i + 1] : viewContainers[0]);
            spContainer.moveView(targetView, view);
            view.select(true);
        }
    }

    function MoveTabContainerCommand(id) {
        MoveTabContainerCommand.id = id;
    }
    genetic.inherits(MoveTabContainerCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                moveToOtherTabContainer();
                resolve();
            });
        }
    });

    function SplitVerticalCommand(id) {
        SplitVerticalCommand.id = id;
    }
    genetic.inherits(SplitVerticalCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                var showedVc = editors.splitViewContainer.getShowedViewContainers();
                if (showedVc && (showedVc.length === 1)) {
                    moveToOtherTabContainer();
                }
                editors.splitViewContainer.set('verticalSplit', false);
                resolve();
            });
        }
    });

    function SplitHorizontalCommand(id) {
        SplitHorizontalCommand.id = id;
    }
    genetic.inherits(SplitHorizontalCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                var showedVc = editors.splitViewContainer.getShowedViewContainers();
                if (showedVc && (showedVc.length === 1)) {
                    moveToOtherTabContainer();
                }
                editors.splitViewContainer.set('verticalSplit', true);
                resolve();
            });
        }
    });

    function SaveFileCommand(id) {
        SaveFileCommand.id = id;
    }
    genetic.inherits(SaveFileCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                topic.publish('editor/save/current');
                resolve();
            });
        }
    });

    function SaveAllCommand(id) {
        SaveAllCommand.id = id;
    }
    genetic.inherits(SaveAllCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                logger.info('saveAll()');
                topic.publish('editor/save/all');
                resolve();
            });
        }
    });

    function CloseCurrentCommand(id) {
        CloseCurrentCommand.id = id;
    }
    genetic.inherits(CloseCurrentCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                logger.info('closeCurrent()');
                topic.publish('editor/close/current');
                resolve();
            });
        }
    });

    function CloseOthersCommand(id) {
        CloseOthersCommand.id = id;
    }
    genetic.inherits(CloseOthersCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                logger.info('closeOthers()');
                topic.publish('editor/close/others');
                resolve();
            });
        }
    });

    function CloseAllCommand(id) {
        CloseAllCommand.id = id;
    }
    genetic.inherits(CloseAllCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                topic.publish('editor/close/all');
                resolve();
            });
        }
    });

    function RecentFilesCommand(id, option) {
        RecentFilesCommand.id = id;
        RecentFilesCommand.option = option;
    }
    genetic.inherits(RecentFilesCommand, Command, {
        execute: function () {
            return new Promise(function (resolve) {
                var path = editors.recentFiles[RecentFilesCommand.option];
                topic.publish('editor/open', path);
                resolve();
            });
        }
    });

    return {
        UndoCommand: UndoCommand,
        RedoCommand: RedoCommand,
        CursorLineToMiddleCommand: CursorLineToMiddleCommand,
        CursorLineToTopCommand: CursorLineToTopCommand,
        CursorLineToBottomCommand: CursorLineToBottomCommand,
        DeleteCommand: DeleteCommand,
        SelectAllCommand: SelectAllCommand,
        SelectLineCommand: SelectLineCommand,
        LineIndentCommand: LineIndentCommand,
        LineDedentCommand: LineDedentCommand,
        LineMoveUpCommand: LineMoveUpCommand,
        LineMoveDownCommand: LineMoveDownCommand,
        LineDeleteCommand: LineDeleteCommand,
        LineCommentCommand: LineCommentCommand,
        BlockCommentCommand: BlockCommentCommand,
        CommentOutSelectionCommand: CommentOutSelectionCommand,
        FoldCodeCommand: FoldCodeCommand,
        BeautifyCodeCommand: BeautifyCodeCommand,
        BeautifyAllCodeCommand: BeautifyAllCodeCommand,
        RenameVariablesCommand: RenameVariablesCommand,
        ReplaceCommand: ReplaceCommand,
        FindInFileCommand: FindInFileCommand,
        HighlightToFindCommand: HighlightToFindCommand,
        FindNextCommand: FindNextCommand,
        FindPreviousCommand: FindPreviousCommand,
        GoToDefinitionCommand: GoToDefinitionCommand,
        moveToOtherTabContainer: moveToOtherTabContainer,
        GoToLineCommand: GoToLineCommand,
        GoToMatchingBraceCommand: GoToMatchingBraceCommand,
        ExSelectTabCommand: ExSelectTabCommand,
        GoPreviousTabCommand: GoPreviousTabCommand,
        GoNextTabCommand: GoNextTabCommand,
        SwitchEditorTabCommand: SwitchEditorTabCommand,
        SwitchNextTabContainerCommand: SwitchNextTabContainerCommand,
        MoveTabContainerCommand: MoveTabContainerCommand,
        SplitVerticalCommand: SplitVerticalCommand,
        SplitHorizontalCommand: SplitHorizontalCommand,
        SaveFileCommand: SaveFileCommand,
        SaveAllCommand: SaveAllCommand,
        CloseCurrentCommand: CloseCurrentCommand,
        CloseOthersCommand: CloseOthersCommand,
        CloseAllCommand: CloseAllCommand,
        RecentFilesCommand: RecentFilesCommand
    };
});
