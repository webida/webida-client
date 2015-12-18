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
 * webida - preview plugin
 *
 */

define(['./preview-pref-values',					// options
        './preview-view',
        'webida-lib/util/path',
        'external/lodash/lodash.min',            // _
        'webida-lib/plugins/workspace/plugin'                   // ws
       ], function (options, view, pathUtil, _, ws) {
    'use strict';

    var SUPPORTED_FORMATS = [
        'html', 'htm',
        'md',
        'png', 'gif', 'jpg', 'jpeg'
    ];

    function getViableItemsForWorkspaceView() {
        function isSupported(path) {
            function getFileExt(name) {
                var ext = (/^.+\.([^.]+)$/.exec(name));
                return (ext && _.isArray(ext) && ext.length > 1) ? ext[1] : '';
            }

            if (!path) {
                return false;
            }
            var name = pathUtil.dividePath(path)[1];
            if (path && name && !pathUtil.isDirPath(path)) {
                var ext = getFileExt(name).toLowerCase();
                if (SUPPORTED_FORMATS.indexOf(ext) > -1) {
                    return true;
                }
            }
            return false;
        }

        if (view.getView() &&
            !options['preview:autoContentsChange'] &&
            isSupported(ws.getSelectedPath())) {
            return {
                'Preview': ['cmnd', 'webida-lib/plugins/preview/preview-commands', 'showPreview']
            };
        } else {
            return {};
        }
    }

    return {
        getViableItemsForWorkspaceView: getViableItemsForWorkspaceView,
    };
});

