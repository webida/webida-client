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

// @formatter:off
define([
    './plugin', 
    './menu-items', 
    'dojo/Deferred', 
    'external/lodash/lodash.min'
], function(
    editors, 
    menuItems, 
    Deferred, 
    _
) {
    'use strict';
// @formatter:on

    function getItemsUnderFile() {
        var items = {};
        var opened = _.values(editors.files);
        if (editors.currentFile && opened && opened.length > 0) {
        	var currentPart = editors.getPart(editors.currentFile);
            if (currentPart.isDirty()) {
                items['&Save'] = menuItems.fileMenuItems['&Save'];
            }
            if (editors.hasModifiedFile()) {
                items['Sav&e All'] = menuItems.fileMenuItems['Sav&e All'];
            }

            items['&Close'] = menuItems.fileMenuItems['&Close'];

            if (opened.length > 1) {
                items['Cl&ose Others'] = menuItems.fileMenuItems['Cl&ose Others'];
            }

            items['C&lose All'] = menuItems.fileMenuItems['C&lose All'];
        }
        if (editors.recentFiles.length > 0) {
            items['Recent Files'] = menuItems.fileMenuItems['Recent Files'];
            items['Recent Files'][3] = editors.recentFiles.exportToPlainArray();
        }
        return items;
    }

    function getItemsUnderEdit() {
        var deferred = new Deferred();
        var items = {};
        var opened = _.values(editors.files);
        if (!opened || opened.length < 1) {
            return null;
        }

        var viewer = editors.currentFile && editors.currentFile.viewer;
        if (viewer) {
            viewer.getMenuItemsUnderEdit(items, menuItems, deferred);
        }

        return deferred;
    }

    function getItemsUnderFind() {
        var opened = _.values(editors.files);
        if (!opened || opened.length < 1) {
            return null;
        } else {
            var items = {};
            items['&Replace'] = menuItems.findMenuItems['&Replace'];
            items['F&ind'] = menuItems.findMenuItems['F&ind'];
            items['&Highlight to Find'] = menuItems.findMenuItems['&Highlight to Find'];
            if (editors.execCommandForCurrentEditorViewer('existSearchQuery')) {
                items['Find &Next'] = menuItems.findMenuItems['Find &Next'];
                items['Find &Previous'] = menuItems.findMenuItems['Find &Previous'];
            }
            return items;
        }
    }

    function getItemsUnderNavigate() {
        function getViewRunnableMenuItems(menuName) {
            var splitContainer = editors.splitViewContainer;
            var focusedVc = splitContainer.getFocusedViewContainer();
            var view;

            if (menuName === '&Select Tab from List') {
                if (editors.editorTabFocusController.getViewList().length > 1) {
                    return true;
                }
                return false;
            } else if (menuName === '&Previous Tab') {
                if (focusedVc.getChildren().length > 1) {
                    return true;
                }
            } else if (menuName === '&Next Tab') {
                if (focusedVc.getChildren().length > 1) {
                    return true;
                }
            } else if (menuName === 'Move Tab to &Other Container') {
                view = focusedVc.getSelectedView();
                if (focusedVc && view) {
                    var showedVcList = splitContainer.getShowedViewContainers();
                    if (showedVcList.length === 1 && (showedVcList[0].getChildren().length > 1)) {
                        return true;
                    } else if (showedVcList.length > 1) {
                        return true;
                    }
                }
                return false;
            } else if (menuName === '&Ex-Selected Tab') {
                if (editors.currentFiles.length > 1) {
                    return true;
                }
            } else if (menuName === 'Switch &Tab Container') {
                if (splitContainer.getShowedViewContainers().length > 1) {
                    return true;
                }
            } else {
                console.warn('Unknown menu name ' + menuName);
            }
            return false;
        }

        var opened = _.values(editors.files);
        var items = {};

        // Navigate Editors
        var naviEditorsItems = {};

        var itemsList = ['&Select Tab from List', '&Previous Tab', '&Next Tab', 
            'Move Tab to &Other Container', '&Ex-Selected Tab', 'Switch &Tab Container'];

        _.each(itemsList, function(item) {
            if (getViewRunnableMenuItems(item)) {
                naviEditorsItems[item] = menuItems.navMenuItems['&Navigate Editors'][item];
            }
        });

        items['&Navigate Editors'] = naviEditorsItems;

        if (opened && opened.length >= 1) {
            items['&Go to Definition'] = menuItems.navMenuItems['&Go to Definition'];

            if (editors.execCommandForCurrentEditorViewer('isDefaultKeyMap')) {
                items['G&o to Line'] = menuItems.navMenuItems['G&o to Line'];
            }

            if (editors.execCommandForCurrentEditorViewer('isThereMatchingBracket')) {
                items['Go to &Matching Brace'] = menuItems.navMenuItems['Go to &Matching Brace'];
            }
        }

        return items;
    }

    function getItemsUnderView() {
        var items = {};
        // Split Editors
        var layoutEditorsItems = {};
        if (editors.splitViewContainer.getShowedViewContainers().length > 1) {
            if (editors.splitViewContainer.get('verticalSplit') === true) {
                layoutEditorsItems['&Horizontal'] = menuItems.viewMenuItems['Spl&it Editors']['&Horizontal'];
            } else {
                layoutEditorsItems['&Vertical'] = menuItems.viewMenuItems['Spl&it Editors']['&Vertical'];
            }
        } else {
            layoutEditorsItems['&Vertical'] = menuItems.viewMenuItems['Spl&it Editors']['&Vertical'];
            layoutEditorsItems['&Horizontal'] = menuItems.viewMenuItems['Spl&it Editors']['&Horizontal'];
        }

        items['Spl&it Editors'] = layoutEditorsItems;
        return items;
    }

    function getContextMenuItems() {
        var deferred = new Deferred();
        var items = {};

        var opened = _.values(editors.files);
        if (!opened || opened.length < 1) {
            return null;
        }

        var editorPart = editors.getPart(editors.currentFile);
        if (editorPart) {
            editorPart.getContextMenuItems(opened, items, menuItems, deferred);
        }

        return deferred;
    }

    return {
        getItemsUnderFile: getItemsUnderFile,
        getItemsUnderEdit: getItemsUnderEdit,
        getItemsUnderFind: getItemsUnderFind,
        getItemsUnderNavigate: getItemsUnderNavigate,
        getItemsUnderView: getItemsUnderView,
        getContextMenuItems: getContextMenuItems
    };
});
