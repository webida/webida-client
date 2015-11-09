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
 * Factory of EngineAdapter for CodeMirror, Ace, etc.
 *
 * @constructor
 * @since: 2015.07.10
 * @author: h.m.kwon
 * 
 */

define([
    'webida-lib/util/logger/logger-client',
    'plugins/webida.editor.text-editor/CodeMirrorAdapterForTextEditor',
    'plugins/webida.editor.text-editor/AceAdapterForTextEditor',
    'plugins/webida.editor.code-editor/CodeMirrorAdapterForCodeEditor'
], function (
    Logger,
    CodeMirrorAdapterForTextEditor,
    AceAdapterForTextEditor,
    CodeMirrorAdapterForCodeEditor 
) {
    'use strict';

    //var logger = new Logger();

    function EngineAdapterFactory() {       

    }

    EngineAdapterFactory.factory = function (type, elem, file, startedListener) {
        if (typeof EngineAdapterFactory[type] !== 'function') {
            console.error('EngineAdapterFactory: type ' + type + 'does not exist');
            return;
        }        
        
        var Constr = EngineAdapterFactory[type];
        var newAdapter = new Constr(elem, file, startedListener);
        
        return newAdapter;
    };
    
    EngineAdapterFactory['codemirror-text'] = CodeMirrorAdapterForTextEditor;
    EngineAdapterFactory['ace-text'] = AceAdapterForTextEditor;
    EngineAdapterFactory['codemirror-code'] = CodeMirrorAdapterForCodeEditor;
    
    //EngineAdapterFactory['ace-text'] = ;   
    
    return EngineAdapterFactory;
});