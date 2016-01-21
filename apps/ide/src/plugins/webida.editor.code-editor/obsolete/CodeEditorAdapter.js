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
 * @file
 * CodeEditor adapter interface
 *
 * @constructor
 * @see CodeEditorViewer, EngineAdapterFactory
 * @constructor
 * @since 1.3.0
 * @author h.m.kwon@samsung.com
 * 
 */

/* jshint unused:false */

define([
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'plugins/webida.editor.text-editor/TextEditorAdapter'
], function (      
    genetic,
    logger,
    TextEditorAdapter
) {
    'use strict';

    function CodeEditorAdapter() {
        logger.info('new CodeEditorAdapter()');
    }   

    genetic.inherits(CodeEditorAdapter, TextEditorAdapter, {
        
        getMode : function () {
            throw new Error('getMode() should be implemented by subclass');
        },

        setMode : function (mode) {
            throw new Error('setMode() should be implemented by subclass');
        },
       
        setTheme : function (theme) {
            throw new Error('setTheme() should be implemented by subclass');
        },

        setLinter : function (type, option) {
            throw new Error('setLinter() should be implemented by subclass');
        },
        
        __applyLinter : function () {
            throw new Error('__applyLinter() should be implemented by subclass');
        },

        setHinters : function (mode, hinterNames) {
            throw new Error('setHinters() should be implemented by subclass');
        },

        setGlobalHinters : function (hinterNames) {
            throw new Error('setGlobalHinters() should be implemented by subclass');
        },

        setAnywordHint : function (anywordHint) {
            throw new Error('setAnywordHint() should be implemented by subclass');
        },
        
        setSnippetEnabled : function (enabled) {
            throw new Error('setSnippetEnabled() should be implemented by subclass');
        },

        setAutoCompletion : function (autoCompletion) {
            throw new Error('setAutoCompletion() should be implemented by subclass');
        },

        setAutoCompletionDelay : function (delay) {
            throw new Error('setAutoCompletionDelay() should be implemented by subclass');
        },

        lineComment: function () {
            throw new Error('lineComment() should be implemented by subclass');
        },

        blockComment: function () {
            throw new Error('blockComment() should be implemented by subclass');
        },

        commentOutSelection: function () {
            throw new Error('commentOutSelection() should be implemented by subclass');
        },

        beautifyCode: function () {
            throw new Error('beautifyCode() should be implemented by subclass');
        },

        beautifyAllCode: function () {
            throw new Error('beautifyAllCode() should be implemented by subclass');
        },

        gotoDefinition: function () {
            throw new Error('gotoDefinition() should be implemented by subclass');
        },

        rename: function () {
            throw new Error('rename() should be implemented by subclass');
        }
    });   

    return CodeEditorAdapter;
});
