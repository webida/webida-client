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
 * Legacy topic dispatcher
 * This will be replaced by 'resources/~' and 'remote/~' topics in 1.7.0
 * 
 * @since: 2015.12.02
 *
 */

/* jshint unused:false */

// @formatter:off
define([
    'dojo/topic',
    'external/URIjs/src/URI',
    'webida-lib/util/logger/logger-client',
    'webida-lib/webida-0.3'
], function (
    topic,
    URI,
    Logger,
    webida
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    
    return {
        onDispatched: function (data) {

            logger.info('onDispatched(' + data + ')');

            function getWFSURL(fsServer, fsid, path) {
                return 'wfs://' + fsServer + '/' + fsid + path;
            }

            //The following topics will be deprecated in 1.7.0. Please don't use.
            //Please use topics with 'resources/~' or 'remote/~' prefix instead. 
            //See https://github.com/webida/webida-developer-guide-english/wiki/Event-System

            switch (data.eventType) {
            case 'file.created':
                //legacy code does not support this type
                break;
            case 'file.updated':
                //legacy code does not support this type
                break;
            case 'file.written':
                topic.publish('sys.fs.file.written', {
                    uid: data.opUid,
                    sid: data.sessionID,
                    url: getWFSURL(new URI(webida.conf.fsServer).host(),
                                   data.fsId, data.path)
                });
                break;
            case 'file.deleted':
                topic.publish('sys.fs.file.deleted', {
                    uid: data.opUid,
                    sid: data.sessionID,
                    url: getWFSURL(new URI(webida.conf.fsServer).host(),
                                   data.fsId, data.path)
                });
                break;
            case 'dir.created':
                topic.publish('sys.fs.dir.created', {
                    uid: data.opUid,
                    sid: data.sessionID,
                    url: getWFSURL(new URI(webida.conf.fsServer).host(),
                                   data.fsId, data.path)
                });
                break;
            case 'dir.deleted':
                topic.publish('sys.fs.dir.deleted', {
                    uid: data.opUid,
                    sid: data.sessionID,
                    url: getWFSURL(new URI(webida.conf.fsServer).host(),
                                   data.fsId, data.path)
                });
                break;
            case 'filedir.exec':
                topic.publish('sys.fs.node.intractableChanges', {
                    uid: data.opUid,
                    sid: data.sessionID,
                    url: getWFSURL(new URI(webida.conf.fsServer).host(),
                                   data.fsId, data.path)
                });
                break;
            case 'filedir.moved':
                topic.publish('sys.fs.node.moved', {
                    uid: data.opUid,
                    sid: data.sessionID,
                    // The following two uses of getWFSURL should be removed
                    // because move can occur between two different fs servers.
                    srcURL: getWFSURL(new URI(webida.conf.fsServer).host(),
                                      data.fsId, data.srcPath),
                    dstURL: getWFSURL(new URI(webida.conf.fsServer).host(),
                                      data.fsId, data.destPath)
                });
                break;
            case 'filedir.copied':
                topic.publish('sys.fs.node.copied', {
                    uid: data.opUid,
                    sid: data.sessionID,
                    // The following two uses of getWFSURL should be removed
                    // because copy can occur between two different fs servers.
                    srcURL: getWFSURL(new URI(webida.conf.fsServer).host(),
                                      data.fsId, data.srcPath),
                    dstURL: getWFSURL(new URI(webida.conf.fsServer).host(),
                                      data.fsId, data.destPath)
                });
                break;
            case 'acl.changed':
                topic.publish('sys.acl.changed', {
                    sid: data.sessionID,
                    trigger: data.trigger,
                    policy: data.policy
                });
                break;
            case 'fs.lock':
                topic.publish('sys.fs.file.locked', {
                    uid: data.opUid,
                    path: data.path,
                    sid: data.sessionID
                });
                break;
            case 'fs.unlock':
                topic.publish('sys.fs.file.unlocked', {
                    uid: data.opUid,
                    path: data.path,
                    sid: data.sessionID
                });
                break;
            default:
                logger.warn('unknown eventType in system notification data: ' +
                             data.eventType);
            }
        }
    }
});
