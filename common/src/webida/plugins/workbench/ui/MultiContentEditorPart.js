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
    './MultiContentPartContainer',
    './Part'
], function(
    TabContainer,
    ContentPane,
    genetic, 
    Logger,
    EditorPart,
    MultiContentPartContainer,
    Part
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
         * Prepares required components.
         */
        onCreate: function() {
            logger.info('%conCreate()', 'color:orange');
            var container = this.getContainer();
            this.createTabContainer(container.getContentNode());
            this.createContents();
        },

        /**
         * Create contents and add to sub-tab.
         * @abstract
         */
        createContents: function() {
            throw new Error('createContents() should be implemented by ' + this.constructor.name);
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
         * @private
         */
        _addContent: function(id, title, index, callback, exec) {
            var content;
            var pane = new ContentPane({
                title: title
            });
            this.getTabContainer().addChild(pane, index);
            content = exec(pane);
            this.getContents().set(id, content);
            this.getTabToContentMap().set(pane, content);
            this._execFunc(callback, content);
            if (this.getContents().size === 1) {
                this.setActiveContent(content);
            }
        },

        /**
         * @param {Object} id
         * @param {string} title
         * @param {number} index
         * @param {HTMLElement} element
         * @param {MultiContentEditorPart~addHtmlElementCallback} callback
         */
        /**
         * @callback MultiContentEditorPart~addHtmlElementCallback
         * @param {HTMLElement} content
         */
        addHtmlElement: function(id, title, index, element, callback) {
            this._addContent(id, title, index, callback, function(pane) {
                pane.domNode.appendChild(element);
                pane.startup();
                return element;
            });
        },

        /**
         * @param {Object} id
         * @param {string} title
         * @param {number} index
         * @param {Function} PartClass
         * @param {DataSource} dataSource
         * @param {MultiContentEditorPart~addPartCallback} callback
         */
        /**
         * @callback MultiContentEditorPart~addPartCallback
         * @param {Part} part
         */
        addPart: function(id, title, index, PartClass, dataSource, callback) {
            var that = this;
            var dataSource = dataSource || this.getDataSource();
            this._addContent(id, title, index, callback, function(pane) {
                var part
                var partContainer;
                partContainer = new MultiContentPartContainer(dataSource, pane);
                partContainer.setParent(that.getContainer());
                partContainer.createPart(PartClass, callback);
                part = partContainer.getPart();
                pane.startup();
                return part;
            });
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
         * @return {(Part|HTMLElement)}
         */
        getActiveContent: function() {
            return this.activeContent;
        },

        /**
         * @param {Object} id
         * @return {(Part|HTMLElement)}
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
         * @return {(Part|HTMLElement)}
         */
        getContentByTab: function(tab) {
            return this.getTabToContentMap().get(tab);
        },

        /**
         * @return {Map.<Object, {(Part|HTMLElement)}>}
         */
        getTabToContentMap: function() {
            return this.tabToContentMap;
        },

        /**
         * @return {Map.<Object, {(Part|HTMLElement)}>}
         */
        getContents: function() {
            return this.contents;
        },

        /**
         * @override
         */
        save: function() {
            var content = this.getActiveContent();
            if ( content instanceof EditorPart) {
                return content.save();
            }
        },

        /**
         * @override
         */
        isDirty: function() {
            var content = this.getActiveContent();
            if ( content instanceof EditorPart) {
                return content.isDirty();
            } else {
                return false;
            }
        },

        /**
         * @override
         */
        getContextMenuItems: function(allItems) {
            var content = this.getActiveContent();
            if (content) {
                return content.getContextMenuItems(allItems);
            } else {
                return null;
            }
        }
    });

    MultiContentEditorPart.TAB_SELECT = 'tabSelect';

    return MultiContentEditorPart;
});
