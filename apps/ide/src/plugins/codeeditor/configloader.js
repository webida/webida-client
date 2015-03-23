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

define(['webida-lib/app',
        'other-lib/underscore/lodash.min'],
function (ide, _) {
    'use strict';

    function loadEditorConfig(instance, file) {
        function translate(pat) {
            // Reference  https://github.com/editorconfig/editorconfig-core-py/blob/master/editorconfig/fnmatch.py
            function escapeRegExp(str) {
                return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
            }
            var i = 0,
                n = pat.length,
                res = '',
                escaped = false,
                c, j, k, group;
            while (i < n) {
                c = pat[i];
                i = i + 1;
                if (c === '*') {
                    j = i;
                    if (j < n && pat[j] === '*') {
                        res = res + '.*';
                    } else {
                        res = res + '[^/]*';
                    }
                } else if (c === '?') {
                    res = res + '.';
                } else if (c === '[') {
                    j = i;
                    if (j < n && pat[j] === '!') {
                        j = j + 1;
                    }
                    if (j < n && pat[j] === ']') {
                        j = j + 1;
                    }
                    while (j < n && (pat[j] !== ']' || escaped)) {
                        escaped = (pat[j] === '\\' && !escaped);
                        j = j + 1;
                    }
                    if (j >= n) {
                        res = res + '\\[';
                    } else {
                        var stuff = pat.substring(i, j);
                        i = j + 1;
                        if (stuff[0] === '!') {
                            stuff = '^' + stuff.substring(1);
                        } else if (stuff[0] === '^') {
                            stuff = '\\' + stuff;
                        }
                        res = res + '[' + stuff + ']';
                    }
                } else if (c === '{') {
                    j = i;
                    var groups = [];
                    while (j < n && pat[j] !== '}') {
                        k = j;
                        while (k < n && ((pat[k] !== ',' && pat[k] !== '}') || escaped)) {
                            escaped = (pat[k] === '\\' && !escaped);
                            k = k + 1;
                        }
                        group = pat.substring(j, k);
                        group = group.replace(/\\,/g, ',');
                        group = group.replace(/\\\}/g, '}');
                        group = group.replace(/\\\\/g, '\\');
                        groups.push(group);
                        j = k;
                        if (j < n && pat[j] === ',') {
                            j = j + 1;
                            if (j < n && pat[j] === '}') {
                                groups.push('');
                            }
                        }
                    }
                    if (j >= n || groups.length < 2) {
                        res = res + '\\{';
                    } else {
                        res = res + '(' + _.map(groups, escapeRegExp).join('|') + ')';
                        i = j + 1;
                    }
                } else {
                    res = res + escapeRegExp(c);
                }
            }
            return new RegExp('^' + res + '$');
        }

        function matching(relPath, currSection) {
            return translate(currSection).test(relPath);
        }

        function parseEditorConfig(editorconfig, relPath) {
            var lines = editorconfig.split('\n');
            var config = {};
            var currentSection, matchingSection = false;
            lines = _.map(lines, function (line) {
                return line.trim().toLowerCase();
            });
            for (var i = 0; i < lines.length; i++) {
                if (lines[i] === '') {
                    continue;
                } // empty line
                if (lines[i][0] === ';') {
                    continue;
                } // comment
                if (lines[i][0] === '[') {
                    // section change
                    currentSection = lines[i].substring(1, lines[i].length - 1).trim();
                    matchingSection = matching(relPath, currentSection);
                } else {
                    var key = lines[i].substr(0, lines[i].indexOf('=')).trim();
                    var value = lines[i].substr(lines[i].indexOf('=') + 1).trim();
                    switch (key) {
                    case 'root':
                        if (currentSection === undefined) {
                            config.root = (value === 'true');
                        }
                        break;
                    case 'indent_style':
                        if (matchingSection) {
                            config.indentWithTabs = (value === 'tab');
                        }
                        break;
                    case 'indent_size':
                        if (matchingSection) {
                            config.indentUnit = +value;
                            if (config.indentUnit === 'NaN') {
                                delete config.indentUnit;
                            }
                        }
                        break;
                    case 'tab_width':
                        if (matchingSection) {
                            config.tabSize = value;
                            if (config.tabSize === 'NaN') {
                                delete config.tabSize;
                            }
                        }
                        break;
                    case 'trim_trailing_whitespace':
                        if (matchingSection) {
                            config.trimTrailingWhitespaces = (value === 'true');
                        }
                        break;
                    case 'insert_final_newline':
                        if (matchingSection) {
                            config.insertFinalNewLine = (value === 'true');
                        }
                        break;
                    }
                }
            }
            return config;
        }

        function applyEditorConfig(config) {
            // apply config to instance
            instance.setIndentWithTabs(config.indentWithTabs);
            instance.setIndentUnit(config.indentUnit);
            instance.setTabSize(config.tabSize);
            instance.setIndentOnPaste(config.indentOnPaste);
            instance.setTrimTrailingWhitespaces(config.trimTrailingWhitespaces);
            instance.setInsertFinalNewLine(config.insertFinalNewLine);
        }

        var bind, path;
        // editorconfig enabled
        bind = ide.getFSCache();    // ide.getMount();
        path = (file.path).split('/');
        path = _.filter(path, function (name) {
            return name !== '';
        });
        (function rec(i, done) {
            if (i >= 0) {
                var arr = path.slice(0, i);
                var configpath = arr.join('/') + '/.editorconfig';
                var rpath = path.slice(i).join('/');
                bind.readFile(configpath, function (error, data) {
                    if (error || data === undefined) {
                        rec(i - 1, done);
                    } else {
                        var config = parseEditorConfig(data, rpath);
                        if (!config.root) {
                            rec(i - 1, function () {
                                applyEditorConfig(config);
                                if (done) {
                                    done();
                                }
                            });
                        } else {
                            applyEditorConfig(config);
                            if (done) {
                                done();
                            }
                        }
                    }
                });
            } else {
                if (done) {
                    done();
                }
            }
        })(path.length - 1);
    }

    function loadJsHintRc(instance, file) {
        var bind = ide.getFSCache();    // ide.getMount();
        var path = (file.path).split('/');
        path = _.filter(path, function (name) {
            return name !== '';
        });
        (function rec(i) {
            if (i >= 0) {
                var hintpath = '/' + path.slice(0, i).join('/') + '/.jshintrc';
                bind.readFile(hintpath, function (error, data) {
                    if (error) {
                        rec(i - 1);
                    } else {
                        var option;
                        try {
                            option = JSON.parse(data);
                        } catch (e) {}
                        if (option) {
                            // workaround for inconsistent behavior of fscache readFile()
                            // when file exists in fscache, readFile() works in synchrously, not like webida fs.
                            setTimeout(function () {
                                instance.setLinter('js', option);
                            }, 0);
                        }
                    }
                });
            } else {
                instance.setLinter('js', true);
                return false;
            }
        })(path.length - 1);
    }

    return {
        editorconfig: loadEditorConfig,
        jshintrc: loadJsHintRc
    };
});
