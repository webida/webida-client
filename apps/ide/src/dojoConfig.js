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

/* exported webidaHost, connHostUrl, dojoConfig */
var webidaHost = decodeURIComponent(
    document.cookie.replace(/(?:(?:^|.*;\s*)webida\.host\s*\=\s*([^;]*).*$)|^.*$/, '$1')
);
// TODO sholud find a neat way
var connHostUrl = decodeURIComponent(
    document.cookie.replace(/(?:(?:^|.*;\s*)webida\.connHostUrl\s*\=\s*([^;]*).*$)|^.*$/, '$1')
);

var dojoConfig = {
    async: true,
    baseUrl: '.',
    parseOnLoad: false,
    packages: [
        { name: 'xstyle', location: '../../../bower_components/xstyle' },
        { name: 'put-selector', location: '../../../bower_components/put-selector' }
    ],
    locale: location.search.match(/locale=([\w\-]+)/) ? RegExp.$1 : 'en-us',
    paths: {
        'webida-lib': '../../../common/src/webida',
        'other-lib': '../../../external/src',
        'lib' : 'lib',
        'plugins' : 'plugins',
        'external': '../../../bower_components'
    },
    aliases: [
        ['text', 'dojo/text'],
        ['popup-dialog', 'webida-lib/widgets/dialogs/popup-dialog/PopupDialog'],
        // TODO: remove this.
        ['diff_match_patch', '//cdnjs.cloudflare.com/ajax/libs/diff_match_patch/20121119/diff_match_patch.js']
    ]
};
