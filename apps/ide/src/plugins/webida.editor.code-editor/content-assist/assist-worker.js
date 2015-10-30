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

function initServers(caExtensionInfos) {
    if (servers) {
        consoleLike.error('unexpected: servers are already set');
        return;
    }

    require.config({
        baseUrl: '..',
        paths: {
            'webida-lib': '../../../../../common/src/webida',
            text: 'lib/text',
            acorn: 'lib/acorn',
            plugins: '..',
            'external': '../../../../../bower_components'
        }
    }); 
    
    require(['plugins/webida.editor.code-editor/content-assist/file-server',
             'content-assist/css-hint-server',
             'content-assist/html-hint-server'],
    function (fileServer, cssServer, htmlServer) {
        //'use strict'; 

        function getRemoteFile(filepath, c) {
            //'use strict';

            send({type: 'getRemoteFile', filepath: filepath}, function (data) {
                c(data.error, data.text);
            });
        }

        fileServer.init(getRemoteFile);

        var serversTemp = {};
        serversTemp.css = cssServer;
        serversTemp.html = htmlServer;      
                
        var promisesForEngines = [];
        
        caExtensionInfos.forEach(function (caExtensionInfo) {
            promisesForEngines.push(new Promise(function (resolve, reject) {
                require([caExtensionInfo.engineModulePath], function (engineModule) {
                    serversTemp[caExtensionInfo.langMode + ':' + caExtensionInfo.engineName] = engineModule;
                    resolve('Engine module [' + caExtensionInfo.engineName + '] is loaded.');
                });
            }));
        });
        
        if (caExtensionInfos.length === 0) {
            servers = serversTemp;
        } else {
            Promise.all(promisesForEngines).then(function (values) {
                servers = serversTemp;                
            });
        }
        
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
        try {
            server.startServer(message.server);
        } catch (err) {
            consoleLike.error(err.stack);
        } finally {
            send({type: 'callback', id: message.id});
        }
        break;
    case 'stop':
        try {
            server.stopServer(message.server);
        } catch (err) {
            consoleLike.error(err.stack);
        } finally {
            send({type: 'callback', id: message.id});
        }
        break;
    case 'addFile':
        try {
            server.addFile(message.server, message.filepath, message.text);
        } catch (err) {
            consoleLike.error(err.stack);
        }
        break;
    case 'delFile':
        try {
            server.delFile(message.server, message.filepath);
        } catch (err) {
            consoleLike.error(err.stack);
        }
        break;
    case 'getFile':
        try {
            server.getFile(message.filepath, function (error, data) {
                send({type: 'callback', error: error, data: data, id: message.id});
            });
        } catch (err) {
            consoleLike.error(err.stack);
            send({type: 'callback', error: {message: 'Exception occurred.'}, id: message.id});
        }
        break;
    case 'request':
        try {
            server.request(message.server, message.body, function (error, data) {
                send({type: 'callback', error: error && error.message, data: data, id: message.id});
            });
        } catch (err) {
            send({type: 'callback', error: {message: 'Exception occurred.'}, id: message.id});
            consoleLike.error(err.stack);
        }
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
        initServers(e.data.caExtensionInfos);
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
