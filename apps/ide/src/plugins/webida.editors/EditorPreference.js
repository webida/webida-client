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
 * EditorPreference set or unset fields of editor preferences
 *
 * @constructor
 * @see TextEditorPart
 * @since: 2015.06.23
 * @author: hw.shim
 * 
 */

define([
	'webida-lib/util/genetic',
	'webida-lib/util/logger/logger-client'
], function(
	genetic,
	Logger
) {
	'use strict';

	var logger = new Logger();
	logger.off();

	function EditorPreference(storage, editorContext) {
		logger.info('new EditorPreference('+storage+', '+editorContext+')');
		var that = this;
		this.configs = null;
		this.storage = storage;
		this.editorContext = editorContext;
		this.listener = function (value, key) {
			that.setField(key, value);
		}
	}

	genetic.inherits(EditorPreference, Object, {
		setFields : function(configs){
			logger.info('setFields('+configs+')');
			var that = this;
			var editorContext = this.editorContext;
			this.configs = configs;
	        this.storage.addLoadedListener(function () {
	            Object.keys(that.configs).forEach(function (key) {
	                that.setField(key, that.storage.getValue(key));
	                if(typeof that.storage.addFieldChangeListener === 'function'){
	                	that.storage.addFieldChangeListener(key, that.listener);
	                }
	            });
	        });
		},
		unsetFields : function(){
			logger.info('unsetFields()');
	    	var that = this;
            Object.keys(this.configs).forEach(function (key) {
            	if(typeof that.storage.removeFieldChangeListener === 'function'){
            		that.storage.removeFieldChangeListener(key, that.listener);
            	}
            });
		},
		setField : function(key, value){
			//logger.info('setField('+key+', '+value+')');
			var config = this.configs[key];
	        var setter = config[0];
	        if (value === undefined && config.length > 1) {
	            value = config[1];
	        }
	        this.editorContext[setter](value);
		}
	});

	return EditorPreference;
});
