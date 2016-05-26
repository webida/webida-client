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
 * @file Introduction
 * @since 1.7.0
 * @author minsung.jin@samsung.com
 */

define([
    'require',
    './command-registry'
], function (
    require,
    commandRegistry
) {
    'use strict';

    /**
     * @param {String} id of the command.
     */
    function toPascalCase(str) {
        var result = '';
        str.replace(/\w+/g, function (txt) {
            str.match(txt).forEach(function (element) {
                result += element[0].toUpperCase() + element.substr(1).toLowerCase();
            });
        });
        return result;
    }
    /**
     * Create command for execution.
     */
    var commandFactory = {
        /**
         * @param {String} id of the command.
         */
        createCommand : function (id, option) {
            return new Promise(function (resolve) {
                var registry = commandRegistry.getCommand(id);
                if (registry) {
                    require([registry.plugin + '/commands'], function (extension) { 
                        var Constructor = extension[toPascalCase(id) + 'Command'];
                        if (!Constructor) {
                            var changedId = id.split(':')[0];
                            option = id.split(':')[1];
                            Constructor = extension[toPascalCase(changedId) + 'Command'];
                        }
                        resolve(new Constructor(id, option));
                    });
                }
            });
        }
    };

    return commandFactory;
});
