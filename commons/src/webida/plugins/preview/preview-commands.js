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

define(['./preview-view',
        './preview-pref-values',
        'dojo/topic',
        'other-lib/underscore/lodash.min',            // _
        'webida-lib/util/path',                             // pathUtil
        'webida-lib/plugins/workspace/plugin',                   // ws
        'dojo/Deferred'                               // Deferred
       ],
function (view, options, topic, _, pathUtil, ws, Deferred) {
    'use strict';

    var FORMAT_HANDLER_PATH = 'webida-lib/plugins/preview/handler';
    var FORMAT_HANDLERS = {
        'html': FORMAT_HANDLER_PATH + '/html',
        'htm': FORMAT_HANDLER_PATH + '/html',
        'md': FORMAT_HANDLER_PATH + '/markdown',
        'png': FORMAT_HANDLER_PATH + '/image',
        'gif': FORMAT_HANDLER_PATH + '/image',
        'jpg': FORMAT_HANDLER_PATH + '/image',
        'jpeg': FORMAT_HANDLER_PATH + '/image'
    };
    var currentPreview = null;
    var lastHandler = null;

    function displayPreview(path) {
        function getFileExt(name) {
            var ext = (/^.+\.([^.]+)$/.exec(name));
            return (ext && _.isArray(ext) && ext.length > 1) ? ext[1] : '';
        }


        function cleanContents() {
            if (lastHandler && lastHandler.destroy) {
                lastHandler.destroy();
                lastHandler = null;
            }
            $('.preview-toolbar-ext-panel').children().remove();
            $('.preview-content-panel').children().remove();
        }

        function showDefaultToolbar(msg) {
            msg = msg || 'No preview';

            $('#preview-default-toolbar').fadeIn().find('.toolbar-message').text(msg);
        }

        function getHandler(ext) {
            var deferred = new Deferred();
            if (!ext) {
                return deferred.reject();
            }
            var mod = FORMAT_HANDLERS[ext];
            if (mod) {
                try {
                    require([mod], function (handler) {
                        deferred.resolve(handler);
                    });
                } catch (e) {
                    return deferred.reject(e);
                }
            } else {
                return deferred.reject();
            }
            return deferred.promise;
        }

        var previewView;
        if (!(previewView = view.getView())) {
            return;    // preview view has not been attached yet.
        }

        cleanContents();

        var id = pathUtil.detachSlash(path);
        var name = pathUtil.dividePath(id)[1];

        currentPreview = id;
        if (path && name && !pathUtil.isDirPath(path)) {
            var ext = getFileExt(name);
            ext = ext.toLowerCase();
            getHandler(ext).then(function (handler) {
                showDefaultToolbar('Preview: ' + id);
                handler.preview(id);
                previewView.select();
                lastHandler = handler;
            }, function () {
                //console.error('Failed to get a handler', e);
                showDefaultToolbar('Preview not supported for "' + id + '"');
            });
            return true;
        } else {
            // Not supported
            var msg = '';
            if (!path) {
                msg = 'No selection in workspace';
            } else if (pathUtil.isDirPath(path)) {
                msg = 'Preview not supported for a directory "' + id + '"';
            }
            showDefaultToolbar(msg);
        }
    }

    function respondToSelection(path) {
        if (options['preview:autoContentsChange']) {
            displayPreview(path);
        }
    }

    function updatePreview(fsURL, path, reason, mayBeModified) {
        if (options['preview:liveReload'] && mayBeModified) {
            if (path && currentPreview &&
                (path === currentPreview)) {
                displayPreview(path);
            }
        }
    }

    topic.subscribe('workspace.node.selected', respondToSelection);
    topic.subscribe('fs.cache.file.set', updatePreview);

    function showPreview() {
        displayPreview(ws.getSelectedPath());
    }

    return {
        showPreview: showPreview
    };
});
