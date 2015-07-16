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
 * webida - preview plugin handler for Markdown
 *
 */

define(['webida-lib/app',
        'showdown'
       ],
function (app, showdown) {
    'use strict';

    var fsMount = app.getFSCache();

    function preview(path) {
        fsMount.readFile(path, function (err, content) {
            if (err) {
                console.log(err);
            } else {
                var converter = new showdown.Converter();
                $('.preview-content-panel').append(converter.makeHtml(content));
            }
        });
    }

    return {
        preview: preview
    };
});
