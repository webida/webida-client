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

define(['./plugin',
        './menu-items',
        'dojo/Deferred',
        'external/lodash/lodash.min'
], function (editors, menuItems, Deferred, _) {
    'use strict';

    function lineCommentableOrUncommentable(editor) {
        var from = editor.getCursor('from');
        var to = editor.getCursor('to');
        var mode1 = editor.getModeAt(from);
        var mode2 = editor.getModeAt(to);
        return mode1.name === mode2.name && mode1.lineComment &&
            mode1.lineComment === mode2.lineComment;
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

    function blockCommentableOrUncommentable(editor) {

        var doc = editor.getDoc();
        var from = editor.getCursor('from');
        var to = editor.getCursor('to');
        var from2 = { line: from.line, ch: 0 };
        var to2 = { line: to.line, ch: doc.getLine(to.line).length };
        //console.log('hina temp: from and to: ');
        //console.debug(from);
        //console.debug(to);

        var mode1 = editor.getModeAt(from);
        var mode2 = editor.getModeAt(to);
        var comments;
        return mode1.name === mode2.name && mode1.blockCommentStart &&
            mode1.blockCommentStart === mode2.blockCommentStart &&
            mode1.blockCommentEnd === mode2.blockCommentEnd &&
            (comments = getEnclosingBlockComments(mode1, editor, from, to)) &&
            (comments.length === 1 ||
             ((comments = getEnclosingBlockComments(mode1, editor, from2, to2)) && comments.length === 0
             )
            );
    }

    function getItemsUnderFile() {
        var items = {};
        var opened = _.values(editors.files);
        if (editors.currentFile && opened && opened.length > 0) {
            //if (editors.isModifiedFile(editors.currentFile)) {
            if (editors.currentFile.isModified()) {
                items['&Save'] = menuItems.fileMenuItems['&Save'];
            }
            if (editors.hasModifiedFile()) {
                items['Sav&e All'] = menuItems.fileMenuItems['Sav&e All'];
            }

            items['&Close'] = menuItems.fileMenuItems['&Close'];

            if (opened.length > 1) {
                items['Cl&ose Others'] = menuItems.fileMenuItems['Cl&ose Others'];
            }

            items['C&lose All'] = menuItems.fileMenuItems['C&lose All'];
        }
        if (editors.recentFiles.length > 0) {
            items['Recent Files'] = menuItems.fileMenuItems['Recent Files'];
            items['Recent Files'][3] = editors.recentFiles.exportToPlainArray();
        }
        return items;
    }

    function getItemsUnderEdit() {
        var deferred = new Deferred();
        var items = {};
        var opened = _.values(editors.files);
        if (!opened || opened.length < 1) {
            return null;
        }

        var editor = editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor;
        if (editor) {
            var selected = editor.getSelection();

            // Undo, Redo
            var history = editor.getHistory();
            if (history) {
                if (history.done && history.done.length > 0) {
                    items['&Undo'] = menuItems.editMenuItems['&Undo'];
                }
                if (history.undone && history.undone.length > 0) {
                    items['&Redo'] = menuItems.editMenuItems['&Redo'];
                }
            }

            // Delete
            items['&Delete'] = menuItems.editMenuItems['&Delete'];

            // Select All, Select Line
            items['Select &All'] = menuItems.editMenuItems['Select &All'];
            items['Select L&ine'] = menuItems.editMenuItems['Select L&ine'];

            // Line
            var lineItems = {};

            // Line - Move Line Up, Move Line Down, Copy, Delete
            lineItems['&Indent'] = menuItems.editMenuItems['&Line']['&Indent'];
            lineItems['&Dedent'] = menuItems.editMenuItems['&Line']['&Dedent'];
            var pos = editor.getCursor();
            if (pos.line > 0) {
                lineItems['Move Line U&p'] = menuItems.editMenuItems['&Line']['Move Line U&p'];
            }
            if (pos.line < editor.lastLine()) {
                lineItems['Move Line Dow&n'] = menuItems.editMenuItems['&Line']['Move Line Dow&n'];
            }
            //lineItems['&Copy Line'] = menuItems.editMenuItems['&Line']['&Copy Line'];
            lineItems['D&elete Lines'] = menuItems.editMenuItems['&Line']['D&elete Lines'];
            items['&Line'] = lineItems;

            // Source
            var sourceItems = {};

            // Toggle Comments
            if (lineCommentableOrUncommentable(editor)) {
                sourceItems['&Toggle Line Comments'] = menuItems.editMenuItems['&Source']['&Toggle Line Comments'];
            }
            if (blockCommentableOrUncommentable(editor)) {
                sourceItems['Toggle Block Comment'] = menuItems.editMenuItems['&Source']['Toggle Block Comment'];
            }
            // Code Folding
            sourceItems['&Fold'] = menuItems.editMenuItems['&Source']['&Fold'];
            // Beutify (All)
            if (editor.getMode().name === 'javascript') {
                if (selected) {
                    sourceItems['&Beautify'] = menuItems.editMenuItems['&Source']['&Beautify'];
                }
                sourceItems['B&eautify All'] = menuItems.editMenuItems['&Source']['B&eautify All'];
            }
            // Rename
            items['&Source'] = sourceItems;

            if (editor._ternAddon) {
                editor._ternAddon.request(editor,
                                          {type: 'rename', newName: 'merong', fullDocs: true},
                                          function (error/*, data*/) {
                    if (!error) {
                        sourceItems['&Rename Variables'] = menuItems.editMenuItems['&Source']['&Rename Variables'];
                    }
                    deferred.resolve(items);
                });
            } else {
                deferred.resolve(items);
            }
        } else {
            deferred.resolve(items);
        }

        return deferred;
    }

    function getItemsUnderFind() {
        var opened = _.values(editors.files);
        if (!opened || opened.length < 1) {
            return null;
        } else {
            var items = {};
            items['&Replace'] = menuItems.findMenuItems['&Replace'];
            items['F&ind'] = menuItems.findMenuItems['F&ind'];
            items['&Highlight to Find'] = menuItems.findMenuItems['&Highlight to Find'];
            var editor = editors.currentFile && editors.currentFile.editorContext && editors.currentFile.editorContext.editor;
            var query = editor && editor.state && editor.state.search && editor.state.search.query;
            if (query) {
                items['Find &Next'] = menuItems.findMenuItems['Find &Next'];
                items['Find &Previous'] = menuItems.findMenuItems['Find &Previous'];
            }
            return items;
        }
    }

    function getItemsUnderNavigate() {
        function getViewRunnableMenuItems(menuName) {
            var splitContainer = editors.splitViewContainer;
            var focusedVc = splitContainer.getFocusedViewContainer();
            var view;

            if (menuName === '&Select Tab from List') {
                if (editors.editorTabFocusController.getViewList().length > 1) {
                    return true;
                }
                return false;
            } else if (menuName === '&Previous Tab') {
                if (focusedVc.getChildren().length > 1) {
                    return true;
                }
            } else if (menuName === '&Next Tab') {
                if (focusedVc.getChildren().length > 1) {
                    return true;
                }
            } else if (menuName === 'Move Tab to &Other Container') {
                view = focusedVc.getSelectedView();
                if (focusedVc && view) {
                    var showedVcList = splitContainer.getShowedViewContainers();
                    if (showedVcList.length === 1 && (showedVcList[0].getChildren().length > 1)) {
                        return true;
                    } else if (showedVcList.length > 1) {
                        return true;
                    }
                }
                return false;
            } else if (menuName === '&Ex-Selected Tab') {
                if (editors.currentFiles.length > 1) {
                    return true;
                }
            } else if (menuName === 'Switch &Tab Container') {
                if (splitContainer.getShowedViewContainers().length > 1) {
                    return true;
                }
            } else {
                console.warn('Unknown menu name ' + menuName);
            }
            return false;
        }

        var opened = _.values(editors.files);
        var items = {};

        // Navigate Editors
        var naviEditorsItems = {};

        var itemsList = ['&Select Tab from List', '&Previous Tab', '&Next Tab',
                         'Move Tab to &Other Container', '&Ex-Selected Tab', 'Switch &Tab Container'];

        _.each(itemsList, function (item) {
            if (getViewRunnableMenuItems(item)) {
                naviEditorsItems[item] = menuItems.navMenuItems['&Navigate Editors'][item];
            }
        });

        items['&Navigate Editors'] = naviEditorsItems;

        if (opened && opened.length >= 1) {
            items['&Go to Definition'] = menuItems.navMenuItems['&Go to Definition'];
            editors.doWithCurrentEditor(function (inst, editor) {
                if (editor.getOption('keyMap') === 'default') {
                    items['G&o to Line'] = menuItems.navMenuItems['G&o to Line'];
                }
            });
            var mb = editors.doWithCurrentEditor(function (instance, editor) {
                return !!(editor.findMatchingBracket(editor.getCursor(), false));
            });
            if (mb) {
                items['Go to &Matching Brace'] = menuItems.navMenuItems['Go to &Matching Brace'];
            }
        }

        return items;
    }

    function getItemsUnderView() {
        var items = {};
        // Split Editors
        var layoutEditorsItems = {};
        if (editors.splitViewContainer.getShowedViewContainers().length > 1) {
            if (editors.splitViewContainer.get('verticalSplit') === true) {
                layoutEditorsItems['&Horizontal'] = menuItems.viewMenuItems['Spl&it Editors']['&Horizontal'];
            } else {
                layoutEditorsItems['&Vertical'] = menuItems.viewMenuItems['Spl&it Editors']['&Vertical'];
            }
        } else {
            layoutEditorsItems['&Vertical'] = menuItems.viewMenuItems['Spl&it Editors']['&Vertical'];
            layoutEditorsItems['&Horizontal'] = menuItems.viewMenuItems['Spl&it Editors']['&Horizontal'];
        }

        items['Spl&it Editors'] = layoutEditorsItems;
        return items;
    }

    function getContextMenuItems() {

        function selectionCommentable(editor) {
            var from = editor.getCursor('from');
            var to = editor.getCursor('to');
            //console.log('hina temp: from and to: ');
            //console.debug(from);
            //console.debug(to);

            if (from.line === to.line && from.ch === to.ch) {
                return false;	// no selection
            }

            var mode1 = editor.getModeAt(from);
            var mode2 = editor.getModeAt(to);
            var comments;
            return mode1.name === mode2.name && mode1.blockCommentStart &&
                mode1.blockCommentStart === mode2.blockCommentStart &&
                mode1.blockCommentEnd === mode2.blockCommentEnd &&
                (comments = getEnclosingBlockComments(mode1, editor, from, to)) && comments.length === 0;
        }

        var deferred = new Deferred();
        var items = {};

        var opened = _.values(editors.files);
        if (!opened || opened.length < 1) {
            return null;
        }

        var editor = (editors.currentFile &&
                      editors.currentFile.editorContext &&
                      editors.currentFile.editorContext.editor) ? editors.currentFile.editorContext.editor : null;
        if (editor) {
            var selected = editor.getSelection();

            // Close Others, Close All
            if (opened.length > 1) {
                items['Close O&thers'] = menuItems.fileMenuItems['Cl&ose Others'];
            }
            items['&Close All'] = menuItems.fileMenuItems['C&lose All'];

            // Undo, Redo
            var history = editor.getHistory();
            if (history) {
                if (history.done && history.done.length > 0) {
                    items['U&ndo'] = menuItems.editMenuItems['&Undo'];
                }
                if (history.undone && history.undone.length > 0) {
                    items['&Redo'] = menuItems.editMenuItems['&Redo'];
                }
            }

            // Save
            //if (editors.isModifiedFile(editors.currentFile)) {
            if (editors.currentFile.isModified()) {
                items['&Save'] = menuItems.fileMenuItems['&Save'];
            }

            // Delete
            items['&Delete'] = menuItems.editMenuItems['&Delete'];

            // Select All, Select Line
            items['Select &All'] = menuItems.editMenuItems['Select &All'];
            items['Select L&ine'] = menuItems.editMenuItems['Select L&ine'];

            // Line
            var lineItems = {};

            // Line - Move Line Up, Move Line Down, Copy, Delete
            lineItems['&Indent'] = menuItems.editMenuItems['&Line']['&Indent'];
            lineItems['&Dedent'] = menuItems.editMenuItems['&Line']['&Dedent'];
            var pos = editor.getCursor();
            if (pos.line > 0) {
                lineItems['Move Line U&p'] = menuItems.editMenuItems['&Line']['Move Line U&p'];
            }
            if (pos.line < editor.lastLine()) {
                lineItems['Move Line Dow&n'] = menuItems.editMenuItems['&Line']['Move Line Dow&n'];
            }
            //lineItems['&Copy Line'] = menuItems.editMenuItems['&Line']['&Copy Line'];
            lineItems['D&elete Lines'] = menuItems.editMenuItems['&Line']['D&elete Lines'];
            lineItems['Move Cursor Line to Middle'] = menuItems.editMenuItems['&Line']['Move Cursor Line to Middle'];
            lineItems['Move Cursor Line to Top'] = menuItems.editMenuItems['&Line']['Move Cursor Line to Top'];
            lineItems['Move Cursor Line to Bottom'] = menuItems.editMenuItems['&Line']['Move Cursor Line to Bottom'];

            if (_.values(lineItems).length > 0) {
                items['&Line'] = lineItems;
            }

            // Source
            var sourceItems = {};

            // Toggle Comments
            if (lineCommentableOrUncommentable(editor)) {
                sourceItems['&Toggle Line Comments'] = menuItems.editMenuItems['&Source']['&Toggle Line Comments'];
            }
            if (blockCommentableOrUncommentable(editor)) {
                sourceItems['Toggle Block Comment'] = menuItems.editMenuItems['&Source']['Toggle Block Comment'];
            }
            if (selectionCommentable(editor)) {
                sourceItems['Comment Out Selection'] = menuItems.editMenuItems['&Source']['Comment Out Selection'];
            }
            // Code Folding
            sourceItems['&Fold'] = menuItems.editMenuItems['&Source']['&Fold'];
            // Beutify (All)
            var currentModeName = editor.getMode().name;
            if (currentModeName === 'javascript' || currentModeName === 'htmlmixed' || currentModeName === 'css') {
                if (selected) {
                    sourceItems['&Beautify'] = menuItems.editMenuItems['&Source']['&Beautify'];
                }
                sourceItems['B&eautify All'] = menuItems.editMenuItems['&Source']['B&eautify All'];
            }
            // Rename
            if (_.values(sourceItems).length > 0) {
                items['So&urce'] = sourceItems;
            }

            // Go to
            items['&Go to Definition'] = menuItems.navMenuItems['&Go to Definition'];
            editors.doWithCurrentEditor(function (inst, editor) {
                if (editor.getOption('keyMap') === 'default') {
                    items['G&o to Line'] = menuItems.navMenuItems['G&o to Line'];
                }
            });
            var mb = editors.doWithCurrentEditor(function (instance, editor) {
                return !!(editor.findMatchingBracket(editor.getCursor(), false));
            });
            if (mb) {
                items['Go to &Matching Brace'] = menuItems.navMenuItems['Go to &Matching Brace'];
            }

            if (editor._ternAddon) {
                editor._ternAddon.request(editor,
                                          {type: 'rename', newName: 'merong', fullDocs: true},
                                          function (error/*, data*/) {
                    if (!error) {
                        sourceItems['&Rename Variables'] = menuItems.editMenuItems['&Source']['&Rename Variables'];
                    }
                    deferred.resolve(items);
                });
            } else {
                deferred.resolve(items);
            }
        } else {
            // FIXME: this is temp code, must fix this coe when editor plugin refactoring
            if (editors.currentFile.isModified()) {
                items['&Save'] = menuItems.fileMenuItems['&Save'];
            }
            deferred.resolve(items);
        }

        return deferred;
    }

    return {
        getEnclosingBlockComments: getEnclosingBlockComments,

        getItemsUnderFile: getItemsUnderFile,
        getItemsUnderEdit: getItemsUnderEdit,
        getItemsUnderFind: getItemsUnderFind,
        getItemsUnderNavigate: getItemsUnderNavigate,
        getItemsUnderView: getItemsUnderView,
        getContextMenuItems: getContextMenuItems
    };
});
