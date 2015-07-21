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
 *
 * A multi-page editor part is an editor with multiple pages.
 * Each of which may contain different EditorViewer respectively.
 * For example, form editor with source editor.
 *
 * @constructor
 * @see EditorPart
 * @since: 2015.07.09
 * @author: hw.shim
 *
 */

// @formatter:off
define([
    'dijit/layout/ContentPane',
    'webida-lib/util/genetic', 
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/loadCSSList',
    'webida-lib/plugins/editors/Document',
    'webida-lib/plugins/workbench/ui/EditorPart',
    'webida-lib/plugins/workbench/ui/MultiViewerEditorPart',
    'webida-lib/plugins/workbench/ui/ViewerModel',
    'plugins/webida.editor.code-editor/CodeEditorViewer',
    'plugins/webida.editor.text-editor/TextEditorPart',
    './FormEditorViewer',
    'dojo/domReady!'
], function(
    ContentPane,
    genetic, 
    Logger,
    loadCSSList,
    Document,
    EditorPart, 
    MultiViewerEditorPart,
    ViewerModel,
    CodeEditorViewer,
    TextEditorPart,
    FormEditorViewer
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();

    function MultiPageExampleEditorPart(file) {
        logger.info('new MulitiTabEditorPart(' + file + ')');
        MultiViewerEditorPart.apply(this, arguments);
    }


    genetic.inherits(MultiPageExampleEditorPart, MultiViewerEditorPart, {

        getCodeEditor: function() {
            var callback = this.createCallback;
            var viewer = new CodeEditorViewer(null, this.file, function(file, viewer) {
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
            return viewer;
        },

        initCodeEditor: function() {
            var viewer = this.getViewerById('CodeEditor');
            var container = viewer.getContainerElement();
            viewer.setValue(this.file.getContents());
            viewer.clearHistory();
            viewer.markClean();
            viewer.setSize(container.offsetWidth, container.offsetHeight);
            viewer.setMatchBrackets(true);
            var that = this;
            var setStatusBarText = function() {
                var workbench = require('webida-lib/plugins/workbench/plugin');
                var file = that.file;
                var viewer = that.getViewerById('CodeEditor');
                var cursor = viewer.getCursor();
                workbench.__editor = viewer;
                workbench.setContext([file.path], {
                    cursor: (cursor.row + 1) + ':' + (cursor.col + 1)
                });
            };
            viewer.addCursorListener(setStatusBarText);
            viewer.addFocusListener(setStatusBarText);
            viewer.addCursorListener(function(viewer) {
                TextEditorPart.pushCursorLocation(viewer.file, viewer.getCursor());
            });
            viewer.addExtraKeys({
                'Ctrl-Alt-Left': function() {
                    TextEditorPart.moveBack();
                },
                'Ctrl-Alt-Right': function() {
                    TextEditorPart.moveForth();
                }
            });
            viewer.setMode(this.file.extension);
            viewer.setTheme('webida');
        },

        getFormEditor: function() {
            var viewer = new FormEditorViewer();
            return viewer;
        },

        /**
         * @param {Document} doc
         * @param {Viewer} sender
         */
        codeListener: function(doc, sender) {
            if (sender === this.getViewerById('FormEditor')) {
                this.getViewerById('CodeEditor').refresh();
            }
        },

        /**
         * @param {Document} doc
         * @param {Viewer} sender
         */
        formListener: function(doc, sender) {
            if (sender === this.getViewerById('CodeEditor')) {
                this.getViewerById('FormEditor').refresh();
            }
        },

        /**
         * Create EditorViewers
         * @override
         */
        createViewers: function() {

            var that = this;

            //TODO : this.getContainer().getDataSource()
            var workbench = require('webida-lib/plugins/workbench/plugin');
            var dsRegistry = workbench.getDataSourceRegistry();
            var dataSource = dsRegistry.getDataSourceById(this.file.path);
            dataSource.getContents(function(contents) {

                //1. Create Model from DataSource
                var doc = new Document(contents);

                //2. codeEditor
                var codeEditor = that.getCodeEditor();
                that.addViewer('CodeEditor', 'Code Editor', codeEditor, 0);
                that.initCodeEditor();

                //3. formEditor
                var formEditor = that.getFormEditor();
                that.addViewer('FormEditor', 'Form Editor', formEditor, 1);
                formEditor.create();

                //4. set model
                codeEditor.setModel(doc);
                formEditor.setModel(doc);

                //4. Listen to model
                doc.on(ViewerModel.CONTENTS_CHANGE, that.codeListener.bind(that));
                doc.on(ViewerModel.CONTENTS_CHANGE, that.formListener.bind(that));
            });
        },

        destroy: function() {
            MultiViewerEditorPart.prototype.destroy.call(this);
            this.getViewerById('CodeEditor').destroy();
        },

        getValue: function() {
            console.info('this.file.getContents(); = ', this.file.getContents());
            return this.file.getContents();
        },

        addChangeListener: function(callback) {

        },

        show: function() {
            logger.info('show()');
            logger.trace();
        },

        hide: function() {
            logger.info('hide()');
        },

        focus: function() {

        },

        isClean: function() {
            return true;
        }
    });

    return MultiPageExampleEditorPart;
});

