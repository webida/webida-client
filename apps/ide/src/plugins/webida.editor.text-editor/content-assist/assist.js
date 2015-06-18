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

define(['require',
        'webida-lib/app'],
function (require, ide) {
    'use strict';
    /* global webidaHost: true */

    var worker = null;

    var msgId = 0, msgCallbacks = {};

    function getRemoteFile(path, c) {
        //ide.getMount().readFile(path, function (error, content) {
        ide.getFSCache().readFile(path, function (error, content) {
            if (content === undefined) {
                content = null;
            }
            c(error, content);
        });
    }

    function init() {
        worker = new Worker(require.toUrl('./assist-worker.js'));

        worker.onmessage = function (e) {
            var data = e.data;

            switch (data.type) {
            case 'log':
                console.log(data.message);
                break;
            case 'warn':
                console.warn(data.message);
                break;
            case 'error':
                console.error(data.message);
                break;
            case 'getRemoteFile':
                console.log('## cc : message from worker : getFile(' + data.filepath + ')');
                getRemoteFile(data.filepath, function (error, text) {
                    send({mode: data.mode, type: 'callback', error: error, text: text, id: data.id});
                });
                break;
            case 'callback':
                console.log('## cc : message from worker : callback()');
                if (data.id && msgCallbacks[data.id]) {
                    msgCallbacks[data.id](data.error, data.data);
                    delete msgCallbacks[data.id];
                }
                break;
            default:
                console.error('unknown message type : ' + data.type);
            }
        };

        send({type: 'informHost',
              webidaHost: webidaHost,
              webidaLibPath: require.toUrl('webida-lib'),
              otherLibPath: require.toUrl('other-lib')
             });
    }

    function send(data, c) {
        if (!worker) {
            init();
        }

        if (c) {
            data.id = ++msgId;
            msgCallbacks[msgId] = c;
        }
        worker.postMessage(data);
    }

    return {
        send: send
    };
});
