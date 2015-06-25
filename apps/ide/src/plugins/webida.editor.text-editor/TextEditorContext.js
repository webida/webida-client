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
 * TextTextEditorContext is an wrapper(or adapter) object that encapsulates 
 * web based text editors, such as codemirror, ace editor,.. etc.
 * Now TextTextEditorContext supports codemirror only, but we will
 * support other editors like ace sooner or later.
 *
 * Still needs refactoring (2015.06.25, hw.shim)
 * 
 * @constructor
 * @see TextEditor
 * @refactor: hw.shim (2015.06.11)
 */

define([
	'require',
	'webida-lib/util/gene',
	'webida-lib/plugins/editors/viable-menu-items',
	'other-lib/underscore/lodash.min',
	'webida-lib/custom-lib/codemirror/lib/codemirror',
	'webida-lib/util/loadCSSList',
	'webida-lib/plugins/editors/EditorContext'
], function (
	require,
	gene, 
	vmi, 
	_, 
	codemirror, 
	loadCSSList,
	EditorContext
) {
	'use strict';

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

    codemirror.commands.save = function (cm) {
        cm.__instance.triggerEvent('save');
    };

    function TextEditorContext(elem, file, startedListener) {
        var self = this;
        this.elem = elem;
        this.file = file;
        this.options = {};
        this.options.extraKeys = {
            'Tab': 'handleTab',
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

    gene.inherit(TextEditorContext, EditorContext, {

    	addDeferredAction : function (action) {
	        if (this.editor) {
	            action(this);
	        } else {
	            this.deferredActions.push(action);
	        }
	    },

		start : function () {
	        if (this.editor !== undefined) {
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
	        setOption('mode', 'text/plain');
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
	
	        if (this.deferredActions) {
	            _.each(this.deferredActions, function (action) {
	                action(self);
	            });
	            delete this.deferredActions;
	        }

	        this.sizeChangePoller = setInterval(function () {
	            self.__checkSizeChange();
	        }, 500);

	        // conditionally indent on paste
	        self.editor.on('change', function (cm, e) {
	            if (self.editor.options.indentOnPaste && e.origin === 'paste' && e.text.length > 1) {
	                for (var i = 0; i <= e.text.length; i++) {
	                    cm.indentLine(e.from.line + i);
	                }
	            }
	        });
	    },

	    __checkSizeChange : function () {
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
	    },

	    destroy : function () {
	        $(this.elem).html('');
	        if (this.sizeChangePoller !== undefined) {
	            clearInterval(this.sizeChangePoller);
	        }
	    },

	    addChangeListener : function (listener) {
	        var tListener = eventTransformers.change(this, listener);
	        this.addDeferredAction(function (self) {
	            self.editor.on('change', tListener);
	        });
	    },

	    addCursorListener : function (listener) {
	        var tListener = eventTransformers.cursor(this, listener);
	        this.cursorListeners.push(listener);
	        this.addDeferredAction(function (self) {
	            self.editor.on('cursorActivity', tListener);
	        });
	    },

	    addFocusListener : function (listener) {
	        this.focusListeners.push(listener);
	        this.addDeferredAction(function (self) {
	            self.editor.on('focus', listener);
	        });
	    },

	    addBlurListener : function (listener) {
	        this.blurListeners.push(listener);
	        this.addDeferredAction(function (self) {
	            self.editor.on('blur', listener);
	        });
	    },

	    addEventListener : function (type, listener) {
	        if (this.customListeners === undefined) {
	            this.customListeners = {};
	        }
	        if (this.customListeners[type] === undefined) {
	            this.customListeners[type] = [];
	        }
	        this.customListeners[type].push(listener);
	    },

	    addExtraKeys : function (extraKeys) {
	        this.options.extraKeys = _.extend(this.options.extraKeys, extraKeys);
	        if (this.editor) {
	            this.editor.setOption('extraKeys', this.options.extraKeys);
	        }
	    },

	    triggerEvent : function (type, event) {
	        var self = this;
	        if (this.customListeners !== undefined) {
	            if (this.customListeners[type] !== undefined) {
	                _.each(this.customListeners[type], function (listener) {
	                    listener(self, event);
	                });
	            }
	        }
	    },

	    setCursor : function (cursor) {
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
	    },

	    setSelection : function (anchor, head) {
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
	    },

	    getCursor : function () {
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
	    },
	
	    setSize : function (width, height) {
	        this.size = {width: width, height: height};
	        this.addDeferredAction(function (self) {
	            self.editor.setSize(width, height);
	        });
	    },
	
	    getTheme : function () {
	        return this.theme;
	    },

	    setTheme : function (theme) {
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
	                csspath = 'webida-lib/plugins/editors/themes/webida-dark.css';
	                break;
	            case 'webida-light':
	                csspath = 'webida-lib/plugins/editors/themes/webida-light.css';
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
	    },

	    getKeymap : function () {
	        return (this.keymap) ? this.keymap: 'default';
	    },

	    setKeymap : function (keymap) {
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
	    },

	    setFontFamily : function (fontFamily) {
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

	    setFontSize : function (fontSize) {
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
	
	    _gutterOn : function (gutterName) {
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

	    _gutterOff : function (gutterName) {
	        if (this.editor) {
	            var gutters = this.editor.getOption('gutters');
	            this.editor.setOption('gutters', _.without(gutters, gutterName));
	        }
	    },
	
	    setStyleActiveLine : function (highlight) {
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
	    },

	    setMatchBrackets : function (match) {
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
	    },

	    setHighlightSelection : function (highlight) {
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
	    },
	
	    setTabSize : function (tabSize) {
	        if (tabSize !== undefined) {
	            this.options.tabSize = tabSize;
	            if (this.editor) {
	                this.editor.setOption('tabSize', tabSize);
	            }
	        }
	    },

	    setIndentWithTabs : function (indentWithTabs) {
	        if (indentWithTabs !== undefined) {
	            this.options.indentWithTabs = indentWithTabs;
	            if (this.editor) {
	                this.editor.setOption('indentWithTabs', indentWithTabs);
	            }
	        }
	    },

	    setIndentUnit : function (indentUnit) {
	        if (indentUnit !== undefined) {
	            this.options.indentUnit = indentUnit;
	            if (this.editor) {
	                this.editor.setOption('indentUnit', indentUnit);
	            }
	        }
	    },

	    setIndentOnPaste : function (indentOnPaste) {
	        if (indentOnPaste !== undefined) {
	            this.options.indentOnPaste = indentOnPaste;
	            if (this.editor) {
	                this.editor.setOption('indentOnPaste', indentOnPaste);
	            }
	        }
	    },

	    setTrimTrailingWhitespaces : function (trimTrailingWhitespaces) {
	        if (trimTrailingWhitespaces !== undefined) {
	            this.trimTrailingWhitespaces = trimTrailingWhitespaces;
	        }
	    },

	    setInsertFinalNewLine : function (insertFinalNewLine) {
	        if (insertFinalNewLine !== undefined) {
	            this.insertFinalNewLine = insertFinalNewLine;
	        }
	    },

	    setRetabIndentations : function (retabIndentations) {
	        if (retabIndentations !== undefined) {
	            this.retabIndentations = retabIndentations;
	        }
	    },

	    setShowInvisibles : function (showingInvisibles) {
	        this.showingInvisibles = showingInvisibles;
	        if (showingInvisibles) {
	            this.addDeferredAction(function (self) {
	                self.editor.addOverlay(TextEditorContext._whitespaceOverlay);
	            });
	        } else {
	            this.addDeferredAction(function (self) {
	                self.editor.removeOverlay(TextEditorContext._whitespaceOverlay);
	            });
	        }
	    },

	    setLineWrapping : function (lineWrapping) {
	        this.options.lineWrapping = lineWrapping;
	        if (this.editor) {
	            this.editor.setOption('lineWrapping', lineWrapping);
	        }
	    },

	    setCodeFolding : function (codeFolding) {
	        this.options.setCodeFolding = codeFolding;
	        if (codeFolding) {
	            var self = this;
	            loadCSSList([require.toUrl('./css/codefolding.css')], function () {
	                require(['webida-lib/custom-lib/codemirror/addon/fold/foldcode',
	                         'webida-lib/custom-lib/codemirror/addon/fold/foldgutter',
	                         'webida-lib/custom-lib/codemirror/addon/fold/brace-fold'], function () {
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

	    setShowLineNumbers : function (showLineNumbers) {
	        this.options.setShowLineNumbers = showLineNumbers;
	        this.addDeferredAction(function (self) {
	            self.editor.setOption('lineNumbers', showLineNumbers);
	        });
	    },

	    getValue : function () {
	        return this.editor ? this.editor.getValue() : undefined;
	    },

	    setValue : function (value) {
	        this.addDeferredAction(function (self) {
	            self.editor.setValue(value);
	        });
	    },
	
	    foldCode : function (range) {
	        if (this.editor) {
	            foldCode(this.editor, range.from, range.to);
	        }
	    },

	    getFoldings : function () {
	        if (this.editor) {
	            var cm = this.editor;
	            var foldings = _.filter(cm.getAllMarks(), function (mark) { return mark.__isFold; });
	            return _.map(foldings, function (fold) {
	                return fold.find();
	            });
	        }
	    },
	
	    isClean : function () {
	        if (this.editor) {
	            return this.editor.getDoc().isClean();
	        } else {
	            return true;
	        }
	    },

	    clearHistory : function () {
	        this.addDeferredAction(function (self) {
	            self.editor.clearHistory();
	        });
	    },

	    markClean : function () {
	        this.addDeferredAction(function (self) {
	            self.editor.markClean();
	        });
	    },
	
	    focus : function () {
	    	if(this.editor){
	    		this.editor.focus();
	    	}
	    },
	
	    refresh : function () {
	    	if(this.editor){
	    		this.editor.refresh();
	    	}
	    }
    });

	//Static

    TextEditorContext.getAvailableThemes = function () {
        return [
            'default', 'ambiance', 'aptana', 'blackboard', 'cobalt', 'eclipse', 'elegant', 'erlang-dark', 'lesser-dark',
            'midnight', 'monokai', 'neat', 'night', 'rubyblue', 'solarized dark', 'solarized light', 'twilight',
            'vibrant-ink', 'xq-dark', 'xq-light', 'webida-dark', 'webida-light'
        ];
    };
    TextEditorContext.getAvailableKeymaps = function () {
        return ['default', 'vim', 'emacs'];
    };

    TextEditorContext._whitespaceOverlay = {
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

    TextEditorContext.getEnclosingDOMElem = function () {
        return document.getElementById('editor');
    };

    TextEditorContext.getShortcuts = function () {
        return [
            { keys : 'shift+alt+P', title : 'TEST C, viable', desc: 'TEST, viable', viable: true },
            { keys : 'ctrl+shift+alt+V', title : 'TEST C 2, viable', desc: 'TEST, viable', viable: true },
            { keys : 'ctrl+shift+alt+U', title : 'TEST C, unviable', desc: 'TEST, viable' }
        ];
    };

    return TextEditorContext;
});
