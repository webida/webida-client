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



define(['external/lodash/lodash.min',
        'dijit/layout/TabContainer',
        'dijit/layout/ContentPane',
        'dijit/Tooltip',
        'dijit/layout/BorderContainer',
        './viewcontainer',
        './view',
        './viewmanager',
        'dojo/topic',
        'dojo/dom-geometry',
        'dojo/aspect',
        'dojo/domReady!', ],
function (_, TabContainer, ContentPane, Tooltip, BorderContainer,
           ViewContainer, View, vm, topic, geometry, aspect) {
    'use strict';

    var splitViewContainer = function () {
        this._splitCount = 0;
        this._verticalSplit = false;
        this._smartVisible = false;
        this.containerList = [];
        this.widgetObject = null;
        this._focusedViewContainer = null;
        this._splitterPressed = false;
        this._changableRotation = false;
        this.region = '';
    };

    splitViewContainer.MAX_COUNT = 5;

    splitViewContainer.prototype = {

        getTopContainer : function () {
            return this.widgetObject;
        },

        get : function (propName) {
            if (propName === 'splitCount') {
                return this._splitCount;
            } else if (propName === 'verticalSplit') {
                return this._verticalSplit;
            } else if (propName === 'smartVisible') {
                return this._smartVisible;
            } else if (propName === 'rotatable') {
                return this._changableRotation;
            } else if (propName === 'region') {
                return this.region;
            }
        },

        set : function (propName, value) {
            if (propName === 'splitCount') {
                return this._split(value);
            } else if (propName === 'verticalSplit') {
                return this._setSplitDirection(value);
            } else if (propName === 'smartVisible') {
                return this._setSmartVisible(value);
            } else if (propName === 'rotatable') {
                return this._setRotatable(value);
            } else if (propName === 'region') {
                return this._setRegion(value);
            }
        },

        setProperties : function (properties) {
            for (var propName in properties) {
                if (properties.hasOwnProperty(propName)) {
                    this.set(propName, properties[propName]);
                }
            }
        },

        init : function (properties, elem) {
            var _self = this;
            var bc = new BorderContainer({style: 'height:100%; width:100%;', padding: 0, design: 'sidebar'});
            if (elem) {
                bc.placeAt(elem);
            }
            this.widgetObject = bc;
            bc.startup();
            if (properties) {
                this.setProperties(properties);
            }

            topic.subscribe('view.selected', function (event) {
                _self._viewSelectedHandler(event);
            });

            topic.subscribe('view.removed', function (event) {
                _self._viewRemovedHandler(event);
            });

            topic.subscribe('view.focused', function (event) {
                _self._viewFocusedHandler(event);
            });

            topic.subscribe('view.added-before', function (event) {
                var vc = event.viewContainer;
                if (vc && (vc.getParent()  === _self)) {
                    if (_self.get('smartVisible')) {
                        _self.showContainer(vc);
                    }
                }
            });

            topic.subscribe('view.removed', function (event) {
                var vc = event.viewContainer;
                if (vc && (vc.getParent()  === _self)) {
                    if  ((event.count === 0) && _self.get('smartVisible')) {
                        _self.hideContainer(vc);
                    }
                }
            });
            
            aspect.after(bc, '_layoutChildren', function () {
                topic.publish('editor-container-layout-changed');
            });

            bc.resize();

            vm.addToGroup(_self, 'default');
        },

        getViewContainer : function (index) {
            if (this.containerList[index]) {
                return this.containerList[index];
            }
            return null;
        },

        getViewContainers : function () {
            return this.containerList;
        },

        showContainer : function (vc) {
            var _self = this;
            if (vc) {
                if (_self._isHided(vc)) {
                    _self.widgetObject.addChild(vc.getTopContainer());
                }
            }
        },

        hideContainer : function (vc) {
            var _self = this;
            if (vc) {
                if (!_self._isHided(vc)) {
                    if (_self._isCenterContainer(vc)) {
                        var nextShowdVc = _self._getNextShowedViewContainer(vc);
                        if (nextShowdVc) {
                            _self._swap(vc, nextShowdVc);
                        }
                    } else {
                        this.widgetObject.removeChild(vc.getTopContainer());
                    }
                }
            }
        },

        insertToPrev : function (vc, view) {
            this._insert(vc, view, true);
        },

        insertToNext : function (vc, view) {
            this._insert(vc, view, false);
        },

        isInsertable : function () {
            var _self = this;
            var i, vc;
            var vcList = _self.getViewContainers();
            for (i = 0 ; i < vcList.length; i++) {
                vc = vcList[i];
                if (_self._isHided(vc)) {
                    return true;
                }
            }
            return false;
        },

        moveView : function (targetViewContainer, view, nextSibling, noneSelect) {
            if (targetViewContainer && view) {
                var vc = view.getParent();
                var viewMoveEvent = {
                    view : view,
                    nextSibling : nextSibling,
                    destViewContainer : targetViewContainer
                };

                topic.publish('view.moved-before', viewMoveEvent);

                if (targetViewContainer === vc) {
                    targetViewContainer.moveView(view, nextSibling);
                    targetViewContainer.select(view);
                } else {
                    var tempView = new View('_tempView', 'tempView');
                    vc.addLast(tempView);
                    vc.remove(view);
                    targetViewContainer.addLast(view);
                    targetViewContainer.moveView(view, nextSibling);
                    vc.remove(tempView, true);
                    if (!noneSelect) {
                        view.select();
                    }
                }

                topic.publish('view.moved', viewMoveEvent);
            }
        },

        getFocusedViewContainer : function () {
            if (this._focusedViewContainer) {
                return this._focusedViewContainer;
            } else {
                return this.getViewContainer(0);
            }
        },

        getShowedViewContainers : function () {
            return this._getViewContainersByState(false);
        },

        getHidedViewContainers : function () {
            return this._getViewContainersByState(true);
        },

        _updateVisible : function () {
            var _self = this;
            _.forEach(_self.containerList, function (vc) {
                if (_self._smartVisible) {
                    if (vc.getNumOfViews() > 0) {
                        _self.showContainer(vc);
                    } else {
                        _self.hideContainer(vc);
                    }
                } else {
                    _self.showContainer(vc);
                }
            });
        },

        _setSmartVisible : function (enable) {
            if (this._smartVisible !== enable) {
                this._smartVisible = enable;
                this._updateVisible();
            }
        },

        _setRotatable : function (enable) {
            if (this._changableRotation !== enable) {
                this._changableRotation = enable;
            }
        },

        _setRegion : function (region) {
            if (this.region !== region) {
                this.region = region;
            }
        },

        _viewSelectedHandler : function (event) {
            var _self = this;
            var vc = event.viewContainer;
            if (vc.getParent() === _self) {
                _self._focusedViewContainer = vc;
            }
        },

        _viewRemovedHandler : function (event) {
            var _self = this;
            var vc = event.viewContainer;
            if (vc.getParent() === _self) {
                if ((_self._focusedViewContainer === vc) && (event.count === 0)) {
                    _self._focusedViewContainer = null;
                }
            }
        },

        _viewFocusedHandler : function (event) {
            var _self = this;
            var vc = event.viewContainer;
            if (vc.getParent() === _self) {
                _self._focusedViewContainer = vc;
            }
        },

        _registEvents : function () {
            var _self = this;

            topic.subscribe('view.selected', function (event) {
                _self._viewSelectedHandler(event);
            });

            topic.subscribe('view.close', function (event) {
                _self._viewCloseHandler(event);
            });

            topic.subscribe('view.focused', function (event) {
                _self._viewFocusedHandler(event);
            });
        },

        _split : function (count) {
            var i, vc, layoutPriority;
            var _self = this;
            if ((count >= 1) && (count <= splitViewContainer.MAX_COUNT)) {
                if (count < _self.containerList.length) {
                    for (i = count; i >= _self.containerList.length; i--) {
                        vc = _self.containerList[i - 1];
                        vc.setParent(null);
                        this.widgetObject.removeChild(vc.getTopContainer());
                        this.containerList.pop();
                        // TODO: destroy vc
                    }
                } else {
                    for (i = _self._splitCount; i < count; i++) {
                        if (i === 0) {
                            layoutPriority = 0;
                        } else {
                            layoutPriority = count - (i);
                        }
                        vc = _self._createViewContainer(layoutPriority, parseInt((100 / count), 10));
                        _self.containerList.push(vc);
                        if (!_self._smartVisible) {
                            _self.showContainer(vc);
                        }
                        // _self._registEvents(vc);
                    }
                }
                _self._splitCount = count;
                return true;
            } else {
                return false;
            }
        },

        _setSplitDirection : function (vertical) {
            var _self = this;
            var borderContainer = _self.widgetObject;
            var children = borderContainer.getChildren();
            var totalW = 0;
            var totalH = 0;
            var width, height;
            var child;
            var i;
            var region, style;

            if (this._verticalSplit !== vertical) {
                if (vertical) {
                    region = 'bottom';
                } else {
                    region = 'right';
                }

                for (i = 0; i < children.length; i++) {
                    child = children[i];
                    totalW += geometry.getContentBox(child.domNode).w;
                    totalH += geometry.getContentBox(child.domNode).h;
                }

                for (i = 0; i < children.length; i++) {
                    child = children[i];
                    width = geometry.getContentBox(child.domNode).w;
                    height = geometry.getContentBox(child.domNode).h;
                    if (vertical) {
                        style = 'height:' + parseInt((height * 100 / totalH), 10) + '%';
                    } else {
                        style = 'width:' + parseInt((width * 100 / totalW), 10) + '%';
                    }

                    if (i > 0) {
                        child.set('style', style);
                        child.set('region', region);
                        borderContainer.removeChild(child);
                        borderContainer.addChild(child);
                    }
                }

                var hidedVc = _self.getHidedViewContainers();
                for (i = 0; i < hidedVc.length; i++) {
                    hidedVc[i].topContainer.set('region', region);
                }

                this._verticalSplit = vertical;
            }
        },

        _isHided : function (vc) {
            var _self = this;
            if (vc) {
                var index = _self.widgetObject.getIndexOfChild(vc.getTopContainer());
                if (index === -1) {
                    return true;
                }
            }
            return false;
        },

        _createViewContainer : function (layoutPriority, widthRatio) {
            var _self = this;
            var vertical = this._verticalSplit;
            var style, region;
            if (vertical) {
                style = 'height:' + widthRatio + '%';
                if (layoutPriority === 0) {
                    region = 'center';
                } else {
                    region = 'bottom';
                }
            } else {
                style = 'width:' + widthRatio + '%';
                if (layoutPriority === 0) {
                    region = 'center';
                } else {
                    region = 'right';
                }
            }

            var vc = new ViewContainer();
            vc.initialize();
            vc.setParent(_self);
            var cp = vc.getTopContainer();
            cp.set('style', style);
            cp.set('region', region);
            cp.set('layoutPriority', layoutPriority);
            cp.set('splitter', true);

            return vc;
        },

        _isCenterContainer : function (viewContainer) {
            if (viewContainer) {
                var cp = viewContainer.getTopContainer();
                if (cp.get('region') === 'center') {
                    return true;
                }
            }
            return false;
        },

        _swap : function (srcViewContainer, destViewContainer) {
            var srcVcList = srcViewContainer.getViewList();
            var destVcList = destViewContainer.getViewList();
            var tempView = new View('_tempForSwap2', 'title');

            destViewContainer.addLast(tempView);
            _.forEach(destVcList, function (view) {
                destViewContainer.remove(view);
                srcViewContainer.addLast(view);
            });

            _.forEach(srcVcList, function (view) {
                srcViewContainer.remove(view);
                destViewContainer.addLast(view);
            });

            tempView.getParent().remove(tempView, true);
        },

        _getNextShowedViewContainer : function (viewContainer) {
            var _self = this;
            var i, vc, found = false;
            var vcList = _self.getViewContainers();
            for (i = 0 ; i < vcList.length; i++) {
                vc = vcList[i];
                if (found) {
                    if (!_self._isHided(vc)) {
                        return vc;
                    }
                } else {
                    if (vc === viewContainer) {
                        found = true;
                    }
                }
            }
            return null;
        },

        _getViewContainersByState : function (isHided) {
            var _self = this;
            var hidedVcList = [];
            var showedVcList = [];
            var vcList = _self.getViewContainers();
            var i, j, vc;

            var children = this.widgetObject.getChildren();
            for (i = 0; i < children.length; i++) {
                for (j = 0 ; j < vcList.length; j++) {
                    vc = vcList[j];
                    if (children[i] === vc.getTopContainer()) {
                        showedVcList.push(vc);
                        break;
                    }
                }
            }

            for (i = 0 ; i < vcList.length; i++) {
                vc = vcList[i];
                if (_self._isHided(vc)) {
                    hidedVcList.push(vc);
                }
            }

            if (isHided) {
                return hidedVcList;
            } else {
                return showedVcList;
            }
        },

        _insert : function (vc, view, isPrev) {
            var region, layoutPriority, i, viewContainer, style, cellRatio;
            var _self = this;
            var showedList = _self._getViewContainersByState(false);
            var hidedList = _self._getViewContainersByState(true);
            var splitCount = showedList.length + 1;

            if (hidedList.length <= 0) {
                console.log('can not add new view container');
                return;
            }

            var targetViewContainer = hidedList[0];

            var viewMoveEvent = {
                view : view,
                nextSibling : null,
                destViewContainer : targetViewContainer
            };

            topic.publish('view.moved-before', viewMoveEvent);

            for (i = 0; i < showedList.length; i++) {
                viewContainer = showedList[i];
                if (viewContainer === vc) {
                    if (isPrev) {
                        showedList.splice(i, 0, targetViewContainer);
                    } else {
                        if (i === (showedList.length - 1)) {
                            showedList.push(targetViewContainer);
                        } else {
                            showedList.splice(i + 1, 0, targetViewContainer);
                        }
                    }
                    break;
                }
            }

            _self.showContainer(targetViewContainer);
            view.getParent().remove(view);
            targetViewContainer.addLast(view);

            var centerContainer = null;
            var centerContainerIndex;
            layoutPriority = [];

            for (i = 0; i < showedList.length; i++) {
                viewContainer = showedList[i];
                if (viewContainer.topContainer.get('region') === 'center') {
                    centerContainer = viewContainer;
                    centerContainerIndex = i;
                }
            }

            var firstViewContainer = showedList[0];
            if (firstViewContainer !== centerContainer) {
                this._swap(firstViewContainer, centerContainer);
                showedList.splice(centerContainerIndex + 1, 0, firstViewContainer);
                showedList.splice(0, 1);
            }

            cellRatio = parseInt(100 / splitCount, 10);
            for (i = 1; i < showedList.length; i++) {
                viewContainer = showedList[i];

                if (this._isHided(viewContainer)) {
                    continue;
                }

                if (_self.get('verticalSplit')) {
                    region = 'bottom';
                    style = 'height:' + cellRatio + '%';
                } else {
                    region = 'right';
                    style = 'width:' + cellRatio + '%';
                }
                layoutPriority = showedList.length - i;

                viewContainer.topContainer.set('region', region);
                viewContainer.topContainer.set('style', style);
                viewContainer.topContainer.set('layoutPriority', layoutPriority);

                _self.widgetObject.removeChild(viewContainer.getTopContainer());
                _self.widgetObject.addChild(viewContainer.getTopContainer());
            }

            topic.publish('view.moved', viewMoveEvent);
        },
    };

    return splitViewContainer;
});
