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
 * This class manages EditorParts
 * 
 * @see EditorPart
 */

define([
	'dojo/topic',
	'text!./ext-to-mime.json',
	'external/lodash/lodash.min',
	'external/URIjs/src/URI',
	'webida-lib/app',
	'webida-lib/util/path',
	'webida-lib/util/arrays/BubblingArray',
	'webida-lib/plugin-manager-0.1',
	'webida-lib/plugins/workbench/plugin',
	'webida-lib/plugins/workbench/ui/EditorPart',
	'webida-lib/widgets/views/view',
	'webida-lib/widgets/views/viewmanager',
	'webida-lib/widgets/views/viewFocusController',
	'external/async/dist/async.min',
	'external/toastr/toastr.min',
	'webida-lib/util/logger/logger-client'
], function (
	topic,
	extToMime, 
	_, 
	URI, 
	ide, 
	pathUtil, 
	BubblingArray, 
	pm, 
	workbench, 
	EditorPart,
	View, 
	vm, 
	ViewFocusController,  
	async, 
	toastr, 
	Logger
) {
    'use strict';

	var logger = new Logger();
	//logger.off();

	/*Closures*/

	/** @module EditorManager */
	var EditorManager = {
		
	};

    return EditorManager;

});
