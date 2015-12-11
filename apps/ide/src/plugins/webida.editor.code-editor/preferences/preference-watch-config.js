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
 * This is the preference watcher configurations
 * that include what method called with the modified values when preferences are changed.
 *
 * @see EditorPreference, CodeEditorPart
 * @since: 2015.12.10
 * @author: Koong Kyungmi (kyungmi.k@samsung.com)
 */

define([], function () {
    'use strict';

    return {
        /**
         * For EditorPreference of this EditorPart instance, generate configuration to watch the values of preferences
         * that are concerned about.
         * TODO If there are more memory-wise way than this, It's better to change this method.
         *
         * @param {CodeEditorPart} editorPart - This is an EditorPart instance related with this configuration.
         * @returns {object} - Watch configuration per editorPart instance
         */
        getConfig: function (editorPart) {
            var viewer = editorPart.getViewer();
            return {
                editor: {
                    'webida.editor.text-editor:cm-theme': [viewer, 'setTheme'],
                    'webida.editor.text-editor:font': [viewer, 'setFontFamily'],
                    'webida.editor.text-editor:fontSize': [viewer, 'setFontSize'],
                    'webida.editor.text-editor:editorconfig': [editorPart, 'setEditorConfig']
                },
                'editor.show-hide': {
                    'webida.editor.text-editor:invisibles': [viewer, 'setShowInvisibles'],
                    'webida.editor.text-editor:lineNumbers': [viewer, 'setShowLineNumbers']
                },
                'content-assist': {
                    'webida.editor.text-editor:folding': [viewer, 'setCodeFolding'],
                    'webida.editor.text-editor:autoCompletion': [viewer, 'setAutoCompletion'],
                    'webida.editor.text-editor:autoCompletionDelay': [viewer, 'setAutoCompletionDelay'],
                    'webida.editor.text-editor:jshintrc': [editorPart, 'setJshint'],
                    'webida.editor.text-editor:anywordHint': [viewer, 'setAnywordHint'],
                    'webida.editor.text-editor:enableSnippet': [viewer, 'setSnippetEnabled']
                },
                'editor.lines': {
                    'webida.editor.text-editor:trimTrailing': [viewer, 'setTrimTrailingWhitespaces'],
                    'webida.editor.text-editor:insertFinal': [viewer, 'setInsertFinalNewLine'],
                    'webida.editor.text-editor:retabIndentations': [viewer, 'setRetabIndentations'],
                    'webida.editor.text-editor:wordWrap': [viewer, 'setLineWrapping'],
                    'webida.editor.text-editor:tabsize': [viewer, 'setTabSize'],
                    'webida.editor.text-editor:indentunit': [viewer, 'setIndentUnit'],
                    'webida.editor.text-editor:indentWithTabs': [viewer, 'setIndentWithTabs'],
                    'webida.editor.text-editor:activeline': [viewer, 'setStyleActiveLine'],
                    'webida.editor.text-editor:highlightselection': [viewer, 'setHighlightSelection'],
                    'webida.editor.text-editor:indentOnPaste': [viewer, 'setIndentOnPaste']
                },
                'editor.key-map': {
                    'webida.editor.text-editor:keymap': [viewer, 'setKeymap']
                }
            };
        }
    };
});