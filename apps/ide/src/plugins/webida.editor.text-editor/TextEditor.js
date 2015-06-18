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
 * TextEditor implementation of EditorPart
 * This should be an ancestor of all text based editors. 
 *
 * @constructor
 * @see EditorPart
 * @since: 2015.06.11
 * @author: hw.shim
 * 
 * file.__elemId removed
 */

define([
	'webida-lib/util/gene',
	'other-lib/underscore/lodash.min',
	'webida-lib/plugins/workbench/ui/EditorPart',
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
	EditorPart,
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
    var lastSavedFoldingStatus = {};

    // file events
    function onFileOpened(file, content) {
    	logger.info('onFileOpened('+file+', content)');
    	var part = editors.getPart(file);
    	if(part instanceof EditorPart){
	    	var editorContext = part.getEditorContext();
	        editorContext.setValue(content);
	        editorContext.clearHistory();
	        editorContext.markClean();
	        var mode = file.name.substr(file.name.lastIndexOf('.') + 1).toLowerCase();
	        setMode(editorContext, mode);
    	}
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
        logger.info('onFileSaved('+file+')');
        var part = editors.getPart(file);
        if(part instanceof EditorPart){
	        var editorContext = part.getEditorContext();
            lastSavedFoldingStatus[file.path] = editorContext.getFoldings();
        }
    }

    topic.subscribe('file.opened', onFileOpened);
    topic.subscribe('file.saved', onFileSaved);

    var preferenceFields = {
        'webida.editor.text-editor:cm-theme': ['setTheme', 'webida-dark'],
        'webida.editor.text-editor:invisibles': ['setShowInvisibles'],
        'webida.editor.text-editor:folding': ['setCodeFolding', true],
        'webida.editor.text-editor:activeline': ['setStyleActiveLine', true],
        // 'webida.editor.text-editor:gutterline': ['setHighlightGutterLine', true],
        // 'webida.editor.text-editor:indentguides': ['setDisplayIndentGuides', true],
        'webida.editor.text-editor:highlightselection': ['setHighlightSelection', true],
        'webida.editor.text-editor:wordWrap': ['setLineWrapping', false],
        'webida.editor.text-editor:indentWithTabs' : ['setIndentWithTabs', false],
        'webida.editor.text-editor:indentunit': ['setIndentUnit', 4],
        'webida.editor.text-editor:indentOnPaste' : ['setIndentOnPaste', true],
        'webida.editor.text-editor:tabsize': ['setTabSize', 4],
        'webida.editor.text-editor:trimTrailing': ['setTrimTrailingWhitespaces', false],
        'webida.editor.text-editor:insertFinal': ['setInsertFinalNewLine', false],
        'webida.editor.text-editor:retabIndentations': ['setRetabIndentations', false],
        'webida.editor.text-editor:font': ['setFontFamily', 'Nanum Gothic Coding'],
        'webida.editor.text-editor:fontSize': ['setFontSize', 13],
        'webida.editor.text-editor:keymap': ['setKeymap', 'default'],
        'webida.editor.text-editor:enableSnippet': ['setSnippetEnabled', true],
        'webida.editor.text-editor:lineNumbers': ['setShowLineNumbers', true],

        // content assist
        'webida.editor.text-editor:autoCompletion': ['setAutoCompletion', true],
        'webida.editor.text-editor:autoCompletionDelay': ['setAutoCompletionDelay', 0.3],
        'webida.editor.text-editor:anywordHint': ['setAnywordHint', false]
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

	function TextEditor(file){
		logger.info('new TextEditor('+file+')');
		EditorPart.apply(this, arguments);
		this.file = file;
		this.created = false;
	}

	gene.inherit(TextEditor, EditorPart, {

        create: function (elem, started) {
			logger.info('create('+elem.tagName+', started)');
			if (this.created === true) {
				return;
			}

        	var file = this.file;
        	var content = file.savedValue;
            this.editorContext = new EditorContext(elem, file, function (file, editorContext) {
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
            var editorContext = this.editorContext;
            file.elem = elem;

            editorContext.setSize('100%', '99%');
            
            /* Invalid direct css manipulation. This causes ODP-423 bug. 
             (ODP-423) Ocassional no contents display in newly created TextEditor
               
            editorContext.addDeferredAction(function (editor) {
                console.log("-tmep--------- addDeferredAction wrapper css");
                var wrapper = editor.editor.getWrapperElement();
                $(wrapper).css({
                    height: 'auto',
                    position: 'absolute',
                    left: '0px',
                    right: '0px',
                    top: '0px',
                    bottom: '0px'
                });                   
            });*/

            editorContext.setMode(file.name.substr(file.name.lastIndexOf('.') + 1));
            setPreferences(editorContext);

            onFileOpened(file, content, editorContext);
            
            //editorContext.addDeferredAction(function (editorContext) {
             //   editorContext.editor.setOption('overviewRuler', false);
            //});

            if (store.getValue('webida.editor.text-editor:editorconfig') === true) {
                configloader.editorconfig(editorContext, file);
            }
            if (store.getValue('webida.editor.text-editor:jshintrc') !== false) {
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
                TextEditor.pushCursorLocation(editorContext.file, editorContext.getCursor());
            });
            editorContext.addExtraKeys({
                'Ctrl-Alt-Left': function () {
                    TextEditor.moveBack();
                },
                'Ctrl-Alt-Right': function () {
                    TextEditor.moveForth();
                }
            });

            this.created = true;
        },

        destroy: function () {
            if (this.editorContext) {
                unsetPreferences(this.editorContext);
                this.editorContext.destroy();
                this.created = false;
                delete this.editorContext;
            }else{
				logger.info('this.editorContext not found');
				logger.trace();
			}
        },

        show: function () {
			logger.info('show()');
			logger.trace();
			if (this.editorContext) {
				this.editorContext.refresh();
			}else{
				logger.info('this.editorContext not found');
				logger.trace();
			}
		},

        hide: function () {
        	logger.info('hide()');
        },

        getValue: function () {
        	if(this.editorContext){
        		return this.editorContext.getValue();
        	}else{
				logger.info('this.editorContext not found');
        		logger.trace();
        	}
        },

        addChangeListener: function (callback) {
			this.editorContext._changeCallback = callback;
        },

        focus: function () {
        	if(this.editorContext){
        		this.editorContext.focus();
        	}else{
				logger.info('this.editorContext not found');
        		logger.trace();
        	}
        },

        markClean: function () {
            this.editorContext.markClean();
        },

        isClean: function () {
        	if(this.editorContext){
        		return this.editorContext.isClean();
        	}else{
				logger.info('this.editorContext not found');
        		logger.trace();
        		return true;
        	}
        },

        getLastSavedFoldingStatus: function () {
            return lastSavedFoldingStatus;
        },
        
        toString : function(){
        	//TODO : inherit from Part
        	var res = '<TextEditor>#'+this.partId;
        	if(this.file){
        		res += '(' + this.file.name + ')';
        	}
        	return res;
        },

        setMode: setMode
    });

	//Static functions

	TextEditor.moveTo = function (location) {
        editors.openFile(location.filepath, {show: true}, function (file) {
            if (editors.getPart(file) === null) {
            	return;
            }
            var part = editors.getPart(file);
        	var context = part.editorContext;
            if (location.start && location.end) {
                context.setSelection(location.start, location.end);
            } else {
                context.setCursor(location.cursor);
            }
            context.addDeferredAction(function (editorContext) {
                if (editorContext.editor) {
                    editorContext.editor.focus();
                }
            });
        });
    };

	TextEditor.moveBack = function () {
		if (cursorStacks.back.length > 1) {
			var popped = cursorStacks.back.pop();
			if (popped) {
				cursorStacks.forth.push(popped);
			}
			TextEditor.moveTo(cursorStacks.back[cursorStacks.back.length - 1]);
		}
	};

	TextEditor.moveForth = function () {
		var popped = cursorStacks.forth.pop();
		if (popped) {
			cursorStacks.back.push(popped);
			TextEditor.moveTo(popped);
		}
	};

	TextEditor.pushCursorLocation = function (file, cursor, forced) {
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
    };

	return TextEditor;
});
