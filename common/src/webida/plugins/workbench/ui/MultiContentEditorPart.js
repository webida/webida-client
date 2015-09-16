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
 * MultiContentEditorPart
 *
 * @see
 * @since: 2015.09.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'dijit/layout/TabContainer',
    'dijit/layout/ContentPane',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './EditorPart',
    './MultiContentPartContainer'
], function(
    TabContainer,
    ContentPane,
    genetic, 
    Logger,
    EditorPart,
    MultiContentPartContainer
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function MultiContentEditorPart(container) {
        logger.info('new MultiContentEditorPart(' + container + ')');

        EditorPart.apply(this, arguments);

        /** @type {Map.<Object, {(Part|Viewer|HTMLElement)}>} */
        this.contents = new Map();

        /** @type {Map.<Object, {(Part|Viewer|HTMLElement)}>} */
        this.tabToContentMap = new Map();

        /** @type {(Part|Viewer|HTMLElement)} */
        this.activeContent = null;
    }


    genetic.inherits(MultiContentEditorPart, EditorPart, {

        /**
         * Create contents and add to sub-tab.
         * @abstract
         */
        createContents: function() {
            throw new Error('createContents() should be implemented by ' + this.constructor.name);
        },

        /**
         * Prepares required components.
         */
        prepareComponents: function() {
            logger.info('%cprepareComponents()', 'color:orange');

            var container = this.getContainer();
            this.createTabContainer(container.getContentNode());
            this.createContents();
        },

        /**
         * Create TabContainer
         * @param {HTMLElement} parentNode
         */
        createTabContainer: function(parentNode) {
            logger.info('createTabContainer(' + parentNode + ')');
            var container = new TabContainer({
                style: 'width: 100%; height: 100%;',
                tabPosition: 'bottom',
                tabStrip: true,
                nested: true
            });
            container.startup();
            parentNode.appendChild(container.domNode);
            container.resize();

            this.setContainerEvent(container);
            this.tabContainer = container;
        },

        /**
         * Sets Container Event
         * If you want different event binding, override this method.
         */
        setContainerEvent: function(container) {
            var that = this;
            container.watch('selectedChildWidget', function(name, oldTab, newTab) {
                var content = that.getContentByTab(newTab);
                if (content) {
                    that.setActiveContent(content);
                }
            });
        },

        /**
         * @param {Object} id
         * @param {string} title
         * @param {(Part|Viewer|HTMLElement)} content
         * @param {number} index
         * @param {MultiContentEditorPart~addViewerCallback} callback
         */
        /**
         * @callback MultiContentEditorPart~addViewerCallback
         * @param {HTMLElement} parentNode
         */
        addContent: function(id, title, content, index, callback) {
            logger.info('addContent(' + id + ', ' + title + ', ' + content + ', ' + index + ', callback)');
            var pane = new ContentPane({
                title: title
            });
            pane.startup();
            this.getTabContainer().addChild(pane, index);
            this.getContents().set(id, content);
            this.getTabToContentMap().set(pane, content);
            this._execFunc(callback, pane.domNode);
            if (this.getContents().size === 1) {
                this.setActiveContent(content);
            }
        },

        addHtmlElement: function(id, title, element, index, callback) {
            logger.info('addHtmlElement(' + id + ', ' + title + ', element, ' + index + ', callback)');
            var pane = new ContentPane({
                title: title
            });
            this.getTabContainer().addChild(pane, index);
            this.getContents().set(id, element);
            this.getTabToContentMap().set(pane, element);
            pane.domNode.appendChild(element);
            pane.startup();
            this._execFunc(callback, pane.domNode);
            if (this.getContents().size === 1) {
                this.setActiveContent(element);
            }
        },

        addPart: function(id, title, PartClass, index, callback) {
            logger.info('addPart(' + id + ', ' + title + ', ' + PartClass.name + ', ' + index + ', callback)');
            var part
            var partContainer;
            var pane = new ContentPane({
                title: title
            });
            this.getTabContainer().addChild(pane, index);
            partContainer = new MultiContentPartContainer(this.getDataSource(), pane);
            partContainer.createPart(PartClass, callback);
            part = partContainer.getPart();
            this.getContents().set(id, part);
            this.getTabToContentMap().set(pane, part);
            pane.startup();
        },

        /**
         * @param {EditorContent} content
         */
        removeContent: function(content) {
            //TODO
        },

        /**
         * @param {EditorContent} content
         */
        setActiveContent: function(content) {
            logger.info('setActiveContent(' + content + ')');
            var that = this;
            this.activeContent = content;
            setTimeout(function() {
                that.emit(MultiContentEditorPart.TAB_SELECT, content);
            });
        },

        /**
         * @return {EditorContent} content
         */
        getActiveContent: function() {
            return this.activeContent;
        },

        /**
         * @param {Object} id
         * @return {EditorContent}
         */
        getContentById: function(id) {
            return this.getContents().get(id);
        },

        /**
         * @return {TabContainer}
         */
        getTabContainer: function() {
            return this.tabContainer;
        },

        /**
         * @param {Object} tab
         * @return {EditorViewer}
         */
        getContentByTab: function(tab) {
            return this.getTabToContentMap().get(tab);
        },

        /**
         * @return {Map.<Object, {(Part|Viewer|HTMLElement)}>}
         */
        getTabToContentMap: function() {
            return this.tabToContentMap;
        },

        /**
         * @return {Map.<Object, {(Part|Viewer|HTMLElement)}>}
         */
        getContents: function() {
            return this.contents;
        },
    });

    return MultiContentEditorPart;
});
