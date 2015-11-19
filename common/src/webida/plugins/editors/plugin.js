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
    'webida-lib/plugin-manager-0.1',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/plugins/workbench/ui/CompatibleTabPartContainer',
    'webida-lib/plugins/workbench/ui/EditorPart',
    'webida-lib/plugins/workbench/ui/LayoutPane',
    'webida-lib/plugins/workbench/ui/PartContainer',
    'webida-lib/plugins/workbench/ui/Workbench',
    'webida-lib/widgets/views/viewmanager',
    'webida-lib/widgets/views/viewFocusController',
    './DataSourceHandler',
    './LifecycleManager'
], function (
    topic, 
    _, 
    ide, 
    BubblingArray,
    Logger, 
    pm, 
    workbench, 
    CompatibleTabPartContainer,
    EditorPart,
    LayoutPane,
    PartContainer,
    Workbench,
    vm, 
    ViewFocusController,  
    DataSourceHandler,
    LifecycleManager
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    logger.log('loaded modules required by editors. initializing editors plugin');

    var dsRegistry = workbench.getDataSourceRegistry();
    var lifecycleManager = LifecycleManager.getInstance();
    var dataSourceHandler = DataSourceHandler.getInstance();

    //TODO This will be refactored in webida-client 1.7.0 Release
    function subscribeToTopics() {

        topic.subscribe('editors.closed', function (dataSourceId, view) {
            editors.editorTabFocusController.unregisterView(view);
        });

        topic.subscribe('fs.cache.file.invalidated', function (fsURL, path) {
            logger.info('fs.cache.file.invalidated arrived');
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

        topic.subscribe('fs.cache.file.set', function (fsUrl, target, reason) {
            if (reason === 'refreshed') {
                topic.publish('data-source/content-changed', target);
            }
        });

        topic.subscribe('editor/not-exists', function () {
            topic.publish('editor/clean/all');
            topic.publish('editor/clean/current');
        });

        //Compatibility
        topic.subscribe('current-part-changed', function (oldPart, newPart) {

            logger.info('current-part-changed arrived');

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
    var asked = [];

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

    editors.getFileByViewId = function (viewId) {
        return _.findWhere(editors.files, {
            viewId: viewId
        });
    };

    editors.quit = function () {
        topic.publish('view.quit');
    };

    function getViewContainer(view, file, option) {
        //cellCount=2, cellIndex=-1
        var viewContainer;
        var cellCount = editors.splitViewContainer.get('splitCount');
        var cellIndex;
        if ((option.cellIndex >= 0) && (option.cellIndex < cellCount)) {
            cellIndex = option.cellIndex;
        } else {
            cellIndex = -1;
        }
        var opt = {};
        opt.fields = {
            title: view.getTitle(),
            path: file.path
        };
        editors.editorTabFocusController.registerView(view, opt);
        if (cellIndex === -1) {
            viewContainer = editors.splitViewContainer.getFocusedViewContainer();
        } else {
            viewContainer = editors.splitViewContainer.getViewContainer(cellIndex);
        }
        return viewContainer;
    }

    /**
     * @private
     * @Override
     */
    lifecycleManager._showExistingPart = function (PartClass, dataSource, options, callback) {
        logger.info('_showExistingPart(PartClass, ' + dataSource + ', ' + options + ', callback)');

        var page = workbench.getCurrentPage();
        var registry = page.getPartRegistry();
        var part = registry.getRecentEditorPart(dataSource, PartClass);

        //Compatibility start
        var persistence = dataSource.getPersistence();
        var view = part.getContainer().getWidgetAdapter().getWidget();
        var viewContainer = getViewContainer(view, persistence, options);
        if (view.getParent()) {
            view.getParent().select(view);
            part.focus();
        }
        //Compatibility end

        if (typeof callback === 'function') {
            callback(part);
        }
    };

    /**
     * @private
     * @Override
     */
    lifecycleManager._createPart = function (PartClass, dataSource, options, callback) {
        logger.info('%c_createPart(PartClass, ' + dataSource + ', ' + options + ', callback)', 'color:green');

        //Compatibility start
        //editors.files[dataSource.getId()] = dataSource.getPersistence();
        //Compatibility end

        var page = workbench.getCurrentPage();
        var layoutPane = page.getChildById('webida.layout_pane.center');

        //3. create Tab & add to Pane
        var tabPartContainer = new CompatibleTabPartContainer(dataSource);
        layoutPane.addPartContainer(tabPartContainer, options, editors);

        //4. create Part
        tabPartContainer.createPart(PartClass, callback);
    };

    subscribeToTopics();

    logger.log('initialized editors plugin\'s module');

    return editors;

});
