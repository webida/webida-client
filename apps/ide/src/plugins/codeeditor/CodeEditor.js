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
 * CodeEditor implementation of Editor
 * This should be an ancestor of all code based editors. 
 *
 * @constructor
 * @see TextEditor
 * @since: 2015.06.11
 * @todo: oop, editorContext, move some codes to TextEditor
 * @author: hw.shim
 */

define([
	'webida-lib/util/gene',
	'other-lib/underscore/lodash.min',
	'webida-lib/plugins/webida.editor.text-editor/TextEditor',
	'webida-lib/plugins/workbench/preference-system/store',	// TODO: issue #12055
	'webida-lib/plugins/editors/plugin',
	'./EditorContext',
	'./configloader',
	'dojo/topic',
	'dojo/dom-geometry',
	'dojo/dom-style',
	'webida-lib/util/logger/logger-client',
	'dojo/domReady!'
], function(
	gene,
	_, 
	TextEditor,
	store, 
	editors, 
	EditorContext, 
	configloader, 
	topic,
	geometry,
	domStyle,
	Logger
) {
	'use strict';

	var logger = new Logger();
    var editorContexts = {};
    var elemIdCounter = 1;
    var lastSavedFoldingStatus = {};

    // file events
    function onFileOpened(file, content) {
        // console.log('file.opened', file.name, file);
        var editorContext = editorContexts[file.__elemId];
        if (editorContext === undefined || editorContext === null) {
            return;
        }

        editorContext.setValue(content);
        editorContext.clearHistory();
        editorContext.markClean();
        var mode = file.name.substr(file.name.lastIndexOf('.') + 1).toLowerCase();
        setMode(editorContext, mode);
    }

    function setMode(editorContext, mode) {

        // TODO: clear the current mode before setting a new one.
        // Currently, without this, file is reopened when its extension (mode) is changed
        // instead of resetting its mode. Note that the latter is more desirable.

        editorContext.setMode(mode);
        switch (mode) {
        case 'json':
            editorContext.setLinter('json', true);
            editorContext.setHinters('json', ['word']);
            break;
        case 'js':
            editorContext.setLinter('js', false);
            editorContext.setHinters('javascript', ['javascript']);
            break;
        case 'css':
            editorContext.setLinter('css', true);
            editorContext.setHinters('css', ['css', 'cssSmart']);
            break;
        case 'html':
            editorContext.setLinter('html', true);
            editorContext.setHinters('html', ['html', 'htmlLink', 'htmlSmart']);
            editorContext.setHinters('htmlmixed', ['html', 'htmlLink', 'htmlSmart']);
            editorContext.setHinters('css', ['css', 'cssSmart']);
            break;
        default:
            editorContext.setHinters('word', ['word']);
            break;
        }
    }

    function onFileSaved(file) {
        // console.log('file.saved', file.name);
        var editorContext = editorContexts[file.__elemId];
        if (editorContext) {
            lastSavedFoldingStatus[file.path] = editorContext.getFoldings();	// ??? Why save foldings here?
        }
    }

    topic.subscribe('file.opened', onFileOpened);
    topic.subscribe('file.saved', onFileSaved);

    var preferenceFields = {
        'codeeditor:cm-theme': ['setTheme', 'webida-dark'],
        'codeeditor:invisibles': ['setShowInvisibles'],
        'codeeditor:folding': ['setCodeFolding', true],
        'codeeditor:activeline': ['setStyleActiveLine', true],
        // 'codeeditor:gutterline': ['setHighlightGutterLine', true],
        // 'codeeditor:indentguides': ['setDisplayIndentGuides', true],
        'codeeditor:highlightselection': ['setHighlightSelection', true],
        'codeeditor:wordWrap': ['setLineWrapping', false],
        'codeeditor:indentWithTabs' : ['setIndentWithTabs', false],
        'codeeditor:indentunit': ['setIndentUnit', 4],
        'codeeditor:indentOnPaste' : ['setIndentOnPaste', true],
        'codeeditor:tabsize': ['setTabSize', 4],
        'codeeditor:trimTrailing': ['setTrimTrailingWhitespaces', false],
        'codeeditor:insertFinal': ['setInsertFinalNewLine', false],
        'codeeditor:retabIndentations': ['setRetabIndentations', false],
        'codeeditor:font': ['setFontFamily', 'Nanum Gothic Coding'],
        'codeeditor:fontSize': ['setFontSize', 13],
        'codeeditor:keymap': ['setKeymap', 'default'],
        'codeeditor:enableSnippet': ['setSnippetEnabled', true],
        'codeeditor:lineNumbers': ['setShowLineNumbers', true],

        // content assist
        'codeeditor:autoCompletion': ['setAutoCompletion', true],
        'codeeditor:autoCompletionDelay': ['setAutoCompletionDelay', 0.3],
        'codeeditor:anywordHint': ['setAnywordHint', false]
    };
    function applyPreference(editorContext, fieldId, definition, fieldValue) {
        var setterName = definition[0];
        if (fieldValue === undefined && definition.length > 1) {
            fieldValue = definition[1];
        }
        editorContext[setterName](fieldValue);
    }
    function setPreferences(editorContext) {
        store.addLoadedListener(function () {
            editorContext.setMatchBrackets(true);
            _.each(preferenceFields, function (definition, fieldId) {
                applyPreference(editorContext, fieldId, definition, store.getValue(fieldId));
            });
            var listener = function (value, fieldId) {
                applyPreference(editorContext, fieldId, preferenceFields[fieldId], value);
            };
            _.each(preferenceFields, function (_, fieldId) {
                store.addFieldChangeListener(fieldId, listener);
            });
            editorContext.__preferenceListener = listener;
        });
    }
    function unsetPreferences(editorContext) {
        if (editorContext.__preferenceListener !== undefined) {
            _.each(preferenceFields, function (_, fieldId) {
                store.removeFieldChangeListener(fieldId, editorContext.__preferenceListener);
            });
        }
    }

    var cursorStacks = {
        back: [],
        forth: []
    };

	function CodeEditor(){
	}

	gene.inherit(CodeEditor, TextEditor, {

        create: function (file, content, elem, started) {
            if (file.__elemId === undefined) {
            	var that = this;
                var elemId = (elemIdCounter++);
                var editorContext = new EditorContext(elem, file, function (file, editorContext) {
                    editorContext.addChangeListener(function (editorContext, change) {
                        if (editorContext._changeCallback) {
                            editorContext._changeCallback(file, change);
                        }
                    });
                    if (started) {
                        _.defer(function () {
                            started(file, editorContext);
                        });
                    }
                });
                editorContexts[elemId] = editorContext;
                file.elem = elem;
                file.__elemId = elemId;

                //editorContext.setSize('100%', '100%');
                //editorContext.setSize('100%', '');
                editorContext.addDeferredAction(function (editor) {
                    var wrapper = editor.editor.getWrapperElement();
                    $(wrapper).css({
                        height: 'auto',
                        position: 'absolute',
                        left: '0px',
                        right: '0px',
                        top: '0px',
                        bottom: '0px'
                    });                   
                });
                editorContext.setMode(file.name.substr(file.name.lastIndexOf('.') + 1));
                setPreferences(editorContext);

                onFileOpened(file, content);
                
                //editorContext.addDeferredAction(function (editor) {
                 //   editor.editor.setOption('overviewRuler', false);
                //});

                if (store.getValue('codeeditor:editorconfig') === true) {
                    configloader.editorconfig(editorContext, file);
                }
                if (store.getValue('codeeditor:jshintrc') !== false) {
                    configloader.jshintrc(editorContext, file);
                }

                editorContext.addEventListener('save', function () {
                    require(['dojo/topic'], function (topic) {
                        topic.publish('#REQUEST.saveFile');
                    });
                });

                var setStatusBarText = function () {
                    require(['webida-lib/plugins/workbench/plugin'], function (workbench) {
                        workbench.__editor = editorContext;
                        var cursor = editorContext.getCursor();
                        workbench.setContext([file.path], {cursor: (cursor.row + 1) + ':' + (cursor.col + 1)});
                    });
                };
                editorContext.addCursorListener(setStatusBarText);
                editorContext.addFocusListener(setStatusBarText);
                editorContext.addCursorListener(function (editorContext) {
                    that.pushCursorLocation(editorContext.file, editorContext.getCursor());
                });
                editorContext.addExtraKeys({
                    'Ctrl-Alt-Left': function () {
                        that.moveBack();
                    },
                    'Ctrl-Alt-Right': function () {
                        that.moveForth();
                    }
                });
            }
        },

        show: function (file) {
            logger.info('show('+file.name+')');
            var editorContext = editorContexts[file.__elemId];
            if (editorContext && editorContext.editor) {
                editorContext.editor.refresh();
				//console.info('editorContext.editor = ',editorContext.editor);
            }
        },

        hide: function (/*file*/) { },

        destroy: function (file) {
            // console.log('destroy', file.name);
            var editorContext = editorContexts[file.__elemId];
            if (editorContext) {
                unsetPreferences(editorContext);
                editorContext.destroy();
                delete editorContexts[file.__elemId];
            }
            delete file.__elemId;
        },

        getValue: function (file) {
            var editorContext = editorContexts[file.__elemId];
            if (editorContext) {
                return editorContext.getValue();
            } else {
                return undefined;
            }
        },

        addChangeListener: function (file, callback) {
            var editorContext = editorContexts[file.__elemId];
            if (editorContext) {
                editorContext._changeCallback = callback;
            }
        },

        focus: function (file) {
            var editorContext = editorContexts[file.__elemId];
            if (editorContext && editorContext.editor) {
                editorContext.editor.focus();
            }
        },

        pushCursorLocation: function (file, cursor, forced) {
            var filepath = (typeof file === 'string') ? file : file.path;
            var thisLocation = {
                filepath: filepath,
                cursor: cursor,
                timestamp: new Date().getTime(),
                forced: forced
            };

            function compareLocations(cursor1, cursor2, colspan, rowspan, timespan) {
                if (cursor1.filepath === cursor2.filepath) {
                    if (((!colspan || (Math.abs(cursor1.cursor.col - cursor2.cursor.col) < colspan)) &&
                        (!rowspan || (Math.abs(cursor1.cursor.row - cursor2.cursor.row) < rowspan))) ||
                        (!timespan || (Math.abs(cursor1.timestamp - cursor2.timestamp) < timespan))) {
                        return true;
                    }
                    return false;
                } else {
                    return false;
                }
            }
            function similarLocations(cursor1, cursor2) {
                return compareLocations(cursor1, cursor2, 5, 5, 3000);
            }
            function identicalLocations(cursor1, cursor2) {
                return compareLocations(cursor1, cursor2, 1, 1, false);
            }
            if (cursorStacks.back.length > 0) {
                var latest = cursorStacks.back.pop();
                if (((forced || latest.forced) && !identicalLocations(thisLocation, latest)) ||
                    (!similarLocations(thisLocation, latest))) {
                    cursorStacks.back.push(latest);
                    cursorStacks.forth = [];
                }
            }
            cursorStacks.back.push(thisLocation);
            return thisLocation;
        },

        moveBack: function () {
            if (cursorStacks.back.length > 1) {
                var popped = cursorStacks.back.pop();

                if (popped) {
                    cursorStacks.forth.push(popped);
                }
                this.moveTo(cursorStacks.back[cursorStacks.back.length - 1]);
            }
        },
        moveForth: function () {
            var popped = cursorStacks.forth.pop();

            if (popped) {
                cursorStacks.back.push(popped);
                this.moveTo(popped);
            }
        },
        moveTo: function (location) {
            editors.openFile(location.filepath, {show: true}, function (file) {
                if (file.__elemId && editorContexts[file.__elemId]) {
                    if (location.start && location.end) {
                        editorContexts[file.__elemId].setSelection(location.start, location.end);
                    } else {
                        editorContexts[file.__elemId].setCursor(location.cursor);
                    }
                    editorContexts[file.__elemId].addDeferredAction(function (editorContext) {
                        if (editorContext.editor) {
                            editorContext.editor.focus();
                        }
                    });
                }
            });
        },

        getLastSavedFoldingStatus: function () {
            return lastSavedFoldingStatus;
        },

        markClean: function (file) {
            var editorContext = editorContexts[file.__elemId];
            if (editorContext) {
                editorContext.markClean();
            }
        },

        isClean: function (file) {
            var editorContext = editorContexts[file.__elemId];
            if (editorContext) {
                return editorContext.isClean();
            } else {
                return true;
            }
        },

        setMode: setMode
    });

	return CodeEditor;
});
