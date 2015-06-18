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
 * An ancestor of all workbench UI parts
 *
 * @see View, Editor
 * @since: 2015.06.09
 * @author: hw.shim
 */

define(['webida-lib/util/gene'], function(gene) {
	'use strict';
	var partId = 0;
	function Part(){
		this.partId = ++partId;
	}
	gene.inherit(Part, Object, {
		create : function(elem, started){
			throw new Error('create() should be implemented by subclass');
		},
		destroy : function(file){
			throw new Error('destroy() should be implemented by subclass');
		},
		show : function(file){
			throw new Error('show() should be implemented by subclass');
		},
		hide : function(file){
			throw new Error('hide() should be implemented by subclass');
		},
		focus : function(){
			throw new Error('focus() should be implemented by subclass');
		}
	});
	return Part;
});
