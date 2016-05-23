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
 * @file Manage actions for deploy commands
 * @since 1.6.0
 * @author kyungmi.k@samsung.com
 * @module Deploy/command
 */

define([
    'dijit/Dialog',
    'dojo/i18n!./nls/resource',
    'webida-lib/app',
    'webida-lib/plugins/command-system/command/Command',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/notify',
    'webida-lib/util/path',
    'webida-lib/server-api',
    './content-view-controller',
    './workspace-view-controller',
    'text!./layout/deploy-layout.html',
    'xstyle/css!./style/style.css',
], function (
    Dialog,
    i18n,
    ide,
    Command,
    wv,
    genetic,
    Logger,
    notify,
    pathUtil,
    webida,
    contentViewController,
    workspaceViewController,
    layoutTemplate
) {
    'use strict';

    /**
     * @type {Logger}
     */
    var logger = new Logger();
    logger.off();

    /**
     * Get context object for deployment
     * @param projectPath
     * @param {deployContextCallback} callback
     * @private
     */
    function getContext(projectPath, callback) {
        var context = {};
        projectPath = (projectPath.charAt(0) === '/') ? projectPath.substring(1) : projectPath;
        var splits = projectPath.split('/');
        if (splits.length < 3) {
            logger.error(i18n.validationInvalidArgument);
            return callback(i18n.validationInvalidArgument);
        }

        context.fsidName = splits[0];
        context.workspaceName = splits[1];
        context.projectName = splits[2];
        context.workspaceProjectName = context.workspaceName + '/' + context.projectName;
        context.workspacePath = context.fsidName + '/' + context.workspaceName;

        webida.auth.getMyInfo(function (err, myInfo) {
            if (err) {
                logger.error(i18n.messageFailGetUserInfo);
                callback(err);
            } else {
                if (!myInfo.uid) {
                    logger.error(i18n.messageFailGetUserInfo);
                    callback(i18n.messageFailGetUserInfo);
                } else {
                    context.username = myInfo.uid;
                    callback(null, context);
                }
            }
        });
    }

    /**
     * Open deploy dialog with the context
     */
    function openDialog() {
        getContext(ide.getFsid() + pathUtil.detachSlash(wv.getSelectedPath()), function (err, context) {
            if (err) {
                return notify.error(i18n.messageFailGetContext);
            }
            var dialog = new Dialog({
                title: i18n.titleDialog,
                style: 'width: 810px; height: 650px',
                refocus: false,
                onHide: function () {
                    dialog.destroyRecursive();
                },
                onLoad: function () {
                    workspaceViewController.onStart(context);
                    contentViewController.onStart(context);
                }
            });
            dialog.set('doLayout', true);
            dialog.setContent(layoutTemplate);
            dialog.show();
        });
    }

    function DeployCommand(id) {
        DeployCommand.id = id;
    }
    genetic.inherits(DeployCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                openDialog();
                resolve();
            });
        }
    });

    return {
        DeployCommand: DeployCommand
    };
});
