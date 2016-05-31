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
 * @file Introduction
 * @since 1.7.0
 * @author minsung.jin@samsung.com
 */

define([
    'external/eventEmitter/EventEmitter',
    'webida-lib/util/genetic',
    '../command/Command',
    '../shortcut/shortcut-registry',
    './command-service'
], function (
    EventEmitter,
    genetic,
    Command,
    shortcutRegistry,
    commandService
) {
    'use strict';

    /**
     * This module initialize command-system.
     * @constructor
     */
    function CommandSystem() {
    }

    genetic.inherits(CommandSystem, EventEmitter, {
        /**
         * initialize command system.
         */
        init: function () {
            var self = this;
            commandService.createRegistry(function () {
                commandService.createMenuModel(function () {
                    var menuModel = commandService.getTopMenuModel();
                    self.emit(self.INITIALIZED, menuModel);
                });
                shortcutRegistry.setCustomShortcut();
            });
        },
        /**
         * The command-service is interface for command system.
         */
        service: commandService,
        /**
         * The Command is Constructor of command
         */
        Command: Command,

        INITIALIZED: 'commandSystemInitialized'
    });

    var commandSystem = new CommandSystem();

    return commandSystem;
});
