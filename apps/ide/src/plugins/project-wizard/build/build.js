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
 * @file Build runner
 * @since 1.0.0
 * @author cimfalab@gmail.com
 *
 * @see module:ProjectWizard/BuildMenu
 * @see module:ProjectWizard/BuildProfile
 * @module ProjectWizard/BuildRunner
 */

define([
    'dojo/topic',
    'webida-lib/app',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/path',
    'webida-lib/webida-0.3',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
    './buildProfile',
    '../constants',
    '../launcher',
    '../messages',
    '../lib/util'
], function (
    topic,
    ide,
    Logger,
    pathUtil,
    webida,
    ButtonedDialog,
    BuildProfile,
    Constants,
    Launcher,
    Messages,
    Util
) {
    'use strict';

    var logger = new Logger();
    logger.off();

    /**
     * Profile information for build
     * @see module:ProjectWizard/BuildProfile.cordovaPlugin - plugins
     * @typedef {Object} buildProfileInfo
     *
     * @property {string} workspaceName
     * @property {string} projectName
     * @property {string} profileId
     * @property {string} profileName
     * @property {string} platform
     * @property {module:ProjectWizard/BuildProfile.buildType} buildType - RUN or DEBUG
     * @property {Array.<string>} plugins
     * @property {string} projectSrl - project uuid
     * @property {?Object} signing - signing information
     */

    /**
     * Build status
     * @see {module:ProjectWizard/BuildProfile.buildStatusState} - for state
     * @typedef {Object} buildStatus
     *
     * @property {Object} ret
     * @property {string} state - state name
     * @property {string} taskId
     * @property {string} profName - profile name
     * @property {string} uri - built file name
     */

    /**
     * Constructor for a build
     *
     * // FIXME
     * @param {string} projectPath - path to the project to build
     * @param {(HTMLElement|jQuery)} element - This element surrounded with the TR Element that has the information of
     *      this build
     *      FIXME! It seems not to be a good approach. It's better to send information object directly as a parameter
     *      than send an element that might have the information.
     * @param {Object} monitor - object for progress bar
     * @constructor
     */
    function Build(projectPath, element, monitor) {
        this.projectPath = projectPath;
        this.element = element;
        this.monitor = monitor;
    }

    /**
     * Enum for running type - build, rebuild and clean
     * @alias buildRunType
     * @readonly
     * @enum {string}
     * @memberof BuildRunner
     */
    Build.TYPE = {
        BUILD: 'build',
        REBUILD: 'rebuild',
        CLEAN: 'clean'
    };

    /**
     * Start to build
     *
     * @param {buildRunType} buildType - build running type
     * @param {buildProfileInfo} pf - build profile
     * @param {object} platformInfo - platform information
     * @callback resultCallback
     */
    Build.prototype.build = function (buildType, pf, platformInfo, resultCallback) {
        logger.log('requestBuild', buildType, pf, platformInfo);
        var self = this;
        var fn;
        switch (buildType) {
        case Build.TYPE.BUILD :
            fn = webida.build.buildProject;
            break;
        case Build.TYPE.REBUILD :
            fn = webida.build.rebuild;
            break;
        case Build.TYPE.CLEAN :
            fn = webida.build.buildClean;
            break;
        default :
            throw new Error('Illegal buildType: ' + buildType);
        }

        var downloadId = 'export-' + pf.profileName + '-download';
        var downloadToDeviceId = 'export-' + pf.profileName + '-download-device';
        var $tr = $(this.element).closest('tr');
        var $msg = $tr.find('.msg');
        var $progress = $tr.find('.ladda-button');
        var $dropdown = $tr.find('.g__dropdown-build');
        // clear
        $msg.empty();
        $('.pkg-download').remove();
        $('.pkg-download-pane').empty();
        $dropdown.hide();
        $progress.show();

        var handleBuild = function (result) {
            if (!result.status) {
                topic.publish('project/build/start', {
                    profileName: pf.profileName,
                    taskId: result
                });
                return;
            }

            var ret = result.status.ret;
            var state = result.status.state;
            var done = false;
            var apkPath;
            logger.log('handleBuild', ret);
            switch (ret) {
            case BuildProfile.STATE_PROGRESS :
                var taskId = BuildProfile.getTaskId(result);
                topic.publish('project/build/progress', {
                    profileName: pf.profileName,
                    taskId: taskId,
                    state: state
                });

                $msg.html($msg.html() + '<br />' + BuildProfile.STATE[state].text).addClass('info');
                break;
            case BuildProfile.STATE_SUCCESS :
                $msg.html($msg.html() + '<br />' +
                    '<br />' + Messages.SUCCESS).addClass('info');
                //$msg.parent().prev().find('label.platform').nextAll('div.pkg-download-pane')
                $tr.find('.build__platform').nextAll('div.pkg-download-pane')
                    .append('<button class="pkg-download to-pc" id="' +
                            downloadId + '">' + 'Download' + '</button><br/>')
                    .append('<button class="pkg-download to-device" id="' +
                            downloadToDeviceId + '">' + Messages.INSTALL_TO_PHONE +
                            '</button>');
                $('#' + downloadId).click(function () {
                    self.downloadPackage.call(self, result.status);
                });
                $('#' + downloadToDeviceId).click(function () {
                    var pkg = self.getRelativeApkPath(result.status);
                    //var apk_path = self.getApkPath(result.status);
                    self.downloadPackageToDevice.call(self, self.projectPath, pkg);
                });
                apkPath = self.getApkPath(result.status);
                done = true;
                break;
            case BuildProfile.STATE_ERROR :
                $msg.html($msg.html() + '<br />' + result.status[BuildProfile.STATE_ERROR_MESSAGE])
                .removeClass('info').addClass('error');
                done = true;
                break;
            }
            //logger.log('handleBuild done?', done);
            if (done) {
                topic.publish('project/build/end', {
                    profileName: pf.profileName,
                    taskId: result.status.taskId,
                    pkg: apkPath
                });
            }
            return done;
        };

        var handleClean = function (result) {
            //logger.log('handleClean', result);
            var ret = result;
            var done = false;
            switch (ret) {
            case BuildProfile.STATE_SUCCESS :
                $msg.html($msg.html() + '<br />' + 'Cleaned').addClass('info');
                done = true;
                break;
            case BuildProfile.STATE_ERROR :
                $msg.html($msg.html() + '<br />' +
                          result.status[BuildProfile.STATE_ERROR_MESSAGE]).removeClass('info').addClass('error');
                done = true;
                break;
            }
            if (done) {
                topic.publish('project/build/cleaned', {
                    profileName: pf.profileName
                });
            }
            return done;
        };

        var cb = function (cbHandle) {
            var cbSelf = this;
            return function (err, result) {
                logger.log('Build result', result);

                // taskId should be used to identify the result.
                // Otherwise, build result can be mangled by 'build after browser
                // refresh' or 'build' when previous build is not finished.
                if (result && result.status) {
                    var resultTaskId = BuildProfile.getTaskId(result);
                    // to just display results of the latest build action
                    var taskId = self.monitor[pf.profileName].lastTaskId;
                    if (taskId !== resultTaskId) {
                        logger.error('taskId not matched (taskId - ' + taskId +
                                      ', resultTaskId - ' + resultTaskId + ')');
                        return;
                    }
                }

                $msg.slideDown('fast');
                if (err) {
                    $msg.text(JSON.stringify(err)).addClass('error');
                    cbHandle(err, result, self);
                    cbSelf.done = true;
                } else {
                    cbSelf.done = cbHandle(err, result, self);
                }
                //logger.log('cb done?', cbSelf.done);
                if (cbSelf.done) {
                    topic.publish('project/build/done', {
                        profileName: pf.profileName
                    });
                    $progress.hide();
                    $dropdown.show();
                }
            };
        };

        require([webida.conf.ntfServer + '/socket.io/socket.io.js'], function (sio) {
            window.sio = sio;

            logger.log('socket.io ready', buildType);
            switch (buildType) {
            case Build.TYPE.BUILD :
            case Build.TYPE.REBUILD :
                fn(pf, platformInfo, cb.call(self, resultCallback || handleBuild));
                break;
            case Build.TYPE.CLEAN :
                fn(pf, cb.call(self, resultCallback || handleClean));
                break;
            }
        });
    };

    /**
     * Get the path to APK file
     *
     * @param {buildStatus} status - build status object
     * @return {string} - path
     */
    Build.prototype.getApkPath = function (status) {
        var apkPath = this.projectPath + this.getRelativeApkPath(status);
        return apkPath;
    };

    /**
     * Get relative path to APK file
     *
     * @param {buildStatus} status - build status object
     * @return {string} - path
     */
    Build.prototype.getRelativeApkPath = function (status) {
        var apkPath = Constants.OUTPUT_DIR + '/' + status.profName + '/' + status.uri;
        return apkPath;
    };

    /**
     * Download built package
     *
     * @param {buildStatus} status - build status object
     */
    Build.prototype.downloadPackage = function (status) {
        var apkPath = this.getApkPath(status);
        this.downloadPackageFile(apkPath, status.uri);
    };

    /**
     * Download built package
     *
     * @param {string} path - package file path
     * @param {string} name - file name to download
     */
    Build.prototype.downloadPackageFile = function (path, name) {
        logger.log('downloadPackageFile', path);
        Util.expandWorkspaceTreeTo(path, true, function () {
            // download
            var url = Constants.getFileDownloadUrl(ide.getFsid(), path);
            Util.downloadFile(url, name);
        });
    };

    /**
     * Open a dialog for downloading package file to device
     *
     * @param {string} projectPath - path to project
     * @param {string} pkg - package file path relative with the project path
     */
    Build.prototype.downloadPackageToDevice = function (projectPath, pkg) {
        logger.log('downloadPackageToDevice', pkg);
        var msg = 'To send a package into your device,<br />' +
            '<ul>' +
                '<li>Please check our Companion App is installed.' +
                '<li>Please check <b>Applications > Unknown sources</b> on your phone.' +
            '</ul>';
        var dlg = new ButtonedDialog({
            buttons: [
                { id: 'downloadOk',
                 caption: 'Proceed',
                 methodOnClick: 'proceed'
                },
                { id: 'downloadCancel',
                 caption: 'Cancel',
                 methodOnClick: 'hide'
                }
            ],
            methodOnEnter: 'ok',
            title: 'Confirm',
            refocus: false,

            onHide: function () {
                dlg.destroyRecursive();
            },

            onLoad: function () {
            },

            proceed: function () {
                var workspace = Util.getWorkspaceName(projectPath);
                var project = pathUtil.getName(projectPath);
                var launcher = new Launcher();
                launcher.downloadToDevice(workspace, project, pkg);
                this.hide();
            }
        });
        dlg.set('doLayout', false);
        dlg.setContentArea(msg);
        dlg.show();
    };

    return Build;
});
