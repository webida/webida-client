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
 * @file handles server api events and publish client level topics/events
 * @since 1.7.0
 * @author jh1977.kim@samsung.com
 */

define([
    'external/URIjs/src/URI',
    'dojo/topic',
    'webida-lib/server-api',
    'webida-lib/util/logger/logger-client',
    './dispatch-legacy-resource-topics'
], function (
    URI, 
    topic,
    webida,
    Logger,
    dispatchLegacyResourceTopics
) {
    'use strict';

    var logger = Logger.getSingleton();
    logger.debug = logger.log; 
    var sessionEventSource = webida.sessionService.getEventSource();

    function dispatchTopic(topicName) {
        return function __reflectingTopicDispatcher(eventName) {
            var args = [];
            args.push(eventName);
            for (var i=1; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            logger.debug('reflecting event ' + eventName + ' to topic ' + topicName, args);
            topic.publish.apply(topic, args);
        };
    }
    
    sessionEventSource.on('session.announcement', dispatchTopic('server/session/announcement'));
    sessionEventSource.on('session.closing', dispatchTopic('server/session/closing'));

    // following events are defined via socket.io & webida service client api does not change
    // the event names for readability & simplicity.
    sessionEventSource.on('connect', dispatchTopic('server/session/connect'));
    sessionEventSource.on('disconnect', dispatchTopic('server/session/disconnect'));
    sessionEventSource.on('reconnect', dispatchTopic('server/session/reconnect'));
    sessionEventSource.on('connect_error', dispatchTopic('server/session/connect/error'));
    sessionEventSource.on('connect_timeout', dispatchTopic('server/session/connect/timeout'));
    sessionEventSource.on('reconnect_failed', dispatchTopic('server/session/reconnect/failed'));

    // workspace.wfs events come from WfsEventGate, not from server.
    sessionEventSource.on('workspace.wfs', dispatchLegacyResourceTopics);

    // need some 'toasting' plugin for basic session events, but not here.
    // for this plugins should work without toaster.
    // we may need a 'session-manager' plugin, using workbench, toaster and other plugins
    //  to show & manage session-related user actions.
    //  for examples
    //   1) pop-up login dialogs and send credentials to api
    //   2) pop-up some warning message when server begins knight-fall protocol (closing)
    //   3) pop-up some warning message when client lost session client connection to server
    //   4) pop-up some 'off-line' warning and show some status bar message

    logger.debug('initialized session event dispatcher plugin');
    return {};
});
