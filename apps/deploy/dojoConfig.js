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

/* exported dojoConfig, webidaHost */

var webidaHost =
    decodeURIComponent(document.cookie.replace(/(?:(?:^|.*;\s*)webida\.host\s*\=\s*([^;]*).*$)|^.*$/, '$1'));

var dojoConfig = {
    async: true,
    baseUrl: '.',
    parseOnLoad: true,
    paths: {
        'lib' : 'lib',
        'core' : 'core',
        'plugins' : 'plugins',
        //'webida-lib': '//library.' + webidaHost + '/src/webida',
        //'other-lib': '//library3.' + webidaHost + '/src',
        'webida-lib': '../../common/src/webida',
        'other-lib': '../../external/src',
        'external': '../../bower_components'
    },
    aliases: [
        ['text', 'dojo/text'],
        ['plugin-manager', 'webida-lib/plugin-manager-0.1'],
        ['underscore', 'lib/lodash.min'],
        ['toastr', 'lib/toastr/toastr'],
        ['popup-dialog', 'webida-lib/widgets/dialogs/popup-dialog/PopupDialog']
    ]
};
