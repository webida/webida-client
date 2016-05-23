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
 *
 * @file
 * @since: 1.7.0
 * @author: minsung.jin@samsung.com
 */

define([
    'external/lodash/lodash.min',
    'dijit/DropDownMenu',
    'dijit/Menu',
    'dijit/MenuBar',
    'dijit/MenuItem',
    'dijit/MenuSeparator',
    'dijit/PopupMenuBarItem',
    'dijit/PopupMenuItem',
    'dijit/registry',
    'dojo',
    'dojo/keys',
    'dojo/on',
    'dojo/topic',
    'webida-lib/plugins/command-system/system/command-system',
    './toolbar'
], function (
    _,
    DropDownMenu,
    Menu,
    MenuBar,
    MenuItem,
    MenuSeparator,
    PopupMenuBarItem,
    PopupMenuItem,
    reg,
    dojo,
    keys,
    on,
    topic,
    commandSystem,
    toolbar
) {
    'use strict';

    var menubar = new MenuBar({
        id: 'commandSystemMenuBar',
        'class': 'app-workbench-menubar-dijit'
    });

    var commandService = commandSystem.service;

    function createTopMenu() {
        var label;
        var menuItem;
        var popup;
        var children;
        var model = commandSystem.service.getTopMenuModel();
        _.each(model.items, function (item) {
            if (item.invisible) {
                return;
            }
            label = item.name.replace(/&(.)/, '{$1}');
            menuItem = new PopupMenuBarItem({ label: label, id: item.id });
            menubar.addChild(menuItem);
            if (item.items.length > 0) {
                popup = new DropDownMenu({ style: 'width: 250px' });
                menuItem.set('popup', popup);
                children = createSubMenu(item.items);
                children.forEach(function (child) {
                    popup.addChild(child);
                });
            }
        });
        menubar.placeAt('app-workbench-menubar');
        menubar.startup();
        dojo.connect(menubar, 'onClick', function () {
            commandService.updateTopMenuModel(function () {
                model = commandSystem.service.getTopMenuModel();
                updateTopMenuItems(model.items);
                setTopMenuState();
                toolbar.update();
            });
        });
        dojo.connect(menubar, 'onKeyDown', function (evt) {
            evt.stopPropagation();
            if (evt.keyCode === keys.ESCAPE) {
                unfocus();
            }
        });

        topic.subscribe('command-system/menu/update', updateTopMenuItems);
    }

    function createSubMenu(items) {
        var menuItem = [];
        var item;
        var label;
        _.each(items, function (child) {
            if (child.invisible) {
                return;
            }
            if (child.items.length > 0) {
                item = createDropDownMenu(child);
            } else {
                if (child.name === '---') {
                    item = new MenuSeparator();
                } else {
                    label = child.name.replace(/&(.)/, '{$1}');
                    item = new MenuItem({ label: label, id: child.id, disabled: child.disabled });
                    item.set('onClick', function () {
                        commandSystem.service.requestExecution(child.commandId);
                    });
                }
            }
            if (item) {
                menuItem.push(item);
            }
        });
        return menuItem;
    }

    function createDropDownMenu(item) {
        var label = item.name.replace(/&(.)/, '{$1}');
        var popup = new DropDownMenu({ style: 'width: 250px' });
        var menuItem = new PopupMenuItem({ label: label, disabled: item.disabled });
        menuItem.set('popup', popup);
        var children = createSubMenu(item.items);
        _.each(children, function (child) {
            popup.addChild(child);
        });

        return menuItem;
    }

    function unfocus() {
        require(['../plugin'], function (workbench) {
            workbench.focusLastWidget();
        });
    }

    function updateTopMenuItems(items) {
        var children;
        var popup;
        var menuItem;
        _.each(items, function (item) {
            menuItem = reg.byId(item.id);
            if (menuItem) {
                popup = menuItem.popup;
                if (popup) {
                    popup.destroyDescendants();
                    if (item.items.length > 0) {
                        updateTopMenuItems(item.items);
                        children = createSubMenu(item.items);
                        children.forEach(function (child) {
                            popup.addChild(child);
                        });
                    }
                }
            }
        });
    }

    function setTopMenuState() {
        var model = commandService.getTopMenuModel();
        _.each(model.items, function (item) {
            setSubMenuState(item);
        });
    }

    function setSubMenuState(item) {
        if (item.items.length > 0) {
            _.each(item.items, function (child) {
                setSubMenuState(child);
            });
        }
    }

    return {
        create: createTopMenu,
        menubar: menubar
    };
});
