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

define(['./RestrictedArray', 'dojo/_base/declare'], function (RestrictedArray, declare) {
    'use strict';

    function naturalOrder(a, b) {
        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        } else {
            return 0;
        }
    }

    var SortedArray = declare(RestrictedArray, {
        constructor : function (orderBy) {
            if (orderBy) {
                var type = typeof orderBy;
                if (type === 'string') {
                    this.compare = function (a, b) {
                        var aKey = a[orderBy];
                        var bKey = b[orderBy];
                        if (aKey < bKey) {
                            return -1;
                        } else if (aKey > bKey) {
                            return 1;
                        } else {
                            return 0;
                        }
                    };
                } else if (type === 'function') {
                    this.compare = orderBy;
                } else {
                    throw new Error('An argument to SortedArray constructor must be a string or an order function');
                }
            } else {
                this.compare = naturalOrder;
            }
        },

        add : function (elem) {
            var len = this.length;
            if (len === 0) {
                Array.prototype.push.call(this, elem);
                return 0;
            } else {
                var compare = this.compare;
                if (compare(elem, this[0]) <= 0) {
                    Array.prototype.unshift.call(this, elem);
                    return 0;
                } else if (compare(this[len - 1], elem) <= 0) {
                    Array.prototype.push.call(this, elem);
                    return len;
                } else {
                    // now, this[0] < equiv < this[len - 1]
                    var il = 0;
                    var ir = len - 1;
                    while (ir - il > 1) {
                        var ic = Math.floor((il + ir) / 2);
                        var center = this[ic];
                        var v = compare(elem, center);
                        if (v === 0) {
                            Array.prototype.splice.call(this, ic, 0, elem);
                            return ic;
                        } else if (v < 0) {
                            ir = ic;
                        } else {
                            il = ic;
                        }
                    }
                    Array.prototype.splice.call(this, ir, 0, elem);
                    return ir;
                }
            }
        },

        query : function (equiv) {
            var len = this.length;
            if (len === 0) {
                return null;
            } else {
                var left = this[0];
                var right = this[len - 1];
                var compare = this.compare;
                var vl = compare(equiv, left);
                var vr = compare(right, equiv);
                if (vl < 0 || vr < 0) {
                    return null;
                } else if (vl === 0) {
                    return left;
                } else if (vr === 0) {
                    return right;
                } else {
                    // now, left < equiv < right
                    var il = 0;
                    var ir = len - 1;
                    while (ir - il > 1) {
                        var ic = Math.floor((il + ir) / 2);
                        var center = this[ic];
                        var v = compare(equiv, center);
                        if (v === 0) {
                            return center;
                        } else if (v < 0) {
                            ir = ic;
                        } else {
                            il = ic;
                        }
                    }
                    return null;
                }
            }
        },

        sort : function () {
            throw new Error('Array.sort() is dropped in SortedArray');
        }
    });

    return SortedArray;
});
