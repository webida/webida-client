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

// @formatter:off
define([
    'external/eventEmitter/EventEmitter',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client'
], function(
    EventEmitter,
    genetic, 
    Logger
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} WidgetAdapter
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    var _containerId = 0;

    function PartContainer(dataSource) {
        logger.info('new PartContainer(' + dataSource + ')');
        this._containerId = ++_containerId;
        this.dataSource = null;
        this.part = null;
        this.parent = null;
        this.title = null;
        this.toolTip = null;
        this.titleImage = null;
        this.adapter = null;
        this.setDataSource(dataSource);
        this.createWidgetAdapter(function(container) {
            container.setTitle(dataSource.getTitle());
            container.setToolTip(dataSource.getToolTip());
            container.setTitleImage(dataSource.getTitleImage());
        });
    }


    genetic.inherits(PartContainer, EventEmitter, {

        /**
         * @param {DataSource} dataSource
         */
        setDataSource: function(dataSource) {
            this.dataSource = dataSource;
        },

        /**
         * @return {DataSource} dataSource
         */
        getDataSource: function() {
            return this.dataSource;
        },

        /**
         * Initializes own Part
         */
        initializePart: function() {

        },

        /**
         * Creates new Part using DataSource
         */
        createPart: function(options, callback) {
            logger.info('createPart(' + options + ', callback)');
            logger.info(this.getDataSource());
            //get Part module by dataSource using plugin manager
            //this.part = new Part()
            //this.part.create(parent);
        },

        /**
         * @return {Part} part
         */
        getPart: function() {
            return this.part;
        },

        /**
         * @param {Object} parent
         */
        setParent: function(parent) {
            this.parent = parent;
        },

        /**
         * @return {Object} parent
         */
        getParent: function() {
            return this.parent;
        },

        /**
         * @param {string} title
         */
        setTitle: function(title) {
            this.title = title;
        },

        /**
         * @return {string} title
         */
        getTitle: function() {
            return this.title;
        },

        /**
         * @param {ImageDescriptor} imageDescriptor
         */
        setTitleImage: function(imageDescriptor) {
            this.titleImage = imageDescriptor;
            //TODO
        },

        /**
         * @return {ImageDescriptor} imageDescriptor
         */
        getTitleImage: function() {
            //TODO
        },

        /**
         * @param {string} toolTip
         */
        setToolTip: function(toolTip) {
            this.toolTip = toolTip;
        },

        /**
         * @return {string} title
         */
        getToolTip: function() {
            return this.toolTip;
        },

        /**
         * @abstract
         * @param {PartContainer~createWidgetAdapterCallback} callback
         */
        /**
         * @callback PartContainer~createWidgetAdapterCallback
         * @param {PartContainer} container
         */
        createWidgetAdapter: function(callback) {
            throw new Error('createWidgetAdapter() should be implemented by ' + this.constructor.name);
        },

        /**
         * @param {WidgetAdapter} adapter
         */
        setWidgetAdapter: function(adapter) {
            this.adapter = adapter;
        },

        /**
         * @return {WidgetAdapter}
         */
        getWidgetAdapter: function() {
            return this.adapter;
        },

        /**
         * @override
         */
        toString: function() {
            var res = '<' + this.constructor.name + '>#' + this.getTitle();
            return res;
        }
    });

    /** @constant {string} */
    PartContainer.PART_CREATED = 'partCreated';

    /** @constant {string} */
    PartContainer.PART_DESTROYED = 'partDestroyed';

    return PartContainer;
});
