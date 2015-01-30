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
        var msg = data.msg;
        var basePath = data.basePath;
        var contents = JSON.parse(data.contents);
        var rData = {}; /* return data */

        if (contents &&
            basePath &&
            msg && msg === 'start') {

            var getInfos = function (basePath, content) {
                // param check
                if (!basePath || !content) {
                    return null;
                }

                var path = basePath + content.name;
                pathList.push(path);

                if (content.isFile) {
                    // file, ex) /webida/directory/filename.txt
                    fileCnt++;
                } else if (content.isDirectory &&
                           content.children &&
                           content.children.length > 0
                          ) {
                    // Directory
                    directoryCnt++;
                    content.children.forEach(function (cObj) {
                        getInfos(path + '/', cObj);
                    });
                }
            };

            var pathList = [];
            var directoryCnt = 0;
            var fileCnt = 0;
            contents.forEach(function (content) {
                getInfos(basePath + '/', content);
            });


            rData.msg = 'success';
            rData.pathList = JSON.stringify(pathList);
            rData.directoyNumber = directoryCnt;
            rData.fileNumber = fileCnt;
            postMessage(rData);
        } else {
            postMessage(rData);
        }
    }

}, false);
