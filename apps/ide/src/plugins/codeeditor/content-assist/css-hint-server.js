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

define(['other-lib/underscore/lodash.min',
        'webida-lib/util/path',
        './file-server',
        './reference'],
function (_, pathUtil, fileServer, reference) {
    'use strict';

    var csshint = {};

    function findCompletions(body) {
        var result = {};

        var token = body.query.token;

        if (token) {
            if ((token.type === 'tag' || token.type === 'qualifier') && /^\./.test(token.string)) {
                token.type = 'class';
                token.start = token.start + 1;
                token.string = token.string.substr(1);
            } else if (token.type === 'builtin' && /^#/.test(token.string)) {
                token.type = 'id';
                token.start = token.start + 1;
                token.string = token.string.substr(1);
            }

            if (token.type === 'id' || token.type === 'class') {
                var htmls = reference.getReferenceFroms(body.query.file);
                if (pathUtil.isHtml(body.query.file)) {
                    htmls = _.union(htmls, [body.query.file]);
                }
                _.each(htmls, function (htmlpath) {
                    var html = fileServer.getLocalFile(htmlpath);
                    if (html) {
                        if (token.type === 'id') {
                            result.list = _.union(result, html.getHtmlIds());
                        } else if (token.type === 'class') {
                            result.list = _.union(result, html.getHtmlClasses());
                        }
                    }
                });
                if (result.list) {
                    result.to = body.query.end;
                    result.from = {
                        line: body.query.end.line,
                        ch: body.query.end.ch - token.string.length
                    };
                }
            }
        }

        return result;
    }

    /**
     * @param {files: [{name, type, text}], query: {type: string, end:{line,ch}, file: string}} body
     * @returns {from: {line, ch}, to: {line, ch}, list: [string]}
     **/
    csshint.request = function (serverId, body, c) {
        _.each(body.files, function (file) {
            if (file.type === 'full') {
                fileServer.setText(file.name, file.text);
                file.type = null;
            }
        });
        body.files = _.filter(body.files, function (file) {
            return file.type !== null;
        });

        var result = {};

        if (body.query.type === 'completions') {
            result = findCompletions(body);
        }

        c(undefined, result);
    };


    return csshint;
});
