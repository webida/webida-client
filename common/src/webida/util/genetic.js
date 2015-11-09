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
 * Genetic utility
 *
 * @since: 2015.06.11
 * @author: hw.shim
 */

define(function () {
    'use strict';
    return {
        /**
         * Inherit prototype props from parent
         * and add new prototypes.
         */
        inherits: function (child, parent, props) {
            child.prototype = Object.create(parent.prototype);
            child.prototype.constructor = child;
            if (typeof props === 'object') {
                Object.keys(props).forEach(function (key) {
                    if (key !== 'constructor') {
                        child.prototype[key] = props[key];
                    }
                });
            }
        },

        /**
         * Simply mixin object arguments.
         */
        mixin: function () {
            var source;
            var target = {};
            for (var i = 0; i < arguments.length; i++) {
                source = arguments[i];
                for (var prop in source) {
                    if (source.hasOwnProperty(prop)) {
                        target[prop] = source[prop];
                    }
                }
            }
            return target;
        }
    };
});
