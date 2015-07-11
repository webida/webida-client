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
 * Factory of EditorAdapter for CodeMirror, Ace, etc.
 *
 * @constructor
 * @since: 2015.07.10
 * @author: h.m.kwon
 * 
 */

define([
    'webida-lib/util/gene',
    'webida-lib/util/logger/logger-client',
    'plugins/webida.editor.text-editor/TextEditorAdapterForCodeMirror',
    'plugins/webida.editor.code-editor/CodeEditorAdapterForCodeMirror'
], function (        
    gene,
    Logger,
    TextEditorAdapterForCodeMirror,
    CodeEditorAdapterForCodeMirror 
) {
    'use strict';

    var logger = new Logger();

    function EditorAdapterFactory() {       

    }

    EditorAdapterFactory.factory = function (type, elem, file, startedListener) {
        if (typeof EditorAdapterFactory[type] !== 'function') {
            console.error('EditorAdapterFactory: type ' + type + 'does not exist');
            return;
        }        
        
        var Constr = EditorAdapterFactory[type];
        var newAdapter = new Constr(elem, file, startedListener);
        
        return newAdapter;
    };
    
    EditorAdapterFactory['codemirror-text'] = TextEditorAdapterForCodeMirror;
    EditorAdapterFactory['codemirror-code'] = CodeEditorAdapterForCodeMirror;
    
    //EditorAdapterFactory.[ace-text] = ;   
    
    return EditorAdapterFactory;
});