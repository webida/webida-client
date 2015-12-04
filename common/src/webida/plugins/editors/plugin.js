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
    'external/lodash/lodash.min',
    'webida-lib/app',
    'webida-lib/util/arrays/BubblingArray',
    'webida-lib/util/logger/logger-client',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/plugins/workbench/ui/CompatibleTabPartContainer',
    'webida-lib/widgets/views/viewFocusController',
    './DataSourceHandler'
], function (
    topic, 
    _,
    ide, 
    BubblingArray,
    Logger, 
    workbench, 
    CompatibleTabPartContainer,
    ViewFocusController,  
    DataSourceHandler
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    var dsRegistry = workbench.getDataSourceRegistry();
    var dataSourceHandler = DataSourceHandler.getInstance();

    //TODO This will be refactored in webida-client 1.7.0 Release
    function subscribeToTopics() {

        topic.subscribe('part/container/removed', function (dataSourceId, view) {
            editors.editorTabFocusController.unregisterView(view);
        });

        topic.subscribe('fs/cache/file/invalidated', function (fsURL, path) {
            logger.info('fs/cache/file/invalidated arrived');
            var dataSource = dsRegistry.getDataSourceById(path);
            var file;
            if (dataSource) {
                file = dataSource.getPersistence();
                if (file === editors.currentFile) {
                    fsCache.refreshFileContents(path);
                } else {
                    file.toRefresh = true;
                }
            }
        });

        topic.subscribe('part/editor/not-exists', function () {
            topic.publish('editor/clean/all');
            topic.publish('editor/clean/current');
        });

        //Compatibility
        topic.subscribe('part/editor/selected', function (oldPart, newPart) {

            logger.info('part/editor/selected arrived');

            if (oldPart !== newPart) {

                if (oldPart) {
                    var oldContainer = oldPart.getContainer();
                    if (oldContainer) {
                        var oldView = oldContainer.getWidgetAdapter().getWidget();
                        workbench.unregistFromViewFocusList(oldView);
                    }
                }

                if (newPart) {
                    var newContainer = newPart.getContainer();
                    var newView = newContainer.getWidgetAdapter().getWidget();
                    workbench.registToViewFocusList(newView, {
                        title: 'Editor',
                        key: 'E'
                    });

                    //------------ TODO refactor ---------------

                    var file = newPart.getDataSource().getPersistence();

                    editors.currentFile = file;

                    if (file) {
                        editors.currentFiles.put(file);
                        editors.recentFiles.put(file.path);

                        if (file.toRefresh) {
                            file.toRefresh = false;
                            fsCache.refreshFileContents(file.path);
                        }
                    }
                } else {
                    editors.currentFile = null;
                }
            }
        });
    }


    topic.publish('editor/clean/current');
    topic.publish('editor/clean/all');

    var fsCache = ide.getFSCache();

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

    subscribeToTopics();

    return editors;

});
