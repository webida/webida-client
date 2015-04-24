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
var dojoConfig = {
    async: true,
    baseUrl: '.',
    parseOnLoad: false,
    packages: [
        { name: 'dojo', location: 'lib/dojo-release-1.9.1-src/dojo' },
        { name: 'dijit', location: 'lib/dojo-release-1.9.1-src/dijit' },
        { name: 'dojox', location: 'lib/dojo-release-1.9.1-src/dojox' },
        { name: 'xstyle', location: '../../../external/src/xstyle' },
        { name: 'put-selector', location: '../../../external/src/put-selector' }
    ],
    locale: location.search.match(/locale=([\w\-]+)/) ? RegExp.$1 : 'en-us',
    paths: {
        'webida-lib': '../../../common/src/webida',
        'other-lib': '../../../external/src',
        'lib' : 'lib',
        'plugins' : 'plugins',
        'widgets': 'widgets'
    },
    aliases: [
        ['text', 'dojo/text'],
        ['popup-dialog', 'webida-lib/widgets/dialogs/popup-dialog/PopupDialog'],
        // TODO: remove this.
        ['diff_match_patch', '//cdnjs.cloudflare.com/ajax/libs/diff_match_patch/20121119/diff_match_patch.js']
    ]
};
