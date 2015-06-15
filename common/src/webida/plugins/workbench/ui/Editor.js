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
 * Interface
 * An ancestor of all workbench editors.
 * This is an abstract constructor function.
 *
 * @see Part, Editor
 * @since: 2015.06.09
 * @author: hw.shim
 */

define([
	'webida-lib/util/gene',
	'./Part'
], function(
	gene,
	Part
) {
	'use strict';
	function Editor(){}
	gene.inherit(Editor, Part, {
		getValue : function(file){
			throw new Error('getValue() should be implemented by subclass');
		},
		markClean : function(file){
			throw new Error('markClean() should be implemented by subclass');
		},
		isClean : function(file){
			throw new Error('isClean() should be implemented by subclass');
		}
	});
	return Editor;
});
