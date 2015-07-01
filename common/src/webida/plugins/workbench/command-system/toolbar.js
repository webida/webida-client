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

define(['webida-lib/plugin-manager-0.1',                // pm
        'other-lib/underscore/lodash.min',               // _
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
        './MenuItemTree',                // MenuItemTree
        'other-lib/toastr/toastr'                         // toastr
       ],
function (pm,
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
          MenuItemTree,
          toastr
         )
{
    'use strict';
    //console.log('mira: toolbar module loaded...');

    var menuItemTree;
    var toolbarItems;

    function setMenuItemTree(tree) {
        if (tree) {
            menuItemTree = tree;
        }
    }

    function setToolbarItems(items) {
        if (items && _.isArray(items)) {
            toolbarItems = items;
        }
    }

    function getToolbarItems() {
        return toolbarItems;
    }

    function setItemTooltip(item, tooltip) {
        domAttr.set(item, 'rel', 'tooltip');
        domAttr.set(item, 'title', tooltip);
    }

    function setItemIcons(item, icons) {
        // normal icon setting
        //var iconNormal = icons.normal;
        var iconNormal = icons;

        if (iconNormal) {
            var img = '<style type="text/css">' +
                        '.' + item.id + '_wticons {' +
                            'background-image: url("' + iconNormal + '");' +
                        '}' +
                      '</style>';
            var imgClasses = item.id + '_wticons webida-tool-bar-icon ' +
                             'webida-tool-bar-icon-normal';

            img = img + '<img class="' + imgClasses + '"' +
                             'src="./styles/webida-images/icons/transparent.png" draggable="false" />';
            item.attr('label', img);

            // icon changed setting
            on(item, 'mouseover', function () {
                if (!!this.get('disabled')) {
                    return;
                }

                $(this.containerNode).find('.webida-tool-bar-icon')
                .addClass('webida-tool-bar-icon-hover')
                .removeClass('webida-tool-bar-icon-normal')
                .removeClass('webida-tool-bar-icon-disabled')
                .removeClass('webida-tool-bar-icon-clicked');
            });

            on(item, 'mouseout', function () {
                if (!!this.get('disabled')) {
                    return;
                }

                $(this.containerNode).find('.webida-tool-bar-icon')
                .addClass('webida-tool-bar-icon-normal')
                .removeClass('webida-tool-bar-icon-hover')
                .removeClass('webida-tool-bar-icon-disabled')
                .removeClass('webida-tool-bar-icon-clicked');
            });

            on(item, 'mousedown', function () {
                if (!!this.get('disabled')) {
                    return;
                }

                $(this.containerNode).find('.webida-tool-bar-icon')
                .addClass('webida-tool-bar-icon-clicked')
                .removeClass('webida-tool-bar-icon-normal')
                .removeClass('webida-tool-bar-icon-disabled')
                .removeClass('webida-tool-bar-icon-hover');
            });

            on(item, 'mouseup', function () {
                if (!!this.get('disabled')) {
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

    function createToolbarMenu(treeSrc) {
        var items = treeSrc;
        var loc = '/'; // root loc is '/'
        setToolbarItems(createToolbarItmes(items, loc));
    }

    function clearMenu(menu) {
        var children = menu.getChildren();
        _.each(children, function (child) {
            child.destroyRecursive();
        });
    }

    function createToolbarItmes(itemSrc, ploc) {
        var items = itemSrc;
        var toolbarItemList = [];

        _.each(items, function (menuItem, menuItemName) {
            var loc = ploc + menuItemName + '/';
            var item;

            if (_.isArray(menuItem)) {
                var type = _.first(menuItem);
                var cmndInfo;
                var tooltip;
                switch (type) {
                case 'cmnd':
                    if (menuItem.length > 1) {
                        cmndInfo = _.last(menuItem);
                        if (cmndInfo && cmndInfo.toolbar) {
                            // create toolbar item
                            item = new Button();

                            // tooltip setting
                            tooltip = cmndInfo.toolbar.tooltip ?
                                cmndInfo.toolbar.tooltip : menuItemName.replace(/&/gi, '');
                            if (cmndInfo.shortcut && cmndInfo.shortcut.keys) {
                                tooltip += '/' + cmndInfo.shortcut.keys;
                            }
                            setItemTooltip(item, tooltip);

                            // icon setting
                            if (cmndInfo.toolbar.icons) {
                                setItemIcons(item, cmndInfo.toolbar.icons);
                            }

                            // enable, disable event setting
                            if (!!cmndInfo.toolbar.enabledOn) {
                                topic.subscribe(cmndInfo.toolbar.enabledOn, dojo.hitch(item, function () {
                                    //console.log('toolbar event subscribe', cmndInfo.toolbar.enabledOn);
                                    // enable toolbar item
                                    this.set('disabled', false);

                                    $(this.containerNode).find('.webida-tool-bar-icon')
                                    .addClass('webida-tool-bar-icon-normal')
                                    .removeClass('webida-tool-bar-icon-hover')
                                    .removeClass('webida-tool-bar-icon-disabled')
                                    .removeClass('webida-tool-bar-icon-clicked');
                                }));
                            }
                            if (!!cmndInfo.toolbar.disabledOn) {
                                topic.subscribe(cmndInfo.toolbar.disabledOn, dojo.hitch(item, function () {
                                    //console.log('toolbar event subscribe', cmndInfo.toolbar.enabledOn);
                                    // disable toolbar item
                                    this.set('disabled', true);

                                    $(this.containerNode).find('.webida-tool-bar-icon')
                                    .addClass('webida-tool-bar-icon-disabled')
                                    .removeClass('webida-tool-bar-icon-normal')
                                    .removeClass('webida-tool-bar-icon-hover')
                                    .removeClass('webida-tool-bar-icon-clicked');
                                }));
                            }

                            // cmnd handle bind
                            on(item, 'click', menuItemTree.invoke.bind(menuItemTree, loc, ''));
                        }
                    }
                    break;
                case 'enum':
                    if (menuItem.length > 1) {
                        cmndInfo = menuItem[1];
                        if (cmndInfo && cmndInfo.toolbar) {
                            // create toolbar item
                            item = new ComboButton();

                            // tooltip setting
                            tooltip = cmndInfo.toolbar.tooltip ?
                                cmndInfo.toolbar.tooltip : menuItemName.replace(/&/gi, '');
                            if (cmndInfo.shortcut && cmndInfo.shortcut.keys) {
                                tooltip += '/' + cmndInfo.shortcut.keys;
                            }
                            setItemTooltip(item, tooltip);

                            // icon setting
                            if (cmndInfo.toolbar.icons) {
                                setItemIcons(item, cmndInfo.toolbar.icons);
                            }

                            // enable, disable event setting
                            if (!!cmndInfo.toolbar.enabledOn) {
                                topic.subscribe(cmndInfo.toolbar.enabledOn, function () {
                                    // enable toolbar item
                                    item.set('disabled', false);

                                    $(item.containerNode).find('.webida-tool-bar-icon')
                                    .addClass('webida-tool-bar-icon-normal')
                                    .removeClass('webida-tool-bar-icon-hover')
                                    .removeClass('webida-tool-bar-icon-disabled')
                                    .removeClass('webida-tool-bar-icon-clicked');
                                });
                            }
                            if (!!cmndInfo.toolbar.disabledOn) {
                                topic.subscribe(cmndInfo.toolbar.disabledOn, function () {
                                    // disable toolbar item
                                    item.set('disabled', true);

                                    $(item.containerNode).find('.webida-tool-bar-icon')
                                    .addClass('webida-tool-bar-icon-disabled')
                                    .removeClass('webida-tool-bar-icon-normal')
                                    .removeClass('webida-tool-bar-icon-hover')
                                    .removeClass('webida-tool-bar-icon-clicked');
                                });
                            }

                            // Events on clicking icon and selecting the first item of dropdown list
                            // should be distinguishable. (index: 0 -> -1)
                            on(item, 'click', menuItemTree.invoke.bind(menuItemTree, loc, -1));

                            var menu = new Menu({ style: 'display: none;'});
                            item.dropDown = menu;
                            aspect.before(item, 'openDropDown', function () {
                                //console.debug('before openDropDown... ok');
                                var _self = this;
                                var menu = _self.dropDown;
                                menu.noChild = true;

                                // clear previous list
                                clearMenu(menu);

                                // create new list
                                // get menu item list (get dynamic enum list)
                                function asyncProcess() {
                                    var deferred = new Deferred();

                                    menuItemTree.getViableItems(function (items) {
                                        var arryLoc = loc.split('/');
                                        arryLoc = _.without(arryLoc, '');

                                        var findItem = items;
                                        if (arryLoc.length > 0) {
                                            arryLoc.forEach(function (key) {
                                                findItem = findItem[key];
                                            });
                                        }

                                        if (findItem && _.isArray(findItem) && _.first(findItem) === 'enum') {
                                            var itemList = findItem[3];
                                            if (itemList && itemList.length > 0) {
                                                clearMenu(menu);
                                                menu.noChild = false;
                                            }

                                            var disableList = findItem[4];

                                            _.each(itemList, function (item, index) {
                                                var mItem;
                                                if (item === '---') {
                                                    mItem = new MenuSeparator();
                                                } else {
                                                    /// add item
                                                    mItem = new MenuItem({
                                                        label: item
                                                    });

                                                    // add event handle
                                                    mItem.set('onClick',
                                                              menuItemTree.invoke.bind(menuItemTree, loc, index));
                                                }

                                                // disabled
                                                if (_.contains(disableList, index)) {
                                                    mItem.set('disabled', true);
                                                }

                                                // add new list
                                                menu.addChild(mItem);
                                            });
                                        } else {
                                            nothing();
                                        }

                                        deferred.resolve();
                                    });

                                    setTimeout(function () {
                                        deferred.progress();
                                    }, 10);

                                    return deferred.promise;
                                }

                                var nothing = function () {
                                    var nothingItem = new MenuItem({
                                        label: 'nothing',
                                        disabled: true
                                    });
                                    // add new list
                                    clearMenu(menu);
                                    menu.addChild(nothingItem);
                                    menu.noChild = false;
                                };
                                nothing();

                                var process = asyncProcess();
                                process.then(function () {
                                    //console.debug('defer async... ok');
                                    // close drop down menu
                                    if (menu.noChild && _self._opened) {
                                        _self.closeDropDown();
                                    }
                                }, null, function () {
                                    var lodingItem = new MenuItem({
                                        label: 'please wait, now loading...',
                                        disabled: true
                                    });

                                    //console.debug('defer async... progress');
                                    clearMenu(menu);
                                    menu.addChild(lodingItem);
                                });
                            });
                        }
                    }
                    break;
                }
            }
            else if (_.isObject(menuItem)) {
                if (_.keys(menuItem).length > 0) { // have sub info
                    // each sub info check and create toolbar item
                    var itemList = createToolbarItmes(menuItem, loc);
                    _.each(itemList, function (item) {
                        toolbarItemList.push(item);
                    });
                }
            }

            if (item) {
                toolbarItemList.push(item);
            }
        });

        return toolbarItemList;
    }

    function init(menuItemTree) {
        if (!menuItemTree || menuItemTree instanceof Error) {
            toastr.error('Failed to initialize the toolbar: \n' + menuItemTree.message);
        } else {
            setMenuItemTree(menuItemTree);
            var treeSrc = menuItemTree.getWholeItems();
            createToolbarMenu(treeSrc);
        }
    }

    function startup() {
        var items = getToolbarItems();
        var toolbar = new Toolbar({
            class: 'app-workbench-toolbar'
        }, 'app-workbench-toolbar');

        if (toolbar) {
            // append each items
            _.each(items, function (item) {
                // append items
                toolbar.addChild(item);
            });

            toolbar = dojo.byId('app-workbench-toolbar');
            domStyle.set(toolbar, 'padding-left', '12px');
        }
    }

    var toolbarda = {
        init: init,
        startup: startup
    };

    return toolbarda;
});
