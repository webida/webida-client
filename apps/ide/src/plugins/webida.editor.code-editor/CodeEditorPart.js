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

define([
	'webida-lib/util/genetic',
	'external/lodash/lodash.min',
	'webida-lib/plugins/workbench/ui/EditorPart',
	'plugins/webida.editor.text-editor/TextEditorPart',
	'webida-lib/plugins/workbench/preference-system/store',
	'webida-lib/plugins/editors/EditorPreference',
	'./preferences/preference-config',
	'./CodeEditorViewer',
	'./configloader',
	'dojo/topic',
	'webida-lib/util/logger/logger-client',
    'webida-lib/util/loadCSSList',
	'dojo/domReady!'
], function(
	genetic,
	_,
	EditorPart,
	TextEditorPart,
	store,
	EditorPreference,
	preferenceConfig,
	CodeEditorViewer,
	configloader,
	topic,
    Logger,
    loadCSSList
) {
	'use strict';

	var logger = new Logger();
	logger.off();

	function CodeEditorPart(file){
		logger.info('new CodeEditorPart('+file+')');
		TextEditorPart.apply(this, arguments); //super constructor
	}
    
    loadCSSList([
        require.toUrl('plugins/webida.editor.code-editor/icons.css')
    ], function () {});

	genetic.inherits(CodeEditorPart, TextEditorPart, {

		/**
		 * Initialize CodeEditorPart
		 * @override
		 */
		initialize : function(){
			logger.info('initialize()');
			TextEditorPart.prototype.initialize.call(this);
			this.initializeCodeEditorPart();
		},

		initializeCodeEditorPart : function(){
			logger.info('initializeCodeEditorPart()');
			var context = this.getViewer();
			var file = this.file;
            //context.addDeferredAction(function (context) {
             //   context.editor.setOption('overviewRuler', false);
            //});
            if (store.getValue('webida.editor.text-editor:editorconfig') === true) {
                configloader.editorconfig(context, file);
            }
            if (store.getValue('webida.editor.text-editor:jshintrc') !== false) {
                configloader.jshintrc(context, file);
            }
		},

		/**
		 * Initialize context
		 * @override
		 */
		initializeContext : function(){
			logger.info('initializeContext()');
			TextEditorPart.prototype.initializeContext.call(this);
			var context = this.getViewer();
			if(context && this.file){
				var mode = this.file.name.split('.').pop().toLowerCase();
				this.setMode(mode);
			}
		},

		/**
		 * @returns CodeEditorViewer
		 * @override
		 */
		getViewerClass : function(){
			return CodeEditorViewer;
		},

		/**
		 * @returns preferenceConfig for CodeEditor
		 * @override
		 */
		getPreferences : function(){
			return preferenceConfig;
		},

	    setMode : function(mode) {
			var context = this.getViewer();
			if(!context) {
				return;
			}
	        context.setMode(mode);
	        switch (mode) {
	        case 'json':
	            context.setLinter('json', true);
	            context.setHinters('json', ['word']);
	            break;
	        case 'js':
	            context.setLinter('js', false);
	            context.setHinters('javascript', ['javascript']);
	            break;
	        case 'css':
	            context.setLinter('css', true);
	            context.setHinters('css', ['css', 'cssSmart']);
	            break;
	        case 'html':
	            context.setLinter('html', true);
	            context.setHinters('html', ['html', 'htmlLink', 'htmlSmart']);
	            context.setHinters('htmlmixed', ['html', 'htmlLink', 'htmlSmart']);
	            context.setHinters('css', ['css', 'cssSmart']);
	            break;
	        default:
	            context.setHinters('word', ['word']);
	            break;
	        }
	    }
    });

	return CodeEditorPart;
});
