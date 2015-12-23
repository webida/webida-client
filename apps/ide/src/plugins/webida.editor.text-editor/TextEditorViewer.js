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
 * TextTextEditorViewer is an wrapper(or adapter) object that encapsulates
 * web based text editors, such as codemirror, ace editor,.. etc.
 * Now TextTextEditorViewer supports codemirror only, but we will
 * support other editors like ace sooner or later.
 *
 * Still needs refactoring (2015.06.25, hw.shim)
 *
 * @constructor
 * @see TextEditor
 * @refactor: hw.shim (2015.06.11)
 */

// @formatter:off
define([
    'dojo/i18n!./nls/resource',
    'dojo/topic',
    'require',
    'webida-lib/util/genetic',
    'external/lodash/lodash.min',
    'external/codemirror/lib/codemirror',
    'webida-lib/plugins/editors/plugin',
    'webida-lib/util/loadCSSList',
    'webida-lib/util/logger/logger-client',
    'webida-lib/plugins/workbench/ui/EditorViewer',
    'webida-lib/plugins/workbench/ui/PartViewer',
    './TextChangeRequest'
], function (
    i18n,
    topic,
    require,
    genetic,
    _,
    codemirror,
    editors,
    loadCSSList,
    Logger,
    EditorViewer,
    PartViewer,
    TextChangeRequest
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    logger.off();

    function foldCode(cm, start, end) {
        var myWidget = $('<span class="CodeMirror-foldmarker">').text('\u2194')[0];
        codemirror.on(myWidget, 'mousedown', function () {
            myRange.clear();
        });
        var myRange = cm.markText(start, end, {
            replacedWith: myWidget,
            clearOnEnter: true,
            __isFold: true
        });
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
                        cm.__instance.setCursor({
                            row: line,
                            col: 0
                        });
                    });
                });
            });
        } else {
            return codemirror.Pass;
        }
    };
    codemirror.commands.handleTab = function (cm) {
        if (!cm.__instance.options.indentWithTabs) {
            codemirror.commands.insertSoftTab(cm);
        } else {
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
                    event = {
                        type: 'insert'
                    };
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

    /* jshint unused:false */
    codemirror.commands.save = function (cm) {
        topic.publish('editor/save/current');
    };
    /* jshint unused:true */

    function scrollToCursor(cm, position) {
        var lineNum = cm.getCursor().line;
        var charCoords = cm.charCoords({
            line: lineNum,
            ch: 0
        }, 'local');
        var height = cm.getScrollInfo().clientHeight;
        var y = charCoords.top;
        var lineHeight = charCoords.bottom - y;
        switch (position) {
            case 'center':
                y = y - (height / 2) + lineHeight;
                break;
            case 'bottom':
                y = y - height + lineHeight * 1.4;
                break;
            case 'top':
                y = y + lineHeight * 0.4;
                break;
        }
        cm.scrollTo(null, y);
    }

    function TextEditorViewer(elem, file) {
        logger.info('%cnew TextEditorViewer(' + elem + ', file)', 'color:green');
        this.init(file);
        EditorViewer.apply(this, arguments);
    }


    genetic.inherits(TextEditorViewer, EditorViewer, {

        init: function (file) {
            //var self = this;
            //TODO remove this.file
            this.file = file;
            this.options = {};
            this.cmOptions = {};
            this.cursorListeners = [];
            this.focusListeners = [];
            this.blurListeners = [];
            this.mode = '';
            this.mappedMode = 'text/plain';
            this.deferredActions = [];
        },

        createWidget: function (parentNode) {
            logger.info('createWidget(' + parentNode + ')');
            this.options.extraKeys = {
                'Tab': 'handleTab',
                'Ctrl--': 'foldselection',
                'Ctrl-D': 'gotoLine',
            };
            this.prepareCreate();
        },

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
                    self.emitLater(PartViewer.READY, self);
                });
            });
            // @formatter:on
        },
        createEditorWidget: function (parentNode) {
            logger.info('createEditorWidget(' + parentNode + ')');
            if (this.editor !== undefined) {
                return;
            }
            var self = this;

            this.addOptions();

            //TODO : update code like followings
            //var adapter = new TextEditorAdapter(this, parentNode);
            //this.setWidget(adapter);
            //this.setParentNode(parentNode);
            this.editor = codemirror(parentNode, this.cmOptions);

            //TODO : refactor
            this.setWidget(this.editor);

            //TODO : This code should be moved to TextEditorAdapter
            this.editor.on('change', function (cm, change) {
                var request = new TextChangeRequest();
                request.setDelta(change);
                request.setContents(cm.getValue());
                self.emit(PartViewer.CONTENTS_CHANGE, request);
            });

            this.editor.setOption('showCursorWhenSelecting', true);
            this.editor.__instance = this;
            $(this.editor.getWrapperElement()).addClass('maincodeeditor');

            if (this.deferredActions) {
                _.each(this.deferredActions, function (action) {
                    action(self);
                });
                delete this.deferredActions;
            }

            this.resizeTopicHandler = topic.subscribe('editor-container-layout-changed', function () {
                self.checkSizeChange();
            });

            // conditionally indent on paste
            self.editor.on('change', function (cm, e) {
                if (self.editor.options.indentOnPaste && e.origin === 'paste' && e.text.length > 1) {
                    for (var i = 0; i <= e.text.length; i++) {
                        cm.indentLine(e.from.line + i);
                    }
                }
            });            
        },

        synchronizeWidgetModel: function (recentViewer) {
            logger.info('synchronizeWidgetModel(' + recentViewer + ')');
            this.editor.swapDoc(recentViewer.editor.getDoc().linkedDoc({
                sharedHist: true
            }));
        },

        addDeferredAction: function (action) {
            if (this.editor) {
                action(this);
            } else {
                this.deferredActions.push(action);
            }
        },

        setOption: function (key, value, condition, defaultValue) {
            if (condition === undefined) {
                if (value !== undefined) {
                    this.cmOptions[key] = value;
                }
            } else {
                if (condition) {
                    this.cmOptions[key] = value;
                } else {
                    this.cmOptions[key] = defaultValue;
                }
            }
        },

        addOptions: function () {
            this.setOption('electricChars', false);
            this.setOption('flattenSpans', false);
            this.setOption('autoCloseBrackets', this.keymap !== 'vim');
            this.setOption('autoCloseTags', true);
            this.setOption('theme', this.theme, isAvailable('theme', this.theme), 'default');
            this.setOption('keyMap', this.keymap, isAvailable('keymap', this.keymap), 'default');
            this.setOption('lineNumbers', this.options.lineNumbers, true);
            this.setOption('tabSize', this.options.tabSize);
            this.setOption('indentUnit', this.options.indentUnit);
            this.setOption('indentWithTabs', this.options.indentWithTabs);
            this.setOption('indentOnPaste', this.options.indentOnPaste);
            this.setOption('extraKeys', this.options.extraKeys);
            this.setOption('lineWrapping', this.options.lineWrapping);
            this.setOption('mode', 'text/plain');
        },

        getMode: function () {
            return this.mode;
        },

        checkSizeChange: function () {
            if (this.editor) {
                var visible = $(this.elem).is(':visible');
                if (visible) {
                    var wrapper = this.editor.getWrapperElement();
                    var parentElem = wrapper.parentNode;
                    var boundingClientRect = wrapper.getBoundingClientRect();
                    var parentBoundingClientRect = parentElem.getBoundingClientRect();

                    var width = parentElem.offsetWidth;
                    var height = parentElem.offsetHeight - (boundingClientRect.top - parentBoundingClientRect.top);
                    if (this.__width !== width || this.__height !== height || this.__visible !== visible) {

                        this.setSize(width, height);

                        this.__visible = visible;
                    }
                }
            }
        },

        destroyWidget: function () {
            //unsubscribing topics

            if (this.resizeTopicHandler) {
                this.resizeTopicHandler.remove();
                this.resizeTopicHandler = null;
            }

            $(this.elem).html('');
        },

        addCursorListener: function (listener) {
            var tListener = eventTransformers.cursor(this, listener);
            this.cursorListeners.push(listener);
            this.addDeferredAction(function (self) {
                self.editor.on('cursorActivity', tListener);
            });
        },

        addFocusListener: function (listener) {
            this.focusListeners.push(listener);
            this.addDeferredAction(function (self) {
                self.editor.on('focus', listener);
            });
        },

        addBlurListener: function (listener) {
            this.blurListeners.push(listener);
            this.addDeferredAction(function (self) {
                self.editor.on('blur', listener);
            });
        },

        addEventListener: function (type, listener) {
            if (this.customListeners === undefined) {
                this.customListeners = {};
            }
            if (this.customListeners[type] === undefined) {
                this.customListeners[type] = [];
            }
            this.customListeners[type].push(listener);
        },

        addExtraKeys: function (extraKeys) {
            this.options.extraKeys = _.extend(this.options.extraKeys, extraKeys);
            if (this.editor) {
                this.editor.setOption('extraKeys', this.options.extraKeys);
            }
        },

        triggerEvent: function (type, event) {
            logger.info('triggerEvent(' + type + ', event)');
            var self = this;
            if (this.customListeners !== undefined) {
                if (this.customListeners[type] !== undefined) {
                    _.each(this.customListeners[type], function (listener) {
                        listener(self, event);
                    });
                }
            }
        },

        setCursor: function (cursor) {
            this.cursor = cursor;
            this.addDeferredAction(function (self) {
                self.editor.getDoc().setCursor(eventTransformers.wrapperLoc2cmLoc(cursor));
            });
            if (!this.editor) {
                var self = this;
                _.each(this.cursorListeners, function (listener) {
                    listener(self, cursor);
                });
            }
        },

        setSelection: function (anchor, head) {
            this.cursor = head;
            this.addDeferredAction(function (self) {
                self.editor.getDoc().setSelection(eventTransformers.wrapperLoc2cmLoc(anchor), 
                                                  eventTransformers.wrapperLoc2cmLoc(head));
            });
            if (!this.editor) {
                var self = this;
                _.each(this.cursorListeners, function (listener) {
                    listener(self, head);
                });
            }
        },

        getCursor: function () {
            if (this.editor) {
                return eventTransformers.cmLoc2wrapperLoc(this.editor.getDoc().getCursor());
            } else {
                var cursor = this.cursor;
                if (cursor === undefined) {
                    cursor = {
                        row: 0,
                        col: 0
                    };
                }
                this.cursor = cursor;
                this.addDeferredAction(function (self) {
                    self.editor.getDoc().setCursor(eventTransformers.wrapperLoc2cmLoc(cursor));
                });
                return this.cursor;
            }
        },

        setSize: function (width, height) {
            if (typeof width === 'number') {
                this.__width = width;
            } else {
                this.__width = null;
            }

            if (typeof height === 'number') {
                this.__height = height;
            } else {
                this.__height = null;
            }

            this.addDeferredAction(function (self) {
                if (typeof height === 'number') {//applying border correction
                    var wrapper = self.editor.getWrapperElement();

                    self.editor.setSize(width, height);
                    var borderCorrection = wrapper.offsetHeight - wrapper.clientHeight;
                    self.editor.setSize(wrapper.clientWidth, wrapper.clientHeight - borderCorrection);
                } else {
                    self.editor.setSize(width, height);
                }
            });
        },
        
        /**
         * Highlights strings matching given query with query options
         * Example: viewer.setHighlight('string',{caseSensitive: false, regexp: false, wholeWord: false});
         * @param {string} query
         * @param {Object} options
         */
        setHighlight: function (query, options) {
            this.addDeferredAction(function (self) {
                self.editor.setHighlight(query, options);
            });
        },

        getTheme: function () {
            return this.theme;
        },

        setTheme: function (theme) {
            if (theme === undefined) {
                return;
            }
            if (theme === 'webida') {
                theme = 'webida-dark';
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

        getKeymap: function () {
            return (this.keymap) ? this.keymap : 'default';
        },

        setKeymap: function (keymap) {
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
                    require(['external/codemirror/keymap/' + keymap], function () {
                        addAvailable('keymap', keymap);
                        if (self.editor) {
                            self.editor.setOption('keyMap', keymap);
                        }
                    });
                    break;
                default:
                    throw new Error('Not supported keymap "' + keymap + '"');
            }
        },

        setFontFamily: function (fontFamily) {
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
        },

        setFontSize: function (fontSize) {
            if (fontSize !== undefined) {
                this.fontSize = fontSize;
                this.addDeferredAction(function (self) {
                    $(self.elem).find('.CodeMirror').css({
                        fontSize: fontSize
                    });
                    self.editor.refresh();
                });
            }
        },

        _gutterOn: function (gutterName) {
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
        },

        _gutterOff: function (gutterName) {
            if (this.editor) {
                var gutters = this.editor.getOption('gutters');
                this.editor.setOption('gutters', _.without(gutters, gutterName));
            }
        },

        setStyleActiveLine: function (highlight) {
            if (highlight !== undefined) {
                this.styleActiveLine = highlight;
                if (highlight) {
                    var self = this;
                    require(['external/codemirror/addon/selection/active-line'], function () {
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
        },

        setMatchBrackets: function (match) {
            if (match === undefined) {
                return;
            }
            this.matchBrackets = match;
            if (match) {
                var self = this;
                require(['external/codemirror/addon/edit/matchbrackets'], function () {
                    self.addDeferredAction(function (self) {
                        self.editor.setOption('matchBrackets', match);
                    });
                });
            } else if (this.editor) {
                this.addDeferredAction(function (self) {
                    self.editor.setOption('matchBrackets', match);
                });
            }
        },

        setHighlightSelection: function (highlight) {
            if (highlight === undefined) {
                return;
            }
            this.highlightSelection = highlight;
            if (highlight) {
                var self = this;
                loadCSSList([require.toUrl('./css/match-highlighter.css')], function () {
                    require(['external/codemirror/addon/search/match-highlighter'], function () {
                        self.addDeferredAction(function (self) {
                            self.editor.setOption('highlightSelectionMatches', highlight);
                        });
                    });
                });
            } else if (this.editor) {
                this.addDeferredAction(function (self) {
                    self.editor.setOption('highlightSelectionMatches', highlight);
                });
            }
        },

        setTabSize: function (tabSize) {
            if (tabSize !== undefined) {
                this.options.tabSize = tabSize;
                if (this.editor) {
                    this.editor.setOption('tabSize', tabSize);
                }
            }
        },

        setIndentWithTabs: function (indentWithTabs) {
            if (indentWithTabs !== undefined) {
                this.options.indentWithTabs = indentWithTabs;
                if (this.editor) {
                    this.editor.setOption('indentWithTabs', indentWithTabs);
                }
            }
        },

        setIndentUnit: function (indentUnit) {
            if (indentUnit !== undefined) {
                this.options.indentUnit = indentUnit;
                if (this.editor) {
                    this.editor.setOption('indentUnit', indentUnit);
                }
            }
        },

        setIndentOnPaste: function (indentOnPaste) {
            if (indentOnPaste !== undefined) {
                this.options.indentOnPaste = indentOnPaste;
                if (this.editor) {
                    this.editor.setOption('indentOnPaste', indentOnPaste);
                }
            }
        },

        setTrimTrailingWhitespaces: function (trimTrailingWhitespaces) {
            if (trimTrailingWhitespaces !== undefined) {
                this.trimTrailingWhitespaces = trimTrailingWhitespaces;
            }
        },

        setInsertFinalNewLine: function (insertFinalNewLine) {
            if (insertFinalNewLine !== undefined) {
                this.insertFinalNewLine = insertFinalNewLine;
            }
        },

        setRetabIndentations: function (retabIndentations) {
            if (retabIndentations !== undefined) {
                this.retabIndentations = retabIndentations;
            }
        },

        setShowInvisibles: function (showingInvisibles) {
            this.showingInvisibles = showingInvisibles;
            if (showingInvisibles) {
                this.addDeferredAction(function (self) {
                    self.editor.addOverlay(TextEditorViewer._whitespaceOverlay);
                });
            } else {
                this.addDeferredAction(function (self) {
                    self.editor.removeOverlay(TextEditorViewer._whitespaceOverlay);
                });
            }
        },

        setLineWrapping: function (lineWrapping) {
            this.options.lineWrapping = lineWrapping;
            if (this.editor) {
                this.editor.setOption('lineWrapping', lineWrapping);
            }
        },

        setCodeFolding: function (codeFolding) {
            this.options.setCodeFolding = codeFolding;
            if (codeFolding) {
                var self = this;
                loadCSSList([require.toUrl('./css/codefolding.css')], function () {
                    require(['external/codemirror/addon/fold/foldcode', 'external/codemirror/addon/fold/foldgutter', 
                             'external/codemirror/addon/fold/brace-fold'], function () {
                        self.addDeferredAction(function (self) {
                            self._gutterOn('CodeMirror-foldgutter');
                            var rf = new codemirror.fold.combine(codemirror.fold.brace);
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

        setShowLineNumbers: function (showLineNumbers) {
            this.options.setShowLineNumbers = showLineNumbers;
            this.addDeferredAction(function (self) {
                self.editor.setOption('lineNumbers', showLineNumbers);
            });
        },

        getValue: function () {
            return this.editor ? this.editor.getValue() : undefined;
        },

        /**
         * Update Viewer's content
         * @param {Object} delta
         */
        render: function (newText) {
            //logger.info('render(' + newText.substr(0, 10) + ')');
            if (this.editor.getDoc().getValue() !== newText) {
                this.editor.setValue(newText);
            }
        },

        refresh: function (contents) {
            //logger.info('refresh(' + contents.substr(0, 10) + ')');
            if (contents.search(/\r\n/) !== -1) {
                this.editor.setOption('lineSeparator', '\r\n');
            }
            this.editor.setValue(contents);
            if (!this.contentsInitialized) {
                this.editor.clearHistory();
                this.contentsInitialized = true;
            }
        },

        foldCodeRange: function (range) {
            if (this.editor) {
                foldCode(this.editor, range.from, range.to);
            }
        },

        getFoldings: function () {
            if (this.editor) {
                var cm = this.editor;
                var foldings = _.filter(cm.getAllMarks(), function (mark) {
                    return mark.__isFold;
                });
                return _.map(foldings, function (fold) {
                    return fold.find();
                });
            }
        },

        clearHistory: function () {
            this.addDeferredAction(function (self) {
                self.editor.clearHistory();
            });
        },

        markClean: function () {
            this.addDeferredAction(function (self) {
                self.editor.markClean();
            });
        },

        focus: function () {
            logger.info('focus()');
            if (this.editor) {
                var editor = this.editor;
                setTimeout(function () {
                    editor.focus();
                });
            }
        },

        fitSize: function () {
            logger.info('fitSize()');
            if (this.editor) {
                var parentNode = this.getParentNode();
                this.setSize(parentNode.offsetWidth, parentNode.offsetHeight);
                this.editor.refresh();
            }
        },

        //methods from editors-commands
        undo: function () {
            this.addDeferredAction(function (self) {
                self.focus();
                self.editor.undo();
            });
        },

        redo: function () {
            this.addDeferredAction(function (self) {
                self.focus();
                self.editor.redo();
            });
        },

        cursorLineToMiddle: function () {
            this.addDeferredAction(function (self) {
                self.focus();
                scrollToCursor(self.editor, 'center');
            });
        },

        cursorLineToTop: function () {
            this.addDeferredAction(function (self) {
                self.focus();
                scrollToCursor(self.editor, 'top');
            });
        },

        cursorLineToBottom: function () {
            this.addDeferredAction(function (self) {
                self.focus();
                scrollToCursor(self.editor, 'bottom');
            });
        },

        del: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                self.focus();
                // delete
                var selected = editor.getSelection();
                if (selected) {
                    editor.replaceSelection('');
                } else {
                    // get document current line info
                    var pos = editor.getCursor(false);
                    var info = editor.lineInfo(pos.line);

                    // delete line
                    if (info.text && info.text.length > 0) {
                        editor.replaceRange('', {
                            line: pos.line,
                            ch: 0
                        }, {
                            line: pos.line,
                            ch: info.text.length
                        });
                    } else {
                        editor.replaceRange('', {
                            line: pos.line,
                            ch: 0
                        }, {
                            line: pos.line + 1,
                            ch: 0
                        });
                    }
                }

            });
        },

        selectAll: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                self.focus();

                // get document line info
                var lastLine = editor.lastLine();
                var lastLineCh = editor.lineInfo(lastLine).text.length;
                var from = {
                    line: 0,
                    ch: 0
                };
                var to = {
                    line: lastLine,
                    ch: lastLineCh
                };

                // select all
                editor.setSelection(from, to, {
                    scroll: false
                });
            });
        },

        selectLine: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                self.focus();

                // get document current line info
                var pos = editor.getCursor(false);
                var info = editor.lineInfo(pos.line);

                var from = {
                    line: pos.line,
                    ch: 0
                };
                var to = {
                    line: pos.line,
                    ch: info.text.length
                };

                // select line
                if (info.text && info.text.length > 0) {
                    editor.extendSelection(from, to);
                }
            });
        },

        lineIndent: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                self.focus();

                var selected = editor.getSelection();
                if (selected) {
                    // reselect
                    var startPos = editor.getCursor(true);
                    var endPos = editor.getCursor(false);

                    // reselect
                    var endPosInfo = editor.lineInfo(endPos.line);
                    if (startPos.ch !== 0 || endPosInfo.text.length !== endPos.ch) {
                        editor.setSelection({
                            line: startPos.line,
                            ch: 0
                        }, {
                            line: endPos.line,
                            ch: endPosInfo.text.length
                        });
                    }

                    // indent
                    editor.indentSelection('add');
                } else {
                    var pos = editor.getCursor();

                    // indent
                    editor.indentLine(pos.line, 'add');
                }
            });
        },

        lineDedent: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                self.focus();

                var selected = editor.getSelection();
                if (selected) {
                    // reselect
                    var startPos = editor.getCursor(true);
                    var endPos = editor.getCursor(false);

                    // reselect
                    var endPosInfo = editor.lineInfo(endPos.line);
                    if (startPos.ch !== 0 || endPosInfo.text.length !== endPos.ch) {
                        editor.setSelection({
                            line: startPos.line,
                            ch: 0
                        }, {
                            line: endPos.line,
                            ch: endPosInfo.text.length
                        });
                    }

                    // unindent

                    editor.indentSelection('subtract');

                } else {
                    var pos = editor.getCursor();

                    // unindent

                    editor.indentLine(pos.line, 'subtract');
                }
            });
        },

        lineMoveUp: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                self.focus();

                // line move up
                var moveUp = function (pos) {
                    var srcLineNum = pos.line;
                    var desLineNum = pos.line - 1;
                    var srcLineText = editor.getLine(srcLineNum);
                    var desLineText = editor.getLine(desLineNum);

                    editor.replaceRange(desLineText, {
                        line: srcLineNum,
                        ch: 0
                    }, {
                        line: srcLineNum,
                        ch: srcLineText.length
                    }, '+input');
                    editor.replaceRange(srcLineText, {
                        line: desLineNum,
                        ch: 0
                    }, {
                        line: desLineNum,
                        ch: desLineText.length
                    }, '+input');
                    editor.setCursor({
                        line: desLineNum,
                        ch: pos.ch
                    });
                };
                var selected = editor.getSelection();
                if (selected) {
                    var startPos = editor.getCursor(true);
                    var endPos = editor.getCursor(false);

                    // reselect
                    var endPosInfo = editor.lineInfo(endPos.line);
                    if (startPos.ch !== 0 || endPosInfo.text.length !== endPos.ch) {
                        editor.setSelection({
                            line: startPos.line,
                            ch: 0
                        }, {
                            line: endPos.line,
                            ch: endPosInfo.text.length
                        });
                        startPos = editor.getCursor(true);
                        endPos = editor.getCursor(false);
                    }

                    // move
                    selected = editor.getSelection();
                    var desLineNum = startPos.line - 1;
                    var desLineText = editor.getLine(desLineNum);

                    editor.replaceRange(desLineText, startPos, endPos, '+input');
                    editor.replaceRange(selected, {
                        line: desLineNum,
                        ch: 0
                    }, {
                        line: desLineNum,
                        ch: desLineText.length
                    }, '+input');

                    // reselect
                    editor.setSelection({
                        line: desLineNum,
                        ch: 0
                    }, {
                        line: endPos.line - 1,
                        ch: endPosInfo.text.length
                    });
                } else {
                    var pos = editor.getCursor();
                    moveUp(pos);
                }
            });
        },

        lineMoveDown: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                self.focus();

                // line move down
                var moveDown = function (pos) {
                    var srcLineNum = pos.line;
                    var desLineNum = pos.line + 1;
                    var srcLineText = editor.getLine(srcLineNum);
                    var desLineText = editor.getLine(desLineNum);

                    editor.replaceRange(desLineText, {
                        line: srcLineNum,
                        ch: 0
                    }, {
                        line: srcLineNum,
                        ch: srcLineText.length
                    }, '+input');
                    editor.replaceRange(srcLineText, {
                        line: desLineNum,
                        ch: 0
                    }, {
                        line: desLineNum,
                        ch: desLineText.length
                    }, '+input');
                    editor.setCursor({
                        line: desLineNum,
                        ch: pos.ch
                    });
                };
                var selected = editor.getSelection();
                if (selected) {
                    var startPos = editor.getCursor(true);
                    var endPos = editor.getCursor(false);

                    // reselect
                    var endPosInfo = editor.lineInfo(endPos.line);
                    if (startPos.ch !== 0 || endPosInfo.text.length !== endPos.ch) {
                        editor.setSelection({
                            line: startPos.line,
                            ch: 0
                        }, {
                            line: endPos.line,
                            ch: endPosInfo.text.length
                        });
                        startPos = editor.getCursor(true);
                        endPos = editor.getCursor(false);
                    }

                    // move
                    selected = editor.getSelection();
                    var desLineNum = endPos.line + 1;
                    var desLineText = editor.getLine(desLineNum);

                    editor.replaceRange(selected, {
                        line: startPos.line + 1,
                        ch: 0
                    }, {
                        line: desLineNum,
                        ch: desLineText.length
                    }, '+input');
                    editor.replaceRange(desLineText, {
                        line: startPos.line,
                        ch: 0
                    }, {
                        line: startPos.line,
                        ch: desLineText.length
                    }, '+input');

                    // reselect
                    editor.setSelection({
                        line: startPos.line + 1,
                        ch: 0
                    }, {
                        line: desLineNum,
                        ch: endPosInfo.text.length
                    });

                } else {
                    var pos = editor.getCursor();
                    moveDown(pos);
                }
            });
        },

        lineDelete: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                self.focus();

                // delete line
                var spos = editor.getCursor(true);
                var epos = editor.getCursor(false);
                var line = (spos.line <= epos.line ? spos.line : epos.line);
                var eposInfo = editor.lineInfo(epos.line);

                // selected line charactor delete
                if (spos.line !== epos.line) {
                    editor.replaceRange('', {
                        line: spos.line,
                        ch: 0
                    }, {
                        line: epos.line,
                        ch: eposInfo.text.length
                    });
                }
                editor.replaceRange('', {
                    line: line,
                    ch: 0
                }, {
                    line: line + 1,
                    ch: 0
                });
                editor.setCursor({
                    line: line,
                    ch: 0
                });
            });
        },

        foldCode: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                self.focus();

                // fold
                if (editor.somethingSelected()) {
                    editor.execCommand('foldselection');
                } else {
                    var rf = editor.options.foldGutter.rangeFinder;
                    editor.foldCode(editor.getCursor(), {
                        scanUp: true,
                        rangeFinder: rf
                    });
                }
            });
        },

        replace: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;                
                editor.execCommand('replace');
            });
        },

        find: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;                
                editor.execCommand('find');
            });
        },

        quickFind: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                self.focus();
                editor.execCommand('highlightSearch');
            });
        },

        findNext: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                self.focus();
                editor.execCommand('findNext');
            });
        },

        findPrev: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                self.focus();
                editor.execCommand('findPrev');
            });
        },

        gotoLine: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                editor.focus();
                editor.execCommand('gotoLine');
            });
        },

        gotoMatchingBrace: function () {
            this.addDeferredAction(function (self) {
                var editor = self.editor;
                self.focus();

                var pos = editor.getCursor();
                var mb = editor.findMatchingBracket(pos, false);
                if (mb && mb.match) {
                    if (pos.line === mb.from.line) {
                        // goto to
                        editor.setCursor(mb.to);
                    } else if (pos.line === mb.to.line) {
                        // goto from
                        editor.setCursor(mb.from);
                    }
                }
            });
        },

        // From editors viable-menu-items

        isThereMatchingBracket: function () {
            if (this.editor) {
                var editor = this.editor;
                return !!(editor.findMatchingBracket(editor.getCursor(), false));
            } else {
                return false;
            }
        },

        isDefaultKeyMap: function () {
            if (this.editor) {
                var editor = this.editor;
                return editor.getOption('keyMap') === 'default';
            } else {
                return false;
            }
        },

        // From from editors plugin.js

        getScrollInfo: function () {
            if (this.editor) {
                var editor = this.editor;
                return editor.getScrollInfo();
            } else {
                return null;
            }
        },

        scrollToScrollInfo: function (scrollInfo) {
            if (this.editor && scrollInfo) {
                var editor = this.editor;
                editor.scrollTo(scrollInfo.left, scrollInfo.top);
            }
        },

        getWorkbenchShortcuts: function (desc) {
            if (this.editor) {
                var editor = this.editor;
                var currentKeyMap = editor.getOption('keyMap');
                var merge = function (current, processed, keymap) {
                    var curKeyMap = codemirror.keyMap[current];
                    keymap = _.extend(keymap, curKeyMap);
                    if (curKeyMap.fallthrough && !_.contains(processed, curKeyMap.fallthrough)) {
                        processed.push(curKeyMap.fallthrough);
                        return merge(curKeyMap.fallthrough, processed, keymap);
                    } else {
                        return keymap;
                    }
                };
                var keymap = merge(currentKeyMap, [currentKeyMap], {});
                delete keymap.fallthrough;
                delete keymap.nofallthrough;
                delete keymap.disableInput;
                delete keymap.style;
                var extraKeys = editor.getOption('extraKeys');
                if (extraKeys) {
                    keymap = _.extend(keymap, extraKeys);
                }
                //console.log('Keymap:', keymap);
                return _.compact(_.map(keymap, function (name, key) {
                    if ((typeof name) === 'string') {
                        var d = desc[name];
                        if (d) {
                            return {
                                keys: key.replace(/Ctrl\-/g, 'Ctrl+').replace(/Alt\-/g, 'Alt+')
                                               .replace(/Shift\-/g, 'Shift+'),
                                desc: d,
                                viable: true
                            };
                        } else {
                            //console.log('hina temp: no desciption for ' +
                            // name);
                            return null;
                        }
                    }
                }));
            } else {
                return [];
            }
        },

        existSearchQuery: function () {
            if (this.editor) {
                var editor = this.editor;
                var query = editor && editor.state && editor.state.search && editor.state.search.query;
                if (query) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        },

        getMenuItemsUnderEdit: function (items, menuItems, deferred) {
            var editor = this.editor;

            if (editor) {
                //var selected = editor.getSelection();

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
                //lineItems['&Copy Line'] =
                // menuItems.editMenuItems['&Line']['&Copy Line'];
                lineItems['D&elete Lines'] = menuItems.editMenuItems['&Line']['D&elete Lines'];
                items['&Line'] = lineItems;

                // Source
                var sourceItems = {};

                // Code Folding
                sourceItems['&Fold'] = menuItems.editMenuItems['&Source']['&Fold'];

                items['&Source'] = sourceItems;

                menuItems.editMenuItems['&Undo'].alternateLabel = i18n.editMenuUndo;
                menuItems.editMenuItems['&Redo'].alternateLabel = i18n.editMenuRedo;
                menuItems.editMenuItems['&Delete'].alternateLabel = i18n.editMenuDelete;
                menuItems.editMenuItems['Select &All'].alternateLabel = i18n.editMenuSelectAll;
                menuItems.editMenuItems['Select L&ine'].alternateLabel = i18n.editMenuSelectLine;
                menuItems.editMenuItems['&Line']['&Indent'].alternateLabel = i18n.editMenuLineIndent;
                menuItems.editMenuItems['&Line']['&Dedent'].alternateLabel = i18n.editMenuLineDedent;
                menuItems.editMenuItems['&Line']['Move Line U&p'].alternateLabel = i18n.editMenuLineMoveLineUp;
                menuItems.editMenuItems['&Line']['Move Line Dow&n'].alternateLabel = i18n.editMenuLineMoveLineDown;
                menuItems.editMenuItems['&Line']['D&elete Lines'].alternateLabel = i18n.editMenuLineDeleteLines;
                items['&Line'].alternateLabel = i18n.editMenuLine;
                menuItems.editMenuItems['&Source']['&Fold'].alternateLabel = i18n.editMenuSourceFold;
                items['&Source'].alternateLabel = i18n.editMenuSource;
            }

            deferred.resolve(items);
        },

        /**
         * Execute command for this EditorViewer
         * @param {Object} command
         */
        execute: function (command) {
            logger.info('execute(' + command + ')');
            return this[command]();
        },

        /**
         * Whether this EditorViewer can execute given command
         * @param {Object} command
         * @return {boolean}
         */
        canExecute: function (command) {
            if ( typeof this[command] === 'function') {
                return true;
            } else {
                return false;
            }
        },
    });

    //Static

    TextEditorViewer.getAvailableThemes = function () {
        // @formatter:off
        return ['codemirror-default', 'ambiance', 'aptana', 'blackboard', 'cobalt', 'eclipse',
        'elegant', 'erlang-dark', 'lesser-dark', 'midnight', 'monokai', 'neat',
        'night', 'rubyblue', 'solarized dark', 'solarized light', 'twilight',
        'vibrant-ink', 'xq-dark', 'xq-light', 'webida-dark', 'webida-light'];
        // @formatter:on
    };
    TextEditorViewer.getAvailableKeymaps = function () {
        return ['default', 'vim', 'emacs'];
    };

    TextEditorViewer._whitespaceOverlay = {
        token: function (stream) {
            if (stream.eatWhile(/\S/)) {
                return null;
            }

            switch (stream.next()) {
                case ' ':
                    return 'whitespace-space';
                case '\t':
                    return 'whitespace-tab';
            }

            return 'whitespace';
        }
    };

    TextEditorViewer.getEnclosingDOMElem = function () {
        return document.getElementById('editor');
    };

    TextEditorViewer.getShortcuts = function () {
        return [{
            keys: 'shift+alt+P',
            title: 'TEST C, viable',
            desc: 'TEST, viable',
            viable: true
        }, {
            keys: 'ctrl+shift+alt+V',
            title: 'TEST C 2, viable',
            desc: 'TEST, viable',
            viable: true
        }, {
            keys: 'ctrl+shift+alt+U',
            title: 'TEST C, unviable',
            desc: 'TEST, viable'
        }];
    };

    return TextEditorViewer;
});
