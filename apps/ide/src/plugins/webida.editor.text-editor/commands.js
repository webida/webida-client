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
 * @file This file is defining method for execution of command.
 * @since 1.7.0
 * @author minsung.jin@samsung.com
 */

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
        ReplaceCommand: ReplaceCommand,
        FindInFileCommand: FindInFileCommand,
        HighlightToFindCommand: HighlightToFindCommand,
        FindNextCommand: FindNextCommand,
        FindPreviousCommand: FindPreviousCommand,
        RecentFilesCommand: RecentFilesCommand
    };
});
