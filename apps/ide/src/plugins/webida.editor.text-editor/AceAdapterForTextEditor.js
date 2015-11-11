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
 * Ace adapter for TextEditor
 *
 * @constructor
 * @see TextEditorViewer, EngineAdapterFactory
 * @constructor
 * @since: 2015.07.13
 * @author: h.m.kwon
 * 
 */

/* jshint unused:false */
/* global ace */

define([
    'require',
    'webida-lib/util/genetic',
    'external/lodash/lodash.min',
    'webida-lib/plugins/editors/plugin',
    'webida-lib/util/loadCSSList',
    './TextEditorAdapter',
    'dojo/topic',
    'external/ace-builds-1.2.0/src-noconflict/ace'
], function (
       require,
        genetic,
        _,
        editors,
        loadCSSList,
        TextEditorAdapter,
        topic,
        aceTemp
       ) {
    'use strict';
    
    //var ace = null;

    function AceAdapterForTextEditor(parentElem, file, startedListener) {
        var self = this;
        this.parentElem = parentElem;
        this.wrapperElem = document.createElement('div');
        this.parentElem.appendChild(this.wrapperElem);
        
        this.wrapperElem.style.height = 'auto';
        this.wrapperElem.style.position = 'absolute';
        this.wrapperElem.style.left = '0px';
        this.wrapperElem.style.right = '0px';
        this.wrapperElem.style.top = '0px';
        this.wrapperElem.style.bottom = '0px';

        this.file = file;
        this.options = {};
        this.options.extraKeys = {        };
        this.cursorListeners = [];
        this.deferredActions = [];
        this.mode = '';
        this.mappedMode = 'text/plain';

        if (startedListener) {
            this.addDeferredAction(function (self) {
                startedListener(file, self);
            });
        }

        /*
        loadCSSList([require.toUrl('./css/webida.css'),
                     require.toUrl('external/codemirror/lib/codemirror.css'),
                     require.toUrl('external/codemirror/addon/dialog/dialog.css')
                    ], function () {
            require(['external/codemirror/addon/dialog/dialog',
                     'external/codemirror/addon/search/searchcursor',
                     './search-addon',
                     'external/codemirror/addon/edit/closebrackets',
                     'external/codemirror/addon/edit/closetag',
                     'external/codemirror/addon/edit/matchbrackets'
                    ], function () {
                self.start();
            });
        });
        */
        /*
        require(['external/ace-builds-1.2.0/src-noconflict/ace'], function (aceModule) {            
            self.start();
        });*/
        
        self.start();
    }

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

    genetic.inherits(AceAdapterForTextEditor, TextEditorAdapter, {

        addDeferredAction: function (action) {
            if (this.editor) {
                action(this);
            } else {
                this.deferredActions.push(action);
            }
        },

        start: function () {
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
            /*
            setOption('theme', this.theme, isAvailable('theme', this.theme), 'default');
            setOption('mode', 'text/plain');
            setOption('keyMap', this.keymap, isAvailable('keymap', this.keymap), 'default');
            setOption('lineNumbers', this.options.lineNumbers, true);
            setOption('tabSize', this.options.tabSize);
            setOption('indentUnit', this.options.indentUnit);
            setOption('indentWithTabs', this.options.indentWithTabs);
            setOption('indentOnPaste', this.options.indentOnPaste);
            setOption('extraKeys', this.options.extraKeys);
            setOption('lineWrapping', this.options.lineWrapping);*/

            this.editor = ace.edit(this.wrapperElem);   
            var container = this.editor.renderer.getContainerElement();
            
            
            this.editor.__instance = this;
            $(this.wrapperElem).addClass('maincodeeditor');

            if (this.deferredActions) {
                _.each(this.deferredActions, function (action) {
                    action(self);
                });
                delete this.deferredActions;
            }            
            
            topic.subscribe('editor-panel-resize-finished', function () {
                self.__checkSizeChange();
            });

            // conditionally indent on paste
            /*
            self.editor.on('change', function (cm, e) {
                
                if (self.editor.options.indentOnPaste && e.origin === 'paste' && e.text.length >
                    1) {
                    for (var i = 0; i <= e.text.length; i++) {
                        cm.indentLine(e.from.line + i);
                    }
                }
            });
            */
        },

        __checkSizeChange: function () {            
            if (this.editor) {
                var visible = $(this.parentElem).is(':visible');
                if (visible) {
                    var wrapper = this.wrapperElem;
                    var boundingClientRect = wrapper.getBoundingClientRect();
                    var parentBoundingClientRect = this.parentElem.getBoundingClientRect();

                    var width = this.parentElem.offsetWidth;
                    var height = this.parentElem.offsetHeight - (boundingClientRect.top -
                                                            parentBoundingClientRect.top);
                    if (this.__width !== width || this.__height !== height || this.__visible !==
                        visible) {

                        this.setSize(width, height);

                        this.__visible = visible;
                    }
                }
            }
        },

        destroy: function () {
            $(this.elem).html('');
            
            if (this.editor) {
                this.editor.destroyWidget();
                this.editor = null;
            }
        },

        addCursorListener: function (listener) {
            //var tListener = eventTransformers.cursor(this, listener);
            this.cursorListeners.push(listener);
            this.addDeferredAction(function (self) {
                //self.editor.on('cursorActivity', tListener);
            });
        },

        addFocusListener: function (listener) {
            this.addDeferredAction(function (self) {
                self.editor.on('focus', listener);
            });
        },

        addBlurListener: function (listener) {
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
        },

        triggerEvent: function (type, event) {
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
                self.editor.moveCursorTo(cursor.row, cursor.col);
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
                self.editor.selection.setSelectionAnchor(anchor.row, anchor.col);
                self.editor.selection.selectTo(head.row, head.col);
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
                var cursorPosition = this.editor.getCursorPosition();
                return {row: cursorPosition.row, col: cursorPosition.column};             
            } else {
                var cursor = this.cursor;
                if (cursor === undefined) {
                    cursor = {
                        row: 0,
                        col: 0
                    };
                }
                this.setCursor(cursor);               
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
                var wrapper;
                if (typeof height === 'number') { //applying border correction
                    wrapper = self.wrapperElem;
                    
                    wrapper.style.width = width + 'px';                    
                    wrapper.style.height = height + 'px';                    
                    self.editor.resize();
                   
                } else {                    
                    wrapper = self.wrapperElem;

                    wrapper.style.width = width;                    
                    wrapper.style.height = height;
                    self.editor.resize();
                }
            });
        },

        getTheme: function () {
            // TODO
            return 'default';
        },

        setTheme: function (theme) {
            //TODO
            if (theme === undefined) {
                return;
            }
            this.theme = 'default';            
        },

        getKeymap: function () {
            //TODO keyboard handler
            //this.editor.setKeyboardHandler('ace/keyboard/vim');
            return 'default';
        },

        setKeymap: function (keymap) {
            //TODO keyboard handler
            if (keymap === undefined) {
                return;
            }            
        },

        setFontFamily: function (fontFamily) {
            
        },

        setFontSize: function (fontSize) {
            
        },

        _gutterOn: function (gutterName) {
            
        },

        _gutterOff: function (gutterName) {
            
        },

        setStyleActiveLine: function (highlight) {
            if (highlight !== undefined && this.editor) {
                this.editor.setHighlightActiveLine(highlight);
            }
        },

        setMatchBrackets: function (match) {
            
        },

        setHighlightSelection: function (highlight) {
            
        },

        setTabSize: function (tabSize) {
            if (tabSize !== undefined) {
                this.options.tabSize = tabSize;
                if (this.editor) {
                    this.editor.getSession().setTabSize(tabSize);
                }
            }
        },

        setIndentWithTabs: function (indentWithTabs) {
            
        },

        setIndentUnit: function (indentUnit) {            
        },

        setIndentOnPaste: function (indentOnPaste) {            
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
            this.addDeferredAction(function (self) {
                self.editor.setShowInvisibles(showingInvisibles);
            });
        },

        setLineWrapping: function (lineWrapping) {
            this.options.lineWrapping = lineWrapping;
            this.addDeferredAction(function (self) {
                self.editor.setWrapBehavioursEnabled(lineWrapping);
            });
        },

        setCodeFolding: function (codeFolding) {            
            this.options.setCodeFolding = codeFolding;
            this.addDeferredAction(function (self) {
                self.editor.setShowFoldWidgets(codeFolding);
            });
        },

        setShowLineNumbers: function (showLineNumbers) {
            // May be, no feature
        },

        getValue: function () {
            return this.editor ? this.editor.getValue() : undefined;
        },

        setValue: function (value) {
            this.addDeferredAction(function (self) {
                self.editor.setValue(value);
                self.editor.clearSelection();
            });
        },

        foldCodeRange: function (range) {
            // May be, no feature
        },

        getFoldings: function () {
            // May be, no feature
        },

        clearHistory: function () {
            this.addDeferredAction(function (self) {
                self.editor.getSession().getUndoManager().reset();
            });
        },

        markClean: function () {
            this.addDeferredAction(function (self) {
                self.editor.getSession().getUndoManager().reset();
            });
        },

        focus: function () {
            if (this.editor) {
                this.editor.focus();
            }
        },

        refresh: function () {
            if (this.editor) {
                this.focus();
                //TODO
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
                //TODO
            });
        },

        cursorLineToTop: function () {
            this.addDeferredAction(function (self) {
                self.focus();
                //TODO
            });
        },

        cursorLineToBottom: function () {
            this.addDeferredAction(function (self) {
                self.focus();
                //TODO
            });
        },

        del: function () {
            this.addDeferredAction(function (self) {
                self.focus();
                //TODO
            });
        },

        selectAll: function () {
            this.addDeferredAction(function (self) {
                self.focus();               
                self.editor.selectAll();                
            });
        },

        selectLine: function () {
            this.addDeferredAction(function (self) {
                self.focus();               
                //TODO
            });
        },

        lineIndent: function () {
            this.addDeferredAction(function (self) {
                self.focus();                
                self.editor.indent();
            });
        },

        lineDedent: function () {
            this.addDeferredAction(function (self) {
                self.focus();
                self.editor.blockOutdent();
            });
        },

        lineMoveUp: function () {
            this.addDeferredAction(function (self) {
                self.focus();
                //TODO
            });
        },

        lineMoveDown: function () {
            this.addDeferredAction(function (self) {
                self.focus();              
                //TODO
            });
        },

        lineDelete: function () {
            this.addDeferredAction(function (self) {
                self.focus();              
                //TODO
            });
        },        

        foldCode: function () {
            this.addDeferredAction(function (self) {
                self.focus();
                //TODO
            });
        },

        replace: function () {
            this.addDeferredAction(function (self) {
                self.focus();
                //TODO
            });
        },

        find: function () {
            this.addDeferredAction(function (self) {
                self.focus();
                //TODO
            });
        },

        quickFind: function () {
            this.addDeferredAction(function (self) {
                self.focus();
                //TODO
            });
        },

        findNext: function () {
            this.addDeferredAction(function (self) {
                self.focus();
                //TODO
            });
        },

        findPrev: function () {
            this.addDeferredAction(function (self) {
                self.focus();
                //TODO
            });
        },

        gotoLine: function () {
            this.addDeferredAction(function (self) {
                self.focus();  
                //TODO
            });
        },

        gotoMatchingBrace: function () {
            this.addDeferredAction(function (self) {
                self.focus();   
                //TODO
            });
        },

        // From editors viable-menu-items

        isThereMatchingBracket: function () {
            return false;
        },

        isDefaultKeyMap: function () {
            return true;
        },

        // From from editors plugin.js

        getScrollInfo: function () {
            return null;
        },

        scrollToScrollInfo: function (scrollInfo) {
            
        },       

        getWorkbenchShortcuts: function (desc) {
            return [];          
        },

        existSearchQuery: function () {
            return false;
        },

        getMenuItemsUnderEdit: function (items, menuItems, deferred) {
            deferred.resolve(items);
        },
        getContextMenuItems: function (opened, items, menuItems, deferred) {                    
            var editor = this.editor;
            var part = editors.getCurrentPart();
            if (editor) {                

                // Close Others, Close All
                if (opened.length > 1) {
                    items['Close O&thers'] = menuItems.fileMenuItems['Cl&ose Others'];
                }
                items['&Close All'] = menuItems.fileMenuItems['C&lose All'];

                // Undo, Redo
                
                if (editor.getSession().getUndoManager().hasUndo()) {
                    items['U&ndo'] = menuItems.editMenuItems['&Undo'];
                }
                if (editor.getSession().getUndoManager().hasRedo()) {
                    items['&Redo'] = menuItems.editMenuItems['&Redo'];
                }                

                // Save
                if (part.isDirty()) {
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
                var pos = this.getCursor();
                if (pos.row > 0) {
                    lineItems['Move Line U&p'] = menuItems.editMenuItems['&Line']['Move Line U&p'];
                }
                if (pos.row < editor.getSession().getLength() - 1) {
                    lineItems['Move Line Dow&n'] = menuItems.editMenuItems['&Line']['Move Line Dow&n'];
                }
                //lineItems['&Copy Line'] = menuItems.editMenuItems['&Line']['&Copy Line'];
                lineItems['D&elete Lines'] = menuItems.editMenuItems['&Line']['D&elete Lines'];
                lineItems['Move Cursor Line to Middle'] = 
                    menuItems.editMenuItems['&Line']['Move Cursor Line to Middle'];
                
                lineItems['Move Cursor Line to Top'] = menuItems.editMenuItems['&Line']['Move Cursor Line to Top'];
                
                lineItems['Move Cursor Line to Bottom'] = 
                    menuItems.editMenuItems['&Line']['Move Cursor Line to Bottom'];

                if (_.values(lineItems).length > 0) {
                    items['&Line'] = lineItems;
                }

                // Source
                var sourceItems = {};

                // Code Folding
                sourceItems['&Fold'] = menuItems.editMenuItems['&Source']['&Fold'];

                // Source
                if (_.values(sourceItems).length > 0) {
                    items['So&urce'] = sourceItems;
                }

                // Go to                

                if (this.isDefaultKeyMap()) {
                    items['G&o to Line'] = menuItems.navMenuItems['G&o to Line'];               
                }            

                if (this.isThereMatchingBracket()) {
                    items['Go to &Matching Brace'] = menuItems.navMenuItems['Go to &Matching Brace'];
                }               
            } else {
                // FIXME: this is temp code, must fix this coe when editor plugin refactoring
                if (part.isDirty()) {
                    items['&Save'] = menuItems.fileMenuItems['&Save'];
                }               
            }
            deferred.resolve(items);
        }
    });

    //Static

    AceAdapterForTextEditor.getAvailableThemes = function () {
        return [
            'default', 'ambiance', 'aptana', 'blackboard', 'cobalt', 'eclipse', 'elegant',
            'erlang-dark', 'lesser-dark',
            'midnight', 'monokai', 'neat', 'night', 'rubyblue', 'solarized dark', 'solarized light',
            'twilight',
            'vibrant-ink', 'xq-dark', 'xq-light', 'webida-dark', 'webida-light'
        ];
    };
    AceAdapterForTextEditor.getAvailableKeymaps = function () {
        return ['default', 'vim', 'emacs'];
    };

    AceAdapterForTextEditor._whitespaceOverlay = {
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

    AceAdapterForTextEditor.getEnclosingDOMElem = function () {
        return document.getElementById('editor');
    };

    AceAdapterForTextEditor.getShortcuts = function () {
        return [];
    };

    return AceAdapterForTextEditor;
});