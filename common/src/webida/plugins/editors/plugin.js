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
 * This plug-in manages EditorParts
 *
 * @see EditorPart
 */

/* jshint unused:false */
/* global Map */

// @formatter:off
define([
    'dojo/topic',
    'webida-lib/util/arrays/BubblingArray',
    'webida-lib/util/logger/logger-client',
    'webida-lib/widgets/views/viewFocusController',
    './DataSourceHandler'
], function (
    topic, 
    BubblingArray,
    Logger, 
    ViewFocusController,  
    DataSourceHandler
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    //TODO : refactor to plugin.json subscriptions
    var dataSourceHandler = DataSourceHandler.getInstance();

    topic.publish('editor/clean/current');
    topic.publish('editor/clean/all');

    //TODO : Refactor files, currentFile, currentFiles, recentFiles
    var editors = {
        splitViewContainer: null,
        editorTabFocusController: new ViewFocusController({
            'Title': 'title',
            'Path': 'path'
        }),
        files: {},
        currentFile: null,
        currentFiles: new BubblingArray(),
        recentFiles: new BubblingArray(20) // keep history of 20 files
    };

    return editors;

});
