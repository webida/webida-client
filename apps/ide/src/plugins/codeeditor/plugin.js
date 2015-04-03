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
 * TODO: Describe it
 * @class plugins.codeEditor
 * @constructor
 * @module plugins
 * @param {object} fm blabal
 * @param {object} store blabla
 * @param {object} amrkup blabla
 */
define(['other-lib/underscore/lodash.min',
        'webida-lib/plugins/workbench/preference-system/store',	// TODO: issue #12055
        'webida-lib/plugins/editors/plugin',
        './codemirror',
        './configloader',
        'dojo/topic',
        'dojo/domReady!'
], function (_, store, editors, CodeEditor, configloader, topic) {
    'use strict';

    var instances = {};
    var elemIdCounter = 1;
    var lastSavedFoldingStatus = {};

    // file events
    function onFileOpened(file, content) {
        // console.log('file.opened', file.name, file);
        var instance = instances[file.__elemId];
        if (instance === undefined || instance === null) {
            return;
        }

        instance.setValue(content);
        instance.clearHistory();
        instance.markClean();
        var mode = file.name.substr(file.name.lastIndexOf('.') + 1).toLowerCase();
        setMode(instance, mode);
    }

    function setMode(instance, mode) {

        // TODO: clear the current mode before setting a new one.
        // Currently, without this, file is reopened when its extension (mode) is changed
        // instead of resetting its mode. Note that the latter is more desirable.

        instance.setMode(mode);
        switch (mode) {
        case 'json':
            instance.setLinter('json', true);
            instance.setHinters('json', ['word']);
            break;
        case 'js':
            instance.setLinter('js', false);
            instance.setHinters('javascript', ['javascript']);
            break;
        case 'css':
            instance.setLinter('css', true);
            instance.setHinters('css', ['css', 'cssSmart']);
            break;
        case 'html':
            instance.setLinter('html', true);
            instance.setHinters('html', ['html', 'htmlLink', 'htmlSmart']);
            instance.setHinters('htmlmixed', ['html', 'htmlLink', 'htmlSmart']);
            instance.setHinters('css', ['css', 'cssSmart']);
            break;
        default:
            instance.setHinters('word', ['word']);
            break;
        }
    }

    function onFileSaved(file) {
        // console.log('file.saved', file.name);
        var instance = instances[file.__elemId];
        if (instance) {
            lastSavedFoldingStatus[file.path] = instance.getFoldings();	// ??? Why save foldings here?
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
    function applyPreference(instance, fieldId, definition, fieldValue) {
        var setterName = definition[0];
        if (fieldValue === undefined && definition.length > 1) {
            fieldValue = definition[1];
        }
        instance[setterName](fieldValue);
    }
    function setPreferences(instance) {
        store.addLoadedListener(function () {
            instance.setMatchBrackets(true);
            _.each(preferenceFields, function (definition, fieldId) {
                applyPreference(instance, fieldId, definition, store.getValue(fieldId));
            });
            var listener = function (value, fieldId) {
                applyPreference(instance, fieldId, preferenceFields[fieldId], value);
            };
            _.each(preferenceFields, function (_, fieldId) {
                store.addFieldChangeListener(fieldId, listener);
            });
            instance.__preferenceListener = listener;
        });
    }
    function unsetPreferences(instance) {
        if (instance.__preferenceListener !== undefined) {
            _.each(preferenceFields, function (_, fieldId) {
                store.removeFieldChangeListener(fieldId, instance.__preferenceListener);
            });
        }
    }

    var cursorStacks = {
        back: [],
        forth: []
    };

    var self = {
        create: function (file, content, elem, started) {
            // console.log('create', file.name, file.__elemId);
            if (file.__elemId === undefined) {
                var elemId = (elemIdCounter++);
                var instance = new CodeEditor(elem, file, function (file, instance) {
                    instance.addChangeListener(function (instance, change) {
                        if (instance._changeCallback) {
                            instance._changeCallback(file, change);
                        }
                    });
                    if (started) {
                        _.defer(function () {
                            started(file, instance);
                        });
                    }
                });
                instances[elemId] = instance;
                file.elem = elem;
                file.__elemId = elemId;

                //instance.setSize('100%', '100%');
                //instance.setSize('100%', '');
                instance.addDeferredAction(function (editor) {
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
                instance.setMode(file.name.substr(file.name.lastIndexOf('.') + 1));
                setPreferences(instance);

                onFileOpened(file, content);

                if (store.getValue('codeeditor:editorconfig') === true) {
                    configloader.editorconfig(instance, file);
                }
                if (store.getValue('codeeditor:jshintrc') !== false) {
                    configloader.jshintrc(instance, file);
                }

                instance.addEventListener('save', function () {
                    require(['dojo/topic'], function (topic) {
                        topic.publish('#REQUEST.saveFile');
                    });
                });

                var setStatusBarText = function () {
                    require(['webida-lib/plugins/workbench/plugin'], function (workbench) {
                        workbench.__editor = instance;
                        var cursor = instance.getCursor();
                        workbench.setContext([file.path], {cursor: (cursor.row + 1) + ':' + (cursor.col + 1)});
                    });
                };
                instance.addCursorListener(setStatusBarText);
                instance.addFocusListener(setStatusBarText);
                instance.addCursorListener(function (instance) {
                    self.pushCursorLocation(instance.file, instance.getCursor());
                });
                instance.addExtraKeys({
                    'Ctrl-Alt-Left': function () {
                        self.moveBack();
                    },
                    'Ctrl-Alt-Right': function () {
                        self.moveForth();
                    }
                });
            }
        },

        show: function (file) {
            // console.log('show', file.name);
            var instance = instances[file.__elemId];
            if (instance && instance.editor) {
                instance.editor.refresh();
            }
        },

        hide: function (/*file*/) { },

        destroy: function (file) {
            // console.log('destroy', file.name);
            var instance = instances[file.__elemId];
            if (instance) {
                unsetPreferences(instance);
                instance.destroy();
                delete instances[file.__elemId];
            }
            delete file.__elemId;
        },

        getValue: function (file) {
            var instance = instances[file.__elemId];
            if (instance) {
                return instance.getValue();
            } else {
                return undefined;
            }
        },

        addChangeListener: function (file, callback) {
            var instance = instances[file.__elemId];
            if (instance) {
                instance._changeCallback = callback;
            }
        },

        focus: function (file) {
            var instance = instances[file.__elemId];
            if (instance && instance.editor) {
                instance.editor.focus();
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
                self.moveTo(cursorStacks.back[cursorStacks.back.length - 1]);
            }
        },
        moveForth: function () {
            var popped = cursorStacks.forth.pop();

            if (popped) {
                cursorStacks.back.push(popped);
                self.moveTo(popped);
            }
        },
        moveTo: function (location) {
            editors.openFile(location.filepath, {show: true}, function (file) {
                if (file.__elemId && instances[file.__elemId]) {
                    if (location.start && location.end) {
                        instances[file.__elemId].setSelection(location.start, location.end);
                    } else {
                        instances[file.__elemId].setCursor(location.cursor);
                    }
                    instances[file.__elemId].addDeferredAction(function (instance) {
                        if (instance.editor) {
                            instance.editor.focus();
                        }
                    });
                }
            });
        },

        getLastSavedFoldingStatus: function () {
            return lastSavedFoldingStatus;
        },

        markClean: function (file) {
            var instance = instances[file.__elemId];
            if (instance) {
                instance.markClean();
            }
        },

        setMode: setMode
    };
    return self;
});
