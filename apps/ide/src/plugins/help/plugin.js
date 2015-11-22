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
 * @fileoverview webida - about
 *
 * @version: 0.1.0
 * @since: 2013.10.16
 *
 * Src:
 *   plugin.js
 */

define([
    'dojo/i18n!./nls/resource',
    'webida-lib/util/locale'
], function (i18n, Locale) {
    'use strict';
    var item = {
        'Help Contents' : {
            'IDE Reference Manual' : [ 'cmnd', 'plugins/help/help-commands', 'showHelpDocument' ],
            'API Documentation' : [ 'cmnd', 'plugins/help/help-commands', 'showAPIDocument' ]
        },
        '&About': [ 'cmnd', 'plugins/help/help-commands', 'showAbout' ]
    };
    var localizer = new Locale(i18n);
    localizer.convertMenuItem(item, 'menu');
    localizer.convertMenuItem(item['Help Contents'], '[menu] ');

    return {
        getViableItems : function () {
            return item;
        }
    };
});
