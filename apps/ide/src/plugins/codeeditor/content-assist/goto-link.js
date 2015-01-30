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

define(['webida-lib/util/path',
        'webida-lib/plugins/editors/plugin'],
function (path, editors) {
    'use strict';

    var _gotoLinkActivated = false;

    /**
     * Key down event handler for goto link
     *
     * @param {CodeMirror} cm
     * @param {KeyboardEvent} e
     */
    function onKeyDown(cm, e) {
        if (e.altKey && !_gotoLinkActivated) {
            var $wrapper = $(cm.display.wrapper);
            $wrapper.find('span.cm-link').addClass('cm-link-active');
            _gotoLinkActivated = true;

            var onKeyUp = function (e) {
                if (e.keyCode === 18) {
                    $wrapper.find('span.cm-link').removeClass('cm-link-active');
                    _gotoLinkActivated = false;
                    document.removeEventListener('keyup', onKeyUp);
                }
            };

            document.addEventListener('keyup', onKeyUp);
        }
    }

    /**
     * Mouse down event handler for goto link
     *
     * @param {CodeMirror} cm
     * @param {MouseEvent} e
     */
    function onMouseDown(cm, e) {
        if (e.altKey && _gotoLinkActivated) {
            var pos = cm.coordsChar({left: e.x, top: e.y});
            var token = cm.getTokenAt(pos);
            if (token.type === 'link') {
                var currentpath = cm.__instance.file.path;
                var linkpath = token.string;
                if (/^[\"\']/.test(linkpath)) {
                    linkpath = linkpath.substr(1, linkpath.length - 2);
                }
                var abspath = path.combine(path.getDirPath(currentpath), linkpath);
                abspath = path.flatten(abspath);
                editors.openFile(abspath);

                // to move focus to the opened file... (WTC-312)
                e.stopPropagation();
                e.preventDefault();
            }
        }
    }

    return {
        onKeyDown : onKeyDown,
        onMouseDown : onMouseDown
    };
});
