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
 * @file The context Menu.
 * @since: 1.7.0
 * @author: minsung.jin@samsung.com
 */

define([
    'external/lodash/lodash.min',
    'dijit/DropDownMenu',
    'dijit/Menu',
    'dijit/MenuItem',
    'dijit/MenuSeparator',
    'dijit/PopupMenuItem',
    'dijit/registry',
    'dojo/keys',
    'dojo/on',
    'webida-lib/plugins/command-system/system/command-system'
], function (
    _,
    DropDownMenu,
    Menu,
    MenuItem,
    MenuSeparator,
    PopupMenuItem,
    reg,
    keys,
    on,
    commandSystem
) {
    'use strict';

    // context menu is singleton object
    var contextMenu = new Menu({
        id: 'commandSystemContextMenu',
        isBuilt : false,
        onBlur: function () {
            this.isBuilt = false;
        },
        stopEvent: function (e) {
            if (!this.isBuilt) {
                e.preventDefault();
                e.stopPropagation();
            }
        },
        style: 'width: 250px',
        contextMenuForWindow: true,
        targetNodeIds: ['app-workbench']
    });
    contextMenu.startup();

    window.addEventListener('contextmenu', function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
    });

    var bodyElement = document.getElementsByTagName('body')[0];
    bodyElement.addEventListener('contextmenu', function (event) {
        contextMenu.stopEvent(event);
    });
    on(bodyElement, 'keydown', function (event) {
        if (event.keyCode === keys.SELECT) {
            contextMenu.stopEvent(event);
        }
    });

    var privates = {
        createDropDownMenu: function createDropDownMenu(pluginName, item) {
            var label = item.name.replace(/&(.)/, '{$1}');
            var popup = new DropDownMenu({ style: 'width: 250px' });
            var menuItem = new PopupMenuItem({ label: label, disabled: item.disabled });
            menuItem.set('popup', popup);
            var children = privates.createMenuItems(pluginName, item.items);
            _.each(children, function (child) {
                popup.addChild(child);
            });
            return menuItem;
        },

        invisibleContext: function invisibleContext(pluginName, item) {
            var ret = false;
            var subString = 'editor';
            if (pluginName.indexOf(subString) > -1) {
                if (item.plugin.indexOf(subString) < 0) {
                    ret = true;
                }
            } else {
                if (item.plugin.indexOf(subString) > -1) {
                    ret = true;
                }
            }
            return ret;
        },

        createMenuItems: function createMenuItems(pluginName, items) {
            var menuItems = [];
            var item;
            var label;
            _.each(items, function (child) {
                if (child.invisible || privates.invisibleContext(pluginName, child)) {
                    return;
                }

                if (child.items.length > 0) {
                    item = privates.createDropDownMenu(pluginName, child);
                } else {
                    if (child.name === '---') {
                        item = new MenuSeparator();
                    } else {
                        label = child.name.replace(/&(.)/, '{$1}');
                        item = new MenuItem({ label: label, disabled: child.disabled });
                        item.set('onClick', function () {
                            commandSystem.service.requestExecution(child.commandId);
                        });
                    }
                }
                if (item) {
                    menuItems.push(item);
                }
            });
            return menuItems;
        },

        fillContextMenu: function fillContextMenu(pluginName) {
            var model = commandSystem.service.getContextMenuModel();
            var menuItems = privates.createMenuItems(pluginName, model.items);
            _.each(menuItems, function (item) {
                if (item) {
                    contextMenu.addChild(item);
                }
            });
        }
    };

    function createContextMenu(pluginName, event) {
        var children = contextMenu.getChildren();
        if (children) {
            _.each(children, function (child) {
                child.destroyRecursive();
            });
        }
        privates.fillContextMenu(pluginName);
        var child = contextMenu.getChildren();
        if (child && child.length > 0) {
            contextMenu.isBuilt = true;
            var element = document.getElementById('app-workbench');
            var ev = document.createEvent('HTMLEvents');
            ev.initEvent('contextmenu', true, false);
            ev.pageX = event.pageX;
            ev.pageY = event.pageY;
            element.dispatchEvent(ev);
        }
    }

    return {
        create: createContextMenu
    };
});
