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

define(['webida-lib/app',
        'webida-lib/webida-0.3',
        'webida-lib/util/path',
        'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
        'dojo',
        'dojo/topic',
        'dijit/registry',
        './buildProfile',
        '../constants',
        '../launcher',
        '../messages',
        '../lib/util'
       ],
function (ide, webida, pathUtil, ButtonedDialog, dojo, topic, reg,
    BuildProfile, Constants, Launcher, Messages, Util) {
    'use strict';
    /* global webidaHost: true */

    // constructor
    var Build = function (projectPath, element, monitor) {
        this.projectPath = projectPath;
        this.element = element;
        this.monitor = monitor;
    };

    Build.TYPE = {
        'BUILD': 'build',
        'REBUILD': 'rebuild',
        'CLEAN': 'clean'
    };

    Build.prototype.build = function (buildType, pf, platformInfo, resultCallback) {
        console.log('requestBuild', buildType, pf, platformInfo);
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
            console.log('handleBuild', ret);
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
            //console.log('handleBuild done?', done);
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
            //console.log('handleClean', result);
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
                console.log('Build result', result);

                // taskId should be used to identify the result.
                // Otherwise, build result can be mangled by 'build after browser
                // refresh' or 'build' when previous build is not finished.
                if (result && result.status) {
                    var resultTaskId = BuildProfile.getTaskId(result);
                    // to just display results of the latest build action
                    var taskId = self.monitor[pf.profileName].lastTaskId;
                    if (taskId !== resultTaskId) {
                        console.error('taskId not matched (taskId - ' + taskId +
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
                //console.log('cb done?', cbSelf.done);
                if (cbSelf.done) {
                    topic.publish('project/build/done', {
                        profileName: pf.profileName
                    });
                    $progress.hide();
                    $dropdown.show();
                }
            };
        };

        require(['//ntf.' + webidaHost + '/socket.io/socket.io.js'], function (sio) {
            // NOTE: Name should be 'sio'?
            window.sio = sio;

            console.log('socket.io ready', buildType);
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

    Build.prototype.getApkPath = function (status) {
        var apkPath = this.projectPath + this.getRelativeApkPath(status);
        return apkPath;
    };

    Build.prototype.getRelativeApkPath = function (status) {
        var apkPath = Constants.OUTPUT_DIR + '/' + status.profName + '/' + status.uri;
        return apkPath;
    };

    Build.prototype.downloadPackage = function (status) {
        var apkPath = this.getApkPath(status);
        this.downloadPackageFile(apkPath, status.uri);
    };

    Build.prototype.downloadPackageFile = function (path, name) {
        console.log('downloadPackageFile', path);
        Util.expandWorkspaceTreeTo(path, true, function () {
            // download
            var url = Constants.getFileDownloadUrl(ide.getFsid(), path);
            Util.downloadFile(url, name);
        });
    };

    Build.prototype.downloadPackageToDevice = function (projectPath, pkg) {
        console.log('downloadPackageToDevice', pkg);
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
