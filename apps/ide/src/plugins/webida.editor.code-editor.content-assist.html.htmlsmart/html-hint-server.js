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

define(['external/lodash/lodash.min',
        'webida-lib/util/path',
        'plugins/webida.editor.code-editor/content-assist/file-server',
        'plugins/webida.editor.code-editor/content-assist/reference'],
function (_, pathUtil, fileServer, reference) {
    'use strict';

    var htmlhint = {};


    function findCssIdsClasses(cssfiles, attrName, token, cursor) {
        var result = {};
        var list = [];

        if (cssfiles && cssfiles.length > 0) {
            _.each(cssfiles, function (csspath) {
                var cssfile = fileServer.getLocalFile(csspath);
                if (cssfile) {
                    if (attrName === 'id') {
                        list = _.union(list, cssfile.getCssIds());
                    } else if (attrName === 'class') {
                        list = _.union(list, cssfile.getCssClasses());
                    }
                }
            });
        }

        if (list.length > 0) {
            var chStart = token.start;
            var chEnd = token.end;

            if (/^['"]/.test(token.string)) {
                chStart++;
            }
            if (/['"$]/.test(token.string)) {
                chEnd--;
            }

            var stringBeforeCursor = token.string.substring(chStart - token.start, cursor.ch - token.start);
            var spaceIndex = stringBeforeCursor.lastIndexOf(' ');
            if (spaceIndex >= 0) {
                chStart += spaceIndex + 1;
                stringBeforeCursor = stringBeforeCursor.substr(spaceIndex + 1);
            }
            var stringAfterCursor = token.string.substring(cursor.ch - token.start, chEnd - token.start);
            spaceIndex = stringAfterCursor.indexOf(' ');
            if (spaceIndex >= 0) {
                chEnd -= (stringAfterCursor.length - spaceIndex);
            }

            if (list.length > 0) {
                var reg = new RegExp('^' + stringBeforeCursor);
                list = _.filter(list, function (item) {
                    return reg.test(item);
                });
            }

            if (list.length > 0) {
                result.from = {line: cursor.line, ch: chStart};
                result.to = {line: cursor.line, ch: chEnd};
                result.list = list;
            }
        }
        return result;
    }

    function findCompletions(body, c) {
        var cursor = body.query.end;
        var token = body.query.token;
        var cssfiles;

        if (token && token.type) {
            var match = token.type.match(/\battr-value-(\w*)/);
            if (match && match.length > 1) {
                var htmlpath = body.query.file;
                var attrName = match[1];
                cssfiles = _.filter(reference.getReferenceTos(htmlpath), function (filepath) {
                    return pathUtil.isCss(filepath);
                });

                if (cssfiles.length > 0) {
                    var pending = cssfiles.length;
                    var getFileCallback = function () {
                        pending--;
                        if (pending === 0) {
                            var result = findCssIdsClasses(cssfiles, attrName, token, cursor);
                            c(undefined, result);
                        }
                    };
                    for (var i = 0; i < cssfiles.length; i++) {
                        fileServer.getFile(cssfiles[i], getFileCallback);
                    }
                }
            }
        }

        if (!cssfiles || cssfiles.length === 0) {
            c(undefined, {});
        }
    }

    /**
     * @param {files: [{name, type, text}], query: {type: string, end:{line,ch}, file: string}} body
     * @param Fn(error, {from: {line, ch}, to: {line, ch}, list: [string]}) c
     **/
    htmlhint.request = function (serverId, body, c) {
        _.each(body.files, function (file) {
            if (file.type === 'full') {
                fileServer.setText(file.name, file.text);
                file.type = null;
            }
        });
        body.files = _.filter(body.files, function (file) {
            return file.type !== null;
        });

        if (body.query && body.query.type === 'completions') {
            findCompletions(body, c);
        } else {
            c(undefined, {});
        }
    };


    return htmlhint;
});
