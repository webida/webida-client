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
 * @file The toolbar.
 * @since: 1.7.0
 * @author: minsung.jin@samsung.com
 */

define([
    'external/lodash/lodash.min',
    'dijit/form/Button',
    'dijit/form/ComboButton',
    'dijit/DropDownMenu',
    'dijit/Menu',
    'dijit/MenuItem',
    'dijit/MenuSeparator',
    'dijit/PopupMenuItem',
    'dojo/on',
    'dojo/dom-attr',
    'dojo/topic',
    'dijit/Toolbar',
    'webida-lib/plugins/command-system/system/command-system',
    'webida-lib/theme',
], function (
    _,
    Button,
    ComboButton,
    DropDownMenu,
    Menu,
    MenuItem,
    MenuSeparator,
    PopupMenuItem,
    on,
    domAttr,
    topic,
    Toolbar,
    commandSystem,
    theme
) {
    'use strict';

    var toolbar;
    var commandService = commandSystem.service;

    function setItemTooltip(item, tooltip) {
        domAttr.set(item, 'rel', 'tooltip');
        domAttr.set(item, 'title', tooltip);
    }

    function setItemIcons(item, icons, iconClass) {
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
                'src="<%=themePath%>/images/icons/transparent.png" draggable="false" />';
            item.attr('label', theme.apply(img));

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

    /*jshint validthis:true */
    function enableToolbarItem(item) {
        item.set('disabled', false);

        $(item.containerNode).find('.webida-tool-bar-icon')
            .addClass('webida-tool-bar-icon-normal')
            .removeClass('webida-tool-bar-icon-hover')
            .removeClass('webida-tool-bar-icon-disabled')
            .removeClass('webida-tool-bar-icon-clicked');
    }

    function disableToolbarItem(item) {
        item.set('disabled', true);

        $(item.containerNode).find('.webida-tool-bar-icon')
            .addClass('webida-tool-bar-icon-disabled')
            .removeClass('webida-tool-bar-icon-normal')
            .removeClass('webida-tool-bar-icon-hover')
            .removeClass('webida-tool-bar-icon-clicked');
    }
    /*jshint validthis:false */

    function setToolbarItem(item, model) {
        item.attr('data-menuitem', model.id);
        // tooltip setting
        var tooltip = model.toolbar.tooltip;
        var command = commandService.getCommandRegistry(model.commandId);
        if (command.shortcut && command.shortcut.defaultKey) {
            tooltip += ' (' + command.shortcut.defaultKey + ')';
        }
        setItemTooltip(item, tooltip);

        // icon setting
        if (model.toolbar.icons) {
            setItemIcons(item, model.toolbar.icons, model.toolbar.iconClass);
        }

        // enable, disable event setting
        if (model.disabled) {
            disableToolbarItem(item);
        } else {
            enableToolbarItem(item);
        }
        on(item, 'click', function () {
            commandService.requestExecution(model.commandId);
        });
    }

    function selectToolbarItems(items, model) {
        if (model.toolbar && model.invisible) {
            items.push(model);
        } else {
            if ('items' in model && Array.isArray(model.items)) {
                model.items.forEach(function (child) {
                    selectToolbarItems(items, child);
                });
            }
        }
        return items;
    }

    function createDropDownButton(item) {
        var button = new ComboButton();
        setToolbarItem(button, item);
        var menu = new Menu({ style: 'display: none;' });
        button.dropDown = menu;
        var menuItem;
        var label;
        _.each(item.items, function (child) {
            if (child.invisible) {
                return;
            }
            if (child.name === '---') {
                menuItem = new MenuSeparator();
            } else {
                label = child.name.replace(/&(.)/, '{$1}');
                menuItem = new MenuItem({ label: label, disabled: child.disabled });
                menuItem.set('onClick', function () {
                    commandSystem.service.requestExecution(child.commandId);
                });
            }
            menu.addChild(menuItem);
        });
        return button;
    }

    function createMenuButton(items) {
        var item;
        var toolbarItems = [];
        _.each(items, function (child) {
            if (child.items.length > 0) {
                item = createDropDownButton(child);
            } else {
                item = new Button();
            }
            setToolbarItem(item, child);
            toolbarItems.push(item);
        });
        return toolbarItems;
    }

    function getToolbarItems() {
        var items = [];
        var menuModel = commandService.getTopMenuModel();
        selectToolbarItems(items, menuModel);
        return items;
    }

    function updateToolbar() {
        clearMenu(toolbar);
        fillToolbar(toolbar);
    }

    function fillToolbar(menu) {
        var modelItems = getToolbarItems();
        var toolbarItems = createMenuButton(modelItems);
        toolbarItems.forEach(function (item) {
            menu.addChild(item);
        });
    }

    function createToolbar() {

        toolbar = new Toolbar({
            style: 'padding-left: 12px',
            class: 'app-workbench-toolbar',
        }, 'app-workbench-toolbar');
        toolbar.startup();

        clearMenu(toolbar);
        fillToolbar(toolbar);
        topic.subscribe('command-system/menu/update', updateToolbar);
    }

    return {
        create: createToolbar,
        update: updateToolbar
    };
});
