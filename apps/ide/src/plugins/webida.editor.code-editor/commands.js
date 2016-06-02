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
    'webida-lib/util/logger/logger-client'
], function (
    topic,
    commandSystem,
    workbench,
    vm,
    genetic,
    Logger
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

    return {
        LineCommentCommand: LineCommentCommand,
        BlockCommentCommand: BlockCommentCommand,
        CommentOutSelectionCommand: CommentOutSelectionCommand,
        FoldCodeCommand: FoldCodeCommand,
        BeautifyCodeCommand: BeautifyCodeCommand,
        BeautifyAllCodeCommand: BeautifyAllCodeCommand,
        RenameVariablesCommand: RenameVariablesCommand,
        GoToDefinitionCommand: GoToDefinitionCommand,
        GoToLineCommand: GoToLineCommand,
        GoToMatchingBraceCommand: GoToMatchingBraceCommand
    };
});
