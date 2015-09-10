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
        'external/lodash/lodash.min'],
function (ide, _) {
    'use strict';

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
        jshintrc: loadJsHintRc
    };
});
