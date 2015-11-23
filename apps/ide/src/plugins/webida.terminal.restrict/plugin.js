/*
 * Copyright (c) 2015 Samsung Electronics Co., Ltd. All rights reserved.
 *
 * Contact:
 * WooYoung Cho <wy1.cho@samsung.com>
 * KangHo Kim <kh5325.kim@samsung.com>
 * KiHyuk Ryu <kihyuck.ryu@samsung.com>
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Contributors:
 * - S-Core Co., Ltd.
 *
 */

/**
 * Terminal plugin module (restrict version)
 * @module webida.terminal.restrict.plugin
 * @memberOf module:webida.terminal.restrict
 */
define([
    'external/lodash/lodash.min',  // _
    'dojo/i18n!./nls/resource',
    'webida-lib/app',                   // ide
    'webida-lib/util/locale',
    'webida-lib/webida-0.3',            // webida
    'webida-lib/widgets/views/view',    // View
    'dojo/text!./layout/terminal.html'
], function (
    _,
    i18n,
    ide,
    Locale,
    webida,
    View,
    terminalHtml
) {
    'use strict';

    var locale = new Locale(i18n);
    var mod = {};

    /**
     * Get restriced terminal view
     * @memberOf module:webida.terminal.restrict.plugin
     */
    mod.getView = function () {
        if (!mod._view) {
            mod._view = new View('generalTerminalView', i18n.titleView);
        }
        return mod._view;
    };

    /**
     * Called when view is appended
     * @memberOf module: webida.terminal.restrict.plugin
     */
    mod.onViewAppended = function () {
        mod._view.setContent(terminalHtml);
        locale.convertMessage(mod._view.domNode);
    };

    return mod;
});
