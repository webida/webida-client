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
 * @fileoverview webida - toolbar
 *
 * @version: 0.1.0
 * @since: 2013.09.25
 *
 * Src:
 *   toolbar.js
 */

define([
    'external/lodash/lodash.min',    // _
    'dojo',                          // dojo
    'dojo/on',                       // on
    'dojo/dom-style',                // domStyle
    'dojo/dom-class',                // domClass
    'dojo/dom-attr',                 // domAttr
    'dojo/html',                     // html
    'dojo/query',                    // query
    'dojo/aspect',                   // aspect
    'dojo/topic',                    // topic
    'dojo/Deferred',                 // Deferred
    'dojo/_base/lang',               // lang
    'dijit/Toolbar',                 // Toolbar
    'dijit/form/Button',             // Button
    'dijit/form/DropDownButton',     // DropDownButton
    'dijit/form/ComboButton',        // ComboButton
    'dijit/Menu',                    // Menu
    'dijit/DropDownMenu',            // DropDownMenu
    'dijit/MenuItem',                // MenuItem
    'dijit/MenuSeparator',           // MenuSeparator
    'dijit/ToolbarSeparator',        // ToolbarSeparator
    'webida-lib/plugin-manager-0.1', // pm
    'webida-lib/util/theme',         // theme
    './MenuItemTree'                 // MenuItemTree
], function (
    _,
    dojo,
    on,
    domStyle,
    domClass,
    domAttr,
    html,
    query,
    aspect,
    topic,
    Deferred,
    lang,
    Toolbar,
    Button,
    DropDownButton,
    ComboButton,
    Menu,
    DropDownMenu,
    MenuItem,
    MenuSeparator,
    ToolbarSeparator,
    pm,
    theme,
    MenuItemTree
) {
    'use strict';
    //console.log('mira: toolbar module loaded...');

    var menuItemTree;

    function setItemTooltip(item, tooltip) {
        domAttr.set(item, 'rel', 'tooltip');
        domAttr.set(item, 'title', tooltip);
    }

    function setItemIcons(item, icons, iconClass) {
        // normal icon setting
        //var iconNormal = icons.normal;
        var iconNormal = icons;
        var imgClass;
        var img = '';

        // If an extension specifies a 'class' property, it precedes icons.
        // For example, an extension can use a sprite image in its class.
        if (iconClass) {
            imgClass = iconClass;
        }
        else if (iconNormal) {
            var menuitem = item.attr('data-menuitem');
            // convert id to valid class name e.g. /&File/&New/&File -> __File__New__File
            var modifiedIconClass = menuitem.replace(/&/g, '').replace(/\//g, '__').replace(/ /g, '_') + '_wticons';
            img = '<style type="text/css">' +
                      '.' + modifiedIconClass + ' {' +
                          'background-image: url("' + theme.apply(iconNormal) + '");' +
                      '}' +
                    '</style>';
            imgClass = modifiedIconClass;
        }

        if (imgClass) {
            imgClass += ' webida-tool-bar-icon webida-tool-bar-icon-normal';
            img = img + '<img class="' + imgClass + '"' +
                             'src="./styles/theme/webida-light/images/icons/transparent.png" draggable="false" />';
            item.attr('label', img);

            // icon changed setting
            on(item, 'mouseover', function () {
                if (this.get('disabled')) {
                    return;
                }

                $(this.containerNode).find('.webida-tool-bar-icon')
                .addClass('webida-tool-bar-icon-hover')
                .removeClass('webida-tool-bar-icon-normal')
                .removeClass('webida-tool-bar-icon-disabled')
                .removeClass('webida-tool-bar-icon-clicked');
            });

            on(item, 'mouseout', function () {
                if (this.get('disabled')) {
                    return;
                }

                $(this.containerNode).find('.webida-tool-bar-icon')
                .addClass('webida-tool-bar-icon-normal')
                .removeClass('webida-tool-bar-icon-hover')
                .removeClass('webida-tool-bar-icon-disabled')
                .removeClass('webida-tool-bar-icon-clicked');
            });

            on(item, 'mousedown', function () {
                if (this.get('disabled')) {
                    return;
                }

                $(this.containerNode).find('.webida-tool-bar-icon')
                .addClass('webida-tool-bar-icon-clicked')
                .removeClass('webida-tool-bar-icon-normal')
                .removeClass('webida-tool-bar-icon-disabled')
                .removeClass('webida-tool-bar-icon-hover');
            });

            on(item, 'mouseup', function () {
                if (this.get('disabled')) {
                    return;
                }

                $(this.containerNode).find('.webida-tool-bar-icon')
                .addClass('webida-tool-bar-icon-normal')
                .removeClass('webida-tool-bar-icon-hover')
                .removeClass('webida-tool-bar-icon-disabled')
                .removeClass('webida-tool-bar-icon-clicked');
            });
        }
    }

    function clearMenu(menu) {
        var children = menu.getChildren();
        children.forEach(function (child) {
            child.destroyRecursive();
        });
    }

   
    function handleTerminalItem(menuItem, loc, bag) { 
        
        var item, tooltip;
        var cmndInfo = menuItem[1];
        /*jshint validthis:true */
        function enableToolbarItem() { 
            //console.log('toolbar event subscribe', cmndInfo.toolbar.enabledOn);
            // enable toolbar item
            this.set('disabled', false);

            $(this.containerNode).find('.webida-tool-bar-icon')
            .addClass('webida-tool-bar-icon-normal')
            .removeClass('webida-tool-bar-icon-hover')
            .removeClass('webida-tool-bar-icon-disabled')
            .removeClass('webida-tool-bar-icon-clicked');        
        } 
        
        function disableToolbarItem() { 
            //console.log('toolbar event subscribe', cmndInfo.toolbar.enabledOn);
            // disable toolbar item
            this.set('disabled', true);

            $(this.containerNode).find('.webida-tool-bar-icon')
            .addClass('webida-tool-bar-icon-disabled')
            .removeClass('webida-tool-bar-icon-normal')
            .removeClass('webida-tool-bar-icon-hover')
            .removeClass('webida-tool-bar-icon-clicked');        
        } 
        /*jshint validthis:false */
        
        function doCommonJobsForToolbarItem() { 
            // set unique identifier for toolbar icon
            item.attr('data-menuitem', loc);

            // tooltip setting
            tooltip = cmndInfo.toolbar.tooltip || loc.split('/').pop().replace(/&/gi, '');
            if (cmndInfo.shortcut && cmndInfo.shortcut.keys) {
                tooltip += ' (' + cmndInfo.shortcut.keys + ')';
            }
            setItemTooltip(item, tooltip);

            // icon setting
            if (cmndInfo.toolbar.icons) {
                setItemIcons(item, cmndInfo.toolbar.icons, cmndInfo.toolbar.iconClass);
            }

            // enable, disable event setting
            if (cmndInfo.toolbar.enabledOn) {
                topic.subscribe(cmndInfo.toolbar.enabledOn, enableToolbarItem.bind(item));
            }
            if (cmndInfo.toolbar.disabledOn) {
                topic.subscribe(cmndInfo.toolbar.disabledOn, disableToolbarItem.bind(item));
            }

            // Events on clicking icon and selecting the first item of dropdown list
            // should be distinguishable. (index: 0 -> -1).
            // -1 has no effect when the item is for a 'cmnd'
            on(item, 'click', menuItemTree.invoke.bind(menuItemTree, loc, -1));
        }

        console.assert(cmndInfo && cmndInfo.toolbar);
        switch (menuItem[0]) {
        case 'cmnd':
            // create toolbar item
            item = new Button();
            doCommonJobsForToolbarItem();     
            break;

        case 'enum':
            // create toolbar item
            item = new ComboButton();
            doCommonJobsForToolbarItem();

            var locSegments = loc.split('/');
            locSegments = _.without(locSegments, '');

            var menu = new Menu({ style: 'display: none;' });
            item.dropDown = menu;
            aspect.before(item, 'openDropDown', function () {
                //console.debug('before openDropDown... ok');

                // clear previous list
                clearMenu(menu);
                menu.addChild(new MenuItem({
                    label: 'loading ...',
                    disabled: true
                }));

                // create new list
                // get menu item list (get dynamic enum list)
                menuItemTree.getViableItems(function (items) {

                    locSegments.forEach(function (key) {
                        if (items) { 
                            items = items[key];
                        } 
                    });
                    var foundItem = items;

                    var labels;
                    if (foundItem && MenuItemTree.isTerminal(foundItem) && 
                        foundItem[0] === 'enum' && (labels = foundItem[3]) && labels.length > 0) {

                        var disabledIndexes = foundItem[4];

                        clearMenu(menu);
                        labels.forEach(function (label, index) {
                            var mItem;
                            if (label === '---') {
                                mItem = new MenuSeparator();
                            } else {
                                mItem = new MenuItem({ label: label });
                                mItem.set('onClick', menuItemTree.invoke.bind(menuItemTree, loc, index));
                            }

                            // disabled
                            if (disabledIndexes && _.contains(disabledIndexes, index)) {
                                mItem.set('disabled', true);
                            }

                            // add new list
                            menu.addChild(mItem);
                        });
                    } else {
                        clearMenu(menu);
                        menu.addChild(new MenuItem({
                            label: '<no items>',
                            disabled: true
                        }));
                    }

                });
            });

            break;
                
        default: 
            console.assert(false, 'assertion fail: unreachable');
                
        }

        console.assert(item); 
        bag.push(item);
    } 

    function toPutOnToolbar(menuItem) { 
        if (MenuItemTree.isTerminal(menuItem)) { 
            var type = menuItem[0];
            if (type === 'cmnd' || type === 'enum') { 
                var cmndInfo = menuItem[1];
                if (cmndInfo && cmndInfo.toolbar) { 
                    return true;
                } 
            } 
        }
        return false;
    }
    
    function init(menuItemTreeArg, predefinedToolbarItems) {
    
        var toPutSeparator = false;
        var warnUnlistedItems = predefinedToolbarItems.list.length > 0;
        
        function getItemsInPredefinedOrder(wholeMenuItems, predefinedList, bag) { 
            predefinedList.forEach(function (item) { 
                
                if (item === '---') { 
                    bag.push(new ToolbarSeparator());
                    toPutSeparator = false;
                } else { 
                    
                    var segments = item.split('/');
                    segments.shift();
                    var menuItem = wholeMenuItems;
                    segments.forEach(function (seg) { 
                        if (menuItem) { 
                            menuItem = menuItem[seg];
                        } 
                    });
                    
                    if (menuItem) { 
                        if (toPutOnToolbar(menuItem)) { 
                            handleTerminalItem(menuItem, item, bag);
                            toPutSeparator = true;
                        } else { 
                            console.warn('A menu item "' + item + '" specified in the predefined order of ' + 
                                         'toolbar items does not have a configuratoin to be put on the toolbar, ' + 
                                         'and is ignored');
                        } 
                    } else { 
                        console.warn('A location "' + item + '" in the predefined order of toolbar items ' + 
                                     'does not have a matching menu item, and is ignored');
                    } 
                } 
            });
        } 
        
        function getRemainingItems(items, ploc, predefinedList, bag) {
            Object.keys(items).forEach(function (menuItemName) {
                var menuItem = items[menuItemName]; 
                var loc = ploc + menuItemName;

                if (MenuItemTree.isTerminal(menuItem)) {
                    if (predefinedList.indexOf(loc) < 0 && toPutOnToolbar(menuItem)) { 
                        if (toPutSeparator) { 
                            bag.push(new ToolbarSeparator());
                            toPutSeparator = false;
                        } 
                        handleTerminalItem(menuItem, loc, bag);
                        if (warnUnlistedItems) { 
                            console.warn('A menu item at "' + loc + 
                                         '" adds a toolbar item which is not in the predefined list.');
                        } 
                    } 
                } else if (MenuItemTree.isNonterminal(menuItem)) {
                    getRemainingItems(menuItem, loc + '/', predefinedList, bag);
                }
            });
        }

        menuItemTree = menuItemTreeArg;

        var toolbar = new Toolbar({
            style: 'padding-left: 12px', 
            class: 'app-workbench-toolbar', 
        }, 'app-workbench-toolbar');

        // append each items
        var toolbarItems = [];
        var wholeMenuItems = menuItemTreeArg.getWholeItems();
        
        getItemsInPredefinedOrder(wholeMenuItems, predefinedToolbarItems.list, toolbarItems);
        if (predefinedToolbarItems.options.indexOf('restrictToList') < 0) { 
            getRemainingItems(wholeMenuItems, '/', predefinedToolbarItems.list, toolbarItems);
        }
        toolbarItems.forEach(function (item) {
            // append items
            toolbar.addChild(item);
        });
    }

    return {
        init: init,
    };
});
