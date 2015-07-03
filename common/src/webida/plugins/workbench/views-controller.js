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
 * @fileoverview webida - workbench
 *
 * @version: 0.1.0
 * @since: 2013.09.25
 *
 * Src:
 */

/* global timedLogger: true */
/* global on: true */

define([
    'require',
    'webida-lib/plugin-manager-0.1',
    'dojox/layout/ToggleSplitter',            // ToggleSplitter
    'webida-lib/webida-0.3',                  // webida
    'webida-lib/app',                               // app
    'webida-lib/widgets/views/viewmanager',         // vm
    'webida-lib/widgets/views/viewFocusController', // ViewFocusController
    'webida-lib/widgets/views/splitviewcontainer',  // SplitViewContainer
    'other-lib/toastr/toastr',
    'external/lodash/lodash.min',
    'dojo/topic',                             // topic
    'dojo/dom-geometry',                      // geometry
    'dojo/aspect',                            // aspect
    'dojo/dom-class',                         // domClass
    'dojo/dom-style',
    'dijit/layout/BorderContainer',           // BorderContainer
    'dijit/layout/ContentPane',               // ContentPane
    'dojo/dom', 'dijit/form/DropDownButton', 'dijit/DropDownMenu', 'dijit/MenuItem'
], function (
     require,
     pm,
     ToggleSplitter, // This is unused but necessary.
     Webida,
     app,
     vm, ViewFocusController, SplitViewContainer,
     toastr, _,
     topic, geometry, aspect, domClass, domStyle,
     BorderContainer, ContentPane,
     dom, DropDownButton, DropDownMenu, MenuItem) {
    'use strict';

    topic.subscribe('view.unregistered', function (event) {
        viewsController.focusController.unregisterView(event.view);
    });
    topic.subscribe('view.maximize', function (event) {
        viewsController.toggleFullScreen(event.location);
    });

    var GROUPNAME = 'COMMON-VIEW';
    var statusbarText;
    var viewsController = {
        _leftSplitViewContainer : null,
        _rightSplitViewContainer : null,
        _bottomSplitViewContainer : null,
        _topContainer : null,
        leftPanel : null,
        rightPanel : null,
        centerPanel : null,
        bottomPanel : null,
        lastPanelState : {
            initialized: false,
            menubar: '',
            toolbar: '',
            left: '',
            right: '',
            bottom: '',
            height: '',
            width: ''
        },
        _workbenchTopElement : null,
        focusController : new ViewFocusController(),
        _viewMap : [],
        lastStatus : null,
        isFullScreen : false,

        createWorkbenchTopMenus : function () {
            // close top level menu
            $('.app-workbench-middle-content').on('mousedown', function () {
                $(window).trigger('closeTopMenu');
            });
            $('.app-workbench-bottom-content').on('mousedown', function () {
                $(window).trigger('closeTopMenu');
            });
            $('#app-workbench-toolbar').on('mousedown', function () {
                $(window).trigger('closeTopMenu');
            });

            $('#app-workbench-top-logo').bind('click', function () {
                this.toggleMenubar();
            }.bind(this));

            $('#app-workbench-menubar-serapator-btn').bind('click', function () {
                this.toggleMenubar();
            }.bind(this));

        },

        initialize : function (elem) {
            var _self = this;
            var _settings = pm.getAppConfig('webida.common.workbench')['webida.common.workbench:views'];
            var _containerOptions = {
                design: 'sidebar', // headline or sidebar (default: sidebar)
                liveSplitters: false // default false
            };
            var _locations;
            //var _center;
            var leftPanelState, rightPanelState, bottomPanelState;

            // default setting
            leftPanelState = {
                count: 5,
                size: '200px',
                verticalsplit: true,
                collapsed: false,
                minSize: 0,
                maxSize : Infinity,
                groupname: GROUPNAME,
                splitter: true
            };
            rightPanelState = {
                count: 5,
                size: '200px',
                verticalsplit: true,
                collapsed: false,
                minSize: 0,
                maxSize : Infinity,
                groupname: GROUPNAME,
                splitter: true
            };
            bottomPanelState = {
                count: 5,
                size: '200px',
                verticalsplit: true,
                collapsed: false,
                minSize: 0,
                maxSize : Infinity,
                groupname: GROUPNAME,
                splitter: true
            };

            if (_settings) {
                if (_settings.hasOwnProperty('containerOptions')) {
                    _containerOptions = {
                        design: _.isString(_settings.containerOptions.design) ?
                            _settings.containerOptions.design : 'sidebar',
                        liveSplitters: _.isBoolean(_settings.containerOptions.liveSplitters) ?
                            _settings.containerOptions.liveSplitters : false
                    };
                }

                if (_settings.hasOwnProperty('locations')) {
                    _locations = _settings.locations;

                    if (_locations.hasOwnProperty('left')) {
                        leftPanelState = {
                            count: _.isNumber(_locations.left.count) ? _locations.left.count : 5,
                            size: _.isString(_locations.left.size) ? _locations.left.size : '200px',
                            verticalsplit: _.isBoolean(_locations.left.verticalsplit) ?
                                _locations.left.verticalsplit : true,
                            collapsed: _.isBoolean(_locations.left.collapsed) ? _locations.left.collapsed : false,
                            minSize: _.isNumber(_locations.left.minSize) ? _locations.left.minSize : 0,
                            maxSize: _.isNumber(_locations.left.maxSize) ? _locations.left.maxSize : Infinity,
                            groupname: _.isString(_locations.left.groupname) ? _locations.left.groupname : GROUPNAME,
                            splitter: _.isBoolean(_locations.left.splitter) ? _locations.left.splitter :true
                        };
                    }

                    if (_locations.hasOwnProperty('right')) {
                        rightPanelState = {
                            count: _.isNumber(_locations.right.count) ? _locations.right.count : 5,
                            size: _.isString(_locations.right.size) ? _locations.right.size : '200px',
                            verticalsplit: _.isBoolean(_locations.right.verticalsplit) ?
                                _locations.right.verticalsplit : true,
                            collapsed: _.isBoolean(_locations.right.collapsed) ? _locations.right.collapsed : false,
                            minSize: _.isNumber(_locations.right.minSize) ? _locations.right.minSize : 0,
                            maxSize: _.isNumber(_locations.right.maxSize) ? _locations.right.maxSize : Infinity,
                            groupname: _.isString(_locations.right.groupname) ? _locations.right.groupname : GROUPNAME,
                            splitter: _.isBoolean(_locations.right.splitter) ? _locations.right.splitter :true
                        };
                    }

                    if (_locations.hasOwnProperty('bottom')) {
                        bottomPanelState = {
                            count: _.isNumber(_locations.bottom.count) ? _locations.bottom.count : 5,
                            size: _.isString(_locations.bottom.size) ? _locations.bottom.size : '200px',
                            verticalsplit: _.isBoolean(_locations.bottom.verticalsplit) ?
                                _locations.bottom.verticalsplit : true,
                            collapsed: _.isBoolean(_locations.bottom.collapsed) ? _locations.bottom.collapsed : false,
                            minSize: _.isNumber(_locations.bottom.minSize) ? _locations.bottom.minSize : 0,
                            maxSize: _.isNumber(_locations.bottom.maxSize) ? _locations.bottom.maxSize :Infinity,
                            groupname: _.isString(_locations.bottom.groupname) ?
                                _locations.bottom.groupname : GROUPNAME,
                            splitter: _.isBoolean(_locations.bottom.splitter) ? _locations.bottom.splitter :true
                        };
                    }
                }
            }

            this._topContainer =  new BorderContainer({
                style: 'height:100%; width:100%; padding:2px; background-color:#ecf1f6',
                design: _containerOptions.design,
                liveSplitters: _containerOptions.liveSplitters
            }, elem);
            this._topContainer._splitterClass = 'dojox.layout.ToggleSplitter';

            // create top level menu And toolbar
            _self.createWorkbenchTopMenus();

            var minWidth = 10;
            var maxWidth = 90;
            var leftPanel, rightPanel, centerPanel, bottomPanel;

            var lastStatus = app.registerStatusContributorAndGetLastStatus('workbench', function () {

                var getViewLocationInfo  = function (splitVc, panelLocation) {
                    var viewInfoList = [];
                    if (splitVc)  {
                        var i, j;
                        var vcList, vc, viewList, view, siblings;
                        vcList = splitVc.getShowedViewContainers();

                        for (i = 0; i < vcList.length; i++) {
                            vc = vcList[i];
                            viewList = vc.getChildren();

                            siblings = [];
                            for (j = 0; j < viewList.length; j++) {
                                view = viewList[j];
                                siblings.push(view.getId());
                            }

                            for (j = 0; j < viewList.length; j++) {
                                view = viewList[j];
                                var viewInfo = {
                                    id : view.getId(),
                                    panelLocation: panelLocation,
                                    cellIndex : i,
                                    siblings : siblings,
                                    selected : view.isSelected()
                                };
                                viewInfoList.push(viewInfo);
                            }
                        }
                    }
                    return viewInfoList;
                };

                var saveSplitContainerLayout = function (splitContainer) {
                    if (splitContainer) {
                        var status = {viewContainers : [], verticalSplit : splitContainer.get('verticalSplit')};
                        var viewContainers = splitContainer.getShowedViewContainers();
                        var vc, i;
                        var totalW = 0;
                        var totalH = 0;
                        var width, height;
                        for (i = 0; i < viewContainers.length; i++) {
                            vc = viewContainers[i];
                            totalW += geometry.getContentBox(vc.topContainer.domNode).w;
                            totalH += geometry.getContentBox(vc.topContainer.domNode).h;
                        }

                        for (i = 0; i < viewContainers.length; i++) {
                            vc = viewContainers[i];
                            width = 0;
                            height = 0;
                            width = geometry.getContentBox(vc.topContainer.domNode).w;
                            height = geometry.getContentBox(vc.topContainer.domNode).h;
                            if (width > 0) {
                                width = parseInt((width * 100 / totalW), 10) + '%';
                            }
                            if (height > 0) {
                                height = parseInt((height * 100 / totalH), 10) + '%';
                            }
                            status.viewContainers.push({width: width, height: height});
                        }
                        return status;
                    }
                    return null;
                };

                var leftSplitContainer = _self._leftSplitViewContainer;
                var rightSplitContainer = _self._rightSplitViewContainer;
                var bottomSplitContainer = _self._bottomSplitViewContainer;

                var leftCollapsed = _self.isPanelCollapsed('left');
                var rightCollapsed = _self.isPanelCollapsed('right');
                var bottomCollapsed = _self.isPanelCollapsed('bottom');

                var totalW = 0;
                var totalH = 0;
                var width = 0;
                var height = 0;
                var lpsize = leftPanelState.size;
                var rpsize = rightPanelState.size;
                var bpsize = bottomPanelState.size;

                if (centerPanel) {
                    totalW += geometry.getContentBox(centerPanel.domNode).w;
                    totalH += geometry.getContentBox(centerPanel.domNode).h;
                }

                if (leftPanel && (leftCollapsed === false)) {
                    totalW += geometry.getMarginBox(leftPanel.domNode).w;
                }

                if (rightPanel && (rightCollapsed === false)) {
                    totalW += geometry.getMarginBox(rightPanel.domNode).w;
                }

                if (bottomPanel && (bottomCollapsed === false)) {
                    totalH += geometry.getMarginBox(bottomPanel.domNode).h;
                }

                if (!leftCollapsed) {
                    width = geometry.getContentBox(leftPanel.domNode).w;
                    lpsize = parseInt((width * 100 + 0.5) / totalW, 10) + '%';
                }

                if (!rightCollapsed) {
                    width = geometry.getContentBox(rightPanel.domNode).w;
                    rpsize = parseInt((width * 100 + 0.5) / totalW, 10) + '%';
                }

                if (!bottomCollapsed) {
                    height = geometry.getContentBox(bottomPanel.domNode).h;
                    bpsize = parseInt((height * 100 + 0.5) / totalH, 10) + '%';
                }

                var panelState = {};

                if (leftSplitContainer) {
                    panelState.left = {
                        'collapsed': leftCollapsed,
                        'size': lpsize,
                        'splitContainerLayout' : saveSplitContainerLayout(leftSplitContainer),
                        'vertical' : leftSplitContainer.get('verticalSplit'),
                        'views': getViewLocationInfo(leftSplitContainer, 'left')
                    };
                }

                if (rightSplitContainer) {
                    panelState.right = {
                        'collapsed': rightCollapsed,
                        'size': rpsize,
                        'splitContainerLayout' : saveSplitContainerLayout(rightSplitContainer),
                        'vertical' : rightSplitContainer.get('verticalSplit'),
                        'views': getViewLocationInfo(rightSplitContainer, 'right')
                    };
                }

                if (bottomSplitContainer) {
                    panelState.bottom = {
                        'collapsed': bottomCollapsed,
                        'size': bpsize,
                        'splitContainerLayout' : saveSplitContainerLayout(bottomSplitContainer),
                        'vertical' : bottomSplitContainer.get('verticalSplit'),
                        'views': getViewLocationInfo(bottomSplitContainer, 'bottom')
                    };
                }

                return {
                    panelState : panelState
                };

            });

            _self.lastStatus = lastStatus;

            if (lastStatus && lastStatus.hasOwnProperty('panelState')) {
                var panelState = lastStatus.panelState;
                if (!panelState) {
                    return;
                }
                var leftState = null;
                var rightState = null;
                var bottomState = null;

                if (panelState.hasOwnProperty('left')) {
                    leftState = panelState.left;
                }
                if (panelState.hasOwnProperty('right')) {
                    rightState = panelState.right;
                }
                if (panelState.hasOwnProperty('bottom')) {
                    bottomState = panelState.bottom;
                }

                if (leftState) {
                    if (leftState.size && !leftState.collapsed) {
                        if ((leftState.size.split('%').length > 1) && (leftState.size.split('%')[0] >= minWidth)  &&
                            (leftState.size.split('%')[0] <= maxWidth)) {
                            leftPanelState.size = leftState.size;
                        }

                        if (leftPanelState.minSize === leftPanelState.maxSize) {
                            leftPanelState.size = leftPanelState.maxSize  + 'px';
                        }
                    }

                    if (leftState.hasOwnProperty('collapsed')) {
                        leftPanelState.collapsed = leftState.collapsed;
                    }

                    if (leftState.hasOwnProperty('splitContainerLayout')) {
                        leftPanelState.viewContainerLayouts = leftState.splitContainerLayout.viewContainers;
                        leftPanelState.verticalsplit = leftState.splitContainerLayout.verticalSplit;
                    }
                }

                if (rightState) {
                    if (rightState.size && !rightState.collapsed) {
                        if ((rightState.size.split('%').length > 1) && (rightState.size.split('%')[0] >= minWidth)  &&
                            (rightState.size.split('%')[0] <= maxWidth)) {
                            rightPanelState.size = rightState.size;
                        }

                        if (rightPanelState.minSize === rightPanelState.maxSize) {
                            rightPanelState.size = rightPanelState.maxSize + 'px';
                        }
                    }

                    if (rightState.hasOwnProperty('collapsed')) {
                        rightPanelState.collapsed = rightState.collapsed;
                    }

                    if (rightState.hasOwnProperty('splitContainerLayout')) {
                        rightPanelState.viewContainerLayouts = rightState.splitContainerLayout.viewContainers;
                        rightPanelState.verticalsplit = rightState.splitContainerLayout.verticalSplit;
                    }

                }

                if (bottomState) {
                    if (bottomState.size && !bottomState.collapsed) {
                        if ((bottomState.size.split('%').length > 1) &&
                            (bottomState.size.split('%')[0] >= minWidth) &&
                            (bottomState.size.split('%')[0] <= maxWidth)) {
                            bottomPanelState.size = bottomState.size;
                        }

                        if (bottomPanelState.minSize === bottomPanelState.maxSize) {
                            bottomPanelState.size = bottomPanelState.maxSize  + 'px';
                        }
                    }

                    if (bottomState.hasOwnProperty('collapsed')) {
                        bottomPanelState.collapsed = bottomState.collapsed;
                    }

                    if (bottomState.hasOwnProperty('splitContainerLayout')) {
                        bottomPanelState.viewContainerLayouts = bottomState.splitContainerLayout.viewContainers;
                        bottomPanelState.verticalsplit = bottomState.splitContainerLayout.verticalSplit;
                    }
                }
            }

            leftPanel = new ContentPane({
                title: '',
                style: 'width:' + leftPanelState.size + '; padding:0px; overflow: hidden',
                region: 'left',
                splitter: leftPanelState.splitter,
                minSize: leftPanelState.minSize,
                maxSize: leftPanelState.maxSize
            });
            centerPanel = new ContentPane({
                title: '',
                toggleable: false,
                content: '<div id="app-workbench-center-panel" style="height:100%"></div>',
                style: 'width:70%; padding:0px',
                region: 'center',
                splitter: true
            });
            rightPanel = new ContentPane({
                title: '',
                style: 'width:' + rightPanelState.size + '; padding:0px; overflow:hidden',
                region: 'right',
                splitter: rightPanelState.splitter,
                minSize: rightPanelState.minSize,
                maxSize: rightPanelState.maxSize
            });
            bottomPanel = new ContentPane({
                title: '',
                region: 'bottom',
                style: 'height:' + bottomPanelState.size + '; padding:0px; overflow:hidden',
                splitter: bottomPanelState.splitter,
                minSize: bottomPanelState.minSize,
                maxSize: bottomPanelState.maxSize
            });

            this._topContainer.addChild(centerPanel);
            this._topContainer.addChild(leftPanel);
            this._topContainer.addChild(rightPanel);
            this._topContainer.addChild(bottomPanel);

            this._leftSplitViewContainer = new SplitViewContainer();
            this._rightSplitViewContainer = new SplitViewContainer();
            this._bottomSplitViewContainer = new SplitViewContainer();

            this._leftSplitViewContainer.init({
                'splitCount': leftPanelState.count,
                'verticalSplit': leftPanelState.verticalsplit,
                'smartVisible': true,
                'rotatable': true,
                'region': 'left'
            });
            this._rightSplitViewContainer.init({
                'splitCount': rightPanelState.count,
                'verticalSplit': rightPanelState.verticalsplit,
                'smartVisible': true,
                'rotatable': true,
                'region': 'right'
            });
            this._bottomSplitViewContainer.init({
                'splitCount': bottomPanelState.count,
                'verticalSplit': bottomPanelState.verticalsplit,
                'smartVisible': true,
                'rotatable': true,
                'region': 'bottom'
            });

            leftPanel.addChild(this._leftSplitViewContainer.getTopContainer());
            rightPanel.addChild(this._rightSplitViewContainer.getTopContainer());
            bottomPanel.addChild(this._bottomSplitViewContainer.getTopContainer());

            _self.leftPanel = leftPanel;
            _self.rightPanel = rightPanel;
            _self.centerPanel = centerPanel;
            _self.bottomPanel = bottomPanel;

            this._topContainer.startup();

            vm.addToGroup(this._leftSplitViewContainer, leftPanelState.groupname);
            vm.addToGroup(this._rightSplitViewContainer, rightPanelState.groupname);
            vm.addToGroup(this._bottomSplitViewContainer, bottomPanelState.groupname);

            var leftSplitter = _self._getSplitter('left');
            var rightSplitter = _self._topContainer.getSplitter('right');
            var bottomSplitter = _self._getSplitter('bottom');

            aspect.before(leftSplitter, '_handleOnChange', function () {
                topic.publish('editor-panel-resize');
            });

            aspect.before(leftSplitter, '_startDrag', function () {
                topic.publish('editor-panel-resize');
            });

            aspect.before(rightSplitter, '_handleOnChange', function () {
                topic.publish('editor-panel-resize');
            });

            aspect.before(rightSplitter, '_startDrag', function () {
                topic.publish('editor-panel-resize');
            });

            aspect.before(bottomSplitter, '_handleOnChange', function () {
                topic.publish('editor-panel-resize');
            });

            aspect.before(bottomSplitter, '_startDrag', function () {
                topic.publish('editor-panel-resize');
            });

            var vcList;

            if (leftPanelState.viewContainerLayouts &&
                (leftPanelState.viewContainerLayouts.length <= leftPanelState.count)) {
                vcList = this._leftSplitViewContainer.getViewContainers();
                _.each(leftPanelState.viewContainerLayouts, function (viewContainer, index) {
                    if (index > 0 && vcList[index]) {
                        if (leftPanelState.verticalsplit) {
                            $(vcList[index].topContainer.domNode).css('height', viewContainer.height);
                        } else {
                            $(vcList[index].topContainer.domNode).css('width', viewContainer.width);
                        }
                    }
                });
            }

            if (rightPanelState.viewContainerLayouts &&
                (rightPanelState.viewContainerLayouts.length <= rightPanelState.count)) {
                vcList = this._rightSplitViewContainer.getViewContainers();
                _.each(rightPanelState.viewContainerLayouts, function (viewContainer, index) {
                    if (index > 0 && vcList[index]) {
                        if (rightPanelState.verticalsplit) {
                            $(vcList[index].topContainer.domNode).css('height', viewContainer.height);
                        } else {
                            $(vcList[index].topContainer.domNode).css('width', viewContainer.width);
                        }
                    }
                });
            }

            if (bottomPanelState.viewContainerLayouts && (
                bottomPanelState.viewContainerLayouts.length <= bottomPanelState.count)) {
                vcList = this._bottomSplitViewContainer.getViewContainers();
                _.each(bottomPanelState.viewContainerLayouts, function (viewContainer, index) {
                    if (index > 0 && vcList[index]) {
                        if (bottomPanelState.verticalsplit) {
                            $(vcList[index].topContainer.domNode).css('height', viewContainer.height);
                        } else {
                            $(vcList[index].topContainer.domNode).css('width', viewContainer.width);
                        }
                    }
                });
            }

            if (leftPanelState.collapsed) {
                this.collapsePanel('left');
            }

            if (rightPanelState.collapsed) {
                this.collapsePanel('right');
            }

            if (bottomPanelState.collapsed) {
                this.collapsePanel('bottom');
            }

            Webida.auth.getMyInfo(function (e, data) {
                if (e) {
                    console.error('getMyInfo error: ' + e);
                } else {
                    var menu = new DropDownMenu({ style: 'display: none;' });
                    var exts = pm.getExtensions('webida.common.workbench:uidMenu') || [];
                    exts.forEach(function (ext) {
                        var menuItem = new MenuItem({
                            label: ext.label,
                            onClick: function () {
                                require([ext.module], function (mod) {
                                    mod[ext.handler]();
                                });
                            }
                        });
                        menu.addChild(menuItem);
                    });

                    menu.startup();

                    var button = new DropDownButton({
                        label: data.email,
                        name: 'userinfo',
                        dropDown: menu,
                        id: 'userinfoButton'
                    });
                    dom.byId('dropDownUserinfo').appendChild(button.domNode);
                }
            });

        },

        getActivatedPanel : function () {
            var _self = this;
            var activeElem = document.activeElement;
            var pNode = activeElem.parentNode;
            if (activeElem) {
                while (pNode) {
                    pNode = pNode.parentNode;
                    if (pNode === _self.leftPanel.domNode) {
                        return;
                    }
                    else if (pNode === _self.rightPanel.domNode) {
                        return;
                    }
                    else if (pNode === _self.bottomPanel.domNode) {
                        return;
                    }
                    else if (pNode === _self.centerPanel.domNode) {
                        return;
                    }
                }
            }
            return null;
        },

        getView : function (id) {
            return vm.getView(id);
        },

        appendView : function (view, location) {
            var _self = this;
            var splitVc = null;
            if (location === 'left') {
                splitVc = _self._leftSplitViewContainer;
            } else if (location === 'right') {
                splitVc = _self._rightSplitViewContainer;
            } else if (location === 'bottom') {
                splitVc = _self._bottomSplitViewContainer;
            }

            if (splitVc) {
                var focusedVc = splitVc.getFocusedViewContainer();
                if (focusedVc) {
                    focusedVc.addLast(view);
                    return true;
                }
            }

            return false;
        },

        _addView : function (view, location, cellIndex, tabIndex) {
            var _self = this;
            var lastStatus = this.lastStatus;
            var selected = false;

            var findTabIndexBySiblings = function (view, viewContainer, siblings) {
                var i, j, sibling;
                var previousSiblings = [];
                var nextSiblings = [];
                var index = -1;
                var found = false;
                var child;

                for (i = 0; i < siblings.length; i++) {
                    sibling = siblings[i];
                    if (sibling === view.getId()) {
                        found = true;
                        continue;
                    }

                    if (found) {
                        nextSiblings.push(sibling);
                    } else {
                        previousSiblings.push(sibling);
                    }
                }

                var children = viewContainer.getChildren();

                // find from nextSilings
                found = false;
                for (i = 0; i < nextSiblings.length; i++) {
                    sibling = nextSiblings[i];
                    if (found) {
                        break;
                    }
                    for (j = 0 ; j < children.length; j++) {
                        child = children[j];
                        if (sibling === child.getId()) {
                            index = j;
                            found = true;
                            break;
                        }
                    }
                }

                if (!found) {
                    // find from previousSiblings
                    for (i = previousSiblings.length - 1; i >= 0; i--) {
                        sibling = previousSiblings[i];
                        if (found) {
                            break;
                        }
                        for (j = 0 ; j < children.length; j++) {
                            child = children[j];
                            if (sibling === child.getId()) {
                                index = j + 1;
                                found = true;
                                break;
                            }
                        }
                    }
                }

                return index;
            };

            if (lastStatus && lastStatus.hasOwnProperty('panelState')) {
                var panelState = lastStatus.panelState;
                var lpViews = [];
                var rpViews = [];
                var bpViews = [];

                if (panelState.hasOwnProperty('left') && panelState.left.hasOwnProperty('views')) {
                    lpViews = panelState.left.views;
                }

                if (panelState.hasOwnProperty('right') && panelState.right.hasOwnProperty('views')) {
                    rpViews = panelState.right.views;
                }

                if (panelState.hasOwnProperty('bottom') && panelState.left.hasOwnProperty('views')) {
                    bpViews = panelState.bottom.views;
                }

                _.each(lpViews, function (lpview) {
                    if (lpview.id === view.getId()) {
                        location = lpview.panelLocation;
                        cellIndex = lpview.cellIndex;
                        selected = lpview.selected;
                        var viewContainer = _self._getViewContainer(location, cellIndex);
                        if (viewContainer) {
                            tabIndex = findTabIndexBySiblings(view, viewContainer, lpview.siblings);
                        }
                    }
                });

                _.each(rpViews, function (rpview) {
                    if (rpview.id === view.getId()) {
                        location = rpview.panelLocation;
                        cellIndex = rpview.cellIndex;
                        selected = rpview.selected;
                        var viewContainer = _self._getViewContainer(location, cellIndex);
                        if (viewContainer) {
                            tabIndex = findTabIndexBySiblings(view, viewContainer, rpview.siblings);
                        }
                    }
                });

                _.each(bpViews, function (btview) {
                    if (btview.id === view.getId()) {
                        location = btview.panelLocation;
                        cellIndex = btview.cellIndex;
                        selected = btview.selected;
                        var viewContainer = _self._getViewContainer(location, cellIndex);
                        if (viewContainer) {
                            tabIndex = findTabIndexBySiblings(view, viewContainer, btview.siblings);
                        }
                    }
                });

                if (panelState.hasOwnProperty('bottom') && panelState.left.hasOwnProperty('views')) {
                    bpViews = panelState.bottom.views;
                }
            }

            this._viewMap[view.getId()] = view;
            var vc = this._getViewContainer(location, cellIndex);
            var index;

            if (tabIndex !== undefined) {
                index = tabIndex;
            } else {
                index = -1;
            }

            if (vc) {
                vc.addAt(view, index);
                if (selected) {
                    view.select();
                }
            }
        },

        removeView : function (view) {
            if (view) {
                var vc = view.getViewContainer();
                if (vc) {
                    vc.remove(view);
                    var id = this._viewMap.view.getId();
                    delete this._viewMap[id];
                }
            }

            vm.removeView(view);
        },

        moveView : function (view, viewContainer, cellIndex, tabIndex) {
            this.removeView(view);
            this.addView(view, location, cellIndex, tabIndex);
        },

        toggleFullScreen : function (location) {
            var t = timedLogger.log('hina temp: exiting toggleFullScreen');

            var _self = this;
            var menubarClosed;
            if (this.getMenubarState() === 'hide') {
                menubarClosed = true;
            } else {
                menubarClosed = false;
            }

            var toolbarClosed;
            if (this.getToolbarState() === 'hide') {
                toolbarClosed = true;
            } else {
                toolbarClosed = false;
            }

            //var leftPanelClosed = _self.isPanelCollapsed('left');
            //var rightPanelClosed = _self.isPanelCollapsed('right');
            //var bottomPanelClosed = _self.isPanelCollapsed('bottom');

            var leftSplitter, rightSplitter, bottomSplitter;
            leftSplitter = _self._getSplitter('left');
            rightSplitter = _self._getSplitter('right');
            bottomSplitter = _self._getSplitter('bottom');

            if (_self.isFullScreen) {
                if (location) {
                    _self.restorePanel(location);
                }

                if (_self.getMenubarState() !== _self.lastPanelState.menubar) {
                    _self.setMenubarState(_self.lastPanelState.menubar);
                }
                if (_self.getToolbarState() !== _self.lastPanelState.toolbar) {
                    _self.setToolbarState(_self.lastPanelState.toolbar);
                }
                this._topContainer.resize();

                if (leftSplitter && (leftSplitter.get('state') !== _self.lastPanelState.left)) {
                    leftSplitter.set('state', _self.lastPanelState.left);
                }

                if (rightSplitter && (rightSplitter.get('state') !== _self.lastPanelState.right)) {
                    rightSplitter.set('state', _self.lastPanelState.right);
                }

                if (bottomSplitter && (bottomSplitter.get('state') !== _self.lastPanelState.bottom)) {
                    bottomSplitter.set('state', _self.lastPanelState.bottom);
                }

            } else {
                _self.lastPanelState.menubar = _self.getMenubarState();
                _self.lastPanelState.toolbar = _self.getToolbarState();

                if (leftSplitter) {
                    _self.lastPanelState.left = leftSplitter.get('state');
                }

                if (rightSplitter) {
                    _self.lastPanelState.right = rightSplitter.get('state');
                }

                if (bottomSplitter) {
                    _self.lastPanelState.bottom = bottomSplitter.get('state');
                }

                _self.collapsePanel('left');
                _self.collapsePanel('right');
                _self.collapsePanel('bottom');

                if (location) {
                    _self.maximizePanel(location);
                }

                _self.setMenubarState('hide');
                _self.setToolbarState('hide');
                this._topContainer.resize();
            }
            _self.isFullScreen = !_self.isFullScreen;
            timedLogger.log('hina temp: exiting toggleFullScreen', t);
        },

        _getSplitter : function (location) {
            var _self = this;
            //TODO : FIXME
            if ((location === 'left') || (location === 'right') || (location === 'bottom') || (location === 'center')) {
                return _self._topContainer.getSplitter(location);
            }
            return null;
        },

        isPanelCollapsed : function (location) {
            var _self = this;
            var splitter = _self._getSplitter(location);
            if (splitter) {
                if (splitter.get('state') === 'closed') {
                    return true;
                }
            }
            return false;
        },

        collapsePanel : function (location) {
            var _self = this;
            var splitter = _self._getSplitter(location);
            if (splitter && (splitter.get('state') !== 'closed')) {
                splitter.set('state', 'closed');
            }
        },

        expandPanel : function (location) {
            var _self = this;
            var splitter = _self._getSplitter(location);
            if (splitter && (splitter.get('state') !== 'full')) {
                splitter.set('state', 'full');
            }
        },

        _getPanel : function (location) {
            var _self = this;
            var children = _self._topContainer.getChildren();
            var panel = null;
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (child.region && child.region === location) {
                    panel = child;
                    break;
                }
            }
            return panel;
        },

        maximizePanel : function (location) {
            var _self = this;
            var panel = _self._getPanel(location);
            if (panel) {
                _self.expandPanel(location);
                switch (location) {
                case 'bottom' :
                    _self.lastPanelState.height = domStyle.get(panel.domNode, 'height');
                    domStyle.set(panel.domNode, 'height', '100%');
                    break;
                case 'left' :
                case 'right' :
                    _self.lastPanelState.width = domStyle.get(panel.domNode, 'width');
                    domStyle.set(panel.domNode, 'width', '100%');
                    break;
                }
            }
        },

        restorePanel : function (location) {
            var _self = this;
            var panel = _self._getPanel(location);
            if (panel) {
                switch (location) {
                case 'bottom' :
                    domStyle.set(panel.domNode, 'height', _self.lastPanelState.height + 'px');
                    break;
                case 'left' :
                case 'right' :
                    domStyle.set(panel.domNode, 'width', _self.lastPanelState.width + 'px');
                    break;
                }
            }
        },

        _getViewContainer : function (location, cellIndex) {
            var splitVc = null;
            if (location === 'left') {
                splitVc = this._leftSplitViewContainer;
            } else if (location === 'right') {
                splitVc = this._rightSplitViewContainer;
            } else if (location === 'bottom') {
                splitVc = this._bottomSplitViewContainer;
            }
            if (splitVc) {
                var index;
                if (cellIndex) {
                    index = cellIndex;
                } else {
                    index = 0;
                }
                return splitVc.getViewContainer(cellIndex);
            }
            return null;
        },

        getWorkbenchTopElement : function () {
            if (this._workbenchTopElement === null) {
                this._workbenchTopElement = document.getElementById('app-workbench');
            }
            return this._workbenchTopElement;
        },

        setMenubarState : function (state) {
            if (state === 'hide') {
                if (domClass.contains(viewsController.getWorkbenchTopElement(), 'workbenchMenubarHide') === false) {
                    domClass.add(viewsController.getWorkbenchTopElement(), 'workbenchMenubarHide');
                }
            } else if (state === 'show') {
                domClass.remove(viewsController.getWorkbenchTopElement(), 'workbenchMenubarHide');
            }
        },

        getMenubarState : function () {
            if (domClass.contains(viewsController.getWorkbenchTopElement(), 'workbenchMenubarHide') === true) {
                return 'hide';
            } else {
                return 'show';
            }
        },

        setToolbarState : function (state) {
            if (state === 'hide') {
                if (domClass.contains(viewsController.getWorkbenchTopElement(), 'workbenchToolbarHide') === false) {
                    domClass.add(viewsController.getWorkbenchTopElement(), 'workbenchToolbarHide');
                }
            } else if (state === 'show') {
                domClass.remove(viewsController.getWorkbenchTopElement(), 'workbenchToolbarHide');
            }
        },

        getToolbarState : function () {
            if (domClass.contains(viewsController.getWorkbenchTopElement(), 'workbenchToolbarHide') === true) {
                return 'hide';
            } else {
                return 'show';
            }
        },

        toggleMenubar : function () {
            if (this.getMenubarState() === 'show') {
                this.setMenubarState('hide');
            } else {
                this.setMenubarState('show');
            }
            this._topContainer.resize();
        },

        toggleToolbar : function () {
            if (this.getToolbarState() === 'show') {
                this.setToolbarState('hide');
            } else {
                this.setToolbarState('show');
            }
            this._topContainer.resize();
        },

        setStatusbarText : function (text) {
            statusbarText = text;
        },

        _setStatusbarText : function (text) {
            var statusContentElem = $(this.getWorkbenchTopElement()).find('.content-filepath');
            statusContentElem.text(text);
        },

        setStatusbarInfos : function (infoList) {
            var statusContentElem = $(this.getWorkbenchTopElement()).find('.content-filepath');
            statusContentElem.html('');
            var addItem = function (text, tooltip) {
                var item = $('<span class="statusbar-content-item"></span>');
                item.attr('data-tooltip', tooltip);
                item.text(text);
                item.appendTo(statusContentElem);
            };

            var addSeparator = function () {
                var item = $('<div class="statusbar-content-separator"></div>');
                item.appendTo(statusContentElem);
            };

            for (var i = 0; i < infoList.length; i++) {
                var info = infoList[i];
                var text = info.text;
                var tooltip = '';
                if (info.hasOwnProperty(tooltip)) {
                    tooltip = info.tooltip;
                }
                addItem(text, tooltip);
                if (i < infoList.length - 1) {
                    addSeparator();
                }
            }
        },

        showViewList : function () {
            var groupList = vm.getGroupListByName(this.GROUP_NAME);
            _.each(groupList, function (splitContainer) {
                var viewContainers = splitContainer.getViewContainers();
                _.each(viewContainers, function (viewContainer) {
                    var children = viewContainer.getChildren();
                    _.each(children, function (view) {
                        var opt = {};
                        opt.fields = {
                            title: view.getTitle()
                        };
                        viewsController.focusController.registerView(view, opt);
                    });
                });

            });

            var fieldLayout = [
                {'name' : 'Title', 'field' : 'title', 'width' : '150'},
            ];
            this.focusController.showViewList(fieldLayout, 'Select View from List');
        },

        /* support event type : mousemove, mouseup */
        watchSplitters : function (event, callback) {
            var moveConnects = {};
            var bc = this._topContainer;

            _.forEach(['left', 'right', 'bottom'], function (region) {
                var spl = bc.getSplitter(region);

                if (event === 'mousemove') {
                    aspect.after(spl, '_startDrag', function () {
                        moveConnects[spl.widgetId] = on(spl.domNode, 'mousemove', function () {
                            var data = {
                                region: spl.region,
                                x: !spl.horizontal ? spl.domNode.style.left : 0,
                                y: spl.horizontal ? spl.domNode.style.top : 0
                            };

                            callback(data);
                        });
                    });
                }

                aspect.after(spl, '_stopDrag', function () {
                    if (event === 'mouseup') {
                        var data = {
                            region: spl.region,
                            x: !spl.horizontal ? spl.domNode.style.left : 0,
                            y: spl.horizontal ? spl.domNode.style.top : 0
                        };

                        callback(data);
                    } else if (event === 'mousemove') {
                        moveConnects[spl.widgetId].remove();
                        delete moveConnects[spl.widgetId];
                    }
                });
            });
        }

    };

    return viewsController;
});
