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
        'dojo/topic',
        'other-lib/underscore/lodash.min',
        'webida-lib/app',
        'webida-lib/custom-lib/codemirror/lib/codemirror',
        'webida-lib/util/path'],
function (require, topic, _, ide, codemirror, pathUtil) {
    'use strict';

    var jshint = {};

    function moveToPosition(data) {
        require(['../plugin'], function (CodeEditor) {
            CodeEditor.moveTo(CodeEditor.pushCursorLocation(data.file, {
                row: data.start.line,
                col: data.start.ch
            }, true));
        });
    }

    function hasActiveCompletion(cm) {
        return (cm.state.completionActive && cm.state.completionActive.widget);
    }

    function onShowArgHints(ternAddon, cm) {
        if (hasActiveCompletion(cm)) {
            return true;
        }
    }

    function WorkerServer(serverId) {
        this.serverId = serverId;
        this.assist = null;
    }

    WorkerServer.prototype.start = function (c) {
        var self = this;
        require(['./assist'], function (assist) {
            self.assist = assist;
            assist.send({mode: 'js', type: 'start', server: self.serverId}, c);
        });
    };
    WorkerServer.prototype.stop = function (c) {
        this.assist.send({mode: 'js', type: 'stop', server: this.serverId}, c);

        this.cm.off(this.onCursorActivity);
        this.cm.off(this.onBlur);
    };
    WorkerServer.prototype.addFile = function (filepath, text) {
        this.assist.send({mode: 'js', type: 'addFile', server: this.serverId, filepath: filepath, text: text});
    };
    WorkerServer.prototype.delFile = function (filepath) {
        this.assist.send({mode: 'js', type: 'delFile', server: this.serverId, filepath: filepath});
    };
    WorkerServer.prototype.request = function (body, c) {
        this.assist.send({mode: 'js', type: 'request', server: this.serverId, body: body}, c);
    };
    WorkerServer.prototype.getFile = function (filepath, c) {
        this.assist.send({mode: 'js', type: 'getFile', filepath: filepath}, c);
    };

    function Server(serverId) {
        this.serverId = serverId;
        this.server = null;
    }

    Server.prototype.start = function (c) {
        var self = this;
        require(['./js-hint-server'], function (server) {
            self.server = server;
            server.startServer(self.serverId);
            c();
        });
    };
    Server.prototype.stop = function () {
        this.server.stopServer();

        this.cm.off(this.onCursorActivity);
        this.cm.off(this.onBlur);
    };
    Server.prototype.addFile = function (filepath, text) {
        this.server.addFile(this.serverId, filepath, text);
    };
    Server.prototype.delfile = function (filepath) {
        this.server.delfile(this.serverId, filepath);
    };
    Server.prototype.request = function (body, c) {
        this.server.request(this.serverId, body, c);
    };
    Server.prototype.getFile = function (filepath, c) {
        this.server.getFile(filepath, c);
    };


    jshint.startServer = function (filepath, cm, options, c) {
        options = options || {};

        var server;

        if (options.useWorker) {
            server = new WorkerServer(filepath);
        } else {
            server = new Server(filepath);
        }

        server.start(function () {
            server.ternAddon = new codemirror.TernServer({
                server: server,
                moveToPosition: moveToPosition,
                onShowArgHints: onShowArgHints
            });

            server.cm = cm;

            server.onCursorActivity = _.debounce(function (cm) {
                if (!hasActiveCompletion(cm)) {
                    server.ternAddon.updateArgHints(cm);
                }
            });
            server.onBlur = function () {
                server.ternAddon.hideDoc();
            };

            cm.on('cursorActivity', server.onCursorActivity, 500);
            cm.on('blur', server.onBlur);

            server.ternAddon.addDoc(filepath, cm.getDoc());

            _.delay(function () {
                topic.publish('#REQUEST.tellAppEntryHTMLs', filepath, function (htmlPaths) {
                    var maybeBaseUrlsObj = {};
                    _.each(htmlPaths, function (htmlpath) {
                        server.addFile(htmlpath);
                        maybeBaseUrlsObj[pathUtil.getDirPath(htmlpath)] = true;
                    });
                    var maybeBaseUrls = Object.keys(maybeBaseUrlsObj);
                    if (maybeBaseUrls.length === 1) {
                        server.request({params: [{name: 'maybeBaseUrl', value: maybeBaseUrls[0]}]});
                    }
                });
                _.delay(function () {
                    server.ternAddon.getHint(cm, function () {});
                }, 1000);
            }, 1000);

            if (c) {
                c(server);
            }
        });
    };

    return jshint;
});
