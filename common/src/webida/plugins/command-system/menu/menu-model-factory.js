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
 * @file This file create model of the menu.
 * @since 1.7.0
 * @author minsung.jin@samsung.com
 */

define([
    './Menu',
    './menu-model'
], function (
    Menu,
    menuModel
) {
    'use strict';

    function changeOriginalLocation(location) {
        var original = location.split('?')[0].split('/');
        if (original.length > 2) {
            return '/' + original[original.length - 2] + '/';
        } else {
            return original[0] + '/';
        }
    }
    /**
     * @param {Object} menu
     * @param {Object} model of the menu
     */
    function setMenuLocation(menu, model) {
        var subStings;
        var itemIndex;
        var parentMenu;
        var parentMenuItems;
        var selector;
        var siblingMenu;
        var siblingMenuItems;
        var siblingItemIndex;
        subStings = menu.location.split('/');
        itemIndex = subStings.length - 1;
        if (menu.location === '/') {
            parentMenu = model;
        } else {
            parentMenu = menuModel.findMenu(subStings[itemIndex - 1], model);
        }
        if (parentMenu) {
            parentMenuItems = parentMenu.items;
        } else {
            parentMenuItems = menuModel.getMenuModel(menu.type).items;
        }
        selector = subStings[itemIndex].split('?');
        if (selector) {
            siblingMenu = menuModel.findMenu(selector[0], model);
            if (siblingMenu) {
                siblingMenuItems = siblingMenu.items;
                siblingItemIndex = parentMenuItems.indexOf(siblingMenu);
            }
            switch (selector[selector.length - 1]) {
                case 'after':
                    if (parentMenuItems[siblingItemIndex + 1] !== menu) {
                        menu.location = siblingMenu.location;
                        parentMenuItems.splice(siblingItemIndex + 1, 0, menu);
                    }
                    break;
                case 'before':
                    if (parentMenuItems[siblingItemIndex - 1] !== menu) {
                        menu.location = siblingMenu.location;
                        parentMenuItems.splice(siblingItemIndex, 0, menu);
                    }
                    break;
                case 'under':
                    if (!siblingMenuItems) {
                        siblingMenuItems = [];
                    }
                    if (siblingMenuItems[siblingMenuItems.length - 1] !== menu) {
                        menu.location = siblingMenu.location;
                        siblingMenuItems.push(menu);
                    }
                    break;
                default:
                    if (parentMenuItems[parentMenuItems.length - 1] !== menu) {
                        parentMenuItems.push(menu);
                    }
                    break;
            }
        } else {
            if (parentMenuItems[parentMenuItems.length - 1] !== menu) {
                parentMenuItems.push(menu);
            }
        }
    }
    /**
     * @param {Object} item is meta of the plugin.
     */
    function createMenu(item, model) {
        var menu = new Menu(item);
        var childMenu;
        if (item.update === 'true') {
            menu.update = true;
        }
        if (!item.type) {
            menu.type = model.type;
        }
        setMenuLocation(menu, model);
        if ('items' in item && Array.isArray(item.items)) {
            item.items.forEach(function (child) {
                item.location = changeOriginalLocation(item.location);
                child.location = item.location + item.id + '/';
                childMenu = createMenu(child, model);
            });
        }
        return menu;
    }
    /**
     * @param {Object} item is meta of the plugin.
     * @param {Object} model of the menu.
     */
    function isExistMenu(item, model) {
        var exist = false;
        if (menuModel.findMenu(item.id, model)) {
            if (item.id !== 'delimiter') {
                return true;
            }
        }
        if ('items' in item && Array.isArray(item.items)) {
            item.items.some(function (child) {
                if (isExistMenu(child, model)) {
                    exist = true;
                }
                return exist;
            });
        }
        return exist;
    }
    /**
     * @param {Object} item is meta of the plugin.
     */
    function setMenuPluginPath(item) {
        if ('items' in item && Array.isArray(item.items)) {
            item.items.forEach(function (child) {
                if (!child.plugin) {
                    child.plugin = item.plugin;
                }
                if ('items' in child && Array.isArray(child.items)) {
                    setMenuPluginPath(child);
                }
            });
        }
    }
    /**
     * @param {Object} item is meta of the plugin.
     */
    function addMenu(item, parentItem) {
        var model = menuModel.getMenuModel(item.type);
        if (typeof parentItem === 'string') {
            item.plugin = parentItem;
            if (isExistMenu(item, model)) {
                if ('items' in item && Array.isArray(item.items)) {
                    item.items.forEach(function (child) {
                        if (!child.plugin) {
                            child.plugin = parentItem;
                        }
                        addMenu(child, menuModel.findMenu(item.id, model));
                    });
                }
            } else {
                setMenuPluginPath(item);
                createMenu(item, model);
            }
        } else {
            model = parentItem;
            item.location = parentItem.location + parentItem.id + '/';
            if (isExistMenu(item, model)) {
                if ('items' in item && Array.isArray(item.items)) {
                    item.items.forEach(function (child) {
                        if (!child.plugin) {
                            child.plugin = parentItem.plugin;
                        }
                        addMenu(child, menuModel.findMenu(item.id, model));
                    });
                }
            } else {
                setMenuPluginPath(item);
                createMenu(item, model);
            }
        }
    }
    /**
     * The factory about model of menu.
     * @module
     */
    var menuModelFactory = {
        /**
         * @param {Object} extension is meta of the plugin about menus.
         */
        createMenuModel: function (extension) {
            extension.items.forEach(function (item) {
                addMenu(item, extension.__plugin__.loc);
            });
        },
        /**
         *
         */
        addMenuModel: function (item, parentItem) {
            addMenu(item, parentItem);
        }
    };

    return menuModelFactory;
});
