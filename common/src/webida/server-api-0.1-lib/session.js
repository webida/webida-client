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
 * @file session.js
 * @since 1.7.0
 * @author jh1977.kim@samsung.com
 */

// we don't want cyclic dependencies between common and TokenManager.
//  so, instead of requiring just ./common, we require all dependencies directly
//  the only instance of TokenManager is saved in common
define([
    'webida-lib/util/genetic',
    './common', 
    './AbstractSocketClient'
],  function (
    genetic,
    common,
    AbstractSocketClient
) {
    'use strict';

    var logger = common.logger;
    var SESSION_NAME_SPACE = 'session';

    // some api modules will  listen events from session client
    // a plugin, called session-event-dispatcher, will listen for session client
    //  and will 'translate' session events into dojo topic

    function SessionSocketClient() {
        AbstractSocketClient.call(this, SESSION_NAME_SPACE, {
            query : {
                workspaceId:common.bootArgs.workspaceId
            }
        });
    }

    genetic.inherits(SessionSocketClient, AbstractSocketClient, {

        // session events (should be handled by this class)
        //  wfsWatcher(wfsId, start/stop)
        //  wfsRaw(wfsId, fsEventName, path, stats)
        //  announcement(msg)
        //  closing(msg, after)
        // basic events on connection (handled in AbstractSocketClient class) 
        //  connect
        //  connect_error(error) 
        //  connect_timeout(error)
        //  disconnect
        //  reconnect
        //  reconnect_failed(err)
        
        _getEventHandlers: function () {
            return {
                // wfs-watch event is subscribed by fs module
                // stats object is not wfs/WfsStats instance.
                wfsWatcher: function(wfsId, event) {
                    logger.debug('session got wfsWatcher event', arguments);
                    this.emit('wfsWatcher', wfsId, event);
                },

                // wfs events will be fired through WFS Mount,
                wfsRaw: function(wfsId, event, path, stats) {
                    logger.debug('session got wfsRaw event', arguments);
                    this.emit('wfsRaw', wfsId, event, path, stats);
                },

                announcement: function(msg) {
                    logger.debug('session got announcement event', arguments);
                    this.emit('announcement', msg);
                }, 
                closing: function(msg, after) {
                    logger.debug('session got closing event', arguments);
                    this.emit('closing', msg, after);
                }
            };
        }
    });
    
    return new SessionSocketClient();
});
