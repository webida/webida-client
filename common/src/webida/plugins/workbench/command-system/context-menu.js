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
 * @fileoverview webida - context menu
 *
 * @version: 0.1.0
 * @since: 2013.09.13
 *
 * Src:
 *   context-menu.js
 */

define(['external/lodash/lodash.min',                 // _
        'dojo/on',                    // on
        'dijit/Menu',                 // Menu
        'dijit/MenuItem',             // MenuItem
        'dijit/CheckedMenuItem',      // CheckedMenuItem
        'dijit/RadioMenuItem',        // RadioMenuItem
        'dijit/PopupMenuItem',        // PopupMenuItem
        'dijit/DropDownMenu',         // DropDownMenu
        'dijit/MenuSeparator',        // MenuSeparator
       ],
function (_, on, Menu, MenuItem, CheckedMenuItem, RadioMenuItem,
           PopupMenuItem, DropDownMenu, MenuSeparator) {
    'use strict';

    var EMPTY_OBJ = {};

    // prevent global browser context menu
    window.addEventListener('contextmenu', function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
    });

    var bodyElement = document.getElementsByTagName('body')[0];
    var contextEvent = {
        /*
        * preventDefault and stopPropagation is fixed the
        * Context menu bug on dialog's text input with keyboard's popup key
        */
        stop : function (e) {
            if (!contextMenu.isBuilt) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    };
    // context menu's open area handle
    bodyElement.addEventListener('contextmenu', function (event) {
        contextEvent.stop(event);
    });
    // context menu's open area handle
    on(bodyElement, 'keydown', function (event) {
        contextEvent.stop(event);
    });

    // context menu is singleton object
    var contextMenu = new Menu({
        id: 'webidaContextMenuDa',
        isBuilt : false,
        onBlur: function () {
            this.isBuilt = false;
        },
        style: 'width: 250px',
        contextMenuForWindow: true,
        targetNodeIds: ['app-workbench']
    });
    contextMenu.startup();

    function fillContextMenu(viableItems, menuItemTree) {

        function createMenuItems(viableItems, declaredItems, parentLoc) {

            var menuItems = [];

            Object.keys(declaredItems).forEach(function (itemName) {

                function createTerminalMenuItem(viableItem, declaredItem, label, loc) {
                    var menuItem, subPopup;
                    switch (viableItem[0]) {
                    case 'cmnd':
                        menuItem = new MenuItem({ label: label });
                        menuItem.set('onClick', menuItemTree.invoke.bind(menuItemTree, loc));

                        // additional info bind
                        var cmndInfo = declaredItem[1] || EMPTY_OBJ;

                        // shortcut key bind
                        menuItem.set('accelKey', cmndInfo.shortcut ? cmndInfo.shortcut.keys : '...');
                        on(menuItem.accelKeyNode, 'click', function (evt) {
                            evt.stopPropagation();
                            contextMenu.onCancel(true);
                            menuItemTree.openShortcutKeysSettingDialog(loc);
                        });
                        on(menuItem.accelKeyNode, 'mouseenter', function () {
                            menuItem.accelKeyNode.classList.add('webidaMenuItemAccelKeyHover');
                        });
                        on(menuItem.accelKeyNode, 'mouseleave', function () {
                            menuItem.accelKeyNode.classList.remove('webidaMenuItemAccelKeyHover');
                        });

                        // label resetting for a procedural menu item
                        if (cmndInfo.procedural) {
                            menuItem.set('label', label + '...');
                        }

                        // set an icon if specified
                        if (cmndInfo.icon) {
                            menuItem.set('iconClass', 'webidamenuicon');
                            var cssText =
                                'background-image: url(' + '"' + cmndInfo.icon + '"' +
                                '); width: 18px; height: 18px; text-align: "center"; ' +
                                'background-repeat: "no-repeat"';
                            menuItem.iconNode.style.cssText = cssText;
                        }

                        break;

                    case 'flag':
                        menuItem = new CheckedMenuItem({ label: label });
                        menuItem.set('checked', !!viableItem[3]);
                        menuItem.set('onClick', menuItemTree.invoke.bind(menuItemTree, loc));

                        break;

                    case 'enum':
                        menuItem = new PopupMenuItem({ label: label });
                        subPopup = new DropDownMenu({ style: 'width: 250px' });
                        menuItem.set('popup', subPopup);
                        var enumList = viableItem[3];
                        var disableList = viableItem[4];
                        _.each(enumList, function (sub, index) {
                            var subItem;
                            if (sub === '---') {
                                subItem = new MenuSeparator();
                            } else {
                                subItem = new MenuItem({ label: sub });
                                subItem.set('onClick', menuItemTree.invoke.bind(menuItemTree, loc, index));
                            }
                            // disabled
                            if (_.contains(disableList, index)) {
                                subItem.set('disabled', true);
                            }
                            subPopup.addChild(subItem);
                        });

                        break;

                    case 'radio':
                        menuItem = new PopupMenuItem({ label: label });
                        subPopup = new DropDownMenu({ style: 'width: 250px' });
                        menuItem.set('popup', subPopup);
                        var radioList = viableItem[3];
                        var radioSelectIndex = viableItem[4];
                        _.each(radioList, function (sub, index) {
                            var subItem = new RadioMenuItem({
                                label: sub,
                                group: 'group' + loc,
                                checked: radioSelectIndex === index
                            });
                            subItem.set('onClick', menuItemTree.invoke.bind(menuItemTree, loc, index));
                            subPopup.addChild(subItem);
                        });

                        break;

                    default:
                        console.error('assertion fail: unreachable');
                    }

                    return menuItem;
                }

                function createNonTerminalMenuItem(viableItem, declaredItem, label, loc) {
                    var menuItem;
                    menuItem = new PopupMenuItem({ label: label });
                    var subPopup = new DropDownMenu({ style: 'width: 250px' });
                    menuItem.set('popup', subPopup);
                    var subList = createMenuItems(viableItem, declaredItem, loc);
                    _.each(subList, function (subMenu) {
                        subPopup.addChild(subMenu);
                    });
                    return menuItem;
                }

                if (itemName === '__invisible__') {
                    // ignore and do nothing
                    return;
                }

                var item;
                var declaredItem = declaredItems[itemName];
                if (_.isString(declaredItem)) {
                    if (declaredItem === '---' && menuItems.length > 0 &&
                        !(_.last(menuItems) instanceof MenuSeparator)) {
                        item = new MenuSeparator();
                    }
                } else {
                    var viableItem = viableItems[itemName];
                    if (!viableItem) {
                        return;
                    }

                    var label = (viableItem.alternateLabel || itemName).replace(/&(.)/, '{$1}');
                    var loc = parentLoc + '/' + itemName;

                    if (_.isArray(viableItem)) {
                        item = createTerminalMenuItem(viableItem, declaredItem, label, loc);
                    } else if (_.isObject(viableItem)) {
                        if (Object.keys(viableItem).length > 0) { // have sub menu
                            item = createNonTerminalMenuItem(viableItem, declaredItem, label, loc);
                        }
                    }
                }

                if (item) {
                    menuItems.push(item);
                }
            });

            if (_.last(menuItems) instanceof MenuSeparator) {
                menuItems.pop();
            }

            return menuItems;
        }

        var menuItems = createMenuItems(viableItems, menuItemTree.getWholeItems(), '');
        _.each(menuItems, function (item) {
            if (item) {
                contextMenu.addChild(item);
            }
        });
    }

    function rebuild(menuItemTree, evt) {
        //console.log('rebuild', menuItemTree);

        // clear previous context menu items
        var children = contextMenu.getChildren();
        if (children) {
            children.forEach(function (child) {
                child.destroyRecursive();
            });
        }

        menuItemTree.getViableItems(function (items) {

            // fill the context menu
            fillContextMenu(items, menuItemTree);

            // context menu item check
            var child = contextMenu.getChildren();
            if (child && child.length > 0) {
                contextMenu.isBuilt = true;

                // context event info copy and re-trigger
                var element = document.getElementById('app-workbench');
                var ev = document.createEvent('HTMLEvents');
                ev.initEvent('contextmenu', true, false);
                ev.pageX = evt.pageX;
                ev.pageY = evt.pageY;

                element.dispatchEvent(ev);
            }
        });
    }

    return {
        rebuild: rebuild
    };
});

