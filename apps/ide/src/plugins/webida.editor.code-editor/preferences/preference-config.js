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
* This is configuratoin of preference fields 
* and their default value for CodeEditor
*
* @see EditorPreference, CodeEditor
* @since: 2015.06.23
* @author: hw.shim
*/

define([], function () {
'use strict';
	return {
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
});