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
], function(
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

		this.setFile(file); //TODO : refactor

        /** @type {Map.<Object, EditorViewer>} */
        this.viewers = new Map();
    }


    genetic.inherits(MultiViewerEditorPart, EditorPart, {

        initialize: function() {
            logger.info('initialize()');
            var parent = this.getParentElement();
            this.createTabContainer(parent);
            this.createViewers();
            //this.initializeListeners();
            //this.initializePreferences();
        },

        /**
         * @override
         */
        create: function(parent, callback) {
            logger.info('create(' + parent.tagName + ', callback)');
            if (this.getFlag(Part.CREATED) === true) {
                return;
            }
            this.setParentElement(parent);
            this.createCallback = callback;
            this.file.elem = parent;	//TODO : remove
            this.initialize();
            this.setFlag(Part.CREATED, true);
        },

        destroy: function () {
        	logger.info('destroy()');
            if (this.editorViewer) {
                this.editorViewer.destroy();
                this.editorViewer = null;
            }else{
				logger.info('this.editorViewer not found');
				logger.trace();
			}
			//unset preferences
			if(this.preferences){
				this.preferences.unsetFields();
			}
			//unsubscribe topic
			if(this.fileOpenedHandle){
				logger.info('this.fileOpenedHandle.remove()', this.fileOpenedHandle);
				this.fileOpenedHandle.remove();
			}
			if(this.fileSavedHandle){
				this.fileSavedHandle.remove();
			}
			//clear state
			this.setFlag(Part.CREATED, false);
        },

        /**
         * Create EditorViewers
         */
        createTabContainer: function(parent) {
            this.tabContainer = new TabContainer({
                style: 'width: 100%; height: 100%;',
                tabPosition: 'bottom',
                tabStrip: true,
                nested: true,
                getChildPaneWidget: function(name) {
                    return _.find(this.getChildren(), function(child) {
                        return child.get('title') === name;
                    });
                }
            });
            this.tabContainer.startup();
            parent.appendChild(this.tabContainer.domNode);
            this.tabContainer.resize();
        },

        /**
         * Create EditorViewers
         */
        createViewers: function() {
            throw new Error('createViewers() should be implemented by ' + this.constructor.name);
        },

        /**
         * @return {Map.<Object, EditorViewer>}
         */
        getAllViewers: function() {

        },

        /**
         * @param {string} title
         * @param {EditorViewer} viewer
         * @param {number} index
         */
        addViewer: function(title, viewer, index) {
            var childPane = new ContentPane({
                title: title
            });
            childPane.startup();
            viewer.elem = childPane.domNode;
            this.tabContainer.addChild(childPane, index);
        },

        /**
         * @param {EditorViewer} viewer
         */
        removeViewer: function(viewer) {

        },

        /**
         * @param {EditorViewer} viewer
         */
        setActiveViewer: function(viewer) {

        },

        /**
         * @return {EditorViewer} viewer
         */
        getActiveViewer: function() {

        },

        /**
         * @param {EditorViewer} viewer
         */
        getViewerByDataSource: function(ds) {

        }
    });

    return MultiViewerEditorPart;
});
