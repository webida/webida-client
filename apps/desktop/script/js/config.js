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

/* exported require, webidaHost */
/* jshint -W079 */

var webidaHost =
    decodeURIComponent(document.cookie.replace(/(?:(?:^|.*;\s*)webida\.host\s*\=\s*([^;]*).*$)|^.*$/, '$1'));
// var webida = '//library.' + webidaHost + '/webida/webida-0.3';
var webida = '../../common/src/webida/webida-0.3';

var require = {
    baseUrl: '.',
    paths: {
        webida: webida,
        common: 'script/js/common',
        underscore: 'script/lib/lodash.min',
        path: 'script/lib/path',
        async: 'script/lib/async',
        base64: 'script/lib/base64',
        md5: 'script/lib/md5',
        sly: 'script/lib/sly.min',
        toastr: 'script/lib/toastr/toastr',
        text: 'script/lib/text',
        'webida-lib': '../../common/src/webida',
        'external': '../../bower_components'
    }
};
