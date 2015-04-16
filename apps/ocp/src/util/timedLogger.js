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

define([], function () {
    'use strict';

    window.timedLogger = (function () {
        var startTime = Date.now();
        return {
            getLoggerTime : function () { return Date.now() - startTime; },
            log : function (msg, since) {
                since = since || 0;
                var now = Date.now() - startTime;
                console.log('<timed-logger> at ' + (now / 1000) +
                            (since ? ' (for ' + ((now - since) / 1000) + '), ' : ', ') +
                            msg);
                return now;
            }
        };
    })();
});
