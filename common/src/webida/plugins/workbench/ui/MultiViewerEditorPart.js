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
 * MultiViewerEditorPart
 *
 * @see
 * @since: 2015.07.19
 * @author: hw.shim
 */

// @formatter:off
define([
    'dijit/layout/TabContainer',
    'dijit/layout/ContentPane',
    'external/eventEmitter/EventEmitter',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './EditorPart',
    './Part'
], function (
    TabContainer,
    ContentPane,
    EventEmitter,
    genetic,
    Logger,
    EditorPart,
    Part
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     * @typedef {Object} EditorViewer
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function MultiViewerEditorPart(file) {
        logger.info('new MultiViewerEditorPart(' + file + ')');
        EditorPart.apply(this, arguments);

        this.setFile(file);
        //TODO : refactor

        /** @type {Map.<Object, EditorViewer>} */
        this.viewers = new Map();

        /** @type {Map.<Object, EditorViewer>} */
        this.tabToViewerMap = new Map();

        /** @type {EditorViewer} */
        this.activeViewer = null;
    }


    genetic.inherits(MultiViewerEditorPart, EditorPart, {

        /**
         * @override
         */
        create: function(parent, callback) {
            logger.info('create(' + parent.tagName + ', callback)');
            this.setParentElement(parent);
            this.createCallback = callback;
            //TODO remove this.file.elem
            this.file.elem = parent;
            this.initialize();
        },

        destroy: function() {
            logger.info('destroy()');
            //unset preferences
            if (this.preferences) {
                this.preferences.unsetFields();
            }
            //unsubscribe topic
            if (this.fileOpenedHandle) {
                logger.info('this.fileOpenedHandle.remove()', this.fileOpenedHandle);
                this.fileOpenedHandle.remove();
            }
            if (this.fileSavedHandle) {
                this.fileSavedHandle.remove();
            }
        },

        initialize: function() {
            logger.info('initialize()');
            this.createTabContainer();
            this.createViewers();
        },

        /**
         * Create TabContainer
         */
        createTabContainer: function() {
            logger.info('createTabContainer()');
            var parent = this.getParentElement();
            var container = new TabContainer({
                style: 'width: 100%; height: 100%;',
                tabPosition: 'bottom',
                tabStrip: true,
                nested: true
            });
            container.startup();
            parent.appendChild(container.domNode);
            container.resize();

            this.setContainerEvent(container);
            this.tabContainer = container;
        },

        /**
         * Set Container Event
         *
         * If you want different event binding, override this method.
         */
        setContainerEvent: function(container) {
            var that = this;
            container.watch('selectedChildWidget', function(name, oldTab, newTab) {
                var viewer = that.getViewerByTab(newTab);
                if (viewer) {
                    that.setActiveViewer(viewer);
                }
            });
        },

        /**
         * Create EditorViewers
         *
         * @abstract
         */
        createViewers: function() {
            throw new Error('createViewers() should be implemented by ' + this.constructor.name);
        },

        /**
         * @return {Map.<Object, EditorViewer>}
         */
        getViewers: function() {
            return this.viewers;
        },

        /**
         * @return {Map.<Object, EditorViewer>}
         */
        getTabToViewerMap: function() {
            return this.tabToViewerMap;
        },

        /**
         * @param {Object} id
         * @param {string} title
         * @param {EditorViewer} viewer
         * @param {number} index
         * @param {MultiViewerEditorPart~addViewerCallback} callback
         */
        /**
         * @callback MultiViewerEditorPart~addViewerCallback
         * @param {HTMLElement} parentNode
         */
        addViewer: function(id, title, viewer, index, callback) {
            logger.info('addViewer(' + id + ', ' + title + ', ' + viewer + ', ' + index + ', callback)');
            var pane = new ContentPane({
                title: title
            });
            pane.startup();
            this.getTabContainer().addChild(pane, index);
            this.getViewers().set(id, viewer);
            this.getTabToViewerMap().set(pane, viewer);
            if ( typeof callback === 'function') {
                callback(pane.domNode);
            }
            if (this.getViewers().size === 1) {
                this.setActiveViewer(viewer);
            }
        },

        /**
         * @param {EditorViewer} viewer
         */
        removeViewer: function(viewer) {
            //TODO
        },

        /**
         * @param {EditorViewer} viewer
         */
        setActiveViewer: function(viewer) {
            logger.info('setActiveViewer(' + viewer + ')');
            this.activeViewer = viewer;
            viewer.refresh();
            this.emit(MultiViewerEditorPart.TAB_SELECT, viewer);
        },

        /**
         * @return {EditorViewer} viewer
         */
        getActiveViewer: function() {
            return this.activeViewer;
        },

        /**
         * @param {Object} id
         * @return {EditorViewer}
         */
        getViewerById: function(id) {
            return this.getViewers().get(id);
        },

        /**
         * @param {Object} tab
         * @return {EditorViewer}
         */
        getViewerByTab: function(tab) {
            return this.getTabToViewerMap().get(tab);
        },

        /**
         * @return {TabContainer}
         */
        getTabContainer: function() {
            return this.tabContainer;
        },

        /**
         * TODO refactor
         */
        getContextMenuItems: function(opened, items, menuItems, deferred) {
            var activeViewer = this.getActiveViewer();
            if (activeViewer) {
                activeViewer.getContextMenuItems(opened, items, menuItems, deferred);
            }
        }
    });

    MultiViewerEditorPart.TAB_SELECT = 'tabSelect';

    return MultiViewerEditorPart;
});
