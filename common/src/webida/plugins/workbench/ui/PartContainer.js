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
 * Constructor
 * PartContainer
 *
 * @see Part, EditorPart, ViewPart
 * @since: 2015.07.07
 * @author: hw.shim
 */

define([
	'webida-lib/util/logger/logger-client'
], function(
	Logger
) {
	'use strict';

	var logger = new Logger();
	//logger.setConfig('level', Logger.LEVELS.log);
	//logger.off();

	function PartContainer(option){
		logger.info('new PartContainer(option)');
		this.element = null;
		this.createEelement(option);
	}

	PartContainer.prototype = {
		createEelement : function(option){
			this.element = $('<div tabindex="0" style="position:absolute; ' +
				'overflow:hidden; width:100%; height:100%; padding:0px; border:0"/>')[0];
			for(var key in option){
				this.element.setAttribute(key, option[key]);
			}
		},
		getElement : function(){
			return this.element;
		}
	};

	PartContainer.prototype.constructor = PartContainer;

	return PartContainer;
});
