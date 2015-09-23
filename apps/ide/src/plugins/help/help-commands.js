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

    var version = '1.4.1';

    function showHelpDocument() {
        require(['webida-lib/webida-0.3'], function (webida) {
            var appid = 'wikida';
            var win = webida.app.launchApp(appid, true);

            win.focus();
        });
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
                 'text!/package.json',
                 'webida-lib/plugins/workbench/plugin',
                 'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog'],
                function (aboutHtml, text, workbench, ButtonedDialog) {
            var pane = new ButtonedDialog({
                buttons: [],
                methodOnEnter: null,

                title: 'About Webida IDE',
                refocus: false,
                onHide: function () {
                    pane.destroyRecursive();
                    workbench.focusLastWidget();
                }

            });
            pane.setContentArea(aboutHtml);

            var data = (text ? $.parseJSON(text) : '');
            if (!!data && !!data.buildnumber) {
                var buildId = data.buildid;
                var underbarPos = buildId.indexOf('_');
                var date = buildId.substring(0, underbarPos);
                var time = buildId.substr(underbarPos + 1);
                time = time.replace(/-/g, ':');
                $('#version').text('Version: ' + version + ' (' + data.buildnumber + ')');
                $('#buildInfo').html('Build created: ' + date + ' ' + time +
                                     '<br>Commit-id: ' + data.buildcommitid);
            } else {
                $('#version').text('Version: ' + version + ' (Prebuild)');
                $('#buildInfo').html('Build created: Unknown' + '<br>Commit-id: Unknown');
            }

            pane.show();
        });
    }

    return {
        showHelpDocument: showHelpDocument,
        showAPIDocument: showAPIDocument,
        showAbout: showAbout
    };
});
