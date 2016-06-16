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
 * @module server-pubsub
 * @fileoverview messaging pub/sub library for webida 1.x client
 *
 * Ths module provides some sub-set of msgs.js
 * @version: 0.1
 */



/**
* messaging api for Javascript module.
*
* This module provides JavaScript API's for message service.
* It depends on socket.io in external/socket.io-client/
* @module msg
*/
define([
	'./server-api-0.1',
	'external/socket.io-client/socket.io',
	'webida-lib/util/logger/logger-client'
], function (
	serverApi,
	sio,
	Logger
) {
    'use strict';

	var logger = new Logger();
    // logger.setConfig('level', Logger.LEVELS.log); // for development mode only
	//logger.off();

    var User = function (nick, email, uid, token) {
        this.nick = nick;
        this.email = email;
        this.uid = uid;
        this.token = token;
    };

    var systemNotificationCallback;

    var init = function (uid, token, host, callbackFunctions, cb) {
        var user  = new User('nick', 'email', uid, token);
        logger('pubsub init - new user', user);

        // dummy stuffs
        systemNotificationCallback = callbackFunctions.topicsysnotify_callback;
        window.setTimeout( function() {
            cb(user);
        }, 0);
    };

    var sub2 = function (user, topics, cb) {
        // dummy stuffs
        var subscriptionResult = {
            'topics': topics
        };
        window.setTimeout( function() {
            cb(subscriptionResult);
        }, 0);
    };

    return {
        init: init,
        sub2: sub2
    };

});
