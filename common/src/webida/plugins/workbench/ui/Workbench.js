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
 * Workbench
 *
 * @see Page, EventEmitter, PartContainer, Part, Perspective
 * @since: 2015.07.12
 * @author: hw.shim
 */

// @formatter:off
define([
    'external/eventEmitter/EventEmitter',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './DataSourceRegistry',
    './LayoutPane',
    './Page',
    './WorkspaceModel'
], function(
    EventEmitter,
    genetic, 
    Logger,
    DataSourceRegistry,
    LayoutPane,
    Page,
    WorkspaceModel
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object.<Object, Object>} Map
     * @typedef {Object} DataSourceRegistry
     * @typedef {Object} WorkbenchModel
     * @typedef {Object} WorkspaceModel
     * @typedef {Object} Page
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function Workbench() {
        logger.info('new Workbench()');
        /** @type {Page} */
        this.currentPage = null;
        /** @type {Map.<string, Page>} */
        this.pages = [];
        /** @type {DataSourceRegistry} */
        this.dataSourceRegistry = new DataSourceRegistry();
        /** @type {WorkspaceModel} */
        this.workspaceModel = new WorkspaceModel();
    }


    genetic.inherits(Workbench, EventEmitter, {

        /**
         * @param {Page} page
         */
        addPage: function(page) {
            this.pages.push(page);
            page.setParent(this);
        },

        /**
         * @param {Page} page
         */
        removePage: function(page) {
            var index = this.pages.indexOf(page);
            if (index > 0) {
                page.setParent(null);
                this.pages.splice(index, 1);
            }
        },

        /**
         * @param {Page} page
         */
        setCurrentPage: function(page) {
            this.currentPage = page;
        },

        /**
         * @return {Page}
         */
        getCurrentPage: function() {
            return this.currentPage;
        },

        /**
         * @return {DataSourceRegistry}
         */
        getDataSourceRegistry: function() {
            return this.dataSourceRegistry;
        },

        /**
         * @param {Object} dataSourceId
         * @param {Function} callback
         */
        createDataSource: function(dataSourceId, callback) {
            logger.info('createDataSource(' + dataSourceId + ', callback)');
            var dsRegistry = this.getDataSourceRegistry();
            var wsModel = this.getWorkspaceModel();
            var factoryId = wsModel.getDataSourceFactory(dataSourceId);
            require([factoryId], function(DataSourceFactory) {
                var factory = new DataSourceFactory();
                var dataSource = factory.create(dataSourceId);
                dsRegistry.registerDataSource(dataSource);
                callback(dataSource);
            });
        },

        /**
         * @param {WorkspaceModel}
         */
        getWorkspaceModel: function() {
            return this.workspaceModel;
        },

        /**
         * @param {WorkbenchModel} model
         */
        parseModel: function(workbenchModel) {

            //TODO : if(!(model instanceof WorkbenchModel)){return;}

            function getPages(model) {
                var LayoutClass = {
                    'Page': Page,
                    'LayoutPane': LayoutPane
                }
                var layoutTree, split, children, child;
                if ('type' in model) {
                    layoutTree = new LayoutClass[model.type](model.id, model.name);
                    if ('split' in model) {
                        split = model.split;
                        layoutTree.setOrientation(split.orientation);
                        layoutTree.setRatio(split.ratio);
                    }
                    if ('children' in model) {
                        children = model.children;
                        for (var i in children) {
                            child = getPages(children[i]);
                            layoutTree.insertChild(child, i);
                        }
                    }
                    return layoutTree;
                }
                return null;
            }

            if ('pages' in workbenchModel) {
                var pages = workbenchModel.pages;
                for (var i in pages) {
                    this.addPage(getPages(pages[i]));
                }
            }
        }
    });

    Workbench.CREATE_DATA_SOURCE = 'createDataSource';

    return Workbench;
});
