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
 * @fileoverview webida - top level menu
 *
 * @version: 0.1.0
 * @since: 2013.09.12
 *
 * Src:
 *   top-level-menu.js
 */

define(['require',
        'external/lodash/lodash.min',             // _
        'dojo',                       // dojo
        'dojo/on',
        'dijit/registry',             // reg
        'dijit/Menu',                 // Menu
        'dijit/MenuItem',             // MenuItem
        'dijit/CheckedMenuItem',      // CheckedMenuItem
        'dijit/RadioMenuItem',        // RadioMenuItem
        'dijit/PopupMenuItem',        // PopupMenuItem
        'dijit/MenuBar',              // MenuBar
        'dijit/PopupMenuBarItem',     // PopupMenuBarItem
        'dijit/MenuBarItem',          // MenuBarItem
        'dijit/DropDownMenu',         // DropDownMenu
        'dijit/MenuSeparator',        // MenuSeparator
       ],
function (require, _, dojo, on, reg, Menu, MenuItem, CheckedMenuItem, RadioMenuItem,
          PopupMenuItem, MenuBar, PopupMenuBarItem, MenuBarItem, DropDownMenu, MenuSeparator) {
    'use strict';
    //console.log('mira: top level menubar module loaded...');

    var EMPTY_OBJ = {};

    var menuItemTree;
    var menubar = new MenuBar({
        id: 'webidaMenuBarMainMenu',
        'class': 'app-workbench-menubar-dijit'
    });

    function unfocus() {
        require(['../plugin'], function (workbench) {
            workbench.focusLastWidget();
        });
    }

    function setTopLevelMenuState() {

        function enableItems(viableItems) {
            var declaredItems = menuItemTree.getWholeItems();
            _.each(declaredItems, function (declaredItem, itemName) {
                if (itemName !== '__invisible__') {
                    var viableItem = viableItems[itemName];
                    var id = '/' + itemName;
                    var menuItem = reg.byId(id);
                    if (!menuItem) {
                        return;
                    }
                    setSubMenuState(viableItem || EMPTY_OBJ, declaredItem, id);
                }
            });
        }

        menuItemTree.getViableItems(enableItems);
    }

    function setSubMenuState(viableItems, declaredItems, pid) {

        _.each(declaredItems, function (declaredItem, itemName) {
            var id = pid + '/' + itemName;
            var menuItem = reg.byId(id);
            if (!menuItem) {
                return;
            }

            // set shortcut keys text
            if (_.isArray(declaredItem) && declaredItem[0] === 'cmnd') {
                var cmndInfo = declaredItem[1] || EMPTY_OBJ;
                menuItem.set('accelKey', cmndInfo.shortcut ? cmndInfo.shortcut.keys : '...');
            }

            var viableItem = viableItems[itemName];
            if (!viableItem) {
                menuItem.set('disabled', true);
                return;
            }

            // dynamically altering menu item label
            if (viableItem.alternateLabel) {
                menuItem.set('label', viableItem.alternateLabel.replace(/&(.)/, '{$1}'));
            }

            menuItem.set('disabled', false);

            if (_.isArray(declaredItem)) {
                var subPopup, type = declaredItem[0];
                switch (type) {
                case 'cmnd':
                    // do nothing
                    break;
                case 'flag':
                    menuItem.set('checked', !!viableItem[3]);
                    break;
                case 'enum':
                    var enumItems = viableItem[3];
                    var disabledItems = viableItem[4];
                    subPopup = menuItem.popup;
                    subPopup.destroyDescendants();
                    enumItems.forEach(function (enumItem, index) {
                        var item;
                        if (enumItem === '---') {
                            item = new MenuSeparator();
                        } else {
                            item = new MenuItem({ label: enumItem });
                            item.set('onClick', menuItemTree.invoke.bind(menuItemTree, id, index));
                        }
                        subPopup.addChild(item);
                    });
                    if (disabledItems) {
                        var children = subPopup.getChildren();
                        disabledItems.forEach(function (i) { children[i].set('disabled', true); });
                    }

                    break;

                case 'radio':
                    var radioItems = viableItem[3];
                    var selectionIndex = viableItem[4];
                    subPopup = menuItem.popup;
                    subPopup.destroyDescendants();
                    _.each(radioItems, function (radioItem, index) {
                        var item = new RadioMenuItem({
                            label: radioItem,
                            group: 'group' + id,
                            checked: selectionIndex === index
                        });
                        item.set('onClick', menuItemTree.invoke.bind(menuItemTree, id, index, ''));
                        subPopup.addChild(item);
                    });

                    break;
                }
            } else if (_.isObject(declaredItem)) {
                if (Object.keys(declaredItem).length > 0) {
                    setSubMenuState(viableItem, declaredItem, id);
                }
            }
        });
    }

    function createTopLevelMenu(declaredItems) {

        _.each(declaredItems, function (item, itemName) {
            if (itemName === '__invisible__') {
                return;
            }

            var label = itemName.replace(/&(.)/, '{$1}');
            var id = '/' + itemName;
            var menuItem = new PopupMenuBarItem({ label: label, id: id });
            menubar.addChild(menuItem);

            if (Object.keys(item).length > 0) { // have sub menu
                // each SubMenu item create
                var subPopup = new DropDownMenu({ style: 'width: 250px' });
                menuItem.set('popup', subPopup);
                var subMenuList = createSubMenu(item, id);
                subMenuList.forEach(function (subMenu) {
                    subPopup.addChild(subMenu);
                });

            }
        });
    }

    function createSubMenu(items, parentId) {
        var menuItem, subMenuList = [];

        _.each(items, function (item, itemName) {

            function createTerminalMenuItem(item, label, id) {
                var menuItem, type, subPopup;
                switch ((type = item[0])) {
                case 'cmnd':
                    menuItem = new MenuItem({ label: label, id: id, disabled: true });
                    menuItem.set('onClick', menuItemTree.invoke.bind(menuItemTree, id));

                    // additional info bind
                    var cmndInfo = item[1] || EMPTY_OBJ;

                    // shortcut key bind
                    menuItem.set('accelKey', cmndInfo.shortcut ? cmndInfo.shortcut.keys : '...');
                    on(menuItem.accelKeyNode, 'click', function (evt) {
                        evt.stopPropagation();
                        unfocus();
                        menuItemTree.openShortcutKeysSettingDialog(id);
                    });
                    on(menuItem.accelKeyNode, 'mouseenter', function () {
                        menuItem.accelKeyNode.classList.add('webidaMenuItemAccelKeyHover');
                    });
                    on(menuItem.accelKeyNode, 'mouseleave', function () {
                        menuItem.accelKeyNode.classList.remove('webidaMenuItemAccelKeyHover');
                    });

                    // label resetting
                    if (cmndInfo.procedural) {
                        menuItem.set('label', label + '...');
                    }

                    // icon bind
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
                    menuItem = new CheckedMenuItem({ label: label, id: id, disabled: true });
                    menuItem.set('onClick', menuItemTree.invoke.bind(menuItemTree, id));

                    break;

                case 'enum':
                    menuItem = new PopupMenuItem({ label: label, id: id, disabled: true });
                    subPopup = new DropDownMenu({ style: 'width: 250px' });
                    menuItem.set('popup', subPopup);

                    break;

                case 'radio':
                    menuItem = new PopupMenuItem({ label: label, id: id, disabled: true });
                    subPopup = new DropDownMenu({ style: 'width: 250px' });
                    menuItem.set('popup', subPopup);

                    break;

                default:
                    console.assert(type === undefined,
                                   'assertion fail: type must be undefined, but ' + type);
                }

                return menuItem;
            }

            function createNonTerminalMenuItem(item, label, id) {
                menuItem = new PopupMenuItem({ label: label, id: id, disabled: true });
                var subPopup = new DropDownMenu({ style: 'width: 250px' });
                menuItem.set('popup', subPopup);
                var subList = createSubMenu(item, id);
                subList.forEach(function (subMenu) {
                    subPopup.addChild(subMenu);
                });

                return menuItem;
            }

            if (_.isString(item)) {
                if (item === '---' && subMenuList.length > 0 &&
                    !(_.last(subMenuList) instanceof MenuSeparator)) {
                    menuItem = new MenuSeparator();
                }
            } else {
                var label = itemName.replace(/&(.)/, '{$1}');
                var id = parentId + '/' + itemName;

                if (_.isArray(item)) {
                    menuItem = createTerminalMenuItem(item, label, id);
                } else if (_.isObject(item)) {
                    if (Object.keys(item).length > 0) {
                        menuItem = createNonTerminalMenuItem(item, label, id);
                    } else {
                        menuItem = new MenuItem({ label: label, id: id, disabled: true });
                    }
                }
            }

            if (menuItem) {
                subMenuList.push(menuItem);
            }
        });

        if (_.last(subMenuList) instanceof MenuSeparator) {
            subMenuList.pop();
        }

        return subMenuList;
    }

    function init(argMenuItemTree) {
        menuItemTree = argMenuItemTree;
        createTopLevelMenu(argMenuItemTree.getWholeItems());

        menubar.placeAt('app-workbench-menubar');
        menubar.startup();

        // setting all (item's enable, disable, check, etc)
        dojo.connect(menubar, 'onFocus', setTopLevelMenuState);

        // menubar focused 'ESC' then close
        dojo.connect(menubar, 'onKeyDown', function (evt) {
            evt.stopPropagation();
            if (evt.keyCode === 27) {  // ESC
                unfocus();
            }
        });
    }

    return {
        menubar: menubar,
        init: init,
    };
});
