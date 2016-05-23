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
 * @file This file is interface of the commmand framework.
 * @since 1.0.0
 * @author minsung.jin@samsung.com
 */

define([
    'webida-lib/plugin-manager-0.1',
    '../command/command-factory',
    '../command/command-registry',
    '../command/command-stack',
    '../menu/menu-model-factory',
    '../menu/menu-model',
    '../shortcut/shortcut-bind',
    '../shortcut/shortcut-registry'
], function (
    pm,
    commandFactory,
    commandRegistry,
    commandStack,
    menuModelFactory,
    menuModel,
    shortcutBind,
    shortcutRegistry
) {
    'use strict';

    /**
     * The commandService.
     * @module
     */
    var commandService = {
        /**
         * @param {Function} The callback function.
         */
        createRegistry: function (cb) {
            var extensions = pm.getExtensions(
                'webida.common.command-system:commands');
            extensions.forEach(function (extension) {
                extension.commands.forEach(function (command) {
                    command.plugin = extension.__plugin__.loc;
                    commandRegistry.setCommand(command);
                    shortcutRegistry.setShortcut(command);
                });
            });
            cb();
        },
        /**
         * @param {Object} item of command.
         */
        setCommandRegistry: function (item) {
            commandRegistry.setCommand(item);
        },
        /**
         * @param {String} id of the command.
         */
        getCommandRegistry: function (id) {
            return commandRegistry.getCommand(id);
        },
        /**
         * @param {String} id of the shortcut.
         */
        getShortcutRegistry: function (id) {
            return shortcutRegistry.getShortcut(id);
        },
        /**
         * @param {Function} The callback function.
         */
        createMenuModel: function (cb) {
            var extensions = pm.getExtensions(
                'webida.common.command-system:menus');
            extensions.forEach(function (extension) {
                menuModelFactory.createMenuModel(extension);
            });
            cb();
        },
        addMenuModel: function (item, parentModel) {
            menuModelFactory.addMenuModel(item, parentModel);
        },
        /**
         * @param {String} id of the menu
         */
        getMenuModel: function (id) {
            var menu;
            menu = menuModel.getTopMenuModel(id);
            if (!menu) {
                menu = menuModel.getContextMenuModel(id);
            }
            return menu;
        },
        /**
         * @param {String} id of the menu
         */
        getTopMenuModel: function (id) {
            return menuModel.getTopMenuModel(id);
        },
         /**
          * @param {String} id of the menu
          */
        getContextMenuModel: function (id) {
            return menuModel.getContextMenuModel(id);
        },
        /**
         * @param {String} id of the menu
         */
        getUserIdMenuModel: function (id) {
            return menuModel.getUserIdMenuModel(id);
        },
        /**
         *
         */
        updateTopMenuModel: function (cb) {
            menuModel.updateTopMenuModel(cb);
        },
        /**
         *
         */
        updateContextMenuModel: function (cb) {
            menuModel.updateContextMenuModel(cb);
        },
        /**
         * @param {String} id of the command.
         */
        requestExecution: function (id) {
            var promise = commandFactory.createCommand(id);
            promise.then(function (Command) {
                if (Command && Command.canExecute()) {
                    commandStack.execute(Command);
                }
            });
        },
        /**
         * The shortcut event listener.
         */
        shortcutEventListener: shortcutBind.eventListener
    };

    return commandService;
});
