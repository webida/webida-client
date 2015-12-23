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

/*jshint unused:false*/

/**
 * Constructor
 * PartContainer
 *
 * @see Part, EditorPart, ViewPart
 * @since: 2015.07.07
 * @author: hw.shim
 */

// @formatter:off
define([
    'dojo/topic',
    'external/eventEmitter/EventEmitter',
    'webida-lib/util/EventProxy',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/plugins/workbench/plugin',
    './DataSource',
    './EditorPart',
    './Part'
], function (
    topic,
    EventEmitter,
    EventProxy,
    genetic, 
    Logger,
    workbench,
    DataSource,
    EditorPart,
    Part
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} WidgetAdapter
     * @typedef {Object} HTMLElement
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    var _containerId = 0;

    function PartContainer(dataSource) {
        logger.info('new PartContainer(' + dataSource + ')');

        var that = this;

        this._containerId = ++_containerId;
        this.dataSource = null;
        this.part = null;
        this.parent = null;
        this.contentNode = null;
        this.title = null;
        this.toolTip = null;
        this.titleImage = null;
        this.adapter = null;
        this.eventProxy = new EventProxy();

        this.setDataSource(dataSource);
        this.createWidgetAdapter();
        this.decorateTitle();

        //In case of rename, move persistence
        this.eventProxy.on(dataSource, DataSource.ID_CHANGE, function () {
            that.decorateTitle();
        });

        //In case of save
        this.eventProxy.on(dataSource, DataSource.AFTER_SAVE, function () {
            that.updateDirtyState();
        });
    }


    genetic.inherits(PartContainer, EventEmitter, {

        /**
         * @param {DataSource} dataSource
         */
        setDataSource: function (dataSource) {
            this.dataSource = dataSource;
        },

        /**
         * @return {DataSource} dataSource
         */
        getDataSource: function () {
            return this.dataSource;
        },

        /**
         * Initializes own Part
         */
        initializePart: function () {

        },

        /**
         * Creates a new Part using DataSource
         */
        createPart: function (PartClass, callback) {
            logger.info('%ccreatePart(' + PartClass.name + ', ' + typeof callback + ')', 'color:orange');

            //1. Creates a new Part
            var part = new PartClass(this);
            this.setPart(part);
            if (typeof callback === 'function') {
                part.once(Part.CONTENTS_READY, callback);
            }

            //2. Registers the part
            var registry = this._getRegistry();
            registry.registerPart(part);
            if (part instanceof EditorPart) {
                registry.setCurrentEditorPart(part);
            }
            this.emit(PartContainer.PART_CREATED);

            //3. Post Part Creation Process 
            part.onCreate();
        },

        /**
         * Close this container
         */
        destroyPart: function () {
            logger.info('destroyPart()');

            //1. Destroy Part
            this.getPart().onDestroy();
            this.emit(PartContainer.PART_DESTROYED);

            //2. Unregister Part
            var registry = this._getRegistry();
            registry.unregisterPart(this.getPart());
            this.setPart(null);

            //3. Remove this from LayoutPane
            this.getParent().removePartContainer(this);

            //4. Remove Event Listeners
            this.eventProxy.offAll();
        },

        /**
         * @param {Part} part
         */
        setPart: function (part) {
            if (this.part && part === null) {
                this.part.setContainer(null);
            } else {
                part.setContainer(this);
            }
            this.part = part;
        },

        /**
         * @return {Part} part
         */
        getPart: function () {
            return this.part;
        },

        /**
         * @param {Object} parent
         */
        setParent: function (parent) {
            this.parent = parent;
        },

        /**
         * @return {Object} parent
         */
        getParent: function () {
            return this.parent;
        },

        /**
         * @param {HTMLElement} contentNode
         */
        setContentNode: function (contentNode) {
            this.contentNode = contentNode;
        },

        /**
         * @param {Object} parent
         */
        getContentNode: function () {
            return this.contentNode;
        },

        /**
         * @param {string} title
         */
        setTitle: function (title) {
            this.title = title;
        },

        /**
         * @return {string} title
         */
        getTitle: function () {
            return this.title;
        },

        /**
         * @param {ImageDescriptor} imageDescriptor
         */
        setTitleImage: function (imageDescriptor) {
            this.titleImage = imageDescriptor;
            //TODO
        },

        /**
         * @return {ImageDescriptor} imageDescriptor
         */
        getTitleImage: function () {
            //TODO
        },

        /**
         * @param {string} toolTip
         */
        setToolTip: function (toolTip) {
            this.toolTip = toolTip;
        },

        /**
         * @return {string} title
         */
        getToolTip: function () {
            return this.toolTip;
        },

        /**
         * Decorates title bar of Container
         */
        decorateTitle: function () {
            var dataSource = this.getDataSource();
            this.setTitle(dataSource.getTitle());
            this.setToolTip(dataSource.getToolTip());
            this.setTitleImage(dataSource.getTitleImage());
        },

        /**
         * @abstract
         * @param {PartContainer~createWidgetAdapterCallback} callback
         */
        /**
         * @callback PartContainer~createWidgetAdapterCallback
         * @param {PartContainer} container
         */
        createWidgetAdapter: function (callback) {
            throw new Error('createWidgetAdapter() should be implemented by ' + this.constructor.name);
        },

        /**
         * @param {WidgetAdapter} adapter
         */
        setWidgetAdapter: function (adapter) {
            this.adapter = adapter;
        },

        /**
         * @return {WidgetAdapter}
         */
        getWidgetAdapter: function () {
            return this.adapter;
        },

        /**
         * Convenient method for LayoutPane.CONTAINER_SELECT event
         * @see LayoutPane
         */
        onSelect: function () {
            var part = this.getPart();
            var registry = this._getRegistry();
            if (part instanceof EditorPart) {
                registry.setCurrentEditorPart(part);
            }
        },

        /**
         * Updates this container's part's dirty state.
         * After update publishes corresponding topic
         */
        updateDirtyState: function () {

            logger.info('updateDirtyState()');
            logger.trace();

            var part = this.getPart();
            var title = this.getDataSource().getTitle();
            var registry = workbench.getCurrentPage().getPartRegistry();
            var currentPart = registry.getCurrentEditorPart();

            if (registry.getDirtyParts().length === 0) {
                topic.publish('editor/clean/all');
            } else {
                topic.publish('editor/dirty/some');
            }

            if (!part) {
                topic.publish('editor/clean/current');
            } else {
                if (part.isDirty()) {
                    this.setTitle('*' + title);
                    if (part === currentPart) {
                        topic.publish('editor/dirty/current');
                    }
                } else {
                    this.setTitle(title);
                    if (part === currentPart) {
                        topic.publish('editor/clean/current');
                    }
                }
            }
        },

        _getRegistry: function () {
            var page = workbench.getCurrentPage();
            return page.getPartRegistry();
        },

        /**
         * @override
         */
        toString: function () {
            var res = '<' + this.constructor.name + '>#' + this.getTitle();
            return res;
        }
    });

    /** @constant {string} */
    PartContainer.PART_CREATED = 'partCreated';

    /** @constant {string} */
    PartContainer.PART_DESTROYED = 'partDestroyed';

    /** @constant {string} */
    PartContainer.CONTAINER_RESIZE = 'resize';

    return PartContainer;
});
