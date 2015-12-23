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
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/plugins/workbench/ui/EditorModelManager',
    'webida-lib/plugins/workbench/ui/EditorPart',
    'webida-lib/plugins/workbench/ui/Part',
    'webida-lib/plugins/workbench/ui/PartContainer',
    'webida-lib/plugins/workbench/ui/PartModel',
    'webida-lib/plugins/workbench/ui/partModelProvider',
    'webida-lib/plugins/workbench/ui/PartRegistry',
    './configloader',
    './Document',
    './DocumentCommand',
    './preferences/preference-watch-config',
    './TextEditorContextMenu',
    './TextEditorMenu',
    './TextEditorViewer',
    'dojo/domReady!'
], function (
    topic,
    _,
    genetic,
    Logger,
    editors,
    EditorPreference,
    workbench,
    EditorModelManager,
    EditorPart,
    Part,
    PartContainer,
    PartModel,
    partModelProvider,
    PartRegistry,
    configloader,
    Document,
    DocumentCommand,
    preferenceConfig,
    TextEditorContextMenu,
    TextEditorMenu,
    TextEditorViewer
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     * @typedef {Object} Document
     */

    var logger = new Logger();
    //logger.off();

    //To support synchronizeWidgetModel
    //TODO : refactor
    var recentViewers = new Map();
    var partRegistry = workbench.getCurrentPage().getPartRegistry();
    partRegistry.on(PartRegistry.PART_UNREGISTERED, function (part) {
        if (partModelProvider.isModelUsed(part.getModel()) === false) {
            recentViewers['delete'](part.getDataSource());
        }
    });

    function TextEditorPart(container) {
        logger.info('new TextEditorPart(' + container + ')');
        EditorPart.apply(this, arguments);
        //var that = this;
        var dataSource = container.getDataSource();
        //TODO remove all dependency to file
        this.file = dataSource.getPersistence();
        this.preferences = null;
        this.foldingStatus = null;
        this.on(Part.CONTENTS_READY, function (part) {
            var viewer = part.getViewer();
            var ds = part.getDataSource();
            var recentViewer = recentViewers.get(ds);
            if (recentViewer) {
                viewer.synchronizeWidgetModel(recentViewer);
            }
            recentViewers.set(ds, viewer);
        });
    }


    genetic.inherits(TextEditorPart, EditorPart, {

        initialize: function () {
            logger.info('initialize()');
            this.initializeViewer();
            this.initializeListeners();
            this.initializePreferences();
        },

        initializeViewer: function () {
            logger.info('initializeViewer()');
            var that = this;
            var viewer = this.getViewer();
            var parent = this.getParentElement();
            viewer.clearHistory();
            viewer.markClean();
            viewer.setSize(parent.offsetWidth, parent.offsetHeight);
            viewer.setMatchBrackets(true);
            var setStatusBarText = function () {
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
            viewer.addCursorListener(setStatusBarText);
            viewer.addFocusListener(setStatusBarText);
            viewer.addCursorListener(function (viewer) {
                TextEditorPart.pushCursorLocation(viewer.file, viewer.getCursor());
            });
            viewer.addExtraKeys({
                'Ctrl-Alt-Left': function () {
                    TextEditorPart.moveBack();
                },
                'Ctrl-Alt-Right': function () {
                    TextEditorPart.moveForth();
                }
            });
        },

        /**
         * To initialize listeners you want
         * override this
         */
        initializeListeners: function () {
            logger.info('initializeListeners()');
            var that = this;
            //TODO : remove listener
            this.on(EditorPart.AFTER_SAVE, function () {
                that.foldingStatus = that.getViewer().getFoldings();
            });
        },

        initializePreferences: function () {
            logger.info('initializePreferences()');
            //preferences
            this.preferences = new EditorPreference(this.getPreferencesConfig());
        },

        /**
         * To use the Preferences you want, override this method
         * and return Preferences you want use
         *
         * @returns preferenceConfig for TextEditor
         */
        getPreferencesConfig: function () {
            return preferenceConfig.getConfig(this);
        },

        /**
         * To use the Context you want, override this method
         * and return Class you want use
         *
         * @returns TextEditorViewer
         */
        getViewerClass: function () {
            return TextEditorViewer;
        },

        /**
         * TODO : move to CodeEditorPart
         */
        getFoldingStatus: function () {
            return this.foldingStatus;
        },

        /**
         * @param {HTMLElement} parent
         * @return {Viewer}
         */
        createViewer: function (parentNode) {
            logger.info('%c createViewer(' + parentNode.tagName + ')', 'color:green');
            //TODO : remove
            this.setParentElement(parentNode);
            //var that = this;

            //Viewer
            var ViewerClass = this.getViewerClass();
            var viewer = new (ViewerClass)(parentNode, this.file);
            this.setViewer(viewer);
            this.initialize();
            return viewer;
        },

        /**
         * @return {Document}
         */
        createModel: function () {
            logger.info('%c createModel()', 'color:green');
            this.setModelManager(new EditorModelManager(this.getDataSource()));
            var model = this.getModelManager().getSynchronized(Document);
            //this.getModelManager().SynchroWith(SvgModel);
            this.setModel(model);
            return model;
        },

        onDestroy: function () {
            logger.info('onDestroy()');
            EditorPart.prototype.onDestroy.apply(this);
            this.getViewer().destroyWidget();
            this.setViewer(null);
            //unset preferences
            if (this.preferences) {
                this.preferences.destroy();
            }
        },

        focus: function () {
            logger.info('focus()');
            this.getViewer().focus();
        },

        /**
         * @return {DocumentCommand}
         */
        getCommand: function (request) {
            return new DocumentCommand(this.getModel(), request);
        },

        /**
         * Returns PartMenu that consists of menu-items for this Part
         * @see Part
         * @override
         * @return {PartMenu}
         */
        _getMenuClass: function () {
            return TextEditorMenu;
        },

        /**
         * Returns PartContextMenu that consists of menu-items for this Part
         * @return {TextEditorContextMenu}
         */
        _getContextMenuClass: function () {
            return TextEditorContextMenu;
        },

        getContextMenuItems: function (allItems) {
            logger.info('getContextMenuItems(' + allItems + ')');
            var contextMenu = new (this._getContextMenuClass())(allItems, this);
            return contextMenu.getPromiseForAvailableItems();
        },

        save: function (callback) {
            logger.info('save(' + typeof callback + ')');
            var that = this;
            this._beforeSave();
            //TODO Refactor : find more neat way without setTimeout
            setTimeout(function () {
                EditorPart.prototype.save.call(that, callback);
            });
        },

        _beforeSave: function () {
            logger.info('_beforeSave');
            var viewer = this.getViewer();
            var doc = this.getModel();
            var text = doc.getContents();
            if (typeof text === 'undefined') {
                return;
            }

            if (viewer.trimTrailingWhitespaces && text.match(/( |\t)+$/m)) {
                text = text.replace(/( |\t)+$/mg, '');
            }

            if (viewer.insertFinalNewLine && text.match(/.$/)) {
                text = text + '\n';
            }

            if (viewer.retabIndentations) {
                var getSpaces = function (n) {
                    var spaces = ['', ' ', '  ', '   ', '    '];
                    if (spaces[n] === undefined) {
                        return (spaces[n] = (n ? ' ' + getSpaces(n - 1) : ''));
                    } else {
                        return spaces[n];
                    }
                };
                var unit = viewer.options.indentUnit, re = /^(( )*)\t/m, m;
                while ((m = text.match(re))) {
                    text = text.replace(re, '$1' + getSpaces(unit - (m[0].length - 1) % unit));
                }
            }

            if (text !== doc.getContents()) {
                var cursor = viewer.getCursor();
                var scrollInfo = viewer.getScrollInfo();
                viewer.refresh(text);
                //TODO Refactor : use execCommand();
                viewer.setCursor(cursor);
                viewer.scrollToScrollInfo(scrollInfo);
            }
        },

        /**
         * Set view options from .editorconfig file
         *
         * @see preference-watch-config, EditorPreference
         * @param {boolean} value - whether use .editorconfig or not
         */
        setEditorConfig: function (value) {
            var viewer = this.getViewer();
            function _applyEditorConfig(config) {
                // apply config to instance
                viewer.setIndentWithTabs(config.indentWithTabs);
                viewer.setIndentUnit(config.indentUnit);
                viewer.setTabSize(config.tabSize);
                viewer.setTrimTrailingWhitespaces(config.trimTrailingWhitespaces);
                viewer.setInsertFinalNewLine(config.insertFinalNewLine);
            }
            if (value) {
                configloader.editorconfig(this.file, function (configs) {
                    _applyEditorConfig(configs);
                });
            } else {
                var values = this.preferences.getFields('editor.lines');
                _applyEditorConfig({
                    indentWithTabs: values['webida.editor.text-editor:indentWithTabs'],
                    indentUnit: values['webida.editor.text-editor:indentunit'],
                    tabSize: values['webida.editor.text-editor:tabsize'],
                    trimTrailingWhitespaces: values['webida.editor.text-editor:trimTrailing'],
                    insertFinalNewLine: values['webida.editor.text-editor:insertFinal']
                });
            }
        }
    });

    //Static functions

    var cursorStacks = {
        back: [],
        forth: []
    };

    TextEditorPart.moveTo = function (location) {
        topic.publish('editor/open', location.filepath, {
            show: true
        }, function (part) {
            var viewer = part.getViewer();
            if (location.start && location.end) {
                viewer.setSelection(location.start, location.end);
            } else {
                viewer.setCursor(location.cursor);
            }

            viewer.addDeferredAction(function (viewer) {
                viewer.editor.focus();
            });
        });
    };

    TextEditorPart.moveBack = function () {
        if (cursorStacks.back.length > 1) {
            var popped = cursorStacks.back.pop();
            if (popped) {
                cursorStacks.forth.push(popped);
            }
            TextEditorPart.moveTo(cursorStacks.back[cursorStacks.back.length - 1]);
        }
    };

    TextEditorPart.moveForth = function () {
        var popped = cursorStacks.forth.pop();
        if (popped) {
            cursorStacks.back.push(popped);
            TextEditorPart.moveTo(popped);
        }
    };

    TextEditorPart.pushCursorLocation = function (file, cursor, forced) {
        logger.info('pushCursorLocation(file, ' + cursor + ', forced)');
        var filepath = (typeof file === 'string') ? file : file.getPath();
        var thisLocation = {
            filepath: filepath,
            cursor: cursor,
            timestamp: new Date().getTime(),
            forced: forced
        };

        function compareLocations(cursor1, cursor2, colspan, rowspan, timespan) {
            if (cursor1.filepath === cursor2.filepath) {
                // @formatter:off
                if (((!colspan || (Math.abs(cursor1.cursor.col - cursor2.cursor.col) < colspan)) && 
                     (!rowspan || (Math.abs(cursor1.cursor.row - cursor2.cursor.row) < rowspan))) ||
                    (!timespan || (Math.abs(cursor1.timestamp - cursor2.timestamp) < timespan))) {
                    return true;
                }
                // @formatter:on
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
            // @formatter:off
            if (((forced || latest.forced) && !identicalLocations(thisLocation, latest)) ||
                (!similarLocations(thisLocation, latest))) {
                cursorStacks.back.push(latest);
                cursorStacks.forth = [];
            }
            // @formatter:on
        }
        cursorStacks.back.push(thisLocation);
        return thisLocation;
    };

    return TextEditorPart;
});
