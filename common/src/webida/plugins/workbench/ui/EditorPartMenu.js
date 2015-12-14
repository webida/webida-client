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
 * EditorPartMenu
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'webida-lib/plugins/editors/plugin',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './PartMenu'
], function (
    editors, //TODO will be removed in 1.8.0
    genetic, 
    Logger,
    PartMenu
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    logger.off();

    function EditorPartMenu(allItems, part) {
        logger.info('new EditorPartMenu(' + allItems + ', ' + part + ')');
        PartMenu.apply(this, arguments);
    }


    genetic.inherits(EditorPartMenu, PartMenu, {

        _getAvailableFileItems: function () {
            logger.info('_getAvailableFileItems()');
            var items = PartMenu.prototype._getAvailableFileItems.call(this);
            var menuItems = this.getAllItems();
            var part = this.getPart();
            var registry = this.getPartRegistry();
            if (part) {
                if (part.isDirty()) {
                    items['&Save'] = menuItems.fileMenuItems['&Save'];
                }
                if (registry.getDirtyParts().length > 0) {
                    items['Sav&e All'] = menuItems.fileMenuItems['Sav&e All'];
                }
            }
            //TODO remove editors
            if (editors.recentFiles.length > 0) {
                items['Recent Files'] = menuItems.fileMenuItems['Recent Files'];
                items['Recent Files'][3] = editors.recentFiles.exportToPlainArray();
            }
            return items;
        },

        _getAvailableViewItems: function () {
            logger.info('_getAvailableViewItems()');
            var items = {
                'Spl&it Editors': {}
            };
            var menuItems = this.getAllItems();
            var registry = this.getPartRegistry();
            if (registry.getEditorParts().length <= 1) {
                return items;
            }
            if (editors.splitViewContainer.getShowedViewContainers().length > 1) {
                if (editors.splitViewContainer.get('verticalSplit') === true) {
                    items['Spl&it Editors']['&Vertical'] = menuItems.viewMenuItems['Spl&it Editors']['&Vertical'];
                } else {                
                    items['Spl&it Editors']['&Horizontal'] = menuItems.viewMenuItems['Spl&it Editors']['&Horizontal'];
                }
            } else {
                items['Spl&it Editors']['&Vertical'] = menuItems.viewMenuItems['Spl&it Editors']['&Vertical'];
                items['Spl&it Editors']['&Horizontal'] = menuItems.viewMenuItems['Spl&it Editors']['&Horizontal'];
            }
            return items;
        },

        _getAvailableNavigateItems: function () {
            logger.info('_getAvailableNavigateItems()');
            var items = {};
            var menuItems = this.getAllItems();
            var registry = this.getPartRegistry();
            var parts = registry.getEditorParts();

            // Navigate Editors
            var naviEditorsItems = {};
            var itemsList = [
                '&Select Tab from List',
                '&Previous Tab',
                '&Next Tab',
                'Move Tab to &Other Container', 
                '&Ex-Selected Tab',
                'Switch &Tab Container'
            ];
    
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

            itemsList.forEach(function (item) {
                if (getViewRunnableMenuItems(item)) {
                    naviEditorsItems[item] = menuItems.navMenuItems['&Navigate Editors'][item];
                }
            });

            items['&Navigate Editors'] = naviEditorsItems;

            return items;
        }
    });

    return EditorPartMenu;
});
