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
        'other-lib/underscore/lodash.min',
        'external/codemirror/lib/codemirror'],
function (require, _, CodeMirror) {
    'use strict';

    var _assist = null;
    var _cssServer = null;

    function requestToWorker(serverId, body, c) {
        if (_assist) {
            _assist.send({mode: 'css', type: 'request', server: serverId, body: body}, c);
        } else {
            require(['./assist'], function (assist) {
                _assist = assist;
                assist.send({mode: 'css', type: 'request', server: serverId, body: body}, c);
            });
        }
    }

    function request(serverId, body, c) {
        if (_cssServer) {
            _cssServer.request(serverId, body, c);
        } else {
            require(['./css-hint-server'], function (server) {
                _cssServer = server;
                server.request(serverId, body, c);
            });
        }
    }


    function getHints(cm, c, path, options) {
        if (!path) {
            console.log('## cc : options should have path property');
        }

        var req;

        if (options.useWorker) {
            req = requestToWorker;
        } else {
            req = request;
        }

        var cursor = cm.getCursor();
        var token = cm.getTokenAt(cursor);
        var tokenSimple = {
            type: token.type,
            string: token.string,
            start: token.start,
            end: token.end
        };

        req(options.path,
            {
            files: [{
                name: options.path,
                type: 'full',
                text: cm.getDoc().getValue()
            }],
            query: {
                type: 'completions',
                token: tokenSimple,
                end: cursor,
                file: options.path
            }
        }, function (error, data) {
            c(data);
        });
    }

    CodeMirror.registerHelper('hint', 'cssSmart', function (cm, c, options) {
        if (!_.isFunction(c)) {
            options = c;
            c = null;
        }

        getHints(cm, c, options.path, options);
    });


    return {
        addFile: function (filepath, text, options) {
            var req;

            if (options.useWorker) {
                req = requestToWorker;
            } else {
                req = request;
            }

            req({
                files: [{
                    name: filepath,
                    type: 'full',
                    text: text
                }]
            });
        }
    };
});
