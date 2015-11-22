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

define(['require'], function (require) {
    'use strict';

    var version = '1.5.0';

    function showHelpDocument() {
        var helpURL = 'https://github.com/webida/webida-client/wiki';
        window.open(helpURL);
    }

    function showAPIDocument() {
        require(['webida-lib/webida-0.3'], function (webida) {
            var appid = 'apidoc';
            var win = webida.app.launchApp(appid, true);

            win.focus();
        });
    }

    function showAbout() {
        require(['text!./about.html',
                'text!./package.json',
                'dojo/i18n!./nls/resource',
                'webida-lib/plugins/workbench/plugin',
                'webida-lib/util/locale',
                'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog'
        ],
        function (aboutHtml, text, i18n, workbench, Locale, ButtonedDialog) {
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

            var parseBuildTime = function (buildId) {
                if (!buildId) {
                    return 'Unknown';
                }
                var arr = buildId.split('_');
                return arr[0] + ' ' + arr[1].replace(/-/g , ':');
            };

            // TODO : fix package.json properties to buidInfo format
            var data = text ? JSON.parse(text) : {};
            var versionInfo = {
                version : data.version || version,
                buildNumber: data.buildnumber || 'Prebuild',
                buildTime: parseBuildTime(data.buildid),
                commitId: data.buildcommitid || 'Unknown'
            };

            pane.setContentArea(aboutHtml);
                        
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
