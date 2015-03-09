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

'use strict';
/* global postMessage: true */
/* global importScripts: true */
/* global onmessage: true */

var msgId = 0, msgCallbacks = {};
var pendingMessages = [];

var msgCount = 0;
var servers = null;

var consoleLike = {
    log: function (msg) {
        //'use strict';
        postMessage({type: 'log', message: '## cc worker [' + msgCount + '] ' + msg});
    },
    warn: function (msg) {
        //'use strict';
        postMessage({type: 'warn', message: '## cc worker [' + msgCount + '] ' + msg});
    },
    error: function (msg) {
        //'use strict';
        postMessage({type: 'error', message: '## cc worker [' + msgCount + '] ' + msg});
    }
};

importScripts('../lib/require.js');

function send(data, c) {
    //'use strict';

    if (c) {
        data.id = ++msgId;
        msgCallbacks[msgId] = c;
    }
    postMessage(data);
}

function initServers(webidaHost/*, webidaLibPath, otherLibPath*/) {
    if (servers) {
        consoleLike.error('unexpected: servers are already set');
        return;
    }

    require.config({
        baseUrl: '..',
        paths: {
            // 'other-lib': '//library3.' + webidaHost,
            'other-lib': '../../../../../external/src',
            // 'webida-lib': '//library.' + webidaHost + '/webida',
            'webida-lib': '../../../../../common/src/webida',
            text: 'lib/text',
            tern: 'lib/ternjs',
            acorn: 'lib/acorn'
        }
    });

    require(['content-assist/file-server',
             'content-assist/js-hint-server',
             'content-assist/css-hint-server',
             'content-assist/html-hint-server'],
    function (fileServer, jsserver, cssserver, htmlserver) {
        //'use strict';

        function getRemoteFile(filepath, c) {
            //'use strict';

            send({type: 'getRemoteFile', filepath: filepath}, function (data) {
                c(data.error, data.text);
            });
        }

        fileServer.init(getRemoteFile);

        servers = {};
        servers.js = jsserver;
        servers.css = cssserver;
        servers.html = htmlserver;

        consoleLike.log('servers set in CA worker');
    });
}

function handleMessage(message) {
    //'use strict';

    ++msgCount;

    consoleLike.log('handleMessage(' + message.type + ', ' + message.filepath + ')');
    var server = servers[message.mode];

    if (!server && message.type !== 'callback') {
        consoleLike.warn('unknown mode : ' + message.mode);
    }
    switch (message.type) {
    case 'start':
        server.startServer(message.server);
        send({type: 'callback', id: message.id});
        break;
    case 'stop':
        server.stopServer(message.server);
        send({type: 'callback', id: message.id});
        break;
    case 'addFile':
        server.addFile(message.server, message.filepath, message.text);
        break;
    case 'delFile':
        server.delFile(message.server, message.filepath);
        break;
    case 'getFile':
        server.getFile(message.filepath, function (error, data) {
            send({type: 'callback', error: error, data: data, id: message.id});
        });
        break;
    case 'request':
        server.request(message.server, message.body, function (error, data) {
            send({type: 'callback', error: error && error.message, data: data, id: message.id});
        });
        break;
    case 'callback':
        if (message.id && msgCallbacks[message.id]) {
            msgCallbacks[message.id](message);
            delete msgCallbacks[message.id];
        }
        break;
    default:
        consoleLike.error('unknown message type : ' + message.type);
    }
}

var intervalForPendings;

function handlePendings() {
    //'use strict';

    if (servers && intervalForPendings) {
        clearInterval(intervalForPendings);
        intervalForPendings = undefined;
        if (pendingMessages.length > 0) {
            for (var i = 0; i < pendingMessages.length; i++) {
                handleMessage(pendingMessages[i]);
            }
            pendingMessages = [];
        }
    }
}

onmessage = function (e) {
    //'use strict';

    if (e.data.type === 'informHost') {
        initServers(e.data.webidaHost, e.data.webidaLibPath, e.data.otherLibPath);
    } else {
        if (!servers) {
            consoleLike.log('pendingMessages.push(' + e.data.type + ', ' + e.data.server + ')');
            pendingMessages.push(e.data);
            if (!intervalForPendings) {
                intervalForPendings = setInterval(handlePendings, 300);
            }
        } else {
            handlePendings();
            handleMessage(e.data);
        }
    }
};
