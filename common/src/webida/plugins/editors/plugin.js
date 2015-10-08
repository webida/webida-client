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

    function subscribeToTopics() {

        topic.subscribe('editors.closed', function(dataSourceId, view) {
            editors.editorTabFocusController.unregisterView(view);
        });

        topic.subscribe('fs.cache.file.invalidated', function(fsURL, path) {
            logger.info('fs.cache.file.invalidated arrived');
            var file = editors.getFile(path);
            if (file) {
                if (file === editors.currentFile) {
                    fsCache.refreshFileContents(path);
                } else {
                    file.toRefresh = true;
                }
            }
        });

        topic.subscribe('fs.cache.file.set', function(fsUrl, target, reason) {
            if (reason === 'refreshed') {
                topic.publish('data-source/content-change', target);
            }
        });

        topic.subscribe('editor/not-exists', function() {
            topic.publish('editors.clean.all');
            topic.publish('editors.clean.current');
        });

        //Compatibility
        topic.subscribe('current-part-changed', function(oldPart, newPart) {

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

                        topic.publish('editors.selected', file.path, file);
                    }
                } else {
                    editors.currentFile = null;
                }
            }
        });
    }


    topic.publish('editors.clean.current');
    topic.publish('editors.clean.all');

    var fsCache = ide.getFSCache();
    var asked = [];

    /** @module editors */
    var editors = {
        splitViewContainer: null,
        editorTabFocusController: new ViewFocusController({
            'Title': 'title',
            'Path': 'path'
        }),
        editorExtensions: pm.getExtensions('webida.common.editors:editor'),
        files: {},
        currentFile: null,
        currentFiles: new BubblingArray(),
        recentFiles: new BubblingArray(20), // keep history of 20 files
        onloadPendingFilesCount: 0,
        parts: new Map()
    };

    editors.getFileByViewId = function(viewId) {
        return _.findWhere(editors.files, {
            viewId: viewId
        });
    };

    editors.quit = function() {
        topic.publish('view.quit');
    };

    editors.setCursor = function(file, pos) {
        if (file.viewer) {
            if (file.viewer.setCursor) {
                file.viewer.setCursor(pos);
            }
        }
    };

    editors.getCursor = function(file) {
        if (file.viewer) {
            if (file.viewer.getCursor) {
                return file.viewer.getCursor();
            }
        }
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
    lifecycleManager._showExistingPart = function(PartClass, dataSource, options, callback) {
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

        if ( typeof callback === 'function') {
            callback(part);
        }
    };

    /**
     * @private
     * @Override
     */
    lifecycleManager._createPart = function(PartClass, dataSource, options, callback) {
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

    /**
     * @deprecated since version 1.3.0
     * This method will be remove from 1.4.0
     * Temp Code
     */
    editors.openFile = lifecycleManager._openDataSource;

    editors.execCommandForCurrentEditorViewer = function(commandKey) {
        logger.info('execCommandForCurrentEditorViewer(' + commandKey + ')');

        // Command means a method of EditorViewer which have no arguments
        if (editors.currentFile && editors.currentFile.viewer) {
            var viewer = editors.currentFile.viewer;
            return viewer[commandKey]();
        }
    };

    editors.getCurrentEditorPart = function() {
        return this.currentEditorPart;
    };

    editors.getCurrentPart = function() {
        logger.info('getCurrentPart()');
        if (this.currentFile) {
            return this.getPart(this.currentFile);
        } else {
            return null;
        }
    };

    editors.getPart = function(file) {
        var dataSource = dsRegistry.getDataSourceById(file.getPath());
        var registry = workbench.getCurrentPage().getPartRegistry();
        var parts = registry.getPartsByDataSource(dataSource);

        if (parts && parts.length > 0) {
            for (var i in parts) {
                if (parts[i] instanceof EditorPart) {
                    return parts[i];
                }
            }
        } else {
            return null;
        }
    };

    //Compatibility
    //TODO remove
    editors.getFile = function(dataSourceId) {
        logger.info('getFile(' + dataSourceId + ')');
        var dataSource = dsRegistry.getDataSourceById(dataSourceId);
        if (dataSource) {
            return dataSource.getPersistence();
        }
    };

    //TODO remove
    editors.getDataSourceById = function(dsId) {
        return dsRegistry.getDataSourceById(dsId);
    };

    //TODO remove
    editors.getDataSource = function(persistence) {
        return dsRegistry.getDataSourceById(persistence.getPersistenceId());
    };

    editors.getPartRegistry = function() {
        var page = workbench.getCurrentPage();
        return page.getPartRegistry();
    };

    subscribeToTopics();

    logger.log('initialized editors plugin\'s module');

    return editors;

});
