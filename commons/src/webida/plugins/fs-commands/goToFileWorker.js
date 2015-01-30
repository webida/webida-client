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


this.addEventListener('message', function (evt) {
    'use strict';
    /* global postMessage: true */

    var data = evt.data;
    if (data) {
        var targetDir = data.targetDir;
        var msg = data.msg;
        var result = JSON.parse(data.files);

        if (targetDir && result && msg && msg === 'start') {
            var returnData = {};

            var getFileList = function (basePath, fileObj) {
                // param check
                if (!basePath || !fileObj) {
                    return null;
                }

                var list = [];
                var path = basePath + fileObj.name;
                if (fileObj.isFile) {
                    // file, ex) /webida/directory/filename.txt
                    var filePath = { id: path };
                    list.push(filePath);

                    // send message
                    /*
                    returnData.msg = 'progress';
                    returnData.list = path;
                    postMessage(returnData);
                    */
                } else if (fileObj.isDirectory &&
                           fileObj.children &&
                           fileObj.children.length > 0
                          ) {
                    // Directory
                    fileObj.children.forEach(function (childFileObj) {
                        var subList = getFileList(path + '/', childFileObj);
                        list = list.concat(subList);
                    });
                }

                return list;
            };

            var list = [];
            result.forEach(function (childFileObj) {
                var subList = getFileList(targetDir, childFileObj);
                list = list.concat(subList);
            });

            returnData.msg = 'success';
            returnData.list = JSON.stringify(list);
            postMessage(returnData);
        }
    }

}, false);
