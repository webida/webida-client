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

define([
    'external/lodash/lodash.min',
    'dijit/layout/TabContainer',
    'dijit/layout/ContentPane',
    'dijit/Tooltip',
    'dijit/layout/BorderContainer',
    './viewmanager',
    'dojo/domReady!'
], function (_, TabContainer, ContentPane, Tooltip, BorderContainer, vm) {
    'use strict';

    var view = function (id, title, option) {

        option = option || {};
        this._parent = null;
        this._tabDragable = true;	// Default : true
        this.contentPane = null;
        this._viewContainer = null;
        this.id = id;
        if (id && title) {
            var options = _.extend({
                id : id,
                title: title,
                closable: false,
                style: 'width:100%; height:100%; padding: 0; border: 1px solid #dadfe4 !important'
            }, option);
            this.contentPane = new ContentPane(options);
        } else {
            console.log('id or title is null');
        }
        vm.addView(this);
    };

    view.prototype = {
        get : function (propName) {
            if (propName === 'title') {
                return this.contentPane.get('title');
            } else if (propName === 'closable') {
                return this.contentPane.get('closable');
            } else if (propName === 'tooltip') {
                return this.contentPane.get('tooltip');
            } else if (propName === 'content') {
                return this.contentPane.get('content').childNodes[0];
            } else if (propName === 'iconClass') {
                return this.contentPane.get('iconClass');
            }
        },

        set : function (propName, value) {
            if (propName === 'title') {
                this.contentPane.set('title', value);
            } else if (propName === 'closable') {
                this.contentPane.set('closable', value);
            } else if (propName === 'tooltip') {
                this.contentPane.set('tooltip', value);
            } /*else if (propName === 'content') {
                if (value) {
                    //this.contentPane.get('closable').childNodes[0].append(value);
                } else {
                    //this.contentPane.get('closable').childNodes[0].append(value);
                }
            } */ else if (propName === 'iconClass', value) {
                this.contentPane.set('iconClass', value);
            }
        },

        getIconClass : function () {
            return this.contentPane.iconClass;
        },

        setIconClass: function (iconClass) {
            this.contentPane.set('iconClass', iconClass);
        },

        getTopContainer : function () {
            return this.contentPane;
        },

        getId : function () {
            return this.id;
        },

        getParent : function () {
            return this._parent;
        },

        setParent : function (parent) {
            this._parent = parent;
        },

        getViewContainer : function () {
            //TODO FIXME
            var parent = this.contentPane.getParent();
            if (parent && parent.hasOwnProperty('viewContainerObject')) {
                return parent.viewContainerObject;
            }

            return null;
        },
        // prevent tab move
        setTabDragable : function (boolean) {
            this._tabDragable = boolean;
        },

        getTabDragable : function () {
            return this._tabDragable;
        },

        setTitle : function (title) {
            this.contentPane.set('title', title);
        },

        getTitle : function () {
            return this.contentPane.get('title');
        },

        setTooltip : function (tooltip) {
            this.contentPane.set('tooltip', tooltip);
        },

        getTooltip : function () {
            return this.contentPane.get('tooltip');
        },

        setContent : function (content) {
            this.contentPane.set('content', content);
        },

        getContent : function () {
            return this.contentPane.domNode.childNodes[0];
            //return this.contentPane.get('content');		???
        },

        destroy : function () {
            this.contentPane.destroyRecursive();
            this.contentPane = null;
            vm.removeView(this);
        },

        select : function (forceFireEvent) {
            var parent = this.getParent();
            if (parent) {
                parent.select(this, forceFireEvent);
            }
        },

        isSelected : function () {
            var viewContainer = this.getParent();
            if (viewContainer) {
                var contentPane = viewContainer.tabContainer.get('selectedChildWidget');
                if (contentPane && (contentPane === this.contentPane)) {
                    return true;
                }
            }
            return false;
        },

        emphasizeTitle : function () {
            var parent = this.getParent();
            if (parent) {
                var index = parent.getViewIndex(this);
                if (index >= 0) {
                    var titleNode = this.tabContainer.tablist.containerNode.childNodes[index];
                    if (titleNode) {
                        $(titleNode[3]).addClass('emphadize-view-title');
                    }
                }
            }
        },

        resetViewTitle : function () {
            var parent = this.getParent();
            if (parent) {
                var index = parent.getViewIndex(this);
                if (index >= 0) {
                    var titleNode = this.tabContainer.tablist.containerNode.childNodes[index];
                    if (titleNode) {
                        $(titleNode[3]).removeClass('emphadize-view-title');
                    }
                }
            }
        },

    };

    return view;
});
