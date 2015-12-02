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
 * Constructor function
 * CommentsControl  class
 * Comments content assist control module.
 *
 * @constructor
 * @since: 2015.11.30
 * @author: h.m.kwon
 *
 */

/*jshint unused:false*/

// @formatter:off
define([
    'external/codemirror/lib/codemirror',
    'external/lodash/lodash.min',
    'require',
    'webida-lib/util/genetic',    
    'webida-lib/util/logger/logger-client',
    'plugins/webida.editor.code-editor/content-assist/IContentAssist'
], function (
    codemirror,
     _,
    require,
    genetic,
    Logger,
    IContentAssist
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    logger.off();     
    
    /* Content assist commands */

    var caCommands = [
        'isLineCommentable',
        'isBlockCommentable',
        'isSelectionCommentable',
        'lineComment',
        'blockComment',
        'commentOutSelection'
    ];

    function CommentsControl(viewer, cm, options, c) {
        logger.info('new CommentsControl()');   

        if (c) {
            c();
        }    
    }
    
    function getEnclosingBlockComments(mode, editor, from, to) {
        var startStr = mode.blockCommentStart;
        var endStr = mode.blockCommentEnd;
        var doc = editor.getDoc();
        var endStrLen = endStr.length;
        var state = 'closed';
        var comments = [];
        var openingPos;
        var lineComment = mode.lineComment;
        var done = false;
        function comparePos(p1, p2) {
            if (p1.line < p2.line) {
                return -1;
            } else if (p1.line > p2.line) {
                return 1;
            } else {
                return p1.ch - p2.ch;
            }
        }

        // collect block comments in the code
        doc.eachLine(function (h) {

            var lineNo, text;

            function findCommentStart(i) {
                if (state !== 'closed') {
                    throw new Error('assertion fail: unrechable');
                }

                if (comparePos({ line: lineNo, ch: i }, to) >= 0) {
                    done = true;
                    return;
                }

                var j = text.indexOf(startStr, i);
                if (j >= i) {
                    var pos = { line: lineNo, ch: j + 1 };
                    var token = editor.getTokenAt(pos, true);
                    if (token && token.string.indexOf(startStr) === 0) {
                        if (comparePos({ line: lineNo, ch: j }, to) < 0) {
                            // found an opening of a block comment
                            state = 'opened';
                            openingPos = { line: lineNo, ch: j };
                            findCommentEnd(j + startStr.length);
                        } else {
                            done = true;
                            return;
                        }
                    }
                }
            }

            function findCommentEnd(i) {
                if (state !== 'opened') {
                    throw new Error('assertion fail: unrechable');
                }
                var j = text.indexOf(endStr, i);
                if (j >= i) {
                    var pos = { line: lineNo, ch: j + 1 };
                    var token = editor.getTokenAt(pos, true);
                    if (token && token.string.substr(-endStrLen) === endStr &&
                        (!lineComment || token.string.indexOf(lineComment) !== 0)) {
                        // found an closing of a block comment
                        state = 'closed';
                        var closingPos;
                        if (comparePos(from, (closingPos = { line: lineNo, ch: j + endStrLen })) < 0) {
                            comments.push([openingPos, closingPos]);
                        }
                        openingPos = null;

                        findCommentStart(j + endStrLen);
                    }
                }
            }

            if (!done) {
                lineNo = h.lineNo();
                text = h.text;
                if (state === 'closed') {
                    findCommentStart(0);
                } else if (state === 'opened') {
                    findCommentEnd(0);
                } else {
                    throw new Error('assertion fail: unreachable');
                }
            }
        });

        //console.log('hina temp: overlapping block comments: ');
        //console.debug(comments);

        // check if from-to overlaps any block comments
        // without being included or including the comments.
        var commentsLen = comments.length;
        if (commentsLen === 0) {
            return [];
        } else if (commentsLen === 1) {
            if (comparePos(comments[0][0], from) <= 0 && comparePos(to, comments[0][1]) <= 0) {
                return comments;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    function isLineCommentable(editor) {
        var from = editor.getCursor('from');
        var to = editor.getCursor('to');
        var mode1 = editor.getModeAt(from);
        var mode2 = editor.getModeAt(to);        
        return mode1.name === mode2.name &&
            mode1.lineComment && mode1.lineComment === mode2.lineComment;
    }

    function isBlockCommentable(editor) {
        var doc = editor.getDoc();
        var from = editor.getCursor('from');
        var to = editor.getCursor('to');
        var from2 = {
            line: from.line,
            ch: 0
        };
        var to2 = {
            line: to.line,
            ch: doc.getLine(to.line).length
        };

        var mode1 = editor.getModeAt(from);
        var mode2 = editor.getModeAt(to);
        var comments;
        return mode1.name === mode2.name &&
            mode1.blockCommentStart &&
            mode1.blockCommentStart === mode2.blockCommentStart &&
            mode1.blockCommentEnd === mode2.blockCommentEnd &&
            (comments = getEnclosingBlockComments(mode1, editor, from, to)) &&
            (comments.length === 1 ||
             ((comments = getEnclosingBlockComments(mode1, editor, from2, to2)) && comments.length === 0));
    }
    
    function isSelectionCommentable(editor) {
        var from = editor.getCursor('from');
        var to = editor.getCursor('to');

        if (from.line === to.line && from.ch === to.ch) {
            return false;
            // no selection
        }

        var mode1 = editor.getModeAt(from);
        var mode2 = editor.getModeAt(to);
        var comments;
        return mode1.name === mode2.name && mode1.blockCommentStart &&
            mode1.blockCommentStart === mode2.blockCommentStart &&
            mode1.blockCommentEnd === mode2.blockCommentEnd &&
            (comments = getEnclosingBlockComments(mode1, editor, from, to)) && comments.length === 0;
    }    
    
    function setCodemirrorCommandsAndHelpers() {
        codemirror.commands.linecomment = function (cm) {
            if (cm.__instance) {
                var from = cm.getCursor('from');
                var to = cm.getCursor('to');
                var mode1 = cm.getModeAt(from);
                var mode2 = cm.getModeAt(to);

                if (mode1.lineComment && mode1.lineComment === mode2.lineComment) {
                    var doc = cm.getDoc();
                    var commenting = false;
                    var line;
                    var commentStr = mode1.lineComment;
                    doc.eachLine(from.line, to.line + 1, function (h) {
                        var i, text = h.text;
                        var commented =
                            (i = text.indexOf(commentStr)) >= 0 &&
                            !/\S/.test(text.substring(0, i));

                        // if there is at least one uncommented line, then we are commenting.
                        commenting = commenting || !commented;
                    });
                    if (commenting) {
                        for (line = from.line; line <= to.line; line++) {
                            doc.replaceRange(commentStr, {line: line, ch: 0});
                        }
                    } else {
                        var len = commentStr.length;
                        for (line = from.line; line <= to.line; line++) {
                            var i, text = doc.getLine(line);
                            i = text.indexOf(commentStr);
                            doc.replaceRange('', {line: line, ch: i}, {line: line, ch: i + len});
                        }
                    }
                    return;
                }
                return codemirror.Pass;
            }
        };
        
        codemirror.commands.blockcomment = function (cm) {
            if (cm.__instance) {
                var doc = cm.getDoc();
                var from = cm.getCursor('from');
                var to = cm.getCursor('to');
                var lastLine = doc.getLine(to.line);

                var mode = cm.getModeAt(from);
                var commenting = (cm.getTokenAt(to, true).type !== 'comment');
                var bcStart = mode.blockCommentStart, bcEnd = mode.blockCommentEnd;
                if (commenting) {
                    doc.replaceRange('\n' + bcEnd, { line: to.line, ch: lastLine.length });
                    doc.replaceRange(bcStart + '\n', { line: from.line, ch: 0 });
                } else {
                    // uncommenting
                    var comments =
                        getEnclosingBlockComments(mode, cm, from, to, bcStart, bcEnd);
                    if (comments.length === 1) {
                        var comment = comments[0];
                        doc.replaceRange('',
                                         { line: comment[1].line, ch: comment[1].ch - bcEnd.length },
                                         comment[1]);
                        doc.replaceRange('',
                                         comment[0],
                                         { line: comment[0].line, ch: comment[0].ch + bcStart.length });
                    } else {
                        console.error('assertion fail: unreachable');
                    }
                }
            }
        };
        
        codemirror.commands.commentOutSelection = function (cm) {
            if (cm.__instance) {
                var from = cm.getCursor('from');
                var to = cm.getCursor('to');
                var mode = cm.getModeAt(from);
                var bcStart = mode.blockCommentStart, bcEnd = mode.blockCommentEnd;

                var doc = cm.getDoc();
                doc.replaceRange(bcEnd, to);
                doc.replaceRange(bcStart, from);
            }
        };
    }

    setCodemirrorCommandsAndHelpers();
    
    function isCaCommand(command) {
        return caCommands.indexOf(command) >= 0;
    }

    genetic.inherits(CommentsControl, IContentAssist, {
        

        /**
         * Returns whether the command is supported
         *
         * @param {string} command
         *
         * @return {boolean}
         */
        canExecute: function (command) {            
            return isCaCommand(command);
        },

        /**
         * Execute the command
         *
         * @param {string} command
         *
         * @param {[args]} arguments
         *
         * @return {all}
         */
        execCommand: function (command) {
            var slice = Array.prototype.slice;
            var args = slice.apply(arguments);
            args.splice(0, 1);
            var func;
            if (isCaCommand(command)) {
                switch (command) {
                    case 'isLineCommentable':
                        func = isLineCommentable;
                        break;                    
                    case 'isBlockCommentable': 
                        func = isBlockCommentable;
                        break;
                    case 'isSelectionCommentable': 
                        func = isSelectionCommentable;
                        break;
                }
                return func.apply(undefined, args);
            } else {
                console.error('Command[' + command + '] is not supported.');
            }
        }
    }); 

    return CommentsControl;
});
