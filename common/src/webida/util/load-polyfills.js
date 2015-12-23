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
 * For cross-browsing, load all needed polyfills.
 * @since: 15. 10. 30
 * @author: Koong Kyungmi (kyungmi.k@samsung.com)
 */

/* global Modernizr */

define([], function () {
    'use strict';
    var BASE = '../../../bower_components/';
    var POLYFILLS = {
        es6: {
            condition: (!Modernizr.promises ||
                !Modernizr.es6math ||
                !Modernizr.es6number ||
                !Modernizr.es6object),
            src: 'es6-shim/es6-shim.min.js'
        }
    };

    function loadAllPolyfills(callback) {
        var toLoad = [];
        var count = 0;

        for (var prop in POLYFILLS) {
            if (POLYFILLS.hasOwnProperty(prop)) {
                var conf = POLYFILLS[prop];
                if (conf.condition) {
                    count++;
                    toLoad.push(BASE + conf.src);
                }
            }
        }

        if (toLoad.length > 0) {
            require(toLoad, function () {
                callback();
            });
        } else {
            callback();
        }
    }

    return {
        load: loadAllPolyfills
    };
});