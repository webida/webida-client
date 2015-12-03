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
        'external/lodash/lodash.min',
        'webida-lib/util/path',
        'external/tern/lib/tern',
        'plugins/webida.editor.code-editor/content-assist/file-server',
        'plugins/webida.editor.code-editor/content-assist/reference',
        'text!external/tern/defs/browser.json',
        'text!external/tern/defs/ecma5.json',
        'text!external/tern/defs/jquery.json',
        'text!./tern-def-ecma5-keywords.json',
        'external/tern/plugin/doc_comment',
        'external/tern/plugin/requirejs',
        './tern-plugin-dojojs'],
function (require, _, pathUtil, tern, fileServer, reference, browserText,
           ecma5Text, jqueryText, ecma5KeywordsText/*, p1, p2, p3*/) {
    'use strict';

    var browserDef = JSON.parse(browserText);
    var ecma5Def = JSON.parse(ecma5Text);
    var jqueryDef = JSON.parse(jqueryText);
    var ecma5KeywordsDef = JSON.parse(ecma5KeywordsText);

    function Server(serverId) {
        this.serverId = serverId;
        this.tern = null;
        this.files = {};
        this.requirejsOptions = {
            maxDepth : 1
        };
    }

    var jshint = {};

    jshint.localServers = {};

    jshint.startServer = function (serverId) {
        var server = this.localServers[serverId];

        if (server) {
            return server;
        }

        server = new Server(serverId);
        server.onReferenceUpdate = function (file, newrefs, oldrefs) {
            newrefs = newrefs || [];
            oldrefs = oldrefs || [];
            if (server.files[file.path]) {
                var changed = false;
                var pathsToDel = _.without(oldrefs, newrefs);
                var pathsToAdd = _.without(newrefs, oldrefs);
                _.each(pathsToDel, function (filepath) {
                    changed = true;
                    jshint.delFile(server.serverId, filepath);
                });
                _.each(pathsToAdd, function (filepath) {
                    if (pathUtil.isJavaScript(filepath)) {
                        changed = true;
                        jshint.addFile(server.serverId, filepath);
                    }
                });
                if (changed) {
                    fileServer.setUpdated(server.serverId);
                }
            }
        };
        fileServer.addReferenceUpdateListener(server.onReferenceUpdate);

        this.localServers[serverId] = server;

        var ternGetFileCallback = function (filepath, c) {
            server.files[filepath] = true;
            filepath = filepath.charAt(0) === '/' ? filepath : this.projectDir + filepath;
            fileServer.getFile(filepath, function (error, fileModel) {
                c(error, fileModel.text);
            });
        };

        server.tern = new tern.Server({
            getFile: ternGetFileCallback,
            async: true,
            defs: [browserDef, ecma5Def, jqueryDef, ecma5KeywordsDef],
            plugins: {
                'doc_comment': true,
                'requirejs': server.requirejsOptions,
                'dojojs' : true
            }
        });

        server.tern.fileServer = fileServer;
        server.tern._ccFilePath = serverId;

        return server;
    };

    jshint.stopServer = function (serverId) {
        var server = this.localServers[serverId];
        if (!server) {
            console.warn('## cc : no server for : ' + serverId);
            return;
        }

        server.tern = null;
        fileServer.removeReferenceUpdateListener(server.onReferenceUpdate);
        delete this.localServers[serverId];
    };

    jshint.addFile = function (serverId, filepath, text) {
        var server = this.localServers[serverId];
        if (!server) {
            console.warn('## cc : no server for : ' + serverId);
            return;
        }

        server.files[filepath] = true;
        var existingFile = fileServer.getLocalFile(filepath);
        if (existingFile) {
            server.onReferenceUpdate(existingFile, reference.getReferenceTos(filepath));
        }

        if (text !== undefined) {
            fileServer.setText(filepath, text);
        }

        fileServer.getFile(filepath, function (/*error, file*/) {
            if (pathUtil.isJavaScript(filepath)) {
                server.tern.addFile(filepath);
            }
        });
    };

    jshint.getFile = function (filepath, c) {
        var file = fileServer.getLocalFile(filepath);
        if (file) {
            c(undefined, file.text);
        } else {
            c('not a local file');
        }
    };

    jshint.delFile = function (serverId, filepath) {
        var server = this.localServers[serverId];
        if (!server) {
            console.warn('## cc : no server for : ' + serverId);
            return;
        }

        delete server.files[filepath];
        server.tern.delFile(filepath);
    };


    function findSubfileOfPosition(subfiles, pos) {
        var startCh = pos.ch;
        var endCh = pos.ch - 1;
        return _.find(subfiles, function (subfile) {
            return subfile.subfileStartPosition &&
                ((subfile.subfileStartPosition.line === pos.line &&
                  subfile.subfileStartPosition.ch <= startCh) ||
                 subfile.subfileStartPosition.line < pos.line) &&
                subfile.subfileEndPosition &&
                ((subfile.subfileEndPosition.line === pos.line &&
                  subfile.subfileEndPosition.ch >= endCh) ||
                 subfile.subfileEndPosition.line > pos.line);
        });
    }

    /**
     * @param {files: [{name, type, text}], query:{type: string, end:{line,ch}, file: string},
        params:[{name: string, value: string}]} body
     **/
    jshint.request = function (serverId, body, c) {
        var server = this.localServers[serverId];
        if (!server) {
            console.warn('No server for : ' + serverId);
            c({error: 'No javascript server for code completion'});
            return;
        }

        if (body.files) {
            _.each(body.files, function (file) {
                if (file.type === 'full') {
                    fileServer.setText(file.name, file.text);
                    file.type = null;
                }
            });
            body.files = _.filter(body.files, function (file) {
                return file.type !== null;
            });
        }

        if (body.params) {
            _.each(body.params, function (param) {
                if (param.name === 'maybeBaseUrl') {
                    server.requirejsOptions.maybeBaseUrl = param.value;
                }
            });
        }

        if (body.query) {
            var subfile;
            if (pathUtil.isHtml(body.query.file)) {
                var file = fileServer.getLocalFile(body.query.file);
                var subfiles = file.getHtmlScriptSubfiles();
                subfile = findSubfileOfPosition(subfiles, body.query.end);
                if (!subfile) {
                    console.log('Not in a javascript');
                    c({error: 'Not in a javascript'});
                    return;
                }
                body.query.file = subfile.path;
                body.query.end.line -= subfile.subfileStartPosition.line;
                if (body.query.end.line === 0) {
                    body.query.end.ch -= subfile.subfileStartPosition.ch;
                }
            }

            server.tern.request(body, function (error, data) {
                if (subfile && data) {
                    if (data.start) {
                        if (data.start.line === 0) {
                            data.start.ch += subfile.subfileStartPosition.ch;
                        }
                        data.start.line += subfile.subfileStartPosition.line;
                    }
                    if (data.end) {
                        if (data.end.line === 0) {
                            data.end.ch += subfile.subfileStartPosition.ch;
                        }
                        data.end.line += subfile.subfileStartPosition.line;
                    }
                }

                c(error, data);
            });
        }
    };


    return jshint;
});
