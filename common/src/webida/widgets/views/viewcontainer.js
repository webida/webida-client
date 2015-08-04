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
    'webida-lib/util/browserUtil',
    './viewTabContainer',
    'dijit/layout/ContentPane',
    'dijit/registry',
    './viewmanager',
    './viewdndmanager',
    'dojo/text!./template/_tmplViewContainerFeedback.html',
    'dojo/dom-geometry',
    'dojo/dom-class',
    'dojo/dom-style',
    'dojo/topic',
    'dojo/_base/lang',
    'webida-lib/util/logger/logger-client',
    'dojo/domReady!'
], function (
    _,
    BrowserUtil,
    TabContainer,
    ContentPane,
    registry,
    vm,
    vdndm,
    feedbackMarkup,
    geometry,
    domclass,
    domstyle,
    topic,
    lang,
    Logger
) {
    'use strict';

	var logger = new Logger();
	logger.off();

    function ViewContainerEvent(name) {
        this.name = name;
    }

    ViewContainerEvent.SELECTED = 'view.selected';
    ViewContainerEvent.CLOSE = 'view.close';
    ViewContainerEvent.QUIT = 'view.quit';
    ViewContainerEvent.ADDED = 'view.added';
    ViewContainerEvent.ADDED_BEFORE = 'view.added-before';
    ViewContainerEvent.REMOVED = 'view.removed';
    ViewContainerEvent.FOCUSED = 'view.focused';
    ViewContainerEvent.MAXIMIZE = 'view.maximize';

    var viewContainer = function () {
        this._parent = null;
        this.viewList = [];
        this._viewMap = {};
        this._dojoHandlerMap = {};
        this.topContainer = new ContentPane({
            style: 'border:0; margin:0; padding:1px;'
        });
        this.tabContainer = new TabContainer({
            style: 'border:0; margin:0; padding:0px;'
        });
        this.topContainer.addChild(this.tabContainer);
        this.tabContainer.viewContainerObject = this;
        this.feedbacks = null;

        var tablistMenu = registry.byId(this.tabContainer.id + '_tablist_Menu');
        if (tablistMenu) {
            tablistMenu.destroyRecursive();
        }
    };

    viewContainer.KEY_VIEW_ID = '_view-id';

    viewContainer.prototype = {
        initialize : function () {
            var _self = this;

            dojo.connect(this.tabContainer, 'onClick', function (ev) {
                var targetNode = null;
                var view = null;

                if (domclass.contains(ev.target, 'dijitTabCloseButton')) {
                    return;
                }

                if (domclass.contains(ev.target, 'dijitTabContent')) {
                    targetNode = ev.target;
                }
                else if (domclass.contains(ev.target.parentNode, 'dijitTabContent')) {
                    targetNode = ev.target.parentNode;
                }
                else {
                    return;
                }

                var topWidgetNode = null;

                if (targetNode) {
                    topWidgetNode = targetNode;
                    while (topWidgetNode) {
                        if (domclass.contains(topWidgetNode, 'dijitTabContainer')) {
                            break;
                        }
                        topWidgetNode = topWidgetNode.parentNode;
                    }
                }

                if (topWidgetNode === _self.tabContainer.domNode) {
                    var children = targetNode.parentNode.childNodes;
                    for (var i = 0; i < children.length; i++) {
                        if (children[i] === targetNode) {
                            view = _self.getViewByIndex(i);
                            if (view) {
                                if (ev.button === 0) {
                                    if (view.isSelected()) {
                                        view.select(true);
                                    } else {
                                        view.select();
                                    }
                                } /*else if ((ev.button === 1) && view.get('closable')) {
                                    _self._contentPaneClose(view.contentPane);
                                } */
                            }
                            ev.preventDefault();
                            break;
                        }
                    }
                }
            });

            dojo.connect(this.tabContainer, 'onMouseUp', function (ev) {
                var targetNode = null;
                var view = null;
                if (domclass.contains(ev.target, 'dijitTabContent')) {
                    targetNode = ev.target;
                } else if (ev.target.parentNode) {
                    targetNode = ev.target.parentNode;
                } else {
                    return;
                }

                if (domclass.contains(targetNode, 'dijitTabContent')) {
                    var children = targetNode.parentNode.childNodes;
                    for (var i = 0; i < children.length; i++) {
                        if (children[i] === targetNode) {
                            view = _self.getViewByIndex(i);
                            if (view) {
                                /*if (ev.button === 0) {
                                    if (view.isSelected()) {
                                        view.select(true);
                                    } else {
                                        view.select();
                                    }
                                } else */
                                if ((ev.button === 1) && view.get('closable')) {
                                    _self._contentPaneClose(view.contentPane, true);
                                }
                            }
                            ev.stopPropagation();
                            ev.preventDefault();
                            break;
                        }
                    }
                }
            });

            _self.tabContainer.watch('selectedChildWidget', function () {
                var pane = _self.tabContainer.get('selectedChildWidget');
                _self._contentPaneSelected(pane);
            });

            _self.tabContainer.on('dragstart', function (ev) {
                var target = BrowserUtil.getTarget(ev);
                if (target && target.hasOwnProperty(viewContainer.KEY_VIEW_ID)) {
                    var viewId = target[viewContainer.KEY_VIEW_ID];
                    var view = vm.getView(viewId);
                    if (view) {
                        //console.log('dragstart setData');
                        // Internet Explorer raises "Unexpected call to method or
                        // property access" error unless format is not 'Text' or 'URL'
                        ev.dataTransfer.setData('Text', viewId);
                        vdndm.dragStart(view);
                    }
                }
            });

            _self.tabContainer.on('dblclick', function (ev) {
                var target = BrowserUtil.getTarget(ev);
                if (target.classList.contains('tabLabel') &&  // WTC-3071
                    ev.currentTarget === _self.tabContainer.domNode) {
                    var event = new ViewContainerEvent(ViewContainerEvent.MAXIMIZE);
                    event.location = _self.getParent().get('region'); // splitviewcontainer
                    var parent = target.parentNode;
                    while (parent && parent.parentNode) {
                        if (parent === _self.tabContainer.domNode.firstElementChild) {
                            topic.publish(ViewContainerEvent.MAXIMIZE, event);
                            break;
                        }
                        parent = parent.parentNode;
                    }
                }
            });

            _self.tabContainer.on('dragend', function () {
                vdndm.dragEnd();
            });

            _self.tabContainer.on('drop', function (ev) {
                ev.stopPropagation();
                // If not prevented, Firefox navigates to url by setData('Text') like www.view_1.com
                ev.preventDefault();

                var view = vdndm.getDraggingView();
                if (!vm.isDroppable(_self, vdndm.getDraggingView())) {
                    return;
                }

                if (view) {
                    var feedbackInfo = vdndm.getFeedbackInfo(_self, ev);

                    vdndm.dragEnd();
                    var command = feedbackInfo.command;
                    var splitVc = _self.getParent();

                    if (command && command.type) {
                        var type = command.type;
                        if (type === 'move') {
                            splitVc.moveView(_self, view, command.nextSibling);
                        }
                        else if (type === 'insert') {
                            //TODO FIXME
                            if (view.getParent().getChildren().length === 1) {
                                splitVc.moveView(_self, view, null, true);
                                if (command.direction === 'prev') {
                                    splitVc.insertToPrev(view.getParent(), view);
                                }
                                else if (command.direction === 'next') {
                                    splitVc.insertToNext(view.getParent(), view);
                                }
                            } else {
                                if (command.direction === 'prev') {
                                    splitVc.insertToPrev(_self, view);
                                }
                                else if (command.direction === 'next') {
                                    splitVc.insertToNext(_self, view);
                                }
                            }

                            if (command.changeRotation) {
                                if (splitVc.get('verticalSplit')) {
                                    splitVc.set('verticalSplit', false);
                                } else {
                                    splitVc.set('verticalSplit', true);
                                }
                            }
                        }
                    }
                }
            });
        },

        getParent : function () {
            return this._parent;
        },

        setParent : function (parent)  {
            this._parent = parent;
        },

        getChildren : function () {
            return this.viewList;
        },

        getTopContainer : function () {
            return this.topContainer;
        },

        isCenterLocation : function () {
            var cp = this.getTopContainer();
            if (cp.get('region') === 'center') {
                return true;
            }
            return false;
        },

        addAt : function (view, index) {
            var _self = this;

            var event = new ViewContainerEvent(ViewContainerEvent.ADDED_BEFORE);
            event.view = view;
            event.viewContainer = _self;

            topic.publish(ViewContainerEvent.ADDED_BEFORE, event);

            if (index === -1) {
                _self.tabContainer.addChild(view.contentPane);
                _self.viewList.push(view);
            } else {
                _self.tabContainer.addChild(view.contentPane, index);
                if (index >= _self.viewList.length) {
                    _self.viewList.push(view);
                } else {
                    _self.viewList.splice(index, 0, view);
                }
            }

            // if view.getTabDragable is true, draggable attribute is set false
            dojo.attr(view.contentPane.controlButton.domNode, 'draggable', view.getTabDragable());

            // Firefox ev.x and ev.y are zero on 'drag' event, so 'dragover' for document is used
            var mouseX, mouseY;
            $(document).on('dragover', function (ev) {
                mouseX = ev.originalEvent.clientX;
                mouseY = ev.originalEvent.clientY;
            });

            view.contentPane.controlButton.domNode.addEventListener('drag', function (ev) {
                ev.stopPropagation();
                // If preventDefault is called(), Internet Explorer does not call drag event handler afterwards
                //ev.preventDefault();
                var mEvent = {
                    view: view,
                    mousePosition: {
                        x: ev.clientX ? ev.clientX : mouseX,
                        y: ev.clientY ? ev.clientY : mouseY
                    }
                };
                //console.log('drag', mEvent);
                vdndm.drag(mEvent);
            });

            view.contentPane.controlButton.domNode[viewContainer.KEY_VIEW_ID] = view.getId();
            view.setParent(_self);

            event = new ViewContainerEvent(ViewContainerEvent.ADDED);
            event.view = view;
            event.viewContainer = _self;
            event.count = _self.tabContainer.getChildren().length;

            topic.publish(ViewContainerEvent.ADDED, event);

            var cbClose = dojo.connect(view.contentPane, 'onClose', function (tabContainer, contentPane) {
                _self._contentPaneClose(contentPane, true);
                //return false;
            });

            var cbFocus = dojo.connect(view.contentPane, 'onFocus', function () {
                _self._viewFocused(view);
            });

            //this._dojoHandlerMap[view.getId()] = [cbClose];
            this._dojoHandlerMap[view.getId()] = [cbClose, cbFocus];
        },

        addLast : function (view) {
            this.addAt(view, -1);
        },

        remove : function (view, isDestroy) {
            this._remove(view, isDestroy);
        },

        removeAt : function (index, isDestroy) {
            var view = this.getViewByIndex(index);
            if (view) {
                this._remove(view, isDestroy);
            }
        },

        getNumOfViews : function () {
            return this.tabContainer.getChildren().length;
        },

        getViewByIndex : function (index) {
            var cp;
            cp = this._getContentPane(index);
            if (cp) {
                return this._getViewByContentPane(cp);
            }
            return null;
        },

        getViewIndex : function (view) {
            return this.tabContainer.getIndexOfChild(view.contentPane);
        },

        select : function (view, forceFireEvent) {
            if (view) {
                var selectedCp = this.tabContainer.get('selectedChildWidget');
                if (selectedCp === view.contentPane && forceFireEvent) {
                    var event = new ViewContainerEvent(ViewContainerEvent.SELECTED);
                    event.view = view;
                    event.viewContainer = this;
                    topic.publish(ViewContainerEvent.SELECTED, event);
                } else {
                    this.tabContainer.selectChild(view.contentPane, true);
                }

//                var index = this.getViewIndex(view);
//
//                if (index >= 0) {
//                    var cp = this._getContentPane(index);
//                    if (cp) {
//                        if (this.tabContainer.get('selectedChildWidget') ===  cp) {
//                            var event = new ViewContainerEvent(ViewContainerEvent.SELECTED);
//                            event.view = view;
//                            event.viewContainer = this;
//                            topic.publish(ViewContainerEvent.SELECTED, event);
//                        } else {
//                            this.tabContainer.selectChild(cp, true);
//                        }
//                    }
//                }
            }
        },

        getViewList : function () {
            var _self = this;
            var viewList = [];
            var view;
            var cpList = _self.tabContainer.getChildren();
            _.forEach(cpList, function (cp) {
                view = _self._getViewByContentPane(cp);
                if (view) {
                    viewList.push(view);
                }
            });
            return viewList;
        },

        moveView : function (view, nextSibling) {
            var currentIndex, nextSiblingIndex;
            var _self = this;
            var viewList = this.getViewList();

            if (view === nextSibling) {
                return;
            }
            if (viewList.length < 2) {
                return;
            }

            currentIndex = _self.getViewIndex(view);
            if (nextSibling) {
                nextSiblingIndex = _self.getViewIndex(nextSibling);
            } else {
                nextSiblingIndex = viewList.length;
            }

            if (currentIndex > -1 && nextSiblingIndex > -1) {
                if (currentIndex > nextSiblingIndex) {
                    _self.remove(view);
                    _self.addAt(view, nextSiblingIndex);
                } else if (currentIndex < nextSiblingIndex) {
                    _self.remove(view);
                    _self.addAt(view, nextSiblingIndex - 1);
                }
            }
        },

        getContainerNode : function () {
            return this.tabContainer.containerNode;
        },

        getTablistNode : function () {
            return this.tabContainer.tablist.domNode;
        },

        isFocused : function () {
            return this.tabContainer.get('focused');
        },

        getSelectedView : function () {
            var _self = this;
            var pane = _self.tabContainer.get('selectedChildWidget');
            var view = _self._getViewByContentPane(pane);
            return view;
        },

        showEventElem : function () {
            var eventElem = this.getFeedbackByLocation('event');
            if (eventElem) {
                domstyle.set(eventElem, 'display', 'block');
            }
        },

        hideEventElem : function ()  {
            var eventElem = this.getFeedbackByLocation('event');
            if (eventElem) {
                domstyle.set(eventElem, 'display', 'none');
                this.hideFeedback();
            }
        },

        getEventElem : function () {
            if (this.feedbacks === null) {
                this._createDragFeedback();
            }
            if (this.feedbacks) {
                return this.getFeedbackByLocation('event');
            }
        },

        showFeedback : function () {
//          var feedbackElem = this.getFeedbackElem(location);
//            if (feedbackElem) {
//                for (var key in styles) {
//                    feedbackElem.css(key, styles[key]);
//                    feedbackElem.css('display', 'block');
//                }
//            }
        },

        hideFeedback : function () {
//          var feedbackElem = this.getFeedbackElem();
//            if (feedbackElem) {
//                feedbackElem.css('display', 'none');
//                feedbackElem.css('width', 0);
//                feedbackElem.css('height', 0);
//            }
        },

        getFeedbackByLocation : function (location) {
            if (!this.feedbacks) {
                this._createDragFeedback();
            }

            if (this.feedbacks) {
                var feedbacks = this.feedbacks;
                if (location === 'event') {
                    return feedbacks.event;
                } else if (location === 'title') {
                    return feedbacks.title;
                } else if (location === 'titleContent') {
                    return feedbacks.titleFeedback;
                } else if (location === 'content') {
                    return feedbacks.content;
                } else if (location === 'center') {
                    return feedbacks.contentCenter;
                } else if (location === 'left') {
                    return feedbacks.contentLeft;
                } else if (location === 'top') {
                    return feedbacks.contentTop;
                } else if (location === 'right') {
                    return feedbacks.contentRight;
                } else if (location === 'bottom') {
                    return feedbacks.contentBottom;
                }
            }
            return null;
        },

        getFeedbacks : function () {
            if (!this.feedbacks) {
                this._createDragFeedback();
            }
            return this.feedbacks;
        },

        _createDragFeedback : function () {
            var _self = this;
            if (!_self.feedbacks) {
                var $feedback = $(feedbackMarkup).appendTo(_self.tabContainer.domNode);
                _self.feedbacks = {};
                var feedbacks = {};
                feedbacks.event = $($feedback[0]);
                feedbacks.title = feedbacks.event.find('.titleFeedbackContainer')[0];
                feedbacks.titleFeedback = feedbacks.event.find('.viewContainerTitleFeedback')[0];
                feedbacks.content = feedbacks.event.find('.contentFeedbackContainer')[0];
                feedbacks.contentCenter = feedbacks.event.find('.viewContainerFeedbackCenter')[0];
                feedbacks.contentLeft = feedbacks.event.find('.viewContainerFeedbackLeft')[0];
                feedbacks.contentTop = feedbacks.event.find('.viewContainerFeedbackTop')[0];
                feedbacks.contentRight = feedbacks.event.find('.viewContainerFeedbackRight')[0];
                feedbacks.contentBottom = feedbacks.event.find('.viewContainerFeedbackBottom')[0];
                feedbacks.event = $feedback[0];
                _self.feedbacks = feedbacks;
            }
        },

        _contentPaneSelected : function (pane) {
			logger.info('_contentPaneSelected('+pane+')');
            var _self = this;
            var event = new ViewContainerEvent(ViewContainerEvent.SELECTED);
            event.view = _self._getViewByContentPane(pane);
            event.viewContainer = _self;
            if (event.view) {
                topic.publish(ViewContainerEvent.SELECTED, event);
            }
        },

        _contentPaneClose : function (pane, closable) {
            var _self = this;
            var event = new ViewContainerEvent(ViewContainerEvent.CLOSE);
            event.view = _self._getViewByContentPane(pane);
            event.viewContainer = _self;
            event.closable = closable;
            event.noClose = function () {
                event.closable = false;
            };

            topic.publish(ViewContainerEvent.CLOSE, event, lang.hitch(this, function () {
                if (event.closable) {
                    this._remove(event.view, true);
                }
            }));
        },

        _contentPaneQuit : function (pane) {
            var _self = this;
            var event = new ViewContainerEvent(ViewContainerEvent.QUIT);
            event.view = _self._getViewByContentPane(pane);
            event.viewContainer = _self;
            event.closable = true;
            event.noClose = function () {
                event.closable = false;
            };

            topic.publish(ViewContainerEvent.QUIT, event);
        },

        _viewFocused : function (view) {
            var _self = this;
            var event = new ViewContainerEvent(ViewContainerEvent.FOCUSED);
            if (view) {
                event.view = view;
                event.viewContainer = _self;
                topic.publish(ViewContainerEvent.FOCUSED, event);
            }
        },

        _remove : function (view, isDestroy) {
            var _self = this;
            var pane = view.contentPane;

            this.tabContainer.removeChild(view.contentPane);

            var connectHandlerKey = view.getId();
            if (this._dojoHandlerMap.hasOwnProperty(connectHandlerKey)) {
                var handlerList = this._dojoHandlerMap[connectHandlerKey];
                _.forEach(handlerList, function(handler) {
                    dojo.disconnect(handler);
                });
            }

            var event = new ViewContainerEvent(ViewContainerEvent.REMOVED);
            event.view = _self._getViewByContentPane(pane);
            event.viewContainer = _self;
            event.count = _self.tabContainer.getChildren().length;
            topic.publish(ViewContainerEvent.REMOVED, event);

            for (var i = 0; i < _self.viewList.length; i++) {
                if (_self.viewList[i] === view) {
                    _self.viewList.splice(i, 1);
                    view.setParent(null);
                    if (isDestroy) {
                        view.destroy();
                    }
                    break;
                }
            }
        },

        _getContentPane : function (index) {
            var children = this.tabContainer.getChildren();
            if (children.length > index) {
                return children[index];
            }
            return null;
        },

        _getViewByContentPane : function (pane) {
            var _self = this;
            var i;
            var view;
            for (i = 0; i < _self.viewList.length; i++) {
                view = _self.viewList[i];
                if (view.getTopContainer() === pane) {
                    return view;
                }
            }
            return null;
        },

        getPrevView : function (view) {
            var vc = this;
            var viewList = vc.getViewList();
            for (var i = 0; i < viewList.length; i++) {
                if (viewList[i] === view) {
                    if (i > 0) {
                        return viewList[i - 1];
                    }
                    break;
                }
            }
            return null;
        },

        getNextView : function (view) {
            var vc = this;
            var viewList = vc.getViewList();
            for (var i = 0; i < viewList.length; i++) {
                if (viewList[i] === view) {
                    if (i < viewList.length - 1) {
                        return viewList[i + 1];
                    }
                    break;
                }
            }
            return null;
        },
    };

    return viewContainer;
});
