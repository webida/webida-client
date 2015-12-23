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
 * @FIXME This file is out of date
 * To use, below lines should be updated. Or It's better to remove this.
 */

/* exported dojoConfig */
var webidaHost = decodeURIComponent(
    document.cookie.replace(/(?:(?:^|.*;\s*)webida\.host\s*\=\s*([^;]*).*$)|^.*$/, '$1')
);

var dojoConfig = {
    async: true,
    baseUrl: '.',
    parseOnLoad: false,
    packages: [
        { name: 'dojo', location: 'lib/dojo-release-1.9.1/dojo' },
        { name: 'dijit', location: 'lib/dojo-release-1.9.1/dijit' },
        { name: 'dojox', location: 'lib/dojo-release-1.9.1/dojox' },
        { name: 'xstyle', location: '//library3.' + webidaHost + '/xstyle' },
        { name: 'put-selector', location: '//library3.' + webidaHost + '/put-selector' }
    ],
    locale: location.search.match(/locale=([\w\-]+)/) ? RegExp.$1 : 'en-us',
    paths: {
        'webida-lib': '//library.' + webidaHost + '/webida',
        'lib' : 'lib',
        'plugins' : 'plugins'
    },
    aliases: [
        ['text', 'dojo/text'],
        ['popup-dialog', 'webida-lib/widgets/dialogs/popup-dialog/PopupDialog'],
        // TODO: remove this.
        ['diff_match_patch', '//cdnjs.cloudflare.com/ajax/libs/diff_match_patch/20121119/diff_match_patch.js']
    ]
};
