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
 * @file The file push command to stack.
 * @since 1.7.0
 * @author minsung.jin@samsung.com
 */

define([
    'webida-lib/util/genetic'
], function (
    genetic
) {
    'use strict';

    function Stack() {
        this.dataStore = [];
        this.top = 0;
    }

    genetic.inherits(Stack, Object, {
        push : function (data) {
            this.dataStore[this.top++] = data;
        },
        pop : function () {
            return this.dataStore[--this.top];
        },
        peek : function () {
            return this.dataStore[this.top - 1];
        },
        clear : function () {
            this.top = 0;
        },
        length : function () {
            return this.top;
        },
        shift : function () {
            this.dataStore.shift();
        },
        get: function (index) {
            return this.dataStore[index];
        }
    });

    var MAX_SIZE = 10;
    var index = 0;
    var stack = new Stack();

    var commandStack = {
        execute : function (Command, option) {
            var result = Command.execute(option);
            result.then(function (value) {
                if (stack.length() >= MAX_SIZE) {
                    stack.shift();
                }
                var data = {
                    command: Command,
                    option: option
                };
                stack.push(data);
                index = 0;
                console.log(Command + ' execution success: ' + value);
            }).catch(function (reason) {
                console.warn(Command + ' execution failed: ' + reason);
            });
        },
        undo: function () {
            if (stack.length() === 0) {
                return;
            }
            if (index <= 0) {
                index = stack.length();
            }
            var data = stack.get(--index);
            var Command = data.command;
            var result = Command.undo(data.option);
            if (result) {
                result.then(function (value) {
                    console.log(Command + ' undo success: ' + value);
                }).catch(function (reason) {
                    console.warn(Command + ' undo failed: ' + reason);
                });
            }
        },
        redo: function () {
            if (stack.length() === 0) {
                return;
            }
            if (index >= stack.length()) {
                index = stack.length() - 1;
            }
            var data = stack.get(index++);
            var Command = data.command;
            var result = Command.redo(data.option);
            if (result) {
                result.then(function (value) {
                    console.log(Command + ' redo success: ' + value);
                }).catch(function (reason) {
                    console.warn(Command + ' redo failed: ' + reason);
                });
            }
        }
    };

    return commandStack;
});
