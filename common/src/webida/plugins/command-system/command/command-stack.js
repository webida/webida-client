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
        Stack.dataStore = [];
        Stack.top = 0;
    }

    genetic.inherits(Stack, Object, {
        push : function (data) {
            Stack.dataStore[this.top++] = data;
        },
        pop : function () {
            return Stack.dataStore[--this.top];
        },
        peek : function () {
            return Stack.dataStore[this.top - 1];
        },
        clear : function () {
            Stack.top = 0;
        },
        length : function () {
            return Stack.top;
        },
        shift : function () {
            Stack.dataStore.shift();
        }
    });

    var MAX_SIZE = 10;
    var stack = new Stack();

    var commandStack = {
        execute : function (Command, option) {
            var result = Command.execute(option);
            result.then(function (value) {
                if (stack.length() >= MAX_SIZE) {
                    stack.shift();
                }
                stack.push(Command);
                console.log(Command + ' execution success: ' + value);
            }).catch(function (reason) {
                console.warn(Command + ' execution failed: ' + reason);
            });
        }
    };

    return commandStack;
});
