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
 *
 */

// @formatter:off
define([
	'webida-lib/util/logger/logger-client'
], function(
	Logger
){
    'use strict';
// @formatter:on

    var colors = {};
    var classPrefix = 'notification-message-';
    var notification = {
        setPreferenceColor: function(values) {
            for (var key in values) {
                if (values.hasOwnProperty(key) && key.endsWith('-color')) {
                    var type = key.substring(0, key.indexOf('-color'));
                    colors[type] = values[key];
                    $('#log').find('.' + classPrefix + type).css({
                        color: colors[type]
                    });
                }
            }
        },
        setNotification: function(type, message, title) {
            var messageString = '[' + getNow() + '] ';
            if (title) {
                messageString += title;
            }
            if (message) {
                messageString += message;
            }
            var $message = $('<p class="notification-message"></p>').addClass(classPrefix + type).css({
                color: colors[type]
            }).text(messageString);
            $('#log').append($message);
        }
    };

    function getNow() {
        var result = [], now = new Date();
        var ymd = now.getFullYear() + '.' + now.getMonth() + '.' + now.getDate() + ' ';
        result.push(now.getHours());
        result.push(now.getMinutes());
        result.push(now.getSeconds());
        var resultToString;
        for (var i = 0; i < result.length; i++) {
            resultToString = result[i].toString();
            if (resultToString.length === 1) {
                result[i] = '0' + resultToString;
            }
        }
        return ymd + result.join(':');
    }

    return notification;
});
