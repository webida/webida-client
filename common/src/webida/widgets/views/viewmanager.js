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

define(['dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'dojo/topic'],
function (BorderContainer, ContentPane, topic) {
    'use strict';

    var viewManager = {

        _viewMap : [],
        _groupMap : {},
        _isDragging : false,
        _draggingData : null,

        initialize : function (/*elem*/) { },

        getView : function (id) {
            if (this._viewMap.hasOwnProperty(id)) {
                return this._viewMap[id];
            }
            return null;
        },

        addView : function (view) {
            this._viewMap[view.getId()] = view;
            var event = {
                view : view
            };
            topic.publish('view.registered', event);
        },

        removeView : function (view) {
            if (view) {
                var id = view.getId();
                delete this._viewMap[id];
                var event = {
                    view : view
                };
                topic.publish('view.unregistered', event);
            }
        },

        addToGroup : function (splitViewContainer, groupName) {

            var _self = this;
            var groupList, i;

            _self.removeFromGroup(splitViewContainer);

            if (!_self._groupMap.hasOwnProperty(groupName)) {
                _self._groupMap[groupName] = [];
            }

            groupList = _self._groupMap[groupName];
            for (i = 0; i < groupList.length; i++) {
                if (groupList[i] === splitViewContainer) {
                    return;
                }
            }
            groupList.push(splitViewContainer);

        },

        removeGroup : function (groupName) {
            var _self = this;
            if (_self._groupMap.hasOwnProperty(groupName)) {
                delete _self._groupMap[groupName];
            }
        },

        removeFromGroup : function (splitViewContainer) {

            var _self = this;
            var groupList, i;
            var groupName = _self.getGroupName(splitViewContainer);
            if (_self._groupMap.hasOwnProperty(groupName)) {
                groupList = _self._groupMap[groupName];
                for (i = 0; i < groupList.length; i++) {
                    if (groupList[i] === splitViewContainer) {
                        groupList.splice(i, 1);
                    }
                }
            }

        },

        getGroupName : function (splitViewContainer) {

            var memberList, i;

            var self = this, name = null;
            Object.keys(this._groupMap).forEach(function (key) {
                if (name) {
                    return;
                }

                memberList = self._groupMap[key];
                for (i = 0 ; i < memberList.length; i++) {
                    if (memberList[i] === splitViewContainer) {
                        name = key;
                        break;
                    }
                }
            });

            return name;
        },

        getGroupListByName : function (groupName) {
            var _self = this;
            var groupList = [];
            if (_self._groupMap.hasOwnProperty(groupName)) {
                groupList = _self._groupMap[groupName];
            }
            return groupList;
        },

        _getGroupNameList : function (/*splitViewContainer*/) {
            var nameList = [];
            Object.keys(this._groupMap).forEach(function (key) {
                nameList.push(key);
            });
            return nameList;
        },

        isDroppable : function (viewContainer, view) {

            var targetSplitViewContainer, srcSplitViewContainer, targetGroupName, srcGroupName;
            //console.log(viewContainer);
            //console.log(view);
            if (viewContainer && view) {
                //console.log('x');
                targetSplitViewContainer = viewContainer.getParent();
                if (view.getParent()) {
                    srcSplitViewContainer = view.getParent().getParent();
                }

                if (targetSplitViewContainer && srcSplitViewContainer) {
                    if (targetSplitViewContainer === srcSplitViewContainer) {
                        return true;
                    } else {
                        targetGroupName = this.getGroupName(targetSplitViewContainer);
                        srcGroupName = this.getGroupName(srcSplitViewContainer);
                        //console.log(targetGroupName + " : " + srcGroupName);
                        if (targetGroupName && srcGroupName && (targetGroupName === srcGroupName)) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
            }

            return false;

        },

        dragStart : function (data) {
            this._isDragging = true;
            this._draggingData = data;
        },

        dragEnd : function () {
            this._isDragging = false;
            this._draggingData = null;
        },

        isDragging : function () {
            return this._isDragging;
        },

        getDraggingData : function () {
            return this._draggingData;
        },

    };

    return viewManager;

});
