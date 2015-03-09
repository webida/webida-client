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

define([], function () {
    'use strict';

    // based on Kennebec's code found in Stackoverflow
    var ret = { platform: navigator.platform, browser: '', browserVer: '' };

    var ua = navigator.userAgent, tem,
        M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*([\d\.]+)/i) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+(\.\d+)?)/g.exec(ua) || [];
        //return 'IE ' + (tem[1] || '');
        ret.browser = 'IE';
        ret.browserVer = tem[1] || '';
    } else {
        M = M[2] ? [M[1], M[2]]:[navigator.appName, navigator.appVersion, '-?'];
        if ((tem = ua.match(/version\/([\.\d]+)/i)) !== null) {
            M[2] = tem[1];
        }
        //return M.join(' ');
        ret.browser = M[0];
        ret.browserVer = M[1];
    }

    return ret;
});
