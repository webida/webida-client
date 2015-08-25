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
    'dojo/topic',
    'external/eventEmitter/EventEmitter',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/plugins/workbench/plugin',
    './DataSource',
    './EditorPart'
], function(
    topic,
    EventEmitter,
    genetic, 
    Logger,
    workbench,
    DataSource,
    EditorPart
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

        this.setDataSource(dataSource);
        this.createWidgetAdapter();
        this.decorateTitle();

        //In case of rename, move persistence
        dataSource.on(DataSource.ID_CHANGE, function(/*dataSource, oldId, newId*/) {
            that.decorateTitle();
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
        createPart: function(PartClass, options, callback) {
            logger.info('%ccreatePart(' + PartClass.name + ', ' + options + ', ' + typeof callback + ')', 'color:orange');
            var that = this;

            //1. Create new Part
            var part = new PartClass(this);
            this.setPart(part);

            //2. Register part
            var registry = this._getRegistry();
            registry.registerPart(part);
            if ( part instanceof EditorPart) {
            	registry.setCurrentEditorPart(part);
            }

			//3. Create User Interface of Part
			var promise = Promise.resolve();
			promise.then(function(){
				part.createViewer(that.getContentNode());
				return part;
			//If everything is OK
			}).then(function(part){
                if ( typeof callback === 'function') {
                    callback(part);
                }
            //If something goes wrong while createViewer
			}).catch(function(e){
				logger.warn(e);
			});
        },

        /**
         * @param {Part} part
         */
        setPart: function(part) {
            this.part = part;
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
         * @param {HTMLElement} contentNode
         */
        setContentNode: function(contentNode) {
            this.contentNode = contentNode;
        },

        /**
         * @param {Object} parent
         */
        getContentNode: function() {
            return this.contentNode;
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
         * Decorates title bar of Container
         */
        decorateTitle: function() {
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
         * Convenient method for LayoutPane.CONTAINER_SELECT event
         * @see LayoutPane
         */
		onSelect: function(){
            var part = this.getPart();
            var registry = this._getRegistry();
            if ( part instanceof EditorPart) {
            	registry.setCurrentEditorPart(part);
            }
		},

        /**
         * Updates this container's part's dirty state.
         * After update publishes corresponding topic
         */
        updateDirtyState: function() {

			if(!this.getPart()){
				topic.publish('editors.clean.current');
				return;
			}

	        var part = this.getPart();
	        var title = this.getDataSource().getTitle();
	        var registry = workbench.getCurrentPage().getPartRegistry();
	        var currentPart = registry.getCurrentEditorPart();
	
	        if (part.isDirty()) {
	            this.setTitle('*' + title);
	            if (part === currentPart) {
	                topic.publish('editors.dirty.current');
	            }
	            topic.publish('editors.dirty.some');
	        } else {
	            this.setTitle(title);
	            if (part === currentPart) {
	                topic.publish('editors.clean.current');
	            }
	            if (registry.getDirtyParts().length === 0) {
	                topic.publish('editors.clean.all');
	            }
	        }
        },

		_getRegistry: function(){
            var page = workbench.getCurrentPage();
            return page.getPartRegistry();
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

    /** @constant {string} */
    PartContainer.CONTAINER_RESIZE = 'containerResize';

    return PartContainer;
});
