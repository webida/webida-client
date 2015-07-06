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
        'external/codemirror/lib/codemirror',
        'webida-lib/app',
        'webida-lib/util/path'],
function (require, _, CodeMirror, ide, pathUtil) {
    'use strict';


    function getHints(cm, c, path/*, options*/) {
        if (!path) {
            console.log('## cc : options should have path property');
        }

        var cursor = cm.getCursor();
        var token = cm.getTokenAt(cursor);

        if (token.type === 'link') {
            var chStart = token.start;
            var chEnd = token.end;

            if (/^['"]/.test(token.string)) {
                chStart++;
            }
            if (/['"$]/.test(token.string)) {
                chEnd--;
            }
            var stringBeforeCursor = token.string.substring(chStart - token.start, cursor.ch - token.start);
            var subdirBeforeCursor = '';
            if (/\//.test(stringBeforeCursor)) {
                subdirBeforeCursor = pathUtil.getDirPath(stringBeforeCursor);
            }

            var dirpath = pathUtil.getDirPath(path) + subdirBeforeCursor;
            dirpath = pathUtil.flatten(dirpath);
            if (pathUtil.endsWith(dirpath, '/')) {
                dirpath = dirpath.substr(0, dirpath.length - 1);
            }

            ide.getFSCache().list(dirpath, false, function (err, data) {
                var result;
                if (data) {
                    var filenameBeforeCursor = stringBeforeCursor.substr(subdirBeforeCursor.length);
                    var filenameAfterCursor = token.string.substring(cursor.ch - token.start, chEnd - token.start);

                    chStart += subdirBeforeCursor.length;
                    var reg = new RegExp('^' + filenameBeforeCursor);
                    var list = _.filter(data, function (file) {
                        return reg.test(file.name);
                    });
                    if (list.length === 1 && list[0].isFile &&
                        filenameAfterCursor.length === 0 && list[0].filename === filenameBeforeCursor) {
                        list = null;
                    }
                    if (list) {
                        list = _.map(list, function (file) {
                            return file.isDirectory ? (file.name + '/') : file.name;
                        });
                        result = {
                            from: {line: cursor.line, ch: chStart},
                            to: {line: cursor.line, ch: chEnd},
                            hintContinue: true,
                            list: list
                        };
                    }
                }
                c(result);
            });
        } else {
            c(null);
        }
    }

    CodeMirror.registerHelper('hint', 'htmlLink', function (cm, c, options) {
        if (!_.isFunction(c)) {
            options = c;
            c = null;
        }

        getHints(cm, c, options.path, options);
    });
});
