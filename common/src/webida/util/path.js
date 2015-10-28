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

define([], function () {
    'use strict';

    var mod = {};

    /**
     * check whether str1 ends with str2
     * str2 can be array of string
     *
     * @param {string} str1
     * @param {string|[string]} str2
     * @param {bool} ignoreCase true for case insensitive comparing
     */
    mod.endsWith = function (str1, str2, ignoreCase) {
        if (ignoreCase) {
            str1 = str1.toLowerCase();
        }
        if (str2 instanceof Array) {
            for (var i = 0; i < str2.length; i++) {
                if (str1.indexOf(ignoreCase ? str2[i].toLowerCase() : str2[i], str1.length - str2[i].length) !== -1) {
                    return true;
                }
            }
            return false;
        } else {
            return str1.indexOf(ignoreCase ? str2.toLowerCase() : str2, str1.length - str2.length) !== -1;
        }
    };

    /**
     * check whether filePath is for directory or not
     *
     * @param {string} filePath
     */
    mod.isDirPath = function (path) {
        return path.lastIndexOf('/') === (path.length - 1);
    };

    /**
     * get directory path of file
     *
     * @param {string} filePath
     */
    mod.getDirPath = function (filePath) {
        if (mod.isDirPath(filePath)) {
            return filePath; // like 'somedir/'
        } else {
            var lastSep = filePath.lastIndexOf('/');
            if (lastSep >= 0) {
                return filePath.substr(0, lastSep + 1); // like 'dir1/dir2/file'
            } else {
                return filePath; // like 'fileordir'	// Why not return ''?
            }
        }
    };

   /**
     * divide a path into a pair of its directory and name
     *
     * @param {string} filePath
     */
    mod.dividePath = function (path) {
        path = mod.detachSlash(path);
        var i = path.lastIndexOf('/');
        var parentPath = path.substring(0, i + 1);
        var name = path.substr(i + 1);
        if (!parentPath || !name) {
            throw new Error('Tried to divide a path into its parent path and name, but failed: ' + path);
        }

        return [parentPath, name];
    };

   /**
     * detach the trailing slash if any
     *
     * @param {string} filePath
     */
    mod.detachSlash = function (path) {
			
        var len = path.length;
        if (path !== '/' && path[len - 1] === '/') {
            return path.substr(0, len - 1);
        } else {
            return path;
        }
    };

    /**
     * attach a trailing slash if none
     *
     * @param {string} filePath
     */
    mod.attachSlash = function (path) {
        var len = path.length;
        if (path[len - 1] === '/') {
            return path;
        } else {
            return path + '/';
        }
    };

    /**
     *
     *
     * @param {string} path
     */
    mod.getParentPath = function (path) {
        return mod.dividePath(mod.detachSlash(path))[0];
    };

    /**
     *
     *
     * @param {string} path
     */
    mod.getName = function (path) {
        return mod.dividePath(mod.detachSlash(path))[1];
    };

    /**
     *
     *
     * @param {string} path
     */
    mod.getLevel = function (path) {
        return (mod.detachSlash(path).split('/').length - 1);
    };

    /**
     * get file name from full path
     *
     * @param {string} filePath
     */
    mod.getFileName = function (filePath) {
        return filePath.substr(filePath.lastIndexOf('/') + 1);
    };

    mod.getFileExt = function (fileName) {
        var i = fileName.lastIndexOf('.');
        return (i > 0 && i < fileName.length - 1 ? fileName.substr(i + 1) : '');
    };
    /**
     * check whether filePath is absolute or relative
     *
     * @param {string} filePath
     */
    mod.isAbsPath = function (filePath) {
        return filePath.length > 0 && filePath.substr(0, 1) === '/';
    };

    /**
     * combine directory path and relative path
     *
     * @param {string} dirPath
     * @param {string} relFilePath
     */
    mod.combine = function (dirPath, relFilePath) {
        if (mod.isAbsPath(relFilePath)) {
            return relFilePath;
        } else {
            return mod.isDirPath(dirPath) ? dirPath + relFilePath : dirPath + '/' + relFilePath;
        }
    };

    /**
     * flatten path by removing '.' and '..'
     *
     * @param {string} path
     */
    mod.flatten = function (path) {
        if (!/(^|\/)(\.\/|[^\/]+\/\.\.\/)/.test(path)) {
            return path;
        }

        var parts = path.split('/');
        for (var i = 0; i < parts.length; i++) {
            if (parts[i] === '.') {
                parts.splice(i--, 1);
            }
            else if (i && parts[i] === '..') {
                var dotdot = 1;
                for (var j = i + 1; j < parts.length; j++) {
                    if (parts[j] === '..') {
                        dotdot++;
                    } else {
                        break;
                    }
                }
                parts.splice(i - dotdot, 2 * dotdot);
                i -= dotdot;
            }
        }
        return parts.join('/');
    };

    mod.isJavaScript = function (path) {
        return this.endsWith(path, '.js', true);
    };

    mod.isHtml = function (path) {
        return this.endsWith(path, ['.html', '.htm'], true);
    };

    mod.isCss = function (path) {
        return this.endsWith(path, '.css', true);
    };

    mod.isJson = function (path) {
        return this.endsWith(path, '.json', true);
    };

    mod.getProjectRootPath = function(childPath) {
        if (!childPath) {
            return null;
        }
        var splitPath = childPath.split('/');
        if (splitPath.length < 3) {
            return null;
        }
        return splitPath.slice(0, 3).join('/') + '/';
    };

    return mod;
});
