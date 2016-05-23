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
 * @file This file is constructor of command.
 * @since 1.7.0
 * @author minsung.jin@samsung.com
 */
define([
    'webida-lib/util/genetic'
], function (
    genetic
) {
    'use strict';

    /**
     * The Command.
     * @constructor
     */
    function Command(id, option) {
        this.id = id;
        this.option = option;
    }

    genetic.inherits(Command, Object, {
        /**
         * Return the ID of the command.
         * @return {String}
         */
        getId: function () {
            return this.id;
        },
        /**
         * Execute a command.
         * the plugins should implement this method.
         */
        execute: function () {
            // do something
            throw new Error('execute() should be implemented by ' + this.constructor.name);
        },
        /**
         * Undo the execution of command.
         */
        undo: function () {
            // undo something
        },
        /**
         * Redo the execution of command.
         */
        redo: function () {
            // redo something
        },
        /**
         * Check status the execution of command.
         */
        canExecute: function () {
            // check status
            return true;
        }
    });

    return Command;
});
