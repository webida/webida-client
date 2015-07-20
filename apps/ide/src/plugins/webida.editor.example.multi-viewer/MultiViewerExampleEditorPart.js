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
    'webida-lib/plugins/workbench/ui/EditorPart',
    'webida-lib/plugins/workbench/ui/MultiViewerEditorPart',
    'plugins/webida.editor.code-editor/CodeEditorViewer',
    'dojo/domReady!'
], function(
    ContentPane,
    genetic, 
    Logger,
    loadCSSList,
    EditorPart, 
    MultiViewerEditorPart,
    CodeEditorViewer
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

        /**
         * Create EditorViewers
         * @override
         */
        createViewers: function() {

			//1. 1st context
            var childPane = new ContentPane({
                title: 'CodeEditor'
            });
            childPane.startup();
            var callback = this.createCallback;
            var context = new CodeEditorViewer(childPane.domNode, this.file, function(file, context) {
                context.addChangeListener(function(context, change) {
                    if (context._changeCallback) {
                        context._changeCallback(file, change);
                    }
                });
                if (callback) {
                    _.defer(function() {
                        callback(file, context);
                    });
                }
            });
            this.tabContainer.addChild(childPane);
			context.setValue(this.file.getContents());

            //2. 2nd context
            var childPane = new ContentPane({
                title: 'FormEditor'
            });
            childPane.startup();
            this.tabContainer.addChild(childPane);
            
            //this.addViewer('CodeEditor', context, 0);
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

