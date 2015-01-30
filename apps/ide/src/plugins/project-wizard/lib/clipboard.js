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
 * @Clipboard - wrapper for ZeroClipboard
 *
 * @version: 1.0.0
 * @since: 2014.04.18
 *
 * Src:
 *   plugins/project-wizard/clipboard.js
 */

define(['lib/ZeroClipboard/ZeroClipboard'], function (ZeroClipboard) {
    'use strict';

    var PATH = 'lib/ZeroClipboard/ZeroClipboard.swf';

    ZeroClipboard.config({
        moviePath: PATH
    });

    // constructor
    var Clipboard = function (target, value) {
        $('.clone-url-box #fe_text').attr('value', value);
        $('.clone-url-box #d_clip_button').attr('data-clipboard-text', value);

        var $t = $(target);
        var e = new ZeroClipboard($t);
        e.on('mouseover', function () {
            if ($t.hasClass('js-zeroclipboard-no-tooltip')) {
                return true;
            }
            $('#global-zeroclipboard-html-bridge').addClass('tooltipped tooltipped-se');
            var n = $t.attr('aria-label');
            var e = $('#global-zeroclipboard-html-bridge').attr('aria-label', n || 'Copy to clipboard.');
            return e;
        });
        e.on('mouseout', function () {
            return $('#global-zeroclipboard-html-bridge').removeClass('tooltipped tooltipped-se');
        });
        e.on('complete', function () {
            var n = $t.attr('data-copied-hint');
            $('#global-zeroclipboard-html-bridge').attr('aria-label', n || 'Copied!');
            return $t.closest('.js-menu-container').length ? $t.menu('deactivate') : void 0;
        });
        e.on('aftercopy', function () {
            var n = $t.attr('data-copied-hint');
            $('#global-zeroclipboard-html-bridge').attr('aria-label', n || 'Copied!');
            return $t.closest('.js-menu-container').length ? $t.menu('deactivate') : void 0;
        });
    };

    Clipboard.initCopy = function (target, source) {
        var $target = $(target);
        var $source = $(source);
        var client = new ZeroClipboard($target);
        client.on('ready', function () {
            client.on('copy', function (event) {
                //console.log('copy', event.clipboardData);
                // copy source text
                event.clipboardData.setData('text/plain', $source.val());
            });
            client.on('aftercopy', function (event) {
                console.log('aftercopy', event.data['text/plain']);
            });
            //client.on('complete', function () { });
            client.on('error', function (event) {
                console.log('error', event);
                Clipboard.destroy();
            });
        });
    };

    Clipboard.destroy = function () {
        ZeroClipboard.destroy();
    };

    return Clipboard;
});
