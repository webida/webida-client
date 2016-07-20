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
 * Resource topic dispatcher
 * 
 * @since: 2015.12.02
 *
 */

// @formatter:off
define([
    'dojo/topic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/server-api'
], function (
    topic,
    Logger,
    webida
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    
    return {
        onDispatched: function (data) {
            logger.info('onDispatched(' + data + ')', data);

            /*
            {
                eventType: "file.updated", 
                opUid: 032312, 
                fsId: "Ufd8zuGPy-", 
                path: "/test/zzz/4332/test.txt", 
                sessionID: "14490552128268252"
            }
            */

            function isRemote(sessionId) {
                if (sessionId && sessionId === webida.auth.getSessionID()) {
                    return false;
                } else {
                    return true;
                }
            }
            
            function getWfsUri(path) {
                if (typeof path === 'string') {
                    return 'wfs:' + path;
                } else {
                    return null;  
                }
            }

            var sessionID = data.sessionID;
            var path = data.path ? data.path : null;
            var wfsUri = getWfsUri(path);

            switch (data.eventType) {
            case 'file.created':
                topic.publish('resources/persistence/created', wfsUri);
                if (isRemote(sessionID)) {
                    topic.publish('remote/persistence/created', wfsUri);
                }
                break;
            case 'file.updated':
                topic.publish('resources/persistence/updated', wfsUri);
                if (isRemote(sessionID)) {
                    topic.publish('remote/persistence/updated', wfsUri);
                }
                break;
            case 'file.deleted':
                topic.publish('resources/persistence/deleted', wfsUri);
                if (isRemote(sessionID)) {
                    topic.publish('remote/persistence/deleted', wfsUri);
                }
                break;
            case 'fs.lock':
                topic.publish('resources/persistence/locked', wfsUri);
                if (isRemote(sessionID)) {
                    topic.publish('remote/persistence/locked', wfsUri);
                }
                break;
            case 'fs.unlock':
                topic.publish('resources/persistence/unlocked', wfsUri);
                if (isRemote(sessionID)) {
                    topic.publish('remote/persistence/unlocked', wfsUri);
                }
                break;
            case 'dir.created':
                topic.publish('resources/directory/created', wfsUri);
                if (isRemote(sessionID)) {
                    topic.publish('remote/directory/created', wfsUri);
                }
                break;
            case 'dir.deleted':
                topic.publish('resources/directory/deleted', wfsUri);
                if (isRemote(sessionID)) {
                    topic.publish('remote/directory/deleted', wfsUri);
                }
                break;
            }

        }
    };
});
