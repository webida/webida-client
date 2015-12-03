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
    'external/lodash/lodash.min',
    'webida-lib/util/logger/logger-client'
], function (
    editors, 
    menuItems, 
    Deferred, 
    _,
    Logger
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function _getPartRegistry() {
        var workbench = require('webida-lib/plugins/workbench/plugin');
        var page = workbench.getCurrentPage();
        return page.getPartRegistry();
    }

    function _getCurrentEditorPart() {
        var registry = _getPartRegistry();
        return registry.getCurrentEditorPart();
    }

    function getItemsUnderFile() {
        logger.info('getItemsUnderFile()');
        logger.trace();
        var items = {};
        var registry = _getPartRegistry();
        var currentPart = registry.getCurrentEditorPart();
        var editorParts = registry.getEditorParts();

        if (currentPart) {
            if (currentPart.isDirty()) {
                items['&Save'] = menuItems.fileMenuItems['&Save'];
            }
            if (registry.getDirtyParts().length > 0) {
                items['Sav&e All'] = menuItems.fileMenuItems['Sav&e All'];
            }

            items['&Close'] = menuItems.fileMenuItems['&Close'];

            if (editorParts.length > 1) {
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
        logger.info('getItemsUnderEdit()');
        var items = {};
        var deferred = new Deferred();
        var part = _getCurrentEditorPart();
        if (part) {
            var viewer = part.getViewer();
            if (viewer) {
                items = viewer.getMenuItemsUnderEdit(items, menuItems, deferred);
            }
        }
        return deferred.resolve(items);
    }

    function getItemsUnderFind() {
        logger.info('getItemsUnderFind()');
        var part = _getCurrentEditorPart();
        if (part) {
            var viewer = part.getViewer();
            if (viewer) {
                var items = {};
                items['&Replace'] = menuItems.findMenuItems['&Replace'];
                items['F&ind'] = menuItems.findMenuItems['F&ind'];
                items['&Highlight to Find'] = menuItems.findMenuItems['&Highlight to Find'];
                if (viewer.execute('existSearchQuery')) {
                    items['Find &Next'] = menuItems.findMenuItems['Find &Next'];
                    items['Find &Previous'] = menuItems.findMenuItems['Find &Previous'];
                }
                return items;
            }
        }
    }

    function getItemsUnderNavigate() {
        logger.info('getItemsUnderNavigate()');

        var registry = _getPartRegistry();
        var part = registry.getCurrentEditorPart();
        var parts = registry.getEditorParts();
        if (!part) {
            return null;
        }
        var viewer = part.getViewer();
        var items = {};

        // Navigate Editors
        var naviEditorsItems = {};
        var itemsList = ['&Select Tab from List', '&Previous Tab', '&Next Tab', 'Move Tab to &Other Container', 
                         '&Ex-Selected Tab', 'Switch &Tab Container'];

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
                if (parts.length >= 2) {
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


        _.each(itemsList, function (item) {
            if (getViewRunnableMenuItems(item)) {
                naviEditorsItems[item] = menuItems.navMenuItems['&Navigate Editors'][item];
            }
        });

        items['&Navigate Editors'] = naviEditorsItems;

        if (viewer) {
            items['&Go to Definition'] = menuItems.navMenuItems['&Go to Definition'];

            if (viewer.execute('isDefaultKeyMap')) {
                items['G&o to Line'] = menuItems.navMenuItems['G&o to Line'];
            }

            if (viewer.execute('isThereMatchingBracket')) {
                items['Go to &Matching Brace'] = menuItems.navMenuItems['Go to &Matching Brace'];
            }
        }

        return items;
    }

    function getItemsUnderView() {
        logger.info('getItemsUnderView()');
        var items = {};
        // Split Editors
        var layoutEditorsItems = {};
        if (editors.splitViewContainer.getShowedViewContainers().length > 1) {
            if (editors.splitViewContainer.get('verticalSplit') === true) {
                layoutEditorsItems['&Vertical'] = menuItems.viewMenuItems['Spl&it Editors']['&Vertical'];
            } else {                
                layoutEditorsItems['&Horizontal'] = menuItems.viewMenuItems['Spl&it Editors']['&Horizontal'];
            }
        } else {
            layoutEditorsItems['&Vertical'] = menuItems.viewMenuItems['Spl&it Editors']['&Vertical'];
            layoutEditorsItems['&Horizontal'] = menuItems.viewMenuItems['Spl&it Editors']['&Horizontal'];
        }

        items['Spl&it Editors'] = layoutEditorsItems;
        return items;
    }

    function getContextMenuItems() {
        logger.info('getContextMenuItems()');
        //var items;
        var registry = _getPartRegistry();
        var currentPart = registry.getCurrentEditorPart();
        if (!currentPart) {
            return null;
        } else {
            try {
                return currentPart.getContextMenuItems(menuItems);
            } catch (e) {
                logger.error(e);
            }
        }
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
