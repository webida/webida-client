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
    'dojo/topic',
    'dijit/layout/ContentPane',
    'external/lodash/lodash.min',
    'webida-lib/util/genetic', 
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/loadCSSList',
    'webida-lib/plugins/editors/plugin',
    'webida-lib/plugins/workbench/ui/EditorPart',
    'webida-lib/plugins/workbench/ui/MultiViewerEditorPart',
    'webida-lib/plugins/workbench/ui/Viewer',
    'webida-lib/plugins/workbench/ui/PartModel',
    'plugins/webida.editor.code-editor/CodeEditorViewer',
    'plugins/webida.editor.text-editor/Document',
    'plugins/webida.editor.text-editor/TextEditorPart',
    './FormEditorViewer',
    'dojo/domReady!'
], function(
    topic,
    ContentPane,
    _,
    genetic, 
    Logger,
    loadCSSList,
    editors,
    EditorPart, 
    MultiViewerEditorPart,
    Viewer,
    PartModel,
    CodeEditorViewer,
    Document,
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

        var that = this;
        this.on(MultiViewerEditorPart.TAB_SELECT, function(viewer) {
            //To implment context menu
            //TODO : this strange code will be removed before webida-client 1.5.0
            //This is due to file.pendingCreator() of editors plugin.
            //file.pendingCreator() will be removed sooner or later.
            that.getFile().viewer = viewer;
        });

        //To implment context menu
        //TODO : this strange code will be removed before webida-client 1.5.0
        setTimeout(function() {
            that.getFile().viewer = that.getActiveViewer();
        }, 200);
    }


    genetic.inherits(MultiPageExampleEditorPart, MultiViewerEditorPart, {

        getCodeViewer: function() {
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
            var container = viewer.getParentNode();
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

            viewer.addEventListener('save', function () {
                topic.publish('#REQUEST.saveFile');                
            });

            viewer.setMode(this.file.extension);
            viewer.setTheme('webida');
        },

        getFormViewer: function() {
            var viewer = new FormEditorViewer();
            return viewer;
        },

        initFormViewer: function() {
            logger.info('initFormViewer()');
            var that = this;
            var formViewer = this.getViewerById('FormEditor');
            formViewer.on(Viewer.CONTENT_CHANGE, function(content) {
                var doc = that.getModel();
                if (content !== doc.getText()) {
                    doc.update(content, formViewer);
                }
            });
        },

        /**
         * @param {Document} doc
         * @param {Viewer} sender
         */
        codeListener: function(doc, sender) {
            logger.info('codeListener(doc, ' + sender + ')');
            if (sender === this.getViewerById('FormEditor')) {
                this.getViewerById('CodeEditor').refresh();
            }
        },

        /**
         * @param {Document} doc
         * @param {Viewer} sender
         */
        formListener: function(doc, sender) {
            logger.info('formListener(doc, ' + sender + ')');
            if (sender === this.getViewerById('CodeEditor')) {
                this.getViewerById('FormEditor').refresh();
            }
        },

        /**
         * @return {DataSource}
         */
        _getDataSource: function() {
            //TODO : this.getContainer().getDataSource()
            var workbench = require('webida-lib/plugins/workbench/plugin');
            var dsRegistry = workbench.getDataSourceRegistry();
            var dataSource = dsRegistry.getDataSourceById(this.file.path);
            return dataSource;
        },

        /**
         * Create EditorViewers
         * @override
         */
        createViewers: function() {

            var that = this;

            var dataSource = this._getDataSource();
            dataSource.getContents(function(contents) {

                //1. Create Model from DataSource
                var doc = new Document(contents);
                that.setModel(doc);

                //2. formViewer
                var formViewer = that.getFormViewer();
                that.addViewer('FormEditor', 'Form Editor', formViewer, 0, function(parentNode) {
                    formViewer.createAdapter(parentNode);
                    that.initFormViewer();
                    formViewer.setContents(doc);
                });

                //3. codeViewer
                var codeViewer = that.getCodeViewer();
                that.addViewer('CodeEditor', 'Code Editor', codeViewer, 1, function(parentNode) {
                    codeViewer.setParentNode(parentNode);
                    that.initCodeEditor();
                    codeViewer.setContents(doc);
                });

                //4. Listen to model
                doc.on(PartModel.CONTENTS_CHANGE, function(doc, sender) {
                    //TODO getFile() will be removed in webida 1.5.0
                    //Temp Code
                    var file = dataSource.getPersistence();
                    editors.refreshTabTitle(that.getFile());
                    topic.publish('file.content.changed', file.getPath(), file.getContents());
                });

                //5. For the concurrent editing, listen to the model
                // Note that, when user select the tab,
                // the tabContainer make the new viewer as a active viewer.
                // Then the active viewer will be refreshed automatically.
                /*
                 doc.on(PartModel.CONTENTS_CHANGE, that.codeListener.bind(that));
                 doc.on(PartModel.CONTENTS_CHANGE, that.formListener.bind(that));
                 */
            });
        },

        /**
         * @override
         */
        setActiveViewer: function(viewer) {
            MultiViewerEditorPart.prototype.setActiveViewer.call(this, viewer);
            //TODO refactor followings
            //TODO do with editors.currentViewer
        },

        destroy: function() {
            MultiViewerEditorPart.prototype.destroy.call(this);
            this.getViewerById('CodeEditor').destroyAdapter();
        },

        addChangeListener: function(callback) {
            logger.info('addChangeListener(' + callback + ')');
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
            if (this.getModel()) {
                var doc = this.getModel();
                var dataSource = this._getDataSource();
                var file = dataSource.getPersistence();
                if (doc.getText() === file.getContents()) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        },

        /**
         * @deprecated
         */
        getValue: function() {
            if (this.getModel()) {
                return this.getModel().getText();
            }
        },

        markClean: function() {
            var doc = this.getModel();
            var dataSource = this._getDataSource();
            var codeViewer = this.getViewerById('CodeEditor');
            if (doc && dataSource) {
                var file = dataSource.getPersistence();
                file.setContents(doc.getText());
            }
            if (codeViewer) {
                codeViewer.markClean();
            }

        }
    });

    return MultiPageExampleEditorPart;
});
