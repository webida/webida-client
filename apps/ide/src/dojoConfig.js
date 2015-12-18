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

(function (global) {
    'use strict';
    var webidaLocale = decodeURIComponent(
        document.cookie.replace(/(?:(?:^|.*;\s*)webida\.locale\s*\=\s*([^;]*).*$)|^.*$/, '$1')
    );
    global.dojoConfig = {
        async: true,
        baseUrl: '../../../bower_components',
        parseOnLoad: false,
        packages: [
            {name: 'xstyle', location: './xstyle'},
            {name: 'put-selector', location: './put-selector'},
            {name: 'jquery', location: './jquery/dist', main: 'jquery.min'},
            {name: 'showdown', location: './showdown/dist', main: 'showdown.min'},
            {name: 'dojo', location: './dojo'},
            {name: 'dijit', location: './dijit'},
            {name: 'dojox', location: './dojox'}
        ],
        locale: ((webidaLocale === 'default') || (webidaLocale === '')) ?
            (location.search.match(/locale=([\w\-]+)/) ? RegExp.$1 : 'en-us') : webidaLocale,
        extraLocale: ['zh-cn', 'zh-tw'],
        paths: {
            'webida-lib': '../common/src/webida',
            lib: '../apps/ide/src/lib',
            plugins: '../apps/ide/src/plugins',
            external: '.'
        },
        aliases: [
            ['text', 'dojo/text'],
            ['popup-dialog', 'webida-lib/widgets/dialogs/popup-dialog/PopupDialog'],
            // TODO should use these below aliases for versioned resources
            ['webida', 'webida-lib/webida-0.3'],
            ['FSCache', 'webida-lib/FSCache-0.1'],
            ['plugin-manager', 'webida-lib/plugin-manager-0.1'],
            ['msg', 'webida-lib/msg.js'],
            // diff_match_patch is used in codemirror
            ['diff_match_patch', '//cdnjs.cloudflare.com/ajax/libs/diff_match_patch/20121119/diff_match_patch.js']
        ]
    };
})(window);