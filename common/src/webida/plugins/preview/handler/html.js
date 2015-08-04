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
 * webida - preview plugin handler for HTML
 *
 */

define(['webida-lib/app', 'plugins/webida.notification/notification-message'],
function (app, toastr) {
    'use strict';

    var fsMount = app.getFSCache();

    function preview(path) {
        var wsPath = app.getPath();
        console.assert(path.indexOf(wsPath) === 0);
        var relPath = path.substr(wsPath.length);

        fsMount.addAlias(wsPath, 10, function (err, aliasData) {
            if (err) {
                toastr.error('Failed to add an alias for the workspace ' +
                             'required to preview an HTML file (' + err + ')');
            } else {
                var $iframe =
                    $('<iframe frameborder="0" border="0" scrolling="auto" src="' +
                      aliasData.url + relPath +
                      '" style="position: absolute; top: 0px; height: 100%; width: 100%">');
                $('.preview-content-panel').append($iframe);
            }
        });
    }

    return {
        preview: preview
    };
});
