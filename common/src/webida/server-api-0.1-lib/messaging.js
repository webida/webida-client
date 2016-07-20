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
 * @file messaging.js
 * @since 1.7.0
 * @author jh1977.kim@samsung.com
 */

define([
    'external/eventEmitter/EventEmitter',
    'webida-lib/util/genetic',
    './common',
    './AbstractSocketClient'
],  function (
    EventEmitter,
    io,
    common
) {
    'use strict';
    var logger = common.logger;

    // for some 'plugin specific socket client', we need
    //  1) generic name space, 'ide' or 'plugins', 'app', 'generic', ... etc 
    //  2) a socket client (with space-specific protocol) that can
    //     create/join/leave/remove room 
    //     broadcast to all, broadcast all but self
    //     send direct message to someone
    //     block/unblock message from someone
    //  3) an abstract class to use the socket client

    return {};
});