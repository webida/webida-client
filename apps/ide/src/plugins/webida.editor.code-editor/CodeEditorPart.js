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
    'webida-lib/plugins/editors/EditorPreference',
    './preferences/preference-watch-config',
    './CodeEditorContextMenu',
    './CodeEditorMenu',
    './CodeEditorViewer',
    './configloader',
    'dojo/topic',
    'webida-lib/util/logger/logger-client',
    'dojo/domReady!'
], function (
    genetic,
    _,
    EditorPart,
    TextEditorPart,
    EditorPreference,
    preferenceConfig,
    CodeEditorContextMenu,
    CodeEditorMenu,
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
        initialize: function () {
            logger.info('initialize()');
            TextEditorPart.prototype.initialize.call(this);
        },

        initializePreferences: function () {
            logger.info('initializePreferences()');
            TextEditorPart.prototype.initializePreferences.call(this);
        },

        /**
         * Initialize viewer
         * @override
         */
        initializeViewer: function () {
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
        getViewerClass: function () {
            return CodeEditorViewer;
        },

        /**
         * @returns preferenceConfig for CodeEditor
         * @override
         */
        getPreferencesConfig: function () {
            return preferenceConfig.getConfig(this);
        },

        setMode: function (mode) {
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
                    break;
                case 'css':
                    viewer.setLinter('css', true);
                    break;
                case 'html':
                    viewer.setLinter('html', true);
                    break;
                default:
                    viewer.setHinters('word', ['word']);
                    break;
            }
        },

        getContextMenuClass: function () {
            return CodeEditorContextMenu;
        },

        /**
         * Set linter from jshintrc file
         * @see preference-watch-config, EditorPreference
         * @param {boolean} value - whether use .editorconfig or not
         */
        setJshint: function (value) {
            if (value) {
                var viewer = this.getViewer();
                configloader.jshintrc(this.file, function (option) {
                    viewer.setLinter('js', option);
                });
            } else {
                this.getViewer().setLinter('js', false);
            }
        },

        /**
         * Returns PartMenu that consists of menu-items for this Part
         * @see Part
         * @override
         * @return {PartMenu}
         */
        _getMenuClass: function () {
            return CodeEditorMenu;
        }
    });

    return CodeEditorPart;
});
