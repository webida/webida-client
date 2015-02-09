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

/* exported require, WS_INFO_PATH */
/* jshint -W079 */

var webidaHost = 
    decodeURIComponent(document.cookie.replace(/(?:(?:^|.*;\s*)webida\.host\s*\=\s*([^;]*).*$)|^.*$/, '$1'));
// var webida = '//library.' + webidaHost + '/webida/webida-0.3';
var webida = '../../commons/src/webida/webida-0.3';

var require = {
    baseUrl: '.',
    paths: {
        webida:	webida,
        controllers: 'src/js/controllers',
        services: 'src/js/services',
        lodash: 'lib/lodash.min',
        toastr: 'lib/toastr/toastr',
        path: 'lib/path',
        text: 'lib/text',
        base64: 'lib/base64',
        md5: 'lib/md5',
        moment: 'lib/moment.min',
        // menus list
        common: 'src/js/common',
        'app-config': 'src/js/app-config',
        q: 'lib/q',
        async: 'lib/async'
    }
};

var WS_PROFILE_PATH = '.profile';
var WS_INFO_PATH = WS_PROFILE_PATH + '/workspace.json';
