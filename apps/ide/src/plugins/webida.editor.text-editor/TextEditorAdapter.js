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
 * TextEditor adapter interface
 *
 * @constructor
 * @see TextEditorContext, EditorAdapterFactory
 * @constructor
 * @since: 2015.07.11
 * @author: h.m.kwon
 * 
 */

define([
    'webida-lib/util/gene',
    'webida-lib/util/logger/logger-client',
    'webida-lib/plugins/editors/EditorAdapter'
], function (
        gene,
        logger,
        EditorAdapter
       ) {
    'use strict';

    function TextEditorAdapter() {
        logger.info('new TextEditorAdapter()');
    }
    
    gene.inherit(TextEditorAdapter, EditorAdapter, {

        addDeferredAction: function (action) {
            throw new Error('addDeferredAction() should be implemented by subclass');
        },

        __checkSizeChange: function () {
            throw new Error('__checkSizeChange() should be implemented by subclass');
        },     

        addCursorListener: function (listener) {
            throw new Error('addCursorListener() should be implemented by subclass');
        },

        addExtraKeys: function (extraKeys) {
            throw new Error('addExtraKeys() should be implemented by subclass');
        },

        setCursor: function (cursor) {
            throw new Error('setCursor() should be implemented by subclass');
        },

        setSelection: function (anchor, head) {
            throw new Error('setSelection() should be implemented by subclass');
        },

        getCursor: function () {
            throw new Error('getCursor() should be implemented by subclass');
        },

        getTheme: function () {
            throw new Error('getTheme() should be implemented by subclass');
        },

        setTheme: function (theme) {
            throw new Error('setTheme() should be implemented by subclass');
        },

        setFontFamily: function (fontFamily) {
            throw new Error('setFontFamily() should be implemented by subclass');
        },

        setFontSize: function (fontSize) {
            throw new Error('setFontSize() should be implemented by subclass');
        },

        _gutterOn: function (gutterName) {
            throw new Error('_gutterOn() should be implemented by subclass');
        },

        _gutterOff: function (gutterName) {
            throw new Error('_gutterOff() should be implemented by subclass');
        },

        setStyleActiveLine: function (highlight) {
            throw new Error('setStyleActiveLine() should be implemented by subclass');
        },

        setMatchBrackets: function (match) {
            throw new Error('setMatchBrackets() should be implemented by subclass');
        },

        setHighlightSelection: function (highlight) {
            throw new Error('setHighlightSelection() should be implemented by subclass');
        },

        setTabSize: function (tabSize) {
            throw new Error('setTabSize() should be implemented by subclass');
        },

        setIndentWithTabs: function (indentWithTabs) {
            throw new Error('setIndentWithTabs() should be implemented by subclass');
        },

        setIndentUnit: function (indentUnit) {
            throw new Error('setIndentUnit() should be implemented by subclass');
        },

        setIndentOnPaste: function (indentOnPaste) {
            throw new Error('setIndentOnPaste() should be implemented by subclass');
        },

        setTrimTrailingWhitespaces: function (trimTrailingWhitespaces) {
            throw new Error('setTrimTrailingWhitespaces() should be implemented by subclass');
        },

        setInsertFinalNewLine: function (insertFinalNewLine) {
            throw new Error('setInsertFinalNewLine() should be implemented by subclass');
        },

        setRetabIndentations: function (retabIndentations) {
            throw new Error('setRetabIndentations() should be implemented by subclass');
        },

        setShowInvisibles: function (showingInvisibles) {
            throw new Error('setShowInvisibles() should be implemented by subclass');
        },

        setLineWrapping: function (lineWrapping) {
            throw new Error('setLineWrapping() should be implemented by subclass');
        },

        setCodeFolding: function (codeFolding) {
            throw new Error('setCodeFolding() should be implemented by subclass');
        },

        setShowLineNumbers: function (showLineNumbers) {
            throw new Error('setShowLineNumbers() should be implemented by subclass');
        },

        getValue: function () {
            throw new Error('getValue() should be implemented by subclass');
        },

        setValue: function (value) {
            throw new Error('setValue() should be implemented by subclass');
        },

        foldCodeRange: function (range) {
            throw new Error('foldCodeRange() should be implemented by subclass');
        },

        getFoldings: function () {
            throw new Error('getFoldings() should be implemented by subclass');
        },

        cursorLineToMiddle: function () {
            throw new Error('cursorLineToMiddle() should be implemented by subclass');
        },

        cursorLineToTop: function () {
            throw new Error('cursorLineToTop() should be implemented by subclass');
        },

        cursorLineToBottom: function () {
            throw new Error('cursorLineToBottom() should be implemented by subclass');
        },

        del: function () {
            throw new Error('del() should be implemented by subclass');
        },

        selectAll: function () {
            throw new Error('selectAll() should be implemented by subclass');
        },

        selectLine: function () {
            throw new Error('selectLine() should be implemented by subclass');
        },

        lineIndent: function () {
            throw new Error('lineIndent() should be implemented by subclass');
        },

        lineDedent: function () {
            throw new Error('lineDedent() should be implemented by subclass');
        },

        lineMoveUp: function () {
            throw new Error('lineMoveUp() should be implemented by subclass');
        },

        lineMoveDown: function () {
            throw new Error('lineMoveDown() should be implemented by subclass');
        },

        lineDelete: function () {
            throw new Error('lineDelete() should be implemented by subclass');
        },        

        foldCode: function () {
            throw new Error('foldCode() should be implemented by subclass');
        },

        replace: function () {
            throw new Error('replace() should be implemented by subclass');
        },

        find: function () {
            throw new Error('find() should be implemented by subclass');
        },

        quickFind: function () {
            throw new Error('quickFind() should be implemented by subclass');
        },

        findNext: function () {
            throw new Error('findNext() should be implemented by subclass');
        },

        findPrev: function () {
            throw new Error('findPrev() should be implemented by subclass');
        },

        gotoLine: function () {
            throw new Error('gotoLine() should be implemented by subclass');
        },

        gotoMatchingBrace: function () {
            throw new Error('gotoMatchingBrace() should be implemented by subclass');
        },       

        isThereMatchingBracket: function () {
            throw new Error('isThereMatchingBracket() should be implemented by subclass');
        },

        getScrollInfo: function () {
            throw new Error('getScrollInfo() should be implemented by subclass');
        },

        scrollToScrollInfo: function (scrollInfo) {
            throw new Error('scrollToScrollInfo() should be implemented by subclass');
        },       

        existSearchQuery: function () {
            throw new Error('existSearchQuery() should be implemented by subclass');
        }
    });

    return TextEditorAdapter;
});