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

/**
 * This file making the search result data.
 *
 * @since: 2015.09.03
 * @author : minsung-jin
 */
define([
    'external/lodash/lodash.min',
    'webida-lib/app',
    'webida-lib/util/path',
    'webida-lib/plugins/workspace/plugin',
    'dojo/store/Memory',
    'plugins/webida.notification/notification-message',
    './search-result-data',
], function (
    _,
    ide,
    pathUtil,
    workspace,
    Memory,
    toastr,
    data
) {
    'use strict';

    function _convertData(metadata) {

        function __convertToNormalizedString(s) {

            return s.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
        }

        var ret = {};
        if (metadata.regEx) {
            ret.encloser = '/';
            ret.pattern = metadata.pattern;
            ret.replaceWith = metadata.replaceWith;
        } else {
            ret.encloser = '"';
            ret.pattern = __convertToNormalizedString(metadata.pattern);
            ret.replaceWith = __convertToNormalizedString(metadata.replaceWith);
        }

        return ret;
    }

    function _makeTreeStore(data) {

        var store = new Memory({
            data: data,
            getChildren: function (object) {
                return this.query({
                    parent: object.id
                });
            }
        });

        return store;
    }

    function makeFindData(metadata, callback) {

        var treeNode = [];

        function __createDirectoryNode(fileName) {

            var node = fileName.split('/');
            node.forEach(function (value, index) {
                var currentNode = node.slice(0, index + 1);
                var path = currentNode.join('/');
                var object = {
                    id: 'id' + treeNode.length,
                    label: value,
                    type: 'directory',
                    path: path,
                    line: ''
                };

                var exist = _.find(treeNode, {path: path, label: value});
                if (!exist) {
                    if (treeNode.length) {
                        var parentPath = path.substring(0, path.length - value.length - 1);
                        var parent = _.find(treeNode, {path: parentPath});
                        object.parent = parent.id;
                    }
                    treeNode.push(object);
                }
            });
            treeNode[treeNode.length - 1].type = 'file';
        }

        function __createTextNode(fileLocationInfo) {

            var node = fileLocationInfo.path.split('/');
            node.push(fileLocationInfo.text);
            node.forEach(function (value, index) {
                var currentNode = node.slice(0, index + 1);
                var path = currentNode.join('/');
                var object = {
                    id: 'id' + treeNode.length,
                    label: value,
                    path: path,
                    line: ''
                };

                var exist = _.find(treeNode, {path: path, label: value});
                if (!exist) {
                    var parentPath = path.substring(0, path.length - value.length - 1);
                    var parent = _.find(treeNode, {path: parentPath});
                    var label = _.escape(value);
                    object.parent = parent.id;
                    object.path = parent.path;
                    object.label = label.replace(metadata.pattern,
                                                 '<mark>' + metadata.pattern + '</mark>');
                    object.type = 'text';
                    object.line = fileLocationInfo.line;
                    treeNode.push(object);
                }
            });
        }

        var convert = _convertData(metadata);

        var options = {};
        options.ignorecase = metadata.ignoreCase;
        options.wholeword = metadata.wholeWord;

        var matchCount = 0;
        var where = [];
        var fsMount = ide.getFSCache();
        fsMount.searchFiles(convert.pattern, metadata.path,
                            options, function (err, results) {
            if (err) {
                toastr.error('Failed to search files.');
                callback(err);
                var error = {
                    error: err
                };
                data.update(error);
            } else {
                if (results.length > 0) {
                    results.forEach(function (file) {
                        var fileName = file.filename;
                        if (fileName.indexOf('/') !== 0) {
                            fileName = '/' + fileName;
                        }
                        __createDirectoryNode(fileName);
                        where.push(treeNode[treeNode.length - 1].path);

                        file.match.forEach(function (line) {
                            var lineNumber = line.line;
                            var text = '\t- at line ' + lineNumber +
                                            ': "' + line.text + '"';
                            var fileLocationInfo = {
                                type: 'fileloc',
                                path: fileName,
                                line: lineNumber,
                                text: text
                            };
                            __createTextNode(fileLocationInfo);
                            matchCount++;
                        });

                    });

                    var treeTitle = '# Result of finding pattern ' +
                        convert.encloser + metadata.pattern +
                        convert.encloser + ' in files (' +
                        matchCount + ' matches)';
                    var store = _makeTreeStore(treeNode);
                    callback(null, treeTitle, store);

                    var source = {
                        title: treeTitle,
                        node: treeNode,
                        replacePaths: where
                    };
                    data.update(source);
                } else {
                    callback('no search result');
                    var result = {
                        error : 'no serach result'
                    };
                    data.update(result);
                }
            }
        });
    }

    function sendReplaceData(metadata, callback) {

        var convert = _convertData(metadata);

        var replacePaths = data.get().replacePaths;

        var options = {};
        options.ignorecase = metadata.ignoreCase;
        options.wholeword = metadata.wholeWord;

        var fsMount = ide.getFSCache();
        fsMount.replaceFiles(convert.pattern, convert.replaceWith,
                             replacePaths, options, function (err) {
            if (err) {
                toastr.error('Failed to replase files.');
                callback(err);

                var error = {
                    error : err
                };
                data.update(error);
            } else {
                var treeTitle = '# The result of replacing ' +
                    convert.encloser + metadata.pattern +
                    convert.encloser + ' to ' + convert.encloser +
                    metadata.replaceWith + convert.encloser +
                    ' (' + replacePaths.length + ' file is replaced)';
                var store = _makeTreeStore(data.get().treeNode);
                callback(null, treeTitle, store);

                var fsCache = ide.getFSCache();
                replacePaths.forEach(function (path) {
                    fsCache.invalidateFileContents(path);
                });

                var title = {
                    title : treeTitle
                };
                data.update(title);
            }
        });
    }

    function makeScopePath(scope, callback) {

        var selected, path;
        switch (scope) {
            case 'Workspace' :
                selected = workspace.getRootPath();
                path = selected;
                break;

            case 'Project' :
                selected = workspace.getSelectedPaths();
                path = pathUtil.getProjectRootPath(selected[0]);
                break;

            case 'Selection' :
                selected = workspace.getSelectedPaths();
                path = selected[0];
                break;

            default :
                path = scope;
                break;
        }

        if (path) {
            callback(null, path);

            var source = {
                scope : scope
            };
            data.update(source);
        } else {
            callback('assertion fail: unreachable');
        }
    }

    return {
        makeFindData : makeFindData,
        sendReplaceData : sendReplaceData,
        makeScopePath : makeScopePath
    };
});
