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
 * Notify utility
 * This utility leaves a log and publishes a topic.
 *
 * @since: 2015.08.14
 * @author: hw.shim
 */

// @formatter:off
define([
    'dojo/topic',
    'webida-lib/util/logger/logger-client'
], function(
    topic,
    Logger
) {
    'use strict';
// @formatter:on

    var logger = new Logger();

    var notify = {

        /**
         * @param {string} msg
         */
        info: function(msg) {
            logger.info('notify > ' + msg);
            topic.publish('NOTIFY', 'info', msg);
        },

        /**
         * @param {string} msg
         */
        warning: function(msg) {
            logger.warn('notify > ' + msg);
            topic.publish('NOTIFY', 'warning', msg);
        },

        /**
         * @param {string} msg
         */
        error: function(msg) {
            logger.error('notify > ' + msg);
            topic.publish('NOTIFY', 'error', msg);
        },

        /**
         * @param {string} msg
         */
        success: function(msg) {
            logger.info('notify > ' + msg);
            topic.publish('NOTIFY', 'success', msg);
        },

        clear: function() {
            topic.publish('NOTIFY', 'clear');
        },

        remove: function() {
            topic.publish('NOTIFY', 'remove');
        }
    }

    return notify;
});
