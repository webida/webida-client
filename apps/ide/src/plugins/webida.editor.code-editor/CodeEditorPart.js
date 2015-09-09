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
 * CodeEditorPart implementation of EditorPart
 * This should be an ancestor of all programming language based editors.
 *
 * @constructor
 * @see TextEditorPart, EditorPart
 * @since: 2015.06.11
 * @author: hw.shim
 *
 */

// @formatter:off
define([
    'webida-lib/util/genetic',
    'external/lodash/lodash.min',
    'webida-lib/plugins/workbench/ui/EditorPart',
    'plugins/webida.editor.text-editor/TextEditorPart',
    'webida-lib/plugins/workbench/preference-system/store',
    'webida-lib/plugins/editors/EditorPreference',
    './preferences/preference-config',
    './CodeEditorContextMenu',
    './CodeEditorViewer',
    './configloader',
    'dojo/topic',
    'webida-lib/util/logger/logger-client',
    'dojo/domReady!'
], function(
    genetic,
    _,
    EditorPart,
    TextEditorPart,
    store,
    EditorPreference,
    preferenceConfig,
    CodeEditorContextMenu,
    CodeEditorViewer,
    configloader,
    topic,
    Logger
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    logger.off();

    function CodeEditorPart(container) {
        logger.info('new CodeEditorPart(' + container + ')');
        //super constructor
        TextEditorPart.apply(this, arguments);
    }


    genetic.inherits(CodeEditorPart, TextEditorPart, {

        /**
         * Initialize CodeEditorPart
         * @override
         */
        initialize: function() {
            logger.info('initialize()');
            TextEditorPart.prototype.initialize.call(this);
        },

        initializePreferences: function() {
            logger.info('initializePreferences()');
            TextEditorPart.prototype.initializePreferences.call(this);
            var viewer = this.getViewer();
            var file = this.file;
            //viewer.addDeferredAction(function (viewer) {
            //   viewer.editor.setOption('overviewRuler', false);
            //});
            if (store.getValue('webida.editor.text-editor:jshintrc') !== false) {
                configloader.jshintrc(viewer, file);
            }
        },

        /**
         * Initialize viewer
         * @override
         */
        initializeViewer: function() {
            logger.info('initializeViewer()');
            TextEditorPart.prototype.initializeViewer.call(this);
            var viewer = this.getViewer();
            if (viewer && this.file) {
                var mode = this.file.name.split('.').pop().toLowerCase();
                this.setMode(mode);
            }
        },

        /**
         * @returns CodeEditorViewer
         * @override
         */
        getViewerClass: function() {
            return CodeEditorViewer;
        },

        /**
         * @returns preferenceConfig for CodeEditor
         * @override
         */
        getPreferences: function() {
            return preferenceConfig;
        },

        setMode: function(mode) {
            var viewer = this.getViewer();
            if (!viewer) {
                return;
            }
            viewer.setMode(mode);
            switch (mode) {
                case 'json':
                    viewer.setLinter('json', true);
                    viewer.setHinters('json', ['word']);
                    break;
                case 'js':
                    viewer.setLinter('js', false);
                    viewer.setHinters('javascript', ['javascript']);
                    break;
                case 'css':
                    viewer.setLinter('css', true);
                    viewer.setHinters('css', ['css', 'cssSmart']);
                    break;
                case 'html':
                    viewer.setLinter('html', true);
                    viewer.setHinters('html', ['html', 'htmlLink', 'htmlSmart']);
                    viewer.setHinters('htmlmixed', ['html', 'htmlLink', 'htmlSmart']);
                    viewer.setHinters('css', ['css', 'cssSmart']);
                    break;
                default:
                    viewer.setHinters('word', ['word']);
                    break;
            }
        },

        getContextMenuClass: function() {
            return CodeEditorContextMenu;
        },
    });

    return CodeEditorPart;
});
