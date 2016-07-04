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

(function (globalObject) {
    'use strict';

    // in electron, we should remove global.require & global.module
    // to make dojo & other amd module work
    // how can we detect that we're working in electron?
    if (typeof(globalObject.process) === 'object' &&
        typeof(globalObject.require) === 'function' &&
        typeof(globalObject.module) === 'object') {
        globalObject.nrequire = globalObject.require;
        globalObject.nmodule = globalObject.module;
        delete globalObject.require;
        delete globalObject.module;
        globalObject.__ELECTRON_BROWSER__ = true;
    }

    var webidaLocale = decodeURIComponent(
        document.cookie.replace(/(?:(?:^|.*;\s*)webida\.locale\s*\=\s*([^;]*).*$)|^.*$/, '$1')
    );
    globalObject.dojoConfig = {
        async: true,
        baseUrl: '../../../bower_components',
        parseOnLoad: false,
        packages: [
            {name: 'dijit', location: './dijit'},
            {name: 'dojo', location: './dojo'},
            {name: 'dojox', location: './dojox'},
            {name: 'jquery', location: './jquery/dist', main: 'jquery.min'},
            {name: 'put-selector', location: './put-selector'},
            {name: 'showdown', location: './showdown/dist', main: 'showdown.min'},
            {name: 'URIjs', location:'./URIjs/src', main:'URI'},
            {name: 'xstyle', location: './xstyle'}
        ],
        locale: ((webidaLocale === 'default') || (webidaLocale === '')) ?
            (location.search.match(/locale=([\w\-]+)/) ? RegExp.$1 : 'en-us') : webidaLocale,
        extraLocale: ['zh-cn', 'zh-tw'],
        paths: {
            'webida-lib': '../common/src/webida',
            lib: '../apps/ide/src/lib',
            plugins: '../apps/ide/src/plugins',
            external: '.',
            top: '..'
        },
        aliases: [
            ['text', 'dojo/text'],
            ['popup-dialog', 'webida-lib/widgets/dialogs/popup-dialog/PopupDialog'],
            // TODO should use these below aliases for versioned resources
            ['FSCache', 'webida-lib/FSCache-0.1'],
            ['plugin-manager', 'webida-lib/plugin-manager-0.1'],
            // diff_match_patch is used in codemirror
            ['diff_match_patch', '//cdnjs.cloudflare.com/ajax/libs/diff_match_patch/20121119/diff_match_patch.js'],

            // following server api will be removed when window.nrequire is true
            // so, put these always at the end of aliases array
            ['webida-lib/server-api', 'webida-lib/webida-0.3'],
            ['webida-lib/server-pubsub', 'webida-lib/msg']
        ]
    };

    // twick requirejs alias to use new server-api when not using using legacy server
    if (window.location.href.indexOf('legacy=') < 0 ) {
        globalObject.dojoConfig.aliases.pop();
        globalObject.dojoConfig.aliases.pop();
        globalObject.dojoConfig.aliases.push(['webida-lib/server-api' , 'webida-lib/server-api-0.1']);
        globalObject.dojoConfig.aliases.push(['webida-lib/server-pubsub' , 'webida-lib/server-pubsub-0.1']);
        globalObject.dojoConfig.aliases.push(['top/site-config.json' , 'top/site-config-desktop.json']);
    }

    if (globalObject.__ELECTRON_BROWSER__) {
        // Although dojo may understand cjs require() by building option,
        //   some bower modules works under amd system only.
        //   So, we don't allow to mix amd/cjs modules with same require function
        globalObject.dojoConfig.has = {
            'host-node': false // Prevent dojo from being fooled by Electron
        };
    }
})(window);
