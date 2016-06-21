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
 * @file
 * CodeEditorViewer for code-base EditorParts
 *
 * Still needs refactoring (2015.06.25, hw.shim)
 *
 * @constructor
 * @see CodeEditorPart
 * @since 1.3.0
 * @author hw.shim@samsung.com
 * @author sewon326.kim@samsung.com
 * @author kyungmi.k@samsung.com
 * @author cg25.woo@samsung.com
 * @author h.m.kwon@samsung.com
 */

/*jshint unused:false*/

// @formatter:off
define([
    'dojo/i18n!./nls/resource',
	'require',
	'webida-lib/util/genetic',
	'external/lodash/lodash.min',
	'external/codemirror/lib/codemirror',
    'external/URIjs/src/URI',
    'webida-lib/plugins/editors/plugin',
    'webida-lib/plugins/workbench/ui/PartViewer',
	'webida-lib/util/loadCSSList',
	'webida-lib/util/logger/logger-client',
	'plugins/webida.editor.text-editor/TextEditorViewer',
	'./snippet',
    './content-assist/ContentAssistDelegator',
    'dojo/topic'
], function (
    i18n,
	require,
	genetic,
	_,
	codemirror,
    URI,
    editors,
    PartViewer,
	loadCSSList,
	Logger,
	TextEditorViewer,
	Snippet,
    ContentAssistDelegator,
    topic
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    var settings = {
        useWorker: true,
        gotoLinkEnabled: true,
        autoHint: true,
        autoHintDelay: 300
    };

    var _localHinterSchemes = {};
    var _globalHinterSchemes = [];

    var hintersMap = {
        'coffee': {
            name: 'coffeescript',
            requires: ['external/codemirror/addon/hint/javascript-hint']
        },
        'xml': {
            name: 'xml',
            requires: ['external/codemirror/addon/hint/xml-hint']
        },
        'word': {
            name: 'anyword',
            requires: ['external/codemirror/addon/hint/anyword-hint']
        },
        'py': {
            name: 'python',
            requires: ['external/codemirror/addon/hint/python-hint']
        }
    };

    var hinterMapper = function (hinter) {
        return hintersMap[hinter];
    };

    var modeMap = {
        'js': [['javascript'], 'text/javascript'],
        'json': [['javascript'], 'application/json'],
        'ts': [['javascript'], 'application/typescript'],
        'html': [['vbscript', 'javascript', 'css', 'htmlmixed'], 'text/html'],
        'css': [['css'], 'text/css'],
        'less': [['less'], 'text/less'],
        'c': [['clike'], 'text/x-csrc'],
        'h': [['clike'], 'text/x-csrc'],
        'java': [['clike'], 'text/x-java'],
        'm': [['clike'], 'text/x-objectivec'],
        'hh': [['clike'], 'text/x-c++src'],
        'hpp': [['clike'], 'text/x-c++src'],
        'hxx': [['clike'], 'text/x-c++src'],
        'cc': [['clike'], 'text/x-c++src'],
        'cpp': [['clike'], 'text/x-c++src'],
        'cxx': [['clike'], 'text/x-c++src'],
        'cs': [['clike'], 'text/x-csharp'],
        'php': [['php'], 'text/x-php'],
        'py': [['python'], 'text/x-python'],
        'fs': [['mllike'], 'text/x-fsharp'],
        'fsi': [['mllike'], 'text/x-fsharp'],
        'pl': [['perl'], 'text/x-perl'],
        'pas': [['pascal'], 'text/x-pascal'],
        'pp': [['pascal'], 'text/x-pascal'],
        'sql': [['sql'], 'text/x-sql'],
        'rb': [['ruby'], 'text/x-ruby'],
        'r': [['r'], 'text/x-rsrc'],
        'cbl': [['cobol'], 'text/x-cobol'],
        's': [['gas'], 'text/x-gas'],
        'f': [['fortran'], 'text/x-Fortran'],
        'for': [['fortran'], 'text/x-Fortran'],
        'd': [['d'], 'text/x-d'],
        'lsp': [['commonlisp'], 'text/x-common-lisp'],
        'lisp': [['commonlisp'], 'text/x-common-lisp'],
        'scala': [['clike'], 'text/x-scala'],
        'groovy ': [['groovy'], 'text/x-groovy'],
        'lua': [['lua'], 'text/x-lua'],
        'schema': [['schema'], 'text/x-scheme'],
        'vbs': [['vbscript'], 'text/vbscript'],
        'go': [['go'], 'text/x-go'],
        'hs': [['haskell'], 'text/x-haskell'],
        'xml': [['xml'], 'application/xml']
    };

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

    var cursorAtAutoHintTokens = [
        {
            mode: ['javascript'],
            checkToken: function (token) {
                return token.type === 'variable' ||
                    token.type === 'variable-2' ||
                    token.type === 'property' ||
                    (token.type === 'keyword' && token.string === 'this');
            }
        },
        {
            mode: ['html', 'xml'],
            checkToken: function (token) {
                return _.contains(['tag', 'attribute', 'link'], token.type);
            }
        },
        {
            mode: ['css'],
            checkToken: function (token) {
                return _.contains(['tag', 'builtin', 'qualifier', 'property error', 'property'], token.type);
            }
        }
    ];

    function foldCode(cm, start, end) {
        var myWidget = $('<span class="CodeMirror-foldmarker">').text('\u2194')[0];
        var myRange = cm.markText(start, end, {
            replacedWith: myWidget,
            clearOnEnter: true,
            __isFold: true
        });
        codemirror.on(myWidget, 'mousedown', function () { myRange.clear(); });
    }
    codemirror.commands.foldselection = function (cm) {
        foldCode(cm, cm.getCursor('start'), cm.getCursor('end'));
    };
    codemirror.commands.gotoLine = function (cm) {
        if (cm.getOption('keyMap') === 'default') {
            var dialog = 'Go to line: <input type="text" style="width: 10em"/> <span style="color: #888"></span>';
            loadCSSList([require.toUrl('external/codemirror/addon/dialog/dialog.css')], function () {
                require(['external/codemirror/addon/dialog/dialog'], function () {
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
    function isAvailable(type, name) {
        return _.contains(availables, type + '::' + name);
    }
    function addAvailable(type, name) {
        if (!isAvailable(type, name)) {
            availables.push(type + '::' + name);
        }
    }

    function cursorAtAutoHint(cm, modeName, cursor, rightToken) {
        var token = cm.getTokenAt(cursor);

        if (_.find(cursorAtAutoHintTokens, function (obj) {
            return _.contains(obj.mode, modeName) && obj.checkToken(token);
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
        topic.publish('editor/save/current');
    };

    function setHinterSchemes() {
        var extInfos = ContentAssistDelegator.getCaExtensionInfos();

        loadCSSList([require.toUrl('external/codemirror/addon/hint/show-hint.css')], function () {
            require(['external/codemirror/addon/hint/show-hint'], function () {
                _.each(extInfos, function (extInfo) {
                    if (extInfo.hinterModes) {
                        _.each(extInfo.hinterModes, function (hinterMode) {
                            if (extInfo.hinterNames) {
                                _.each(extInfo.hinterNames, function (hinterName) {
                                    if (_localHinterSchemes[hinterMode]) {
                                        _localHinterSchemes[hinterMode].push({name: hinterName});
                                    } else {
                                        _localHinterSchemes[hinterMode] = [{name: hinterName}];
                                    }
                                });
                            }
                        });
                    } else {
                        if (extInfo.hinterNames) {
                            _.each(extInfo.hinterNames, function (hinterName) {
                                _globalHinterSchemes.push({name: hinterName});
                            });
                        }
                    }
                });
            });
        });
    }

    setHinterSchemes();

    function startContentAssist(editor, cm, c) {
        var options = {};
        options.useWorker = settings.useWorker;
        options.autoHint = settings.autoHint;

        return new ContentAssistDelegator(editor, cm, options, c);
    }

    var onChangeForAutoHintDebounced;
    function setChangeForAutoHintDebounced() {
        onChangeForAutoHintDebounced = _.debounce(function (cm, changeObj, lastCursor) {
            // TODO - limch - minimize addFile() call to WebWorker
            var editor = cm.__instance;

            if (editor._contentAssistDelegator) {
                var options = {};
                options.async = true;
                options.useWorker = settings.useWorker;
                editor._contentAssistDelegator.execCommand(
                    'addFile',
                    editor.file.path,
                    cm.getDoc().getValue(),
                    options);
            }

            if (changeObj.origin === '+input' && settings.autoHint) {
                var cursor = cm.getCursor();
                if (cursor.line === lastCursor.line && cursor.ch === lastCursor.ch) {
                    codemirror.commands.autocomplete(cm, {autoHint: true, completeSingle: false});
                }
            }
        }, settings.autoHintDelay);
    }

    setChangeForAutoHintDebounced();

    function onChangeForAutoHint(cm, changeObj) {
        onChangeForAutoHintDebounced(cm, changeObj, cm.getCursor());
    }

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
                return 'external/codemirror/mode/' + modename + '/' + modename;
            });
            require(mappedMode, function () {
                addAvailable('mode', modename);
                done();
            });
        } else {
            done();
        }
    }

    function CodeEditorViewer(elem, file, startedListener) {
        logger.info('new CodeEditorViewer()');
        this.settings = settings;
        TextEditorViewer.apply(this, arguments);
    }

    genetic.inherits(CodeEditorViewer, TextEditorViewer, {

		/**
		 * @override
		 */
        createWidget: function (parentNode) {
            logger.info('createWidget(' + parentNode + ')');
            this.options.extraKeys = {
                'Ctrl-Space': 'autocomplete',
                'Ctrl-/': 'linecomment',
                'Tab': 'defaultTab',
                'Shift-Tab': 'navigateSnippetBackward',
                'Ctrl--': 'foldselection',
                'Ctrl-D': 'deleteLine',
                'Ctrl-L': 'gotoLine'
            };
			this.prepareCreate();
        },

        /**
		 * @override
		 */
        prepareCreate: function () {
            logger.info('prepareCreate()');
            var self = this;
            // @formatter:off
            loadCSSList([
                require.toUrl('plugins/webida.editor.text-editor/css/webida.css'),
                require.toUrl('external/codemirror/lib/codemirror.css'),
                require.toUrl('external/codemirror/addon/dialog/dialog.css')
            ], function () {
                logger.info('*require*');
                require([
                    'external/codemirror/addon/dialog/dialog',
                    'external/codemirror/addon/search/searchcursor',
                    'plugins/webida.editor.text-editor/search-addon',
                    'external/codemirror/addon/edit/closebrackets',
                    'external/codemirror/addon/edit/closetag',
                    'external/codemirror/addon/edit/matchbrackets'
                ], function () {
                    logger.info('%cLoad CSS complete', 'color:orange');
                    self.createEditorWidget(self.getParentNode());
                });
            });
            // @formatter:on
        },

		/**
		 * @override
		 */
        createEditorWidget: function (parentNode) {
            logger.info('createEditorWidget(' + parentNode + ')');
            TextEditorViewer.prototype.createEditorWidget.call(this, parentNode);

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
            Snippet.init(this.editor);
        },

		/**
		 * @override
		 */
        addOptions: function () {
            TextEditorViewer.prototype.addOptions.call(this);
            this.setOption('mode', this.mappedMode, isAvailable('mode', this.mode), 'text/plain');
        },

        setMode : function (mode) {
            var that = this;
            var assistDelegator = null;
            that.promiseForSetMode = new Promise(function (resolve, reject) {
                if (mode === undefined || that.mode === mode) {
                    resolve('no change');
                    return;
                }
                that.mode = mode;

                that.mappedMode = mapMode(mode);
                loadMode(mode, function () {
                    if (that.editor) {
                        that.editor.setOption('mode', that.mappedMode);
                    }

                    that.addDeferredAction(function () {
                        require(['./emmet'], function () {
                            // Nothing to do
                        });
                    });
                });

                loadCSSList([require.toUrl('external/codemirror/addon/dialog/dialog.css'),
                     require.toUrl('external/codemirror/addon/hint/show-hint.css'),
                     require.toUrl('external/codemirror/addon/tern/tern.css'),
                ], function () {
                    require(['external/codemirror/addon/dialog/dialog',
                        'external/codemirror/addon/hint/show-hint',
                        'external/codemirror/addon/tern/tern'
                    ], function () {
                        that.addDeferredAction(function () {
                            if (mode === 'js' ||
                                mode === 'html' ||
                                mode === 'htmlmixed' ||
                                mode === 'css' ||
                                mode === 'json'
                               ) {
                                _.defer(function () {
                                    assistDelegator = startContentAssist(that, that.editor, function () {
                                        resolve('ca started');
                                    });
                                });
                            } else {
                                resolve('no ca started');
                            }
                            that.editor.on('change', onChangeForAutoHint);
                        });
                    });
                });
            });
            that.promiseForSetMode.then(function (val) {
                that.emitLater(PartViewer.READY, that);
                that._contentAssistDelegator = assistDelegator;
            });
        },

        //TODO : inherit from TextEditorViewer
        /**
         * @override
         */
        setTheme : function (theme) {
            if (theme === undefined) {
                return;
            }
            if (theme === 'webida') {
                theme = 'webida-light';
            }
            this.theme = theme;
            if (theme === 'codemirror-default') {
                theme = this.theme = 'default';
                this.addDeferredAction(function (self) {
                    self.editor.setOption('theme', self.theme);
                });
            } else {
                var self = this;
                var csspath = 'external/codemirror/theme/' + theme + '.css';
                switch (theme) {
                    case 'webida-dark':
                        csspath = 'webida-lib/plugins/editors/themes/webida-dark.css';
                        break;
                    case 'webida-light':
                        csspath = 'webida-lib/plugins/editors/themes/webida-light.css';
                        break;
                    case 'solarized dark':
                    case 'solarized light':
                        csspath = 'external/codemirror/theme/solarized.css';
                        break;
                }
                loadCSSList([require.toUrl(csspath)], function () {
                    addAvailable('theme', theme);
                    self.addDeferredAction(function (self) {
                        self.editor.setOption('theme', self.theme);
                    });
                });
            }
        },

        setLinter : function (type, option) {
            if (type === undefined || option === undefined) {
                return;
            }
            if (! this.linters) {
                this.linters = {};
            }
            this.linters[type] = option;

            var that = this;
            that.promiseForSetMode.then(function(){
                var editor = that.editor;
                if (editor._contentAssistDelegator) {
                    editor._contentAssistDelegator.execCommandForAll(
                        'setLinter',
                        that,
                        type,
                        option);
                }
            });
        },
        __applyLinter : function () {
            if (this.editor && this.linters && _.contains(['js', 'json', 'css', 'html'], this.mode)) {
                if (this.linters[this.mode]) {
                    this._gutterOn('CodeMirror-lint-markers');

                    var that = this;
                    that.promiseForSetMode.then(function(){
                        var editor = that.editor;
                        if (editor._contentAssistDelegator) {
                            editor._contentAssistDelegator.execCommandForAll(
                                'applyLinter',
                                that.editor,
                                that.mode);
                        }
                    });
                } else {
                    this.editor.setOption('lint', false);
                    this._gutterOff('CodeMirror-lint-markers');
                }
            }
        },

        setHinters : function (mode, hinterNames) {
            if (mode && hinterNames) {
                var hinterSchms = _.filter(_.map(hinterNames, hinterMapper), _.identity);
                var paths = ['external/codemirror/addon/hint/show-hint'];
                _.each(hinterSchms, function (x) {
                    paths = _.union(paths, x.requires);
                });
                loadCSSList([require.toUrl('external/codemirror/addon/hint/show-hint.css')], function () {
                    require(paths, function () {
                        if (hinterSchms.length > 0) {
                            _localHinterSchemes[mode] = hinterSchms;
                        }
                    });
                });
            }
        },

        setGlobalHinters : function (hinterNames) {
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
        },

        setAnywordHint : function (anywordHint) {
            if (anywordHint) {
                this.setGlobalHinters(['word']);
            } else {
                this.setGlobalHinters([]);
            }
        },

		/**
		 * @override
		 */
        setCodeFolding : function (codeFolding) {
            this.options.setCodeFolding = codeFolding;
            if (codeFolding) {
                var self = this;
                loadCSSList([require.toUrl('plugins/webida.editor.text-editor/css/codefolding.css')], function () {
                    require(['external/codemirror/addon/fold/foldcode',
                             'external/codemirror/addon/fold/foldgutter',
                             'external/codemirror/addon/fold/brace-fold',
                             'external/codemirror/addon/fold/xml-fold',
                             'external/codemirror/addon/fold/comment-fold'], function () {
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
        },
        setSnippetEnabled : function (enabled) {
            this.options.setSnippetEnabled = enabled;
            if (!enabled) {
                this.addDeferredAction(function (self) {
                    Snippet.clearSnippets(self.editor);
                });
            }
        },

        setAutoCompletion : function (autoCompletion) {
            settings.autoHint = autoCompletion;
        },

        setAutoCompletionDelay : function (delay) {
            var num = typeof delay === 'string' ? parseFloat(delay, 10) : delay;
            num *= 1000;
            settings.autoHintDelay = num;

            setChangeForAutoHintDebounced();
        },

        lineComment: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                self.focus();
                self.promiseForSetMode.then(function () {
                    if (editor._contentAssistDelegator) {
                        editor._contentAssistDelegator.execCommand('lineComment', editor);
                    }
                });
            });
        },

        blockComment: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                self.focus();
                self.promiseForSetMode.then(function () {
                    if (editor._contentAssistDelegator) {
                        editor._contentAssistDelegator.execCommand('blockComment', editor);
                    }
                });
            });
        },

        commentOutSelection: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                self.focus();
                self.promiseForSetMode.then(function () {
                    if (editor._contentAssistDelegator) {
                        editor._contentAssistDelegator.execCommand('commentOutSelection', editor);
                    }
                });
            });
        },

        beautifyCode: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                self.focus();
                self.promiseForSetMode.then(function () {
                    if (editor._contentAssistDelegator) {
                        editor._contentAssistDelegator.execCommand('beautifyCode', editor);
                    }
                });
            });
        },

        beautifyAllCode: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                self.focus();
                self.promiseForSetMode.then(function () {
                    if (editor._contentAssistDelegator) {
                        editor._contentAssistDelegator.execCommand('beautifyAllCode', editor);
                    }
                });
            });
        },

        gotoDefinition: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                self.focus();
                editor.execCommand('jsca-gotodefinition');
            });
        },

        rename: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;

                // rename trigger
                editor.execCommand('jsca-rename');
            });
        }
    });

    CodeEditorViewer._whitespaceOverlay = {
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

    CodeEditorViewer.getEnclosingDOMElem = function () {
        return document.getElementById('editor');
    };

    CodeEditorViewer.getShortcuts = function () {
        return [
            { keys : 'shift+alt+P', title : 'TEST C, viable', desc: 'TEST, viable', viable: true },
            { keys : 'ctrl+shift+alt+V', title : 'TEST C 2, viable', desc: 'TEST, viable', viable: true },
            { keys : 'ctrl+shift+alt+U', title : 'TEST C, unviable', desc: 'TEST, viable' }
        ];
    };

    CodeEditorViewer.getAvailableModes = function () {
        return [
            'js', 'json', 'ts', 'html', 'css', 'less'
        ];
    };
    CodeEditorViewer.getAvailableThemes = function () {
        return [
            'codemirror-default', 'ambiance', 'aptana', 'blackboard',
            'cobalt', 'eclipse', 'elegant', 'erlang-dark', 'lesser-dark',
            'midnight', 'monokai', 'neat', 'night', 'rubyblue', 'solarized dark', 'solarized light', 'twilight',
            'vibrant-ink', 'xq-dark', 'xq-light', 'webida-dark', 'webida-light'
        ];
    };
    CodeEditorViewer.getAvailableKeymaps = function () {
        return ['default', 'vim', 'emacs'];
    };

    CodeEditorViewer.addAvailable = addAvailable;
    CodeEditorViewer.isAvailable = isAvailable;

    return CodeEditorViewer;
});
