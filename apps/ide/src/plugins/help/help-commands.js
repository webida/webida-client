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
 * @version: 0.2.0
 * @since: 2015.11.22
 *
 * Src:
 *   help-oommands.js
 */

define(['require'], function (require) {
    'use strict';

    function showHelpDocument() {
        var helpURL = 'https://github.com/webida/webida-client/wiki';
        window.open(helpURL);
    }

    function showAPIDocument() {
        require(['webida-lib/app-config'], function (config) {
            if (config.apiDocBaseUrl) {
                var win = window.open(config.apiDocBaseUrl);
                win.focus();
            }
        });
    }

    function showAbout() {
        require([
            'text!./about.html',
            'text!top/site-config.json',
            'dojo/i18n!./nls/resource',
            'webida-lib/plugins/workbench/plugin',
            'webida-lib/util/locale',
            'webida-lib/theme',
            'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog'
        ], function (
            aboutHtml,
            siteConfig,
            i18n,
            workbench,
            Locale,
            theme,
            ButtonedDialog
        ) {
            var localizer = new Locale(i18n);
            var pane = new ButtonedDialog({
                buttons: [],
                methodOnEnter: null,
                title: i18n.aboutDialogTitle,
                refocus: false,
                onHide: function () {
                    pane.destroyRecursive();
                    workbench.focusLastWidget();
                }
            });

            var data = siteConfig ? JSON.parse(siteConfig) : {};
            var versionInfo = data.build || {
                version : 'x.y.z',
                buildNumber:  '',
                buildTime: '????-??-??',
                commitId: ''
            };

            pane.setContentArea(theme.apply(aboutHtml));

            $('#version').text(localizer.formatMessage('messageVersion', versionInfo));
            $('#buildInfo').html(
                localizer.formatMessage('messageBuiltAt', versionInfo) +
                '<br>' + localizer.formatMessage('messageBuildCommitId', versionInfo));

            pane.show();
        });
    }

    return {
        showHelpDocument: showHelpDocument,
        showAPIDocument: showAPIDocument,
        showAbout: showAbout
    };
});
