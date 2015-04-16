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
    'webida-lib/util/browserUtil',
    'dijit/layout/BorderContainer',
    'dijit/layout/ContentPane',
    'dojo/dom-geometry',
    'dojo/dom-style',
    'dojo/dom-class',
    'widgets/views/viewmanager'
], function(BrowserUtil, BorderContainer, ContentPane, geometry, domStyle, domClass, vm) {
    'use strict';

    var viewDnDManager = {
        _isDragging: false,
        _draggingData: null,
        _view: null,
        _viewContainerList: [],
        _currentViewContainer: null,
        INSERT_EDGE_WIDTH: 36,
        VIEWCONTAINER_PADDING: 4,
        FEEDBACK_EDGE_COLOR: 'RGBA(0, 128, 255, 0.7)',
        FEEDBACK_EDGE_COLOR_HOVER: 'RGBA(0, 255, 255, 0.7)',
        FEEDBACK_CONTENT_COLOR: 'RGBA(0, 128, 255, 0.5)',

        initialize: function( /*elem*/ ) {},

        dragStart: function(view, data) {
            this._view = view;
            this._draggingData = data;
            this._isDragging = true;
            this._showViewContainerEventElems(false);
            this.initViewcontainers(view);
        },

        dragEnd: function() {
            this.unInitViewContainers(this._view);
            this._showViewContainerEventElems(true);
            this._clear();
        },

        drag: function(ev) {
            var vcItem = null;
            var bFind = false;
            for (var i = 0; i < this._viewContainerList.length; i++) {
                vcItem = this._viewContainerList[i];
                if (this._isInGeometry(vcItem.tabGeo, ev.mousePosition)) {
                    this.setCurrentViewContainer(vcItem.vc);
                    var event = {
                        viewContainer: vcItem.vc,
                        mousePosition: ev.mousePosition
                    };
                    this.dragOver(event);
                    bFind = true;
                    break;
                }
            }

            if (bFind === false) {
                this.setCurrentViewContainer(null);
            }
        },

        dragOver: function(ev) {
            if (this.isDragging() === false) {
                return;
            }

            var feedbackInfo = this.getFeedbackInfo(ev.viewContainer, ev.mousePosition);
            this.showFeedbackByFeedbackInfo(feedbackInfo);
        },

        drop: function( /*ev*/ ) {},

        dragLeave: function( /*ev*/ ) {},

        isDragging: function() {
            return this._isDragging;
        },

        getDraggingData: function() {
            return this._draggingData;
        },

        getDraggingView: function() {
            return this._view;
        },

        initViewcontainers: function(view) {
            if (view && view.getParent() && view.getParent().getParent()) {
                var splitVc = view.getParent().getParent();
                var groupName = vm.getGroupName(splitVc);
                var groupList = vm.getGroupListByName(groupName);
                var vcList = null;
                var vc = null;
                for (var i = 0; i < groupList.length; i++) {
                    vcList = groupList[i].getShowedViewContainers();
                    for (var j = 0; j < vcList.length; j++) {
                        vc = vcList[j];
                        var vcItem = {};
                        vcItem.vc = vc;
                        vcItem.tabGeo = geometry.position(vc.tabContainer.domNode);
                        vcItem.titleGeo = geometry.position(vc.getTablistNode());
                        vcItem.contentGeo = geometry.position(vc.getContainerNode());
                        this._viewContainerList.push(vcItem);
                        this.initFeedbacks(vc);
                    }
                }
            }
        },

        unInitViewContainers: function(view) {
            if (view && view.getParent() && view.getParent().getParent()) {
                var splitVc = view.getParent().getParent();
                var groupName = vm.getGroupName(splitVc);
                var groupList = vm.getGroupListByName(groupName);
                var vcList = null;
                for (var i = 0; i < groupList.length; i++) {
                    vcList = groupList[i].getShowedViewContainers();
                    for (var j = 0; j < vcList.length; j++) {
                        this.unInitFeedbacks(vcList[j]);
                    }
                }
                this._viewContainerList.splice(0, this._viewContainerList.length);
            }
        },

        hideFeedbacks: function(viewContainer) {
            var titleFeedback = viewContainer.getFeedbackByLocation('title');
            var contentFeedback = viewContainer.getFeedbackByLocation('content');
            domStyle.set(titleFeedback, 'display', 'none');
            domStyle.set(contentFeedback, 'display', 'none');
        },

        showFeedback: function( /*viewContainer, command*/ ) {},

        unInitFeedbacks: function(viewContainer) {
            var feedbacks = viewContainer.getFeedbacks();
            Object.keys(feedbacks).forEach(function(key) {
                domStyle.set(feedbacks[key], 'display', 'none');
            });
        },

        initFeedbacks: function(viewContainer) {
            var tabContentGeometry = geometry.position(viewContainer.tabContainer.domNode);
            var contentGeometry = geometry.position(viewContainer.getContainerNode());
            var titleGeometry = geometry.position(viewContainer.getTablistNode());
            var eventElem = viewContainer.getFeedbackByLocation('event');
            var titleElem = viewContainer.getFeedbackByLocation('title');
            var contentElem = viewContainer.getFeedbackByLocation('content');
            var elem;
            domStyle.set(eventElem, 'display', 'block');

            contentGeometry.x -= tabContentGeometry.x;
            //contentGeometry.y -= tabContentGeometry.y;
            contentGeometry.y -= titleGeometry.y;

            titleGeometry.x -= tabContentGeometry.x;
            titleGeometry.y -= tabContentGeometry.y;

            var feedbackGeom = this._getFeedbackGeometries(viewContainer);
            var feedbackGeomExpanded = {};
            if (feedbackGeom.hasOwnProperty('center') && feedbackGeom.hasOwnProperty('left') &&
                feedbackGeom.hasOwnProperty('top') && feedbackGeom.hasOwnProperty('right') &&
                feedbackGeom.hasOwnProperty('bottom')) {
                feedbackGeomExpanded.content = this._expandGeometry(contentGeometry, 0);
                feedbackGeomExpanded.center = this._expandGeometry(feedbackGeom.center, -1);
                feedbackGeomExpanded.left = this._expandGeometry(feedbackGeom.left, -1);
                feedbackGeomExpanded.top = this._expandGeometry(feedbackGeom.top, -1);
                feedbackGeomExpanded.right = this._expandGeometry(feedbackGeom.right, -1);
                feedbackGeomExpanded.bottom = this._expandGeometry(feedbackGeom.bottom, -1);
                this._setContentBox(titleElem, titleGeometry);
                this._setContentBox(contentElem, feedbackGeomExpanded.content);

                var edges = this.getAvailableEdges(viewContainer, this._view);
                var loc;
                for (var i = 0; i < edges.length; i++) {
                    loc = edges[i];
                    elem = viewContainer.getFeedbackByLocation(loc);
                    if (elem) {
                        domStyle.set(elem, 'display', 'block');
                        if (loc === 'center') {
                            this._setStyles(elem, this._getFeedbackStyles(feedbackGeomExpanded.center, 'center'));
                        } else if (loc === 'left') {
                            this._setStyles(elem, this._getFeedbackStyles(feedbackGeomExpanded.left, 'left'));
                        } else if (loc === 'top') {
                            this._setStyles(elem, this._getFeedbackStyles(feedbackGeomExpanded.top, 'top'));
                        } else if (loc === 'right') {
                            this._setStyles(elem, this._getFeedbackStyles(feedbackGeomExpanded.right, 'right'));
                        } else if (loc === 'bottom') {
                            this._setStyles(elem, this._getFeedbackStyles(feedbackGeomExpanded.bottom, 'bottom'));
                        }
                    }
                }
            }
        },

        showFeedbackByFeedbackInfo: function(feedbackInfo) {
            var baseArea = feedbackInfo.baseArea;
            var viewContainer = feedbackInfo.targetViewContainer;
            //console.log('showFeedbackByFeedbackInfo', baseArea, feedbackInfo.feedbackLocation);
            if (!baseArea || !viewContainer) {
                return;
            }

            var titleElem = viewContainer.getFeedbackByLocation('title');
            var titleContent = viewContainer.getFeedbackByLocation('titleContent');
            var contentElem = viewContainer.getFeedbackByLocation('content');
            var contentCenter = viewContainer.getFeedbackByLocation('center');
            var contentLeft = viewContainer.getFeedbackByLocation('left');
            var contentTop = viewContainer.getFeedbackByLocation('top');
            var contentRight = viewContainer.getFeedbackByLocation('right');
            var contentBottom = viewContainer.getFeedbackByLocation('bottom');
            if (baseArea === 'title') {
                domStyle.set(contentElem, 'display', 'none');
                domStyle.set(titleElem, 'display', 'block');
                domStyle.set(titleContent, 'display', 'block');
                this._setStyles(titleContent, feedbackInfo.styles);
            } else if (baseArea === 'content') {
                domStyle.set(contentElem, 'display', 'block');
                domStyle.set(titleElem, 'display', 'none');
                var loc = feedbackInfo.feedbackLocation;

                domClass.remove(contentCenter, 'activate');
                domClass.remove(contentLeft, 'activate');
                domClass.remove(contentTop, 'activate');
                domClass.remove(contentRight, 'activate');
                domClass.remove(contentBottom, 'activate');

                if (loc === 'center') {
                    domClass.add(contentCenter, 'activate');
                } else if (loc === 'left') {
                    domClass.add(contentLeft, 'activate');
                } else if (loc === 'top') {
                    domClass.add(contentTop, 'activate');
                } else if (loc === 'right') {
                    domClass.add(contentRight, 'activate');
                } else if (loc === 'bottom') {
                    domClass.add(contentBottom, 'activate');
                }
            }
        },

        setCurrentViewContainer: function(vc) {
            var curVc = this.getCurrentViewContainer();
            if (curVc !== vc) {
                this._currentViewContainer = vc;
                if (curVc) {
                    this.hideFeedbacks(curVc);
                }
            }
        },

        getCurrentViewContainer: function() {
            return this._currentViewContainer;
        },

        _getFeedbackStyles: function(geometry, location) {
            var styles = {};
            var edgeWidth;
            if (geometry.w > geometry.h) {
                edgeWidth = geometry.h;
            } else {
                edgeWidth = geometry.w;
            }

            if (location === 'center') {
                styles.left = geometry.x + 'px';
                styles.top = geometry.y + 'px';
                styles.width = geometry.w + 'px';
                styles.height = geometry.h + 'px';
            } else {
                // the style property to set in DOM-accessor format ("borderWidth", not "border-width")
                styles.borderWidth = edgeWidth + 'px';
                if (location === 'left') {
                    styles.left = geometry.x + 'px';
                    styles.top = geometry.y - edgeWidth + 'px';
                    styles.width = 0;
                    styles.height = geometry.h + 'px';
                } else if (location === 'top') {
                    styles.left = geometry.x - edgeWidth + 'px';
                    styles.top = geometry.y + 'px';
                    styles.width = geometry.w + 'px';
                    styles.height = 0;
                } else if (location === 'right') {
                    styles.left = geometry.x + geometry.w - (edgeWidth * 2) + 'px';
                    styles.top = geometry.y - edgeWidth + 'px';
                    styles.width = '0';
                    styles.height = geometry.h + 'px';
                } else if (location === 'bottom') {
                    styles.left = geometry.x - edgeWidth + 'px';
                    styles.top = geometry.y + geometry.h - (edgeWidth * 2) + 'px';
                    styles.width = geometry.w + 'px';
                    styles.height = 0;
                }
            }
            return styles;
        },

        _setStyles: function(elem, styles) {
            Object.keys(styles).forEach(function(key) {
                domStyle.set(elem, key, styles[key]);
            });
        },

        _setContentBox: function(elem, contentBox) {
            if (contentBox.hasOwnProperty('x')) {
                domStyle.set(elem, 'left', contentBox.x + 'px');
            }
            if (contentBox.hasOwnProperty('y')) {
                domStyle.set(elem, 'top', contentBox.y + 'px');
            }
            if (contentBox.hasOwnProperty('x')) {
                domStyle.set(elem, 'width', contentBox.w + 'px');
            }
            if (contentBox.hasOwnProperty('x')) {
                domStyle.set(elem, 'height', contentBox.h + 'px');
            }
        },

        _showViewContainerEventElems: function(bHide) {
            var view = this._view;
            if (view && view.getParent() && view.getParent().getParent()) {
                var splitVc = view.getParent().getParent();
                var groupName = vm.getGroupName(splitVc);
                var groupList = vm.getGroupListByName(groupName);
                var vcList = null;
                for (var i = 0; i < groupList.length; i++) {
                    vcList = groupList[i].getViewContainers();
                    for (var j = 0; j < vcList.length; j++) {
                        if (bHide) {
                            vcList[j].hideEventElem();
                        } else {
                            this.hideFeedbacks(vcList[j]);
                            vcList[j].showEventElem();
                        }
                    }
                }
            }
        },

        _clear: function() {
            this._isDragging = false;
            this._draggingData = null;
            this._view = null;
            this.setCurrentViewContainer(null);
        },

        _expandGeometry: function(geometry, expandValueW, expandValueH) {
            if (expandValueH === undefined) {
                expandValueH = expandValueW;
            }
            if ((geometry.w + (expandValueW * 2) > 0) &&
                ((geometry.h + (expandValueH * 2)) > 0)) {
                return {
                    x: geometry.x - expandValueW,
                    y: geometry.y - expandValueH,
                    w: geometry.w + (expandValueW * 2),
                    h: geometry.h + (expandValueH * 2)
                };
            }
            return geometry;
        },

        _getFeedbackGeometries: function(viewContainer) {
            var _self = this;
            var geometries = {};
            if (!viewContainer || !viewContainer.getParent()) {
                return geometries;
            }

            var tabContentGeometry = geometry.position(viewContainer.tabContainer.domNode);
            var contentGeometry = geometry.position(viewContainer.getContainerNode());
            var titleGeometry = geometry.position(viewContainer.getTablistNode());
            var edgeWidth = _self.INSERT_EDGE_WIDTH;
            var baseEdgeWidth;

            //check min size
            if (contentGeometry.w < 4 || contentGeometry.h < 4) {
                return geometries;
            }

            if (contentGeometry.w >= contentGeometry.h) {
                baseEdgeWidth = parseInt(contentGeometry.h / 4, 10);
            } else {
                baseEdgeWidth = parseInt(contentGeometry.w / 4, 10);
            }

            if (edgeWidth > baseEdgeWidth) {
                edgeWidth = baseEdgeWidth;
            }

            var relativeContentGeom = {
                x: contentGeometry.x - tabContentGeometry.x,
                y: contentGeometry.y - tabContentGeometry.y - titleGeometry.h,
                w: contentGeometry.w,
                h: contentGeometry.h
            };

            relativeContentGeom = _self._expandGeometry(relativeContentGeom, -1 * _self.VIEWCONTAINER_PADDING);
            var centerGeometry = _self._expandGeometry(relativeContentGeom, -1 * edgeWidth);
            var leftEdgeGeometry = {
                x: centerGeometry.x - edgeWidth,
                y: centerGeometry.y,
                w: edgeWidth,
                h: centerGeometry.h
            };
            var topEdgeGeometry = {
                x: centerGeometry.x,
                y: centerGeometry.y - edgeWidth,
                w: centerGeometry.w,
                h: edgeWidth
            };
            var rightEdgeGeometry = {
                x: centerGeometry.x + centerGeometry.w,
                y: centerGeometry.y,
                w: edgeWidth,
                h: centerGeometry.h
            };
            var bottomEdgeGeometry = {
                x: centerGeometry.x,
                y: centerGeometry.y + centerGeometry.h,
                w: centerGeometry.w,
                h: edgeWidth
            };

            geometries.center = centerGeometry;
            geometries.left = leftEdgeGeometry;
            geometries.top = topEdgeGeometry;
            geometries.right = rightEdgeGeometry;
            geometries.bottom = bottomEdgeGeometry;

            return geometries;
        },

        drawFeedbackContainer: function( /*viewContainer*/ ) {},

        showContentFeedback: function( /*location*/ ) {},

        showTitleFeedback: function( /*index*/ ) {},

        getAvailableEdges: function(viewContainer, targetView) {
            var edges = [];
            var edgesType = 'center';
            var targetSiblingCount = 0;
            var isSameSplitContainer = false;
            var splitVc = viewContainer.getParent();
            var isInsertable = splitVc.isInsertable();
            var showedViewcontainerCount = splitVc.getShowedViewContainers().length;

            if (targetView && targetView.getParent()) {
                targetSiblingCount = targetView.getParent().getChildren().length;
            }

            if (targetView.getParent().getParent() === splitVc) {
                isSameSplitContainer = true;
            }

            if (isInsertable) {
                if ((showedViewcontainerCount <= 1)) {
                    if (isSameSplitContainer) { //same view container
                        if (targetSiblingCount <= 1) {
                            edgesType = 'center';
                        } else {
                            edgesType = 'all';
                        }
                    } else {
                        edgesType = 'all';
                    }
                } else {
                    if (isSameSplitContainer) {
                        if (viewContainer === targetView.getParent()) {
                            if (targetSiblingCount <= 1) {
                                edgesType = 'center';
                            } else {
                                edgesType = 'side';
                            }
                        } else {
                            if (targetSiblingCount <= 1) {
                                edgesType = 'all';
                            } else {
                                edgesType = 'side';
                            }
                        }
                    } else {
                        edgesType = 'side';
                    }
                }
            }

            if (showedViewcontainerCount > 1) {
                if (isSameSplitContainer &&
                    (viewContainer !== targetView.getParent()) &&
                    (targetSiblingCount <= 1)) {
                    if (showedViewcontainerCount === 2) {
                        edgesType = 'all';
                    } else {
                        edgesType = 'side';
                    }
                }
            }

            if (splitVc.get('rotatable') === false) {
                if (edgesType === 'all') {
                    edgesType = 'side';
                }
            }

            if (edgesType === 'center') {
                edges.push('center');
            } else if (edgesType === 'side') {
                edges.push('center');
                if (splitVc.get('verticalSplit')) {
                    edges.push('top', 'bottom');
                } else {
                    edges.push('left', 'right');
                }
            } else if (edgesType === 'all') {
                edges.push('center', 'left', 'top', 'right', 'bottom');
            }

            return edges;
        },

        getFeedbackInfo: function(viewContainer, currentMousePosition) {
            var _self = this;
            if (!viewContainer || !viewContainer.getParent()) {
                return null;
            }

            var splitVc = viewContainer.getParent();

            var tabContentGeometry = geometry.position(viewContainer.tabContainer.domNode);
            var contentGeometry = geometry.position(viewContainer.getContainerNode());
            var titleGeometry = geometry.position(viewContainer.getTablistNode());
            var edgeWidth = _self.INSERT_EDGE_WIDTH;
            var loc = null;
            var feedbackGeometry = {
                x: 0,
                y: 0,
                w: 0,
                h: 0
            };
            var nextSibling = null;
            var command = {
                type: null,
                targetContainer: viewContainer
            };
            var changeRotation = false;
            var srcView = _self._view;
            var styles = {};
            var baseEdgeWidth;
            var incXAxis, incYAxis;
            var feedbackInfo = {
                baseArea: null,
                feedbackLocation: null,
                targetViewContainer: viewContainer,
                feedbackGeometry: {},
                command: {}
            };
            var i;
            //check min size
            if (contentGeometry.w < 4 || contentGeometry.h < 4) {
                return null;
            }

            if (contentGeometry.w >= contentGeometry.h) {
                baseEdgeWidth = parseInt(contentGeometry.h / 4, 10);
            } else {
                baseEdgeWidth = parseInt(contentGeometry.w / 4, 10);
            }

            if (edgeWidth > baseEdgeWidth) {
                edgeWidth = baseEdgeWidth;
            }

            // Fixes when the x and y are undefined
            var curPos = BrowserUtil.getPosition(currentMousePosition);
            //console.log('_isIn?', currentMousePosition, curPos);
            if (_self._isInGeometry(contentGeometry, curPos)) {
                feedbackInfo.baseArea = 'content';

                var relativeMousePos = {
                    x: curPos.x - tabContentGeometry.x,
                    y: curPos.y - tabContentGeometry.y
                };

                var relativeContentGeom = {
                    x: contentGeometry.x - tabContentGeometry.x,
                    y: contentGeometry.y - tabContentGeometry.y,
                    w: contentGeometry.w,
                    h: contentGeometry.h
                };

                relativeContentGeom = _self._expandGeometry(relativeContentGeom, -1 * _self.VIEWCONTAINER_PADDING);
                var centerGeometry = _self._expandGeometry(relativeContentGeom, -1 * edgeWidth);
                var leftEdgeGeometry = {
                    x: centerGeometry.x - edgeWidth,
                    y: centerGeometry.y,
                    w: edgeWidth,
                    h: centerGeometry.h
                };
                var topEdgeGeometry = {
                    x: centerGeometry.x,
                    y: centerGeometry.y - edgeWidth,
                    w: centerGeometry.w,
                    h: edgeWidth
                };
                var rightEdgeGeometry = {
                    x: centerGeometry.x + centerGeometry.w,
                    y: centerGeometry.y,
                    w: edgeWidth,
                    h: centerGeometry.h
                };
                var bottomEdgeGeometry = {
                    x: centerGeometry.x,
                    y: centerGeometry.y + centerGeometry.h,
                    w: centerGeometry.w,
                    h: edgeWidth
                };

                var leftTopCorner = {
                    x: leftEdgeGeometry.x,
                    y: leftEdgeGeometry.y - edgeWidth,
                    w: leftEdgeGeometry.w,
                    h: edgeWidth
                };
                var leftBottomCorner = {
                    x: leftTopCorner.x,
                    y: bottomEdgeGeometry.y,
                    w: leftTopCorner.w,
                    h: leftTopCorner.h
                };
                var rightTopCorner = {
                    x: rightEdgeGeometry.x,
                    y: rightEdgeGeometry.y - edgeWidth,
                    w: rightEdgeGeometry.w,
                    h: edgeWidth
                };
                var rightBottomCorner = {
                    x: rightTopCorner.x,
                    y: bottomEdgeGeometry.y,
                    w: rightTopCorner.w,
                    h: rightTopCorner.h
                };

                if (_self._isInGeometry(leftTopCorner, relativeMousePos)) {
                    //feedbackGeometry = centerGeometry;
                    incXAxis = relativeMousePos.x - leftTopCorner.x;
                    incYAxis = relativeMousePos.y - leftTopCorner.y;
                    if (incXAxis >= incYAxis) {
                        loc = 'top';
                    } else {
                        loc = 'left';
                    }
                } else if (_self._isInGeometry(leftBottomCorner, relativeMousePos)) {
                    //feedbackGeometry = centerGeometry;
                    incXAxis = relativeMousePos.x - leftBottomCorner.x;
                    incYAxis = leftBottomCorner.y + leftBottomCorner.h - relativeMousePos.y;
                    if (incXAxis >= incYAxis) {
                        loc = 'bottom';
                    } else {
                        loc = 'left';
                    }
                } else if (_self._isInGeometry(rightTopCorner, relativeMousePos)) {
                    //feedbackGeometry = centerGeometry;
                    incXAxis = relativeMousePos.x - rightTopCorner.x;
                    incYAxis = rightTopCorner.y + rightTopCorner.h - relativeMousePos.y;
                    if (incXAxis >= incYAxis) {
                        loc = 'right';
                    } else {
                        loc = 'top';
                    }
                } else if (_self._isInGeometry(rightBottomCorner, relativeMousePos)) {
                    //feedbackGeometry = centerGeometry;
                    incXAxis = relativeMousePos.x - rightBottomCorner.x;
                    incYAxis = relativeMousePos.y - rightBottomCorner.y;
                    if (incXAxis >= incYAxis) {
                        loc = 'right';
                    } else {
                        loc = 'bottom';
                    }
                } else if (_self._isInGeometry(centerGeometry, relativeMousePos)) {
                    feedbackGeometry = centerGeometry;
                    loc = 'center';
                } else if (_self._isInGeometry(leftEdgeGeometry, relativeMousePos)) {
                    feedbackGeometry = leftEdgeGeometry;
                    loc = 'left';
                } else if (_self._isInGeometry(topEdgeGeometry, relativeMousePos)) {
                    feedbackGeometry = topEdgeGeometry;
                    loc = 'top';
                } else if (_self._isInGeometry(rightEdgeGeometry, relativeMousePos)) {
                    feedbackGeometry = rightEdgeGeometry;
                    loc = 'right';
                } else if (_self._isInGeometry(bottomEdgeGeometry, relativeMousePos)) {
                    feedbackGeometry = bottomEdgeGeometry;
                    loc = 'bottom';
                }

                var availableEdges = this.getAvailableEdges(viewContainer, this._view);
                var avalaible = false;
                for (i = 0; i < availableEdges.length; i++) {
                    if (loc === availableEdges[i]) {
                        avalaible = true;
                        break;
                    }
                }

                if (avalaible === false) {
                    loc = null;
                }

                if (loc === 'center' && (viewContainer !== _self._view.getParent())) {
                    command.type = 'move';
                    command.nextSibling = null;
                } else if ((loc === 'left') || (loc === 'top')) {
                    command.type = 'insert';
                    command.direction = 'prev';
                } else if ((loc === 'right') || (loc === 'bottom')) {
                    command.type = 'insert';
                    command.direction = 'next';
                }

                if (splitVc.get('verticalSplit')) {
                    if ((loc === 'left') || (loc === 'right')) {
                        changeRotation = true;
                    }
                } else {
                    if ((loc === 'top') || (loc === 'bottom')) {
                        changeRotation = true;
                    }
                }

                command.changeRotation = changeRotation;

                if (loc === 'center') {
                    styles.left = feedbackGeometry.x + 'px';
                    styles.top = feedbackGeometry.y + 'px';
                    styles.width = feedbackGeometry.w + 'px';
                    styles.height = feedbackGeometry.h + 'px';
                } else if ((loc === 'left') || (loc === 'top') || (loc === 'right') || (loc === 'bottom')) {
                    styles.borderWidth = edgeWidth + 'px';

                    if (loc === 'left') {
                        styles.borderLeftColor = this.FEEDBACK_EDGE_COLOR;
                        styles.left = feedbackGeometry.x + 'px';
                        styles.top = feedbackGeometry.y - edgeWidth + 'px';
                        styles.width = 0;
                        styles.height = feedbackGeometry.h + 'px';
                    } else if (loc === 'top') {
                        styles.borderTopColor = this.FEEDBACK_EDGE_COLOR;
                        styles.left = feedbackGeometry.x - edgeWidth + 'px';
                        styles.top = feedbackGeometry.y + 'px';
                        styles.width = feedbackGeometry.w + 'px';
                        styles.height = 0;
                    } else if (loc === 'right') {
                        styles.borderRightColor = this.FEEDBACK_EDGE_COLOR;
                        styles.left = feedbackGeometry.x + feedbackGeometry.w - (edgeWidth * 2) + 'px';
                        styles.top = feedbackGeometry.y - edgeWidth + 'px';
                        styles.width = '0';
                        styles.height = feedbackGeometry.h + 'px';
                    } else if (loc === 'bottom') {
                        styles.borderBottomColor = this.FEEDBACK_EDGE_COLOR;
                        styles.left = feedbackGeometry.x - edgeWidth + 'px';
                        styles.top = feedbackGeometry.y + feedbackGeometry.h - (edgeWidth * 2) + 'px';
                        styles.width = feedbackGeometry.w + 'px';
                        styles.height = 0;
                    }
                } else {
                    styles.display = 'none';
                }
            } else { //change tab order
                feedbackInfo.baseArea = 'title';
                var viewList = viewContainer.getViewList();
                var sibling;
                var srcViewNextSibling = null;
                loc = 'title';
                for (i = 1; i < viewList.length; i++) {
                    sibling = viewList[i - 1];
                    if (sibling === srcView) {
                        srcViewNextSibling = viewList[i];
                    }
                }

                styles.display = 'none';

                for (i = 0; i < viewList.length; i++) {
                    sibling = viewList[i];

                    var controlBtnGeometry = geometry.position(sibling.contentPane.controlButton.domNode);
                    if (_self._isInGeometry(controlBtnGeometry, curPos)) {
                        if (curPos.x <= ((controlBtnGeometry.x * 2 + controlBtnGeometry.w) / 2)) {
                            nextSibling = sibling;
                        } else {
                            if (i === viewList.length - 1) {
                                nextSibling = null;
                            } else {
                                nextSibling = viewList[i + 1];
                            }
                        }

                        if (((srcViewNextSibling !== nextSibling) && (srcView !== nextSibling)) ||
                            ((nextSibling === null) && (srcView.getParent() !== viewContainer))) {
                            command.type = 'move';
                            command.nextSibling = nextSibling;
                            if (nextSibling) {
                                var nextSiblingGeo = geometry.position(nextSibling.contentPane.controlButton.domNode);
                                feedbackGeometry.x = nextSiblingGeo.x - titleGeometry.x;
                            } else {
                                var lastSibling = viewList[viewList.length - 1];
                                var lastSiblingGeo = geometry.position(lastSibling.contentPane.controlButton.domNode);
                                feedbackGeometry.x = (lastSiblingGeo.x + lastSiblingGeo.w) - titleGeometry.x;
                            }
                            styles.display = 'block';
                        }
                        /*else {
                            styles.display = 'none';
                        } */

                        styles.left = feedbackGeometry.x + 'px';
                        styles.top = feedbackGeometry.y + 'px';

                        break;
                    }
                }
            }

            feedbackInfo.feedbackLocation = loc;
            feedbackInfo.command = command;
            feedbackInfo.styles = styles;

            return feedbackInfo;
        },

        _isInGeometry: function(geometry, position) {
            var posX = position.x,
                posY = position.y;
            if ((geometry.x <= posX) && ((geometry.x + geometry.w) > posX) &&
                (geometry.y <= posY) && ((geometry.y + geometry.h) > posY)) {
                return true;
            }
            return false;
        },
    };

    viewDnDManager.initialize();

    return viewDnDManager;
});