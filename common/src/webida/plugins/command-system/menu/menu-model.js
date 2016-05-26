/*
 * Copyright (c) 2012-2016 S-Core Co., Ltd.
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
 * @file The menu model.
 * @since 1.7.0
 * @author minsung.jin@samsung.com
 */

define([
    './Menu'
], function (
    Menu
) {
    'use strict';

    var model = {
        topMenu: new Menu({
            id: 'root',
            type: 'top-menu',
            items: []
        }),
        contextMenu: new Menu({
            id: 'root',
            type: 'context-menu',
            items: []
        }),
        userIdMenu: new Menu({
            id: 'root',
            type: 'user-id-menu',
            items: []
        })
    };

    /**
     * @param {String} id of the menu.
     * @param {Object} model of the menu.
     */
    function findMenu(id, model) {
        var item;
        if (id === model.id) {
            item = model;
        } else {
            if ('items' in model && Array.isArray(model.items)) {
                model.items.some(function (child) {
                    item = findMenu(id, child);
                    if (item) {
                        return true;
                    }
                });
            }
        }
        return item;
    }

    /**
     *
     */
    function createPromiseForTopMenuModel(item) {
        return new Promise(function (resolve) {
            require([item.plugin + '/menus'], function (ext) {
                ext.updateTopMenu();
                resolve(item.plugin);
            });
        });
    }

    /**
     *
     */
    function createPromiseForContextMenuModel(item) {
        return new Promise(function (resolve) {
            require([item.plugin + '/menus'], function (ext) {
                if (typeof ext.updateContextMenu === 'function') {
                    ext.updateContextMenu();
                    resolve(item.plugin);
                }
            });
        });
    }

    var menuModel = {
        /**
         * @param {String} type of the menu.
         */
        getMenuModel: function (type) {
            var menuModel;
            if (type === 'top-menu') {
                menuModel = model.topMenu;
            } else if (type === 'context-menu') {
                menuModel = model.contextMenu;
            } else {
                menuModel = model.userIdMenu;
            }
            return menuModel;
        },
        /**
         * @param {String} id of the menu.
         */
        getTopMenuModel: function (id) {
            if (id) {
                return findMenu(id, model.topMenu);
            } else {
                return model.topMenu;
            }
        },
        /**
         * @param {String} id of the menu.
         */
        getContextMenuModel: function (id) {
            if (id) {
                return findMenu(id, model.contextMenu);
            } else {
                return model.contextMenu;
            }
        },
        /**
         * @param {String} id of the menu.
         */
        getUserIdMenuModel: function (id) {
            if (id) {
                return findMenu(id, model.userIdMenu);
            } else {
                return model.userIdMenu;
            }
        },
        /**
         *
         */
        updateTopMenuModel: function (cb) {
            var res = [];
            var updatedPlugin;
            model.topMenu.items.forEach(function (menu) {
                menu.items.forEach(function (item) {
                    if (item.update && item.plugin !== updatedPlugin) {
                        res = res.concat(createPromiseForTopMenuModel(item));
                        updatedPlugin = item.plugin;
                    }
                });
            });
            Promise.all(res).then(function (value) {
                cb(value);
            });
        },
        /**
         *
         */
        updateContextMenuModel: function (cb) {
            var res = [];
            var updatedPlugin;
            model.contextMenu.items.forEach(function (item) {
                if (item.update && item.plugin !== updatedPlugin) {
                    res = res.concat(createPromiseForContextMenuModel(item));
                    updatedPlugin = item.plugin;
                }
            });
            Promise.all(res).then(function (value) {
                cb(value);
            });
        },
        /**
         * @param {String} id of the menu.
         * @param {Object} model of the menu.
         */
        findMenu: findMenu
    };

    return menuModel;
});
