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
 * TextEditorPart implementation of EditorPart
 * This should be an ancestor of all text based editors.
 *
 * @constructor
 * @see EditorPart
 * @since: 2015.06.11
 * @author: hw.shim
 *
 * file.__elemId removed
 */

// @formatter:off
define([
    'dojo/topic',
    'external/lodash/lodash.min',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/plugins/editors/plugin',
    'webida-lib/plugins/editors/EditorPreference',
    'webida-lib/plugins/workbench/ui/Part',
    'webida-lib/plugins/workbench/ui/EditorPart',
    './preferences/preference-config',
    './TextEditorViewer',
    'dojo/domReady!'
], function(
    topic,
    _,
    genetic,
    Logger,
    editors,
    EditorPreference,
    Part,
    EditorPart,
    preferenceConfig,
    TextEditorViewer
) {
    'use strict';
// @formatter:on

    //TODO : this.viewer -> this.getViewer()
    //See File.prototype.isModified = function () {
    //TODO : this.file -> this.getFile()

    var logger = new Logger();
    logger.off();

    var preferenceIds = ['texteditor', 'texteditor.lines', 'texteditor.key-map', 'texteditor.show-hide'];

    function TextEditorPart(file) {
        logger.info('new TextEditorPart(' + file + ')');
        EditorPart.apply(this, arguments);
        this.setFile(file);
        this.fileOpenedHandle = null;
        this.fileSavedHandle = null;
        this.preferences = null;
        this.foldingStatus = null;
    }


    genetic.inherits(TextEditorPart, EditorPart, {

        initialize: function() {
            logger.info('initialize()');
            this.initializeContext();
            this.initializeListeners();
            this.initializePreferences();
        },

        initializeContext: function() {
            logger.info('initializeContext()');
            var context = this.getViewer();
            var parent = this.getParentElement();
            context.setValue(this.file.getContents());
            context.clearHistory();
            context.markClean();
            context.setSize(parent.offsetWidth, parent.offsetHeight);
            context.setMatchBrackets(true);

            /* Invalid direct css manipulation. This causes ODP-423 bug.
             (ODP-423) Ocassional no contents display in newly created TextEditor

             viewer.addDeferredAction(function (editor) {
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
            var that = this;
            var setStatusBarText = function() {
                var workbench = require('webida-lib/plugins/workbench/plugin');
                var file = that.file;
                var viewer = that.getViewer();
                var cursor = viewer.getCursor();
                workbench.__editor = viewer;
                //TODO : refactor
                workbench.setContext([file.path], {
                    cursor: (cursor.row + 1) + ':' + (cursor.col + 1)
                });
            };
            context.addCursorListener(setStatusBarText);
            context.addFocusListener(setStatusBarText);
            context.addCursorListener(function(viewer) {
                TextEditorPart.pushCursorLocation(context.file, context.getCursor());
            });
            context.addExtraKeys({
                'Ctrl-Alt-Left': function() {
                    TextEditorPart.moveBack();
                },
                'Ctrl-Alt-Right': function() {
                    TextEditorPart.moveForth();
                }
            });
        },

        /**
         * To initialize listeners you want
         * override this
         */
        initializeListeners: function() {
            logger.info('initializeListeners()');
            var that = this;
            //subscribe topic

            this.fileOpenedHandle = topic.subscribe('file.opened', function(file, content) {
                if (that.file === file) {
                    that.viewer.setValue(content);
                }
            });

            this.fileSavedHandle = topic.subscribe('file.saved', function(file) {
                that.foldingStatus = that.getViewer().getFoldings();
            });
            this.viewer.addEventListener('save', function() {
                require(['dojo/topic'], function(topic) {
                    topic.publish('#REQUEST.saveFile');
                });
            });
        },

        initializePreferences: function() {
            logger.info('initializePreferences()');
            if (this.viewer && this.file) {

                //preferences
                this.preferences = new EditorPreference(preferenceIds, this.viewer);
                this.preferences.setFields(this.getPreferences());
            }
        },

        /**
         * To use the Preferences you want, override this method
         * and return Preferences you want use
         *
         * @returns preferenceConfig for TextEditor
         */
        getPreferences: function() {
            return preferenceConfig;
        },

        /**
         * To use the Context you want, override this method
         * and return Class you want use
         *
         * @returns TextEditorViewer
         */
        getViewerClass: function() {
            return TextEditorViewer;
        },

        /**
         * If viewer does not exist when calling getViewer(),
         * this method is called to create new viewer.
         *
         * @see Part.js getViewer()
         * @override
         */
        createViewer: function() {
            //TODO : parent, callback in case of none
            var parent = this.getParentElement();
            var callback = this.createCallback;
            var ViewerClass = this.getViewerClass();
            var viewer = new (ViewerClass)(parent, this.file, function(file, viewer) {
                viewer.addChangeListener(function(viewer, change) {
                    if (viewer._changeCallback) {
                        viewer._changeCallback(file, change);
                    }
                });
                if (callback) {
                    _.defer(function() {
                        callback(file, viewer);
                    });
                }
            });
            this.setViewer(viewer);
        },

        getFoldingStatus: function() {
            return this.foldingStatus;
        },

        create: function(parent, callback) {
            logger.info('create(' + parent.tagName + ', callback)');
            if (this.getFlag(Part.CREATED) === true) {
                return;
            }
            this.setParentElement(parent);
            this.createCallback = callback;
            this.file.elem = parent;
            //TODO : remove
            this.initialize();
            this.setFlag(Part.CREATED, true);
        },

        destroy: function() {
            logger.info('destroy()');
            if (this.viewer) {
                this.viewer.destroyAdapter();
                this.viewer = null;
            } else {
                logger.info('this.viewer not found');
                logger.trace();
            }
            //unset preferences
            if (this.preferences) {
                this.preferences.unsetFields();
            }
            //unsubscribe topic
            if (this.fileOpenedHandle !== null) {
                logger.info('this.fileOpenedHandle.remove()');
                this.fileOpenedHandle.remove();
            }
            if (this.fileSavedHandle !== null) {
                this.fileSavedHandle.remove();
            }
            //clear state
            this.setFlag(Part.CREATED, false);
        },

        show: function() {
            logger.info('show()');
            this.getViewer().refresh();
            this.getViewer().checkSizeChange();
        },

        hide: function() {
            logger.info('hide()');
        },

        getValue: function() {
            if (this.viewer) {
                return this.viewer.getValue();
                //TODO : getViewer()
            } else {
                logger.info('this.viewer not found');
                logger.trace();
            }
        },

        addChangeListener: function(callback) {
            this.viewer._changeCallback = callback;
        },

        focus: function() {
            if (this.viewer) {
                this.viewer.focus();
                //TODO : getViewer()
            } else {
                logger.info('this.viewer not found');
                logger.trace();
            }
        },

        markClean: function() {
            this.getViewer().markClean();
        },

        isClean: function() {
            if (this.viewer) {
                return this.viewer.isClean();
                //TODO : getViewer()
            } else {
                logger.info('this.viewer not found');
                logger.trace();
                return true;
            }
        },

        getContextMenuItems: function(opened, items, menuItems, deferred) {
            var viewer = this.getViewer();
            if (viewer) {
                viewer.getContextMenuItems(opened, items, menuItems, deferred);
            }
        }
    });

    //Static functions

    var cursorStacks = {
        back: [],
        forth: []
    };

    TextEditorPart.moveTo = function(location) {
        topic.publish('#REQUEST.openFile', location.filepath, {
            show: true
        }, function(file) {
            if (editors.getPart(file) === null) {
                return;
            }
            var part = editors.getPart(file);
            var viewer = part.getViewer();
            if (location.start && location.end) {
                viewer.setSelection(location.start, location.end);
            } else {
                viewer.setCursor(location.cursor);
            }

            viewer.addDeferredAction(function(viewer) {
                viewer.editor.focus();
            });
        });
    };

    TextEditorPart.moveBack = function() {
        if (cursorStacks.back.length > 1) {
            var popped = cursorStacks.back.pop();
            if (popped) {
                cursorStacks.forth.push(popped);
            }
            TextEditorPart.moveTo(cursorStacks.back[cursorStacks.back.length - 1]);
        }
    };

    TextEditorPart.moveForth = function() {
        var popped = cursorStacks.forth.pop();
        if (popped) {
            cursorStacks.back.push(popped);
            TextEditorPart.moveTo(popped);
        }
    };

    TextEditorPart.pushCursorLocation = function(file, cursor, forced) {
        logger.info('pushCursorLocation(file, ' + cursor + ', forced)');
        var filepath = ( typeof file === 'string') ? file : file.path;
        var thisLocation = {
            filepath: filepath,
            cursor: cursor,
            timestamp: new Date().getTime(),
            forced: forced
        };

        function compareLocations(cursor1, cursor2, colspan, rowspan, timespan) {
            if (cursor1.filepath === cursor2.filepath) {
                if (((!colspan || (Math.abs(cursor1.cursor.col - cursor2.cursor.col) < colspan)) && (!rowspan || (Math.abs(cursor1.cursor.row - cursor2.cursor.row) < rowspan))) || (!timespan || (Math.abs(cursor1.timestamp - cursor2.timestamp) < timespan))) {
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
            if (((forced || latest.forced) && !identicalLocations(thisLocation, latest)) || (!similarLocations(thisLocation, latest))) {
                cursorStacks.back.push(latest);
                cursorStacks.forth = [];
            }
        }
        cursorStacks.back.push(thisLocation);
        return thisLocation;
    };

    return TextEditorPart;
});
