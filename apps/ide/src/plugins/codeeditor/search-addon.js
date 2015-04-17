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

define(['webida-lib/custom-lib/codemirror/lib/codemirror',
        'other-lib/underscore/lodash.min'], function (CodeMirror, _) {
    // Define search commands. Depends on dialog.js or another
    // implementation of the openDialog method.

    // Replace works a little oddly -- it will do the replace on the next
    // Ctrl-G (or whatever is bound to findNext) press. You prevent a
    // replace by making sure the match is no longer selected when hitting
    // Ctrl-G.

    'use strict';

    (function () {

        function getKeyword(token, ch) {
            var str = token.string;
            if (!str) {
                return '';
            }

            if (token.type === 'comment') {
                var arr;
                ch = ch - token.start - 1;
                while ((arr = str.match(/\w+/))) {
                    var matchStart = arr.index;
                    if (ch < matchStart) {
                        return str.charAt(ch).trim();
                    } else {
                        var matchEnd = matchStart + arr[0].length;
                        if (ch < matchEnd) {
                            return arr[0].trim();
                        } else {
                            ch = ch - matchEnd;
                            str = str.substr(matchEnd);
                        }
                    }
                }
                return str.charAt(ch).trim();
            } else {
                return str.trim();
            }
        }

        function showDialog(cm, replace, callbacks) {
            function closeDialog() {
                searchDlg.remove();
                $(wrapper).css({ top: '0px' });
                cm.off('focus', closeDialog);
                clearSearch(cm);
            }

            function makeInputBox(parent, title, cssOpt) {
                var input = $('<div title="' + title + '">').appendTo(parent);
                var css = _.extend({
                    borderRadius: '4px',
                    backgroundColor: '#aebcca',
                    '-moz-box-shadow': 'inset 0 1px 3px rgba(0, 0, 0, 0.5)',
                    '-webkit-box-shadow': 'inset 0 1px 3px rgba(0, 0, 0, 0.5)',
                    'box-shadow': 'inset 0 1px 3px rgba(0, 0, 0, 0.5)'
                }, cssOpt);
                input.css(css);
                var box = $('<input type="text">').appendTo(input);
                box.css({
                    border: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'transparent',
                    marginLeft: '6px',
                    fontFamily: 'Nanum Gothic Coding',
                    fontSize: '12px'
                });
                return box;
            }

            function makeNavButton(parent, title, cssOpt, imageUrl) {
                var elem = $('<div class="webida-btn" title="' + title + '">').appendTo(parent);
                elem.css(_.extend({
                    position: 'absolute',
                    width: '22px',
                    height: '22px',
                    top: '0px',
                    right: '0px'
                }, cssOpt));
                var elemImg = $('<div>').appendTo(elem);
                elemImg.css({
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundImage: imageUrl
                });
                return elem;
            }

            function makeToggleButton(parent, text, title) {
                var btn = $('<div class="webida-btn" title="' + title + '">').text(text).appendTo(parent);
                var css = {
                    display: 'inline-block',
                    margin: '0 0 0 6px',
                    width: '36px',
                    height: '22px',
                    color: '#363f49'
                };
                btn.css(css);
                btn.click(function () {
                    if (btn.hasClass('selected')) {
                        btn.removeClass('selected');
                    } else {
                        btn.addClass('selected');
                    }
                });
                return btn;
            }

            function mockClicked(btn) {
                btn.addClass('active');
                setTimeout(function () {
                    btn.removeClass('active');
                }, 100);
            }

            var lastQuery = {};

            function setQuery() {
                function makeQuery() {
                    return {
                        query: searchInputBox.val(),
                        regexp: searchRegExp.hasClass('selected'),
                        caseSensitive: searchCaseSensitive.hasClass('selected'),
                        wholeWord: searchWholeWord.hasClass('selected')
                    };
                }

                if (searchInputBox.val() === '') {
                    return false;
                } else {
                    var newQuery = makeQuery();
                    if ((lastQuery.query !== newQuery.query) ||
                        (lastQuery.regexp !== newQuery.regexp) ||
                        (lastQuery.caseSensitive !== newQuery.caseSensitive) ||
                        (lastQuery.wholeWord !== newQuery.wholeWord)) {
                        callbacks.startSearch(cm, searchInputBox.val(), newQuery);
                        lastQuery = newQuery;
                    }
                    return true;
                }
            }

            function findPrev() {
                if (setQuery()) {
                    callbacks.findPrev(cm, searchInputBox.val());
                }
            }

            function findNext() {
                if (setQuery()) {
                    callbacks.findNext(cm, searchInputBox.val());
                }
            }

            function replaceOne() {
                if (setQuery()) {
                    callbacks.replace(cm, searchInputBox.val(), searchReplaceInputBox.val());
                }
            }

            function replaceAll() {
                if (setQuery()) {
                    callbacks.replaceAll(cm, searchInputBox.val(), searchReplaceInputBox.val());
                }
            }
            // check if the dialog was opened already.
            var wrapper = cm.getWrapperElement();
            var parentElem = wrapper.parentNode;
            if (parentElem.getElementsByClassName('webida-find-replace-dialog').length > 0) {
                console.warn('Unexpected: Tried to attach the second search dialog, which is ignored');
                return;
            }

            //
            // Search Dialog
            //
            var searchDlg = $('<div class="webida-find-replace-dialog" tabindex="0">').insertBefore(wrapper);
            var dlgHeight = replace ? '72px' : '39px';
            searchDlg.css({
                position: 'relative',
                top: '0px',
                left: '0px',
                width: '100%',
                height: dlgHeight,
                margin: '0 60px 0 0',
                padding: '0',
                zIndex: 1000,
                backgroundRepeat: 'repeat-x',
                backgroundImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAABICAIAAAC4IAh6AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAdSURBVChTY5i/ei/D7uM3GC7cezOKkTAoTBgYGABrArekfvp7PAAAAABJRU5ErkJggg==)' //jshint ignore:line
            });
            $(wrapper).css({ top: dlgHeight });
            // WTC-387
            searchDlg.bind('keyup', function (e) { e.stopPropagation(); });
            searchDlg.bind('keydown', function (e) {
                e.stopPropagation();
                if (e.keyCode === 27) {
                    cm.focus();
                }
            });

            //
            // Search Dialog first line
            //
            var searchDlgFirstLine = $('<div>').appendTo(searchDlg);
            searchDlgFirstLine.css({
                position: 'absolute',
                top: '8px',
                left: '0px',
                width: '100%',
                height: '24px'
            });

            var searchInputBox = makeInputBox(searchDlgFirstLine, 'text to find/replace', {
                    position: 'absolute',
                    height: '24px',
                    top: '0px',
                    right: '0px',
                    left: '0px',
                    margin: '0 240px 0 6px'
                });
            var cursor, defaultValue = cm.getDoc().getSelection() ||
                (cursor = cm.getCursor(), getKeyword(cm.getTokenAt(cursor), cursor.ch));
            searchInputBox.val(defaultValue).select();

            // Search Navigation buttons left/right
            var searchNavLeft = makeNavButton(searchDlgFirstLine, 'previous', { margin: '0 186px 0 0' },
                'url(data:image/png;base64,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)'); //jshint ignore:line
            var searchNavRight = makeNavButton(searchDlgFirstLine, 'next', { margin: '0 156px 0 0' },
                'url(data:image/png;base64,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)'); //jshint ignore:line

            var searchOptionBtns = $('<div>').appendTo(searchDlgFirstLine);
            searchOptionBtns.css({
                position: 'absolute',
                height: '24px',
                top: '0px',
                right: '0px',
                margin: '0 6px 0 20px'
            });

            var searchRegExp = makeToggleButton(searchOptionBtns, '.*?', 'regular expression');
            var searchCaseSensitive = makeToggleButton(searchOptionBtns, 'Aa', 'case sensitive');
            var searchWholeWord = makeToggleButton(searchOptionBtns, '\' \'', 'whole words only');

            searchNavLeft.click(findPrev);
            searchNavRight.click(findNext);

            searchInputBox.on('keydown', function (e) {
                if (e.keyCode === 13) {
                    if (e.shiftKey) {
                        mockClicked(searchNavLeft);
                        findPrev();
                    } else {
                        mockClicked(searchNavRight);
                        findNext();
                    }
                }
            });

            if (replace) {
                //
                // Search Dialog second line
                //
                var searchDlgSecondLine = $('<div>').appendTo(searchDlg);
                searchDlgSecondLine.css({
                    position: 'absolute',
                    top: '39px',
                    left: '0px',
                    width: '100%',
                    height: '24px'
                });


                var searchReplaceInputBox = makeInputBox(searchDlgSecondLine, 'text to replace with', {
                        position: 'absolute',
                        height: '24px',
                        top: '0px',
                        right: '0px',
                        left: '0px',
                        margin: '0 240px 0 6px'
                    });
                searchReplaceInputBox.attr({ placeholder: 'with' });

                var searchReplace = $('<div class="webida-btn">Replace</div>').appendTo(searchDlgSecondLine);
                searchReplace.css({
                    position: 'absolute',
                    margin: '0 147px 0 0',
                    width: '61px',
                    height: '22px',
                    top: '0px',
                    right: '0px'
                });
                var searchReplaceAll = $('<div class="webida-btn">Replace All</div>').appendTo(searchDlgSecondLine);
                searchReplaceAll.css({
                    position: 'absolute',
                    margin: '0 57px 0 0',
                    width: '82px',
                    height: '22px',
                    top: '0px',
                    right: '0px'
                });

                searchReplace.click(replaceOne);
                searchReplaceAll.click(replaceAll);

                searchReplaceInputBox.on('keydown', function (e) {
                    if (e.keyCode === 13) {
                        mockClicked(searchReplace);
                        replaceOne();
                    }
                });
            }

            //
            // Event Handlers
            //

            cm.on('focus', closeDialog);

            // Focus the input box.
            searchInputBox.focus();

            //
            // Function Definitions
            //


        }

        function getSearchState(cm) {
            function SearchState() {
                this.posFrom = this.posTo = this.query = this.overlay = null;
            }
            return cm.state.search || (cm.state.search = new SearchState());
        }

        function find(cm, rev) {
            cm.operation(function () {
                var state = getSearchState(cm);
                if (state.query) {
                    var cursor = cm.getSearchCursor(state.query,
                                                    rev ? state.posFrom : state.posTo);
                    if (!cursor.find(rev)) {
                        cursor = cm.getSearchCursor(state.query,
                                                    { line: rev ? cm.lastLine() : cm.firstLine(), ch: 0 });
                        if (!cursor.find(rev)) {
                            return;
                        }
                    }
                    cm.setCursor(cursor.from());
                    state.posFrom = cursor.from();
                    state.posTo = cursor.to();
                }
            });
        }

        function clearSearch(cm) {
            cm.operation(function () {
                var state = getSearchState(cm);
                if (state.query) {
                    state.query = null;
                    cm.removeOverlay(state.overlay);
                }
            });
        }

        function startQuery(cm, query, opt) {
            function escapeRegExp(str) {
                return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
            }

            function searchOverlay(query) {
                return {
                    token: function (stream) {
                        if (stream.match(query)) {
                            return 'searching';
                        }
                        while (!stream.eol()) {
                            stream.next();
                            if (stream.match(query, false)) {
                                break;
                            }
                        }
                    }
                };
            }

            var state = getSearchState(cm);

            if (opt.regexp) {
                if (opt.wholeWord) {
                    state.query = new RegExp('\\b' + query + '\\b', opt.caseSensitive ? '' : 'i');
                } else {
                    state.query = new RegExp(query, opt.caseSensitive ? '' : 'i');
                }
            } else {
                if (opt.wholeWord) {
                    state.query = new RegExp('\\b' + escapeRegExp(query) + '\\b', opt.caseSensitive ? '' : 'i');
                } else {
                    state.query = new RegExp(escapeRegExp(query), opt.caseSensitive ? '' : 'i');
                }
            }
            cm.removeOverlay(state.overlay);
            state.overlay = searchOverlay(state.query);
            cm.addOverlay(state.overlay);
            state.posFrom = state.posTo = cm.getCursor();
            state.opt = opt;
        }

        function showFindReplaceDialog(cm, replace) {

            clearSearch(cm);
            var firstReplace;
            showDialog(cm, replace, {
                startSearch: function (cm, query, opt) {
                    firstReplace = true;
                    startQuery(cm, query, opt);
                },
                findPrev: function (cm) {
                    firstReplace = false;
                    find(cm, true);
                },
                findNext: function (cm) {
                    firstReplace = false;
                    find(cm, false);
                },
                replace: function (cm, query, replaceText) {
                    if (!firstReplace) {
                        var state = getSearchState(cm);
                        var cursor = cm.getSearchCursor(state.query, state.posFrom);
                        cursor.findNext();
                        cm.operation(function () {
                            if (state.opt.regexp) {
                                var match = cm.getRange(cursor.from(), cursor.to()).match(query);
                                cursor.replace(replaceText.replace(/\$(\d)/g, function (whole, i) {
                                    return parseInt(i, 10) >= 0 ? match[i] : whole;
                                }));
                            } else {
                                cursor.replace(replaceText);
                            }
                        });
                    }
                    firstReplace = false;
                    find(cm, false);
                },
                replaceAll: function (cm, query, replaceText) {
                    var state = getSearchState(cm);
                    cm.operation(function () {
                        /* jshint -W083 */
                        for (var cursor = cm.getSearchCursor(state.query); cursor.findNext();) {
                            if (state.opt.regexp) {
                                var match = cm.getRange(cursor.from(), cursor.to()).match(query);
                                cursor.replace(replaceText.replace(/\$(\d)/g, function (whole, i) {
                                    return parseInt(i, 10) >= 0 ? match[i] : whole;
                                }));
                            } else {
                                cursor.replace(replaceText);
                            }
                        }
                         /* jshint +W083 */
                    });
                    cm.focus();
                }
            });
        }

        CodeMirror.commands.find = function (cm) { showFindReplaceDialog(cm, false); };
        CodeMirror.commands.replace = function (cm) { showFindReplaceDialog(cm, true); };
        CodeMirror.commands.findNext = function (cm) { find(cm, false); };
        CodeMirror.commands.findPrev = function (cm) { find(cm, true); };
        CodeMirror.commands.highlightSearch = function (cm) {
            clearSearch(cm);
            var cursor, text = cm.getDoc().getSelection() ||
                (cursor = cm.getCursor(), getKeyword(cm.getTokenAt(cursor), cursor.ch));
            if (text) {
                startQuery(cm, text, { caseSensitive: false, regexp: false, wholeWord: false });
            }
        };
    })();
});
