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

define([
    'dijit/Dialog',
    'dojo/i18n!./nls/resource',
    'webida-lib/app',
    'webida-lib/util/path',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/locale',
    'webida-lib/util/logger/logger-client',
    './content-view-controller',
    './deploy',
    './workspace-view-controller',
    'text!./layout/deploy-layout.html',
    'xstyle/css!./style/style.css'
], function (
    Dialog,
    i18n,
    ide,
    pathUtil,
    wv,
    locale,
    Logger,
    contentViewController,
    deploy,
    workspaceViewController,
    layoutTemplate
) {
    'use strict';

    var module = {};
    var ui = {};

    var logger = new Logger();

    module.openDialog = function () {
        deploy.init(ide.getFsid() + pathUtil.detachSlash(wv.getSelectedPath()));
        ui.dialog = new Dialog({
            title: i18n.dialogTitle,
            style: 'width: 810px; height: 650px',
            refocus: false,
            onHide: function () {
                ui.dialog.destroyRecursive();
            },
            onLoad: function () {
                workspaceViewController.onStart();
                contentViewController.onStart();
            }
        });
        ui.dialog.set('doLayout', true);
        ui.dialog.setContent(layoutTemplate);
        ui.dialog.show();
    };

    return module;
});
