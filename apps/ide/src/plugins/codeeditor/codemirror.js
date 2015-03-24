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

define(['require',
        'webida-lib/plugins/editors/viable-menu-items',
        'other-lib/underscore/lodash.min',
        'webida-lib/custom-lib/codemirror/lib/codemirror',
        'webida-lib/util/loadCSSList',
        './snippet'],
function (require, vmi, _, codemirror, loadCSSList, Snippet) {
    'use strict';

    var settings = {
        useWorker: true,
        gotoLinkEnabled: true,
        autoHint: true,
        autoHintDelay: 300
    };

    var _localHinterSchemes = [];
    var _globalHinterSchemes = [];

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
                    vmi.getEnclosingBlockComments(mode, cm, from, to, bcStart, bcEnd);
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
    function foldCode(cm, start, end) {
        var myWidget = $('<span class="CodeMirror-foldmarker">').text('\u2194')[0];
        codemirror.on(myWidget, 'mousedown', function () { myRange.clear(); });
        var myRange = cm.markText(start, end, {
            replacedWith: myWidget,
            clearOnEnter: true,
            __isFold: true
        });
    }
    codemirror.commands.foldselection = function (cm) {
        foldCode(cm, cm.getCursor('start'), cm.getCursor('end'));
    };

    codemirror.commands['tern-showtype'] = function (cm) {
        cm._ternAddon.showType(cm);
    };
    codemirror.commands['tern-gotodefinition'] = function (cm) {
        cm._ternAddon.jumpToDef(cm);
    };
    codemirror.commands['tern-jumpback'] = function (cm) {
        cm._ternAddon.jumpBack(cm);
    };
    codemirror.commands['tern-rename'] = function (cm) {
        cm._ternAddon.rename(cm);
    };
    /*
    codemirror.commands['tern-showreference'] = function (cm) {
        // Caution: Do not load modules under plugins directory.
        require(['plugins/search-view/plugin'], function (SearchView) {
            cm._ternAddon.showReferences(cm, function (error, refs) {
                if (!error) {
                    SearchView.showResult({
                        items: _.map(refs.refs, function (ref) {
                            return {
                                path: ref.file,
                                location: {
                                    start: eventTransformers.cmLoc2wrapperLoc(ref.start),
                                    end: eventTransformers.cmLoc2wrapperLoc(ref.end)
                                }
                            };
                        }),
                        columns: [
                            {id: 'path', label: 'File name',
                             formatter: function (path) { return path.substring(path.lastIndexOf('/') + 1); }},
                            {id: 'location', label: 'Location'},
                            {id: 'path', label: 'File Path',
                             formatter: function (path) { return path.substring(0, path.lastIndexOf('/') + 1); }}
                        ]
                    });
                }
            });
        });
    };
     */
    codemirror.commands.gotoLine = function (cm) {
        if (cm.getOption('keyMap') === 'default') {
            var dialog = 'Go to line: <input type="text" style="width: 10em"/> <span style="color: #888"></span>';
            loadCSSList([require.toUrl('webida-lib/custom-lib/codemirror/addon/dialog/dialog.css')], function () {
                require(['webida-lib/custom-lib/codemirror/addon/dialog/dialog'], function () {
                    cm.openDialog(dialog, function (query) {
                        var line = Math.floor(+query - 1);
                        cm.__instance.setCursor({row: line, col: 0});
                    });
                });
            });
        } else {
            return codemirror.Pass;
        }
    };
    codemirror.commands.handleTab = function (cm) {
        if (cm.__instance.options.setSnippetEnabled) {
            if (Snippet.navigateSnippet(cm) || Snippet.expandSnippet(cm)) {
                return undefined;
            }
        }
        if (!cm.__instance.options.indentWithTabs) {
            codemirror.commands.insertSoftTab(cm);
        } else {
            return codemirror.Pass;
        }
    };
    codemirror.commands.navigateSnippetBackward = function (cm) {
        if (!Snippet.navigateSnippet(cm, true)) {
            return codemirror.Pass;
        }
    };

    // Manage available themes and modes
    var availables = ['mode::text/plain'];
    function addAvailable(type, name) {
        if (!isAvailable(type, name)) {
            availables.push(type + '::' + name);
        }
    }
    function isAvailable(type, name) {
        return _.contains(availables, type + '::' + name);
    }

    // CodeEditor
    var eventTransformers = {
        // TODO 예전 에이스 에디터의 잔해
        // row, col 사용은 제거해도 무방할 듯
        wrapperLoc2cmLoc: function (loc) {
            if (loc.hasOwnProperty('row') && loc.hasOwnProperty('col')) {
                return {
                    line: loc.row,
                    ch: loc.col
                };
            } else {
                return loc;
            }
        },
        cmLoc2wrapperLoc: function (loc) {
            if (loc.hasOwnProperty('line') && loc.hasOwnProperty('ch')) {
                return {
                    row: loc.line,
                    col: loc.ch
                };
            } else {
                return loc;
            }
        },
        change: function (self, listener) {
            return function (_, e) {
                var event;
                if (e.removed.length > 1 || e.removed[0] !== '') {
                    // something removed
                    event = {};
                    event.range = {
                        start: eventTransformers.cmLoc2wrapperLoc(e.from),
                        end: eventTransformers.cmLoc2wrapperLoc(e.to)
                    };
                    event.text = e.removed.join('\n');
                    event.data = e;
                    listener(self, event);
                }
                if (e.text.length > 1 || e.text[0] !== '') {
                    // something inserted
                    event = {type: 'insert'};
                    var end = eventTransformers.cmLoc2wrapperLoc(e.from);
                    end.row += e.text.length - 1;
                    if (e.text.length === 1) {
                        end.col += e.text[0].length;
                    } else {
                        end.col = e.text[e.text.length - 1].length;
                    }
                    event.range = {
                        start: eventTransformers.cmLoc2wrapperLoc(e.from),
                        end: end
                    };
                    event.text = e.text.join('\n');
                    event.data = e;
                    listener(self, event);
                }
            };
        },
        cursor: function (self, listener) {
            return function () {
                listener(self);
            };
        }
    };

    function cursorAtAutoHint(cm, modeName, cursor, rightToken) {
        var token = cm.getTokenAt(cursor);

        if (_.find(cursorAtAutoHintTypes, function (obj) {
            return _.contains(obj.mode, modeName) && _.contains(obj.tokenTypes, token.type);
        })) {
            return true;
        }

        // javascript
        if (token.type === null && token.string === '.') {
            if (!rightToken) {
                return cursorAtAutoHint(cm, modeName, {line: cursor.line, ch: cursor.ch - 1}, token);
            }
        } else if (token.type === null && token.string === ')' && rightToken && rightToken.string === '.') {
            var matching = cm.findMatchingBracket(cursor, false);
            if (matching && matching.match, matching.to) {
                return cursorAtAutoHint(cm, modeName, {line: matching.to.line, ch: matching.to.ch});
            }
        }

        // html
        if (token.type === null && token.string === '=') {
            if (!rightToken) {
                if (cm.getTokenTypeAt({line: cursor.line, ch: cursor.ch - 1}) === 'attribute') {
                    return true;
                }
            }
        } else if (/\battr-value-\w+\b/.test(token.type)) {
            return true;
        }


        return false;
    }

    var cursorAtAutoHintTypes = [
        {
            mode: ['javascript'],
            tokenTypes: ['variable', 'variable-2', 'property']
        },
        {
            mode: ['html', 'xml'],
            tokenTypes: ['tag', 'attribute', 'link']
        },
        {
            mode: ['css'],
            tokenTypes: ['tag', 'builtin', 'qualifier', 'property error', 'property']
        }
    ];


    function onBeforeShowHints(cm) {
        if (cm._ternAddon) {
            cm._ternAddon.closeArgHints(cm);
        }
    }

    codemirror.commands.autocomplete = function (cm, options) {
        if (options === undefined) {
            // call by explicit key (ctrl+space)
            if (cm.state.completionActive) {
                cm.state.completionActive.close();
                return;
            }
        }

        options = options || {};
        options.path = cm.__instance.file.path;
        options.async = true;
        options.useWorker = cm.__instance.settings.useWorker;
        options.beforeShowHints = onBeforeShowHints;

        var modeAt = cm.getModeAt(cm.getCursor());
        var modeName = modeAt && modeAt.name;

        if (modeName === undefined || modeName === null) {
            return;
        }
        cm._hintModeName = modeName;

        if (cm.state.completionActive && cm.state.completionActive.widget) {
            return;
        } else if (options.autoHint && !cursorAtAutoHint(cm, modeName, cm.getCursor())) {
            return;
        }

        codemirror.showHint(cm, hint, options);
    };

    codemirror.commands.save = function (cm) {
        cm.__instance.triggerEvent('save');
    };

    function CodeEditor(elem, file, startedListener) {
        var self = this;

        this.elem = elem;
        this.file = file;

        this.options = {};
        this.options.extraKeys = {
            'Ctrl-Space': 'autocomplete',
            'Ctrl-/': 'linecomment',
            'Tab': 'handleTab',
            'Shift-Tab': 'navigateSnippetBackward',
            'Ctrl--': 'foldselection',
            'Ctrl-D': 'gotoLine',
        };
        this.cursorListeners = [];
        this.focusListeners = [];
        this.blurListeners = [];

        this.deferredActions = [];

        this.mode = '';
        this.mappedMode = 'text/plain';

        if (startedListener) {
            this.addDeferredAction(function (self) {
                startedListener(file, self);
            });
        }

        this.settings = settings;

        loadCSSList([require.toUrl('./css/webida.css'),
                     require.toUrl('webida-lib/custom-lib/codemirror/lib/codemirror.css'),
                     require.toUrl('webida-lib/custom-lib/codemirror/addon/dialog/dialog.css')], function () {
            require(['webida-lib/custom-lib/codemirror/addon/dialog/dialog',
                     'webida-lib/custom-lib/codemirror/addon/search/searchcursor',
                     './search-addon',
                     'webida-lib/custom-lib/codemirror/addon/edit/closebrackets',
                     'webida-lib/custom-lib/codemirror/addon/edit/closetag',
                     'webida-lib/custom-lib/codemirror/addon/edit/matchbrackets'], function () {
                self.start();
            });
        });

    }
    CodeEditor.jsHintWorker = (function () {
        var listeners = {};
        var worker = null;
        return function (code, options, listener) {
            if (worker === null) {
                worker = new Worker(require.toUrl('./jshint-worker.js'));
                worker.onmessage = function (event) {
                    var data = event.data;
                    listeners[data.reqId](data);
                };
            }
            var reqId = _.uniqueId('jshint-worker-');
            worker.postMessage({
                reqId: reqId,
                code: code,
                options: options
            });
            listeners[reqId] = listener;
        };
    })();
    CodeEditor.getAvailableModes = function () {
        return [
            'js', 'json', 'ts', 'html', 'css', 'less'
        ];
    };
    CodeEditor.getAvailableThemes = function () {
        return [
            'default', 'ambiance', 'blackboard', 'cobalt', 'eclipse', 'elegant', 'erlang-dark', 'lesser-dark',
            'midnight', 'monokai', 'neat', 'night', 'rubyblue', 'solarized dark', 'solarized light', 'twilight',
            'vibrant-ink', 'xq-dark', 'xq-light', 'webida-dark', 'webida-light'
        ];
    };
    CodeEditor.getAvailableKeymaps = function () {
        return ['default', 'vim', 'emacs'];
    };
    CodeEditor.prototype.addDeferredAction = function (action) {
        if (this.editor) {
            action(this);
        } else {
            this.deferredActions.push(action);
        }
    };
    CodeEditor.prototype.start = function () {
        if (this.editor !== undefined) {
            console.error('Error!');
            return;
        }
        var self = this;
        var options = {
            //electricChars: false,
            flattenSpans: false,
            autoCloseBrackets: this.keymap !== 'vim',
            autoCloseTags: true
        };

        function setOption(name, value, condition, defaultValue) {
            if (condition === undefined) {
                if (value !== undefined) {
                    options[name] = value;
                }
            } else {
                if (condition) {
                    options[name] = value;
                } else {
                    options[name] = defaultValue;
                }
            }
        }
        setOption('theme', this.theme, isAvailable('theme', this.theme), 'default');
        setOption('mode', this.mappedMode, isAvailable('mode', this.mode), 'text/plain');
        setOption('keyMap', this.keymap, isAvailable('keymap', this.keymap), 'default');
        setOption('lineNumbers', this.options.lineNumbers, true);
        setOption('tabSize', this.options.tabSize);
        setOption('indentUnit', this.options.indentUnit);
        setOption('indentWithTabs', this.options.indentWithTabs);
        setOption('indentOnPaste', this.options.indentOnPaste);
        setOption('extraKeys', this.options.extraKeys);
        setOption('lineWrapping', this.options.lineWrapping);

        this.editor = codemirror(this.elem, options);
        this.editor.setOption('showCursorWhenSelecting', true);
        this.editor.__instance = this;
        $(this.editor.getWrapperElement()).addClass('maincodeeditor');
        this.__applyLinter();

        if (this.deferredActions) {
            _.each(this.deferredActions, function (action) {
                action(self);
            });
            delete this.deferredActions;
        }

        this.sizeChangePoller = setInterval(function () {
            self.__checkSizeChange();
        }, 500);

        this.editor.on('mousedown', function (cm, e) {
            if (settings.gotoLinkEnabled) {
                require(['./content-assist/goto-link'], function (gotolink) {
                    gotolink.onMouseDown(cm, e);
                });
            }
        });

        this.editor.on('keydown', function (cm, e) {
            if (settings.gotoLinkEnabled) {
                require(['./content-assist/goto-link'], function (gotolink) {
                    gotolink.onKeyDown(cm, e);
                });
            }
        });

        // conditionally indent on paste
        self.editor.on('change', function (cm, e) {
            if (self.editor.options.indentOnPaste && e.origin === 'paste' && e.text.length > 1) {
                for (var i = 0; i <= e.text.length; i++) {
                    cm.indentLine(e.from.line + i);
                }
            }
        });

        Snippet.init(self.editor);
    };
    CodeEditor.prototype.__checkSizeChange = function () {
        if (this.editor) {
            var visible = $(this.elem).is(':visible');
            if (visible) {
                var width = $(this.elem).width(), height = $(this.elem).height();
                if (this.__width !== width || this.__height !== height || this.__visible !== visible) {
                    this.editor.refresh();
                    this.__width = width;
                    this.__height = height;
                    this.__visible = visible;
                }
            }
        }
    };
    CodeEditor.prototype.destroy = function () {
        $(this.elem).html('');
        if (this.sizeChangePoller !== undefined) {
            clearInterval(this.sizeChangePoller);
        }
    };
    CodeEditor.prototype.addChangeListener = function (listener) {
        var tListener = eventTransformers.change(this, listener);
        this.addDeferredAction(function (self) {
            self.editor.on('change', tListener);
        });
    };
    CodeEditor.prototype.addCursorListener = function (listener) {
        var tListener = eventTransformers.cursor(this, listener);
        this.cursorListeners.push(listener);
        this.addDeferredAction(function (self) {
            self.editor.on('cursorActivity', tListener);
        });
    };
    CodeEditor.prototype.addFocusListener = function (listener) {
        this.focusListeners.push(listener);
        this.addDeferredAction(function (self) {
            self.editor.on('focus', listener);
        });
    };
    CodeEditor.prototype.addBlurListener = function (listener) {
        this.blurListeners.push(listener);
        this.addDeferredAction(function (self) {
            self.editor.on('blur', listener);
        });
    };
    CodeEditor.prototype.addEventListener = function (type, listener) {
        if (this.customListeners === undefined) {
            this.customListeners = {};
        }
        if (this.customListeners[type] === undefined) {
            this.customListeners[type] = [];
        }
        this.customListeners[type].push(listener);
    };
    CodeEditor.prototype.addExtraKeys = function (extraKeys) {
        this.options.extraKeys = _.extend(this.options.extraKeys, extraKeys);
        if (this.editor) {
            this.editor.setOption('extraKeys', this.options.extraKeys);
        }
    };
    CodeEditor.prototype.triggerEvent = function (type, event) {
        var self = this;
        if (this.customListeners !== undefined) {
            if (this.customListeners[type] !== undefined) {
                _.each(this.customListeners[type], function (listener) {
                    listener(self, event);
                });
            }
        }
    };
    CodeEditor.prototype.setCursor = function (cursor) {
        this.cursor = cursor;
        this.addDeferredAction(function (self) {
            self.editor.getDoc().setCursor(eventTransformers.wrapperLoc2cmLoc(cursor));
        });
        if (! this.editor) {
            var self = this;
            _.each(this.cursorListeners, function (listener) {
                listener(self, cursor);
            });
        }
    };
    CodeEditor.prototype.setSelection = function (anchor, head) {
        this.cursor = head;
        this.addDeferredAction(function (self) {
            self.editor.getDoc().setSelection(
                eventTransformers.wrapperLoc2cmLoc(anchor),
                eventTransformers.wrapperLoc2cmLoc(head));
        });
        if (! this.editor) {
            var self = this;
            _.each(this.cursorListeners, function (listener) {
                listener(self, head);
            });
        }
    };
    CodeEditor.prototype.getCursor = function () {
        if (this.editor) {
            return eventTransformers.cmLoc2wrapperLoc(this.editor.getDoc().getCursor());
        } else {
            var cursor = this.cursor;
            if (cursor === undefined) {
                cursor = {row: 0, col: 0};
            }
            this.cursor = cursor;
            this.addDeferredAction(function (self) {
                self.editor.getDoc().setCursor(eventTransformers.wrapperLoc2cmLoc(cursor));
            });
            return this.cursor;
        }
    };
    CodeEditor.prototype.getMode = function () {
        return this.mode;
    };


    function startJavaScriptAssist(editor, cm, c) {
        if (cm._ternAddon) {
            if (c) {
                c();
            }
        }
        require(['./content-assist/js-hint'], function (jshint) {
            var options = {};
            options.useWorker = settings.useWorker;
            options.autoHint = settings.autoHint;

            jshint.startServer(editor.file.path, cm, options, function (server) {
                cm._ternAddon = server.ternAddon;
                editor.assister = server;
                editor.addExtraKeys({
                    'Ctrl-I': 'tern-showtype',
                    'Alt-.': 'tern-gotodefinition',
                    'Alt-,': 'tern-jumpback',
                    // 'Ctrl-B': 'tern-showreference'
                });
                if (c) {
                    c();
                }
            });
        });
    }

    function setChangeForAutoHintDebounced() {
        onChangeForAutoHintDebounced = _.debounce(function (cm, changeObj, lastCursor) {
            // TODO - limch - minimize addFile() call to WebWorker
            var editor = cm.__instance;
            if (editor.assister && editor.assister.addFile) {
                var options = {};
                options.async = true;
                options.useWorker = settings.useWorker;
                editor.assister.addFile(editor.file.path, cm.getDoc().getValue(), options);
            }

            if (changeObj.origin === '+input' && settings.autoHint) {
                var cursor = cm.getCursor();
                if (cursor.line === lastCursor.line && cursor.ch === lastCursor.ch) {
                    codemirror.commands.autocomplete(cm, {autoHint: true, completeSingle: false});
                }
            }
        }, settings.autoHintDelay);
    }

    var onChangeForAutoHintDebounced;
    setChangeForAutoHintDebounced();

    function onChangeForAutoHint(cm, changeObj) {
        onChangeForAutoHintDebounced(cm, changeObj, cm.getCursor());
    }



    var modeMap = {
        'js': [['javascript'], 'text/javascript'],
        'json': [['javascript'], 'application/json'],
        'ts': [['javascript'], 'application/typescript'],
        'html': [['xml', 'vbscript', 'javascript', 'css', 'htmlmixed'], 'text/html'],
        'css': [['css'], 'text/css'],
        'less': [['less'], 'text/less']
    };

    function mapMode(mode) {
        var mapped = modeMap[mode];
        if (mapped === undefined) {
            return 'text/plain';
        } else {
            return mapped[1];
        }
    }
    function loadMode(modename, done) {
        var mappedMode = modeMap[modename];
        if (mappedMode === undefined) {
            mappedMode = false;
        } else {
            mappedMode = mappedMode[0];
        }
        if (mappedMode) {
            mappedMode = _.map(mappedMode, function (modename) {
                return 'webida-lib/custom-lib/codemirror/mode/' + modename + '/' + modename;
            });
            require(mappedMode, function () {
                addAvailable('mode', modename);
                done();
            });
        } else {
            done();
        }
    }

    CodeEditor.prototype.setMode = function (mode) {
        if (mode === undefined || this.mode === mode) {
            return;
        }
        this.mode = mode;

        var self = this;

        this.mappedMode = mapMode(mode);
        loadMode(mode, function () {
            if (self.editor) {
                self.editor.setOption('mode', self.mappedMode);
            }
            self.__applyLinter();
            self.addDeferredAction(function () {
                require(['./emmet'], function () {
                    // Nothing to do
                });
            });
        });

        loadCSSList([require.toUrl('webida-lib/custom-lib/codemirror/addon/dialog/dialog.css'),
             require.toUrl('webida-lib/custom-lib/codemirror/addon/hint/show-hint.css'),
             require.toUrl('webida-lib/custom-lib/codemirror/addon/tern/tern.css'),
        ], function () {
            require(['webida-lib/custom-lib/codemirror/addon/dialog/dialog',
                'webida-lib/custom-lib/codemirror/addon/hint/show-hint',
                'webida-lib/custom-lib/codemirror/addon/tern/tern'
            ], function () {
                self.addDeferredAction(function () {
                    if (mode === 'js') {
                        _.defer(function () {
                            startJavaScriptAssist(self, self.editor);
                        });
                    } else if (mode === 'html' || mode === 'htmlmixed') {
                        var options = {};
                        options.async = true;
                        options.useWorker = settings.useWorker;
                        require(['./content-assist/html-hint'], function (htmlhint) {
                            self.assister = htmlhint;
                            htmlhint.addFile(self.file.path, self.editor.getDoc().getValue(), options);
                        });
                    }
                    self.editor.on('change', onChangeForAutoHint);
                });
            });
        });
    };

    CodeEditor.prototype.setSize = function (width, height) {
        this.size = {width: width, height: height};
        this.addDeferredAction(function (self) {
            self.editor.setSize(width, height);
        });
    };

    CodeEditor.prototype.getTheme = function () {
        return this.theme;
    };
    CodeEditor.prototype.setTheme = function (theme) {
        if (theme === undefined) {
            return;
        }
        if (theme === 'webida') {
            theme = 'webida-dark';
        }
        this.theme = theme;
        if (theme === 'default') {
            if (this.editor) {
                this.editor.setOption('theme', this.theme);
            }
        } else {
            var self = this;
            var csspath = 'webida-lib/custom-lib/codemirror/theme/' + theme + '.css';
            switch (theme) {
            case 'webida-dark':
                csspath = './themes/webida-dark.css';
                break;
            case 'webida-light':
                csspath = './themes/webida-light.css';
                break;
            case 'solarized dark':
            case 'solarized light':
                csspath = 'webida-lib/custom-lib/codemirror/theme/solarized.css';
                break;
            }
            loadCSSList([require.toUrl(csspath)], function () {
                addAvailable('theme', theme);
                if (self.editor) {
                    self.editor.setOption('theme', self.theme);
                }
            });
        }
    };
    CodeEditor.prototype.getKeymap = function () {
        return (this.keymap) ? this.keymap: 'default';
    };
    CodeEditor.prototype.setKeymap = function (keymap) {
        if (keymap === undefined) {
            return;
        }
        var self = this;
        switch (keymap) {
        case '':
        case 'default':
            this.keymap = keymap;
            if (this.editor) {
                this.editor.setOption('keyMap', 'default');
                this.editor.setOption('autoCloseBrackets', true);
            }
            break;
        case 'vim':
        //case 'emacs':
            if (this.editor) {
                this.editor.setOption('autoCloseBrackets', false);
            }
            this.keymap = keymap;
            require(['webida-lib/custom-lib/codemirror/keymap/' + keymap], function () {
                addAvailable('keymap', keymap);
                if (self.editor) {
                    self.editor.setOption('keyMap', keymap);
                }
            });
            break;
        default:
            throw new Error('Not supported keymap "' + keymap + '"');
        }
    };
    CodeEditor.prototype.setFontFamily = function (fontFamily) {
        if (fontFamily !== undefined) {
            this.fontFamily = fontFamily;
            this.addDeferredAction(function (self) {
                $(self.elem).find('.CodeMirror').css({
                    fontFamily: fontFamily
                });
                self.editor.refresh();
                window.fontingEditor = self;
            });
        }
    };
    CodeEditor.prototype.setFontSize = function (fontSize) {
        if (fontSize !== undefined) {
            this.fontSize = fontSize;
            this.addDeferredAction(function (self) {
                $(self.elem).find('.CodeMirror').css({
                    fontSize: fontSize
                });
                self.editor.refresh();
            });
        }
    };

    // Option setters and getters

    CodeEditor.prototype._gutterOn = function (gutterName) {
        if (this.editor) {
            var gutters = this.editor.getOption('gutters');
            if (!_.contains(gutters, gutterName)) {
                var i, newgutters = [];
                var order = ['CodeMirror-linenumbers', 'CodeMirror-lint-markers', 'CodeMirror-foldgutter'];
                for (i = 0; i < order.length; i++) {
                    if (_.contains(gutters, order[i]) || order[i] === gutterName) {
                        newgutters.push(order[i]);
                    }
                }
                for (i = 0; i < gutters.length; i++) {
                    if (!_.contains(order, gutters[i])) {
                        newgutters.push(gutters[i]);
                    }
                }
                this.editor.setOption('gutters', newgutters);
            }
        }
    };
    CodeEditor.prototype._gutterOff = function (gutterName) {
        if (this.editor) {
            var gutters = this.editor.getOption('gutters');
            this.editor.setOption('gutters', _.without(gutters, gutterName));
        }
    };

    CodeEditor.prototype.setStyleActiveLine = function (highlight) {
        if (highlight !== undefined) {
            this.styleActiveLine = highlight;
            if (highlight) {
                var self = this;
                require(['webida-lib/custom-lib/codemirror/addon/selection/active-line'], function () {
                    self.addDeferredAction(function (self) {
                        self.editor.setOption('styleActiveLine', highlight);
                    });
                });
            } else if (this.editor) {
                this.addDeferredAction(function (self) {
                    self.editor.setOption('styleActiveLine', highlight);
                });
            }
        }
    };
    CodeEditor.prototype.setMatchBrackets = function (match) {
        if (match === undefined) {
            return;
        }
        this.matchBrackets = match;
        if (match) {
            var self = this;
            require(['webida-lib/custom-lib/codemirror/addon/edit/matchbrackets'], function () {
                self.addDeferredAction(function (self) {
                    self.editor.setOption('matchBrackets', match);
                });
            });
        } else if (this.editor) {
            this.addDeferredAction(function (self) {
                self.editor.setOption('matchBrackets', match);
            });
        }
    };
    CodeEditor.prototype.setHighlightSelection = function (highlight) {
        if (highlight === undefined) {
            return;
        }
        this.highlightSelection = highlight;
        if (highlight) {
            var self = this;
            loadCSSList([require.toUrl('./css/match-highlighter.css')], function () {
                require(['webida-lib/custom-lib/codemirror/addon/search/match-highlighter'], function () {
                    self.addDeferredAction(function (self) {
                        self.editor.setOption('highlightSelectionMatches', highlight);
                    });
                });
            });
        } else  if (this.editor) {
            this.addDeferredAction(function (self) {
                self.editor.setOption('highlightSelectionMatches', highlight);
            });
        }
    };
    CodeEditor.prototype.setLinter = function (type, option) {
        if (type === undefined || option === undefined) {
            return;
        }
        if (! this.linters) {
            this.linters = {};
        }
        var self = this;
        switch (type) {
        case 'js':
            this.linters.js = option;
            if (option) {
                loadCSSList([
                    require.toUrl('webida-lib/custom-lib/codemirror/addon/lint/lint.css'),
                ], function () {
                    require([
                        'webida-lib/custom-lib/codemirror/addon/lint/lint',
                        'webida-lib/custom-lib/codemirror/addon/lint/javascript-lint'
                    ], function () {
                        addAvailable('addon', 'lint');
                        addAvailable('addon', 'javascript-lint');
                        self.__applyLinter();
                    });
                });
            } else {
                this.__applyLinter();
            }
            break;
        case 'json':
            this.linters.json = option;
            if (option) {
                require(['./lib/lints/jsonlint'], function () {
                    loadCSSList([
                        require.toUrl('webida-lib/custom-lib/codemirror/addon/lint/lint.css')
                    ], function () {
                        require([
                            'webida-lib/custom-lib/codemirror/addon/lint/lint',
                            'webida-lib/custom-lib/codemirror/addon/lint/json-lint'
                        ], function () {
                            addAvailable('addon', 'lint');
                            addAvailable('addon', 'json-lint');
                            self.__applyLinter();
                        });
                    });
                });
            } else {
                this.__applyLinter();
            }
            break;
        case 'html':
            this.linters.html = option;
            if (option) {
                loadCSSList([
                    require.toUrl('webida-lib/custom-lib/codemirror/addon/lint/lint.css')
                ], function () {
                    require([
                        'webida-lib/custom-lib/codemirror/addon/lint/lint',
                    ], function () {
                        require(['./content-assist/html-lint'], function () {
                            addAvailable('addon', 'lint');
                            addAvailable('addon', 'html-lint');
                            self.__applyLinter();
                        });
                    });
                });
            }
            break;
        case 'css':
            this.linters.css = option;
            if (option) {
                require(['./lib/lints/csslint'], function () {
                    loadCSSList([
                        require.toUrl('webida-lib/custom-lib/codemirror/addon/lint/lint.css')
                    ], function () {
                        require([
                            'webida-lib/custom-lib/codemirror/addon/lint/lint',
                            'webida-lib/custom-lib/codemirror/addon/lint/css-lint'
                        ], function () {
                            addAvailable('addon', 'lint');
                            addAvailable('addon', 'css-lint');
                            self.__applyLinter();
                        });
                    });
                });
            } else {
                this.__applyLinter();
            }
            break;
        }
    };
    CodeEditor.prototype.__applyLinter = function () {
        if (this.editor && this.linters && _.contains(['js', 'json', 'css', 'html'], this.mode)) {
            if (this.linters[this.mode]) {
                this._gutterOn('CodeMirror-lint-markers');
                switch (this.mode) {
                case 'js':
                    if (isAvailable('addon', 'lint') && isAvailable('addon', 'javascript-lint')) {
                        if ((typeof this.linters[this.mode]) === 'object') {
                            var jshintrc = this.linters.js;
                            this.editor.setOption('lint', {
                                async: true,
                                getAnnotations: function (editorValue, updateLinting, passOptions, editor) {
                                    CodeEditor.jsHintWorker(editorValue, jshintrc, function (data) {
                                        updateLinting(editor, data.annotations);
                                    });
                                }
                            });
                        } else {
                            this.editor.setOption('lint', {
                                async: true,
                                getAnnotations: function (editorValue, updateLinting, passOptions, editor) {
                                    CodeEditor.jsHintWorker(editorValue, false, function (data) {
                                        updateLinting(editor, data.annotations);
                                    });
                                }
                            });
                        }
                    }
                    break;
                case 'json':
                    if (isAvailable('addon', 'lint') && isAvailable('addon', 'json-lint')) {
                        this.editor.setOption('lint', true);
                    }
                    break;
                case 'html':
                    if (isAvailable('addon', 'lint') && isAvailable('addon', 'html-lint')) {
                        this.editor.setOption('lint', true);
                    }
                    break;
                case 'css':
                    if (isAvailable('addon', 'lint') && isAvailable('addon', 'css-lint')) {
                        this.editor.setOption('lint', true);
                    }
                    break;
                }
            } else {
                this.editor.setOption('lint', false);
                this._gutterOff('CodeMirror-lint-markers');
            }
        }
    };

    var hintersMap = {
        'javascript': {
            name: 'javascript',
            requires: []
        },
        'coffee': {
            name: 'coffeescript',
            requires: ['webida-lib/custom-lib/codemirror/addon/hint/javascript-hint']
        },
        'html': {
            name: 'html',
            requires: ['webida-lib/custom-lib/codemirror/addon/hint/xml-hint',
                       'webida-lib/custom-lib/codemirror/addon/hint/html-hint']
        },
        'htmlLink': {
            name: 'htmlLink',
            requires: ['./content-assist/html-hint-link']
        },
        'htmlSmart': {
            name: 'htmlSmart',
            requires: ['./content-assist/html-hint']
        },
        'xml': {
            name: 'xml',
            requires: ['webida-lib/custom-lib/codemirror/addon/hint/xml-hint']
        },
        'css': {
            name: 'css',
            requires: ['webida-lib/custom-lib/codemirror/addon/hint/css-hint']
        },
        'cssSmart': {
            name: 'cssSmart',
            requires: ['./content-assist/css-hint']
        },
        'word': {
            name: 'anyword',
            requires: ['webida-lib/custom-lib/codemirror/addon/hint/anyword-hint']
        },
        'py': {
            name: 'python',
            requires: ['webida-lib/custom-lib/codemirror/addon/hint/python-hint']
        }
    };

    var hinterMapper = function (hinter) {
        return hintersMap[hinter];
    };

    CodeEditor.prototype.setHinters = function (mode, hinterNames) {
        if (mode && hinterNames) {
            var hinterSchms = _.filter(_.map(hinterNames, hinterMapper), _.identity);
            var paths = ['webida-lib/custom-lib/codemirror/addon/hint/show-hint'];
            _.each(hinterSchms, function (x) {
                paths = _.union(paths, x.requires);
            });
            loadCSSList([require.toUrl('webida-lib/custom-lib/codemirror/addon/hint/show-hint.css')], function () {
                require(paths, function () {
                    _localHinterSchemes[mode] = hinterSchms;
                });
            });
        }
    };

    CodeEditor.prototype.setGlobalHinters = function (hinterNames) {
        _globalHinterSchemes = [];
        if (hinterNames) {
            var hinterSchms = _.filter(_.map(hinterNames, hinterMapper), _.identity);
            var paths = [];
            _.each(hinterSchms, function (x) {
                paths = _.union(paths, x.requires);
            });
            require(paths, function () {
                _globalHinterSchemes = hinterSchms;
            });
        }
    };

    function jshint(cm, callback) {
        if (cm._ternAddon) {
            cm._ternAddon.getHint(cm, callback);
        } else {
            startJavaScriptAssist(cm.__instance, cm, function () {
                cm._ternAddon.getHint(cm, callback);
            });
        }
    }

    codemirror.registerHelper('hint', 'javascript', jshint);

    function mergeResult(resultAll, resultThis) {
        if (resultThis && resultThis.list) {
            if (!resultAll.from) {
                resultAll.from = resultThis.from;
                resultAll.to = resultThis.to;
                resultAll.hintContinue = resultThis.hintContinue;
            }
            if (resultThis.list) {
                _.each(resultThis.list, function (item) {
                    var text = (typeof item === 'string') ? item : item.text;
                    var found = _.find(resultAll.list, function (olditem) {
                        var oldtext = (typeof olditem === 'string') ? olditem : olditem.text;
                        return text === oldtext;
                    });
                    if (!found) {
                        resultAll.list.push(item);
                    }
                });
            }
            resultAll.hintContinue = resultAll.hintContinue || resultThis.hintContinue;
        }
    }

    function hint(cm, callback, options) {
        var modeName = cm.getModeAt(cm.getCursor()).name;
        if (modeName === 'javascript' && cm.__instance.getMode() === 'json') {
            modeName = 'json';
        }
        if (!_localHinterSchemes[modeName]) {
            modeName = cm.getMode().name;
        }
        var localHinters = _.map(_localHinterSchemes[modeName],
                                 function (x) { return codemirror.helpers.hint[x.name]; });
        var globalHinters = _.map(_globalHinterSchemes,
                                  function (x) { return codemirror.helpers.hint[x.name]; });
        globalHinters = _.filter(globalHinters, function (hinter) {
            return _.indexOf(localHinters, hinter) < 0;
        });
        if (!_.isFunction(callback)) {
            options = callback;
            callback = null;
        }
        var localResult = {list: [], from: null, to: null};
        var globalResult = {list: [], from: null, to: null};

        var pending = localHinters.length + globalHinters.length;
        if (callback && pending === 0) {
            callback(localResult);
        }

        _.each(localHinters, function (hinter) {
            if (callback) {
                hinter(cm, function (completions) {
                    mergeResult(localResult, completions);
                    pending--;
                    if (pending === 0) {
                        mergeResult(localResult, globalResult);
                        callback(localResult);
                    }
                }, options);
            } else {
                var completions = hinter(cm, options);
                mergeResult(localResult, completions);
            }
        });
        _.each(globalHinters, function (hinter) {
            if (callback) {
                hinter(cm, function (completions) {
                    mergeResult(globalResult, completions);
                    pending--;
                    if (pending === 0) {
                        mergeResult(localResult, globalResult);
                        callback(localResult);
                    }
                });
            } else {
                var completions = hinter(cm, options);
                mergeResult(localResult, completions);
            }
        });

        return localResult;
    }

    CodeEditor.prototype.setAnywordHint = function (anywordHint) {
        if (anywordHint) {
            this.setGlobalHinters(['word']);
        } else {
            this.setGlobalHinters([]);
        }
    };

    CodeEditor.prototype.setTabSize = function (tabSize) {
        if (tabSize !== undefined) {
            this.options.tabSize = tabSize;
            if (this.editor) {
                this.editor.setOption('tabSize', tabSize);
            }
        }
    };
    CodeEditor.prototype.setIndentWithTabs = function (indentWithTabs) {
        if (indentWithTabs !== undefined) {
            this.options.indentWithTabs = indentWithTabs;
            if (this.editor) {
                this.editor.setOption('indentWithTabs', indentWithTabs);
            }
        }
    };
    CodeEditor.prototype.setIndentUnit = function (indentUnit) {
        if (indentUnit !== undefined) {
            this.options.indentUnit = indentUnit;
            if (this.editor) {
                this.editor.setOption('indentUnit', indentUnit);
            }
        }
    };
    CodeEditor.prototype.setIndentOnPaste = function (indentOnPaste) {
        if (indentOnPaste !== undefined) {
            this.options.indentOnPaste = indentOnPaste;
            if (this.editor) {
                this.editor.setOption('indentOnPaste', indentOnPaste);
            }
        }
    };
    CodeEditor.prototype.setTrimTrailingWhitespaces = function (trimTrailingWhitespaces) {
        if (trimTrailingWhitespaces !== undefined) {
            this.trimTrailingWhitespaces = trimTrailingWhitespaces;
        }
    };
    CodeEditor.prototype.setInsertFinalNewLine = function (insertFinalNewLine) {
        if (insertFinalNewLine !== undefined) {
            this.insertFinalNewLine = insertFinalNewLine;
        }
    };
    CodeEditor.prototype.setRetabIndentations = function (retabIndentations) {
        if (retabIndentations !== undefined) {
            this.retabIndentations = retabIndentations;
        }
    };
    CodeEditor._whitespaceOverlay = {
        token: function (stream) {
            if (stream.eatWhile(/\S/)) { return null; }

            switch (stream.next()) {
            case ' ':
                return 'whitespace-space';
            case '\t':
                return 'whitespace-tab';
            }

            return 'whitespace';
        }
    };
    CodeEditor.prototype.setShowInvisibles = function (showingInvisibles) {
        this.showingInvisibles = showingInvisibles;
        if (showingInvisibles) {
            this.addDeferredAction(function (self) {
                self.editor.addOverlay(CodeEditor._whitespaceOverlay);
            });
        } else {
            this.addDeferredAction(function (self) {
                self.editor.removeOverlay(CodeEditor._whitespaceOverlay);
            });
        }
    };
    CodeEditor.prototype.setLineWrapping = function (lineWrapping) {
        this.options.lineWrapping = lineWrapping;
        if (this.editor) {
            this.editor.setOption('lineWrapping', lineWrapping);
        }
    };
    CodeEditor.prototype.setCodeFolding = function (codeFolding) {
        this.options.setCodeFolding = codeFolding;
        if (codeFolding) {
            var self = this;
            loadCSSList([require.toUrl('./css/codefolding.css')], function () {
                require(['webida-lib/custom-lib/codemirror/addon/fold/foldcode',
                         'webida-lib/custom-lib/codemirror/addon/fold/foldgutter',
                         'webida-lib/custom-lib/codemirror/addon/fold/brace-fold',
                         'webida-lib/custom-lib/codemirror/addon/fold/xml-fold',
                         'webida-lib/custom-lib/codemirror/addon/fold/comment-fold'], function () {
                    self.addDeferredAction(function (self) {
                        self._gutterOn('CodeMirror-foldgutter');
                        var rf = new codemirror.fold.combine(codemirror.fold.brace, codemirror.fold.comment,
                                                             codemirror.fold.xml);
                        self.editor.setOption('foldGutter', {
                            rangeFinder: rf
                        });
                    });
                });
            });
        } else {
            this.addDeferredAction(function (self) {
                self.editor.setOption('foldGutter', false);
                self._gutterOff('CodeMirror-foldgutter');
            });
        }
    };
    CodeEditor.prototype.setSnippetEnabled = function (enabled) {
        this.options.setSnippetEnabled = enabled;
        if (!enabled) {
            this.addDeferredAction(function (self) {
                Snippet.clearSnippets(self.editor);
            });
        }
    };
    CodeEditor.prototype.setShowLineNumbers = function (showLineNumbers) {
        this.options.setShowLineNumbers = showLineNumbers;
        this.addDeferredAction(function (self) {
            self.editor.setOption('lineNumbers', showLineNumbers);
        });
    };
    CodeEditor.prototype.getValue = function () {
        return this.editor ? this.editor.getValue() : undefined;
    };
    CodeEditor.prototype.setValue = function (value) {
        this.addDeferredAction(function (self) {
            self.editor.setValue(value);
        });
    };

    CodeEditor.prototype.foldCode = function (range) {
        if (this.editor) {
            foldCode(this.editor, range.from, range.to);
        }
    };
    CodeEditor.prototype.getFoldings = function () {
        if (this.editor) {
            var cm = this.editor;
            var foldings = _.filter(cm.getAllMarks(), function (mark) { return mark.__isFold; });
            return _.map(foldings, function (fold) {
                return fold.find();
            });
        }
    };

    CodeEditor.prototype.markClean = function () {
        this.addDeferredAction(function (self) {
            self.editor.getDoc().markClean();
        });
    };
    CodeEditor.prototype.isClean = function () {
        if (this.editor) {
            return this.editor.getDoc().isClean();
        } else {
            return true;
        }
    };
    CodeEditor.prototype.clearHistory = function () {
        this.addDeferredAction(function (self) {
            self.editor.clearHistory();
        });
    };
    CodeEditor.prototype.markClean = function () {
        this.addDeferredAction(function (self) {
            self.editor.markClean();
        });
    };

    CodeEditor.getEnclosingDOMElem = function () {
        return document.getElementById('editor');
    };

    CodeEditor.getShortcuts = function () {
        return [
            { keys : 'shift+alt+P', title : 'TEST C, viable', desc: 'TEST, viable', viable: true },
            { keys : 'ctrl+shift+alt+V', title : 'TEST C 2, viable', desc: 'TEST, viable', viable: true },
            { keys : 'ctrl+shift+alt+U', title : 'TEST C, unviable', desc: 'TEST, viable' }
        ];
    };

    CodeEditor.prototype.setAutoCompletion = function (autoCompletion) {
        settings.autoHint = autoCompletion;
    };

    CodeEditor.prototype.setAutoCompletionDelay = function (delay) {
        var num = typeof delay === 'string' ? parseFloat(delay, 10) : delay;
        num *= 1000;
        settings.autoHintDelay = num;

        setChangeForAutoHintDebounced();
    };

    return CodeEditor;
});
