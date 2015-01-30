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

define(['./RestrictedArray', 'dojo/_base/declare'],
function (RestrictedArray, declare) {
    'use strict';

    var BubblingArray = declare(RestrictedArray, {
        constructor: function (maxLen) {
            this.maxLen = maxLen;
        },
        put : function () {
            var len = arguments.length;
            for (var i = len - 1; i >= 0; i--) {
                var elem = arguments[i];
                var j;
                if ((j = this.indexOf(elem)) >= 0) {
                    this.splice(j, 1);
                }
                Array.prototype.unshift.call(this, elem);
            }

            if (typeof this.maxLen === 'number') {
                var maxLen = this.maxLen;
                while (this.length > maxLen) {
                    this.pop();
                }
            }

            return this.length;
        },
        exportToPlainArray : function () {
            var arr = [];
            this.forEach(function (val) {
                arr.push(val);
            });
            return arr;
        },
        importFromPlainArray : function (arr) {
            var len = arr.length;
            for (var i = len - 1; i >= 0; i--) {
                var elem = arr[i];
                this.put(elem);
            }
        }
    });

    return BubblingArray;
});
