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
 * @file Run on various kind of platform (no more maintenance)
 * @since 1.0.0 (2014.04.18)
 * @author kh5325.kim@samsung.com
 */

define([
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/path',
    'webida-lib/webida-0.3',
    './constants',
    './lib/util'
], function (
    Logger,
    pathUtil,
    webida,
    Constants,
    Util
) {
    'use strict';
    var logger = new Logger();
    logger.off();
    // TODO: temporary my account
    var gcmAPIKey = 'AIzaSyB_8WqaGg_SESmPzB37kr32vXetEDQHQ-Y';

    // constructor
    var Launcher = function () {
    };

    Launcher.ACTION = {
        RUN: 'run',
        DEBUG: 'debug',
        DOWNLOAD: 'download'
    };
    Launcher.RUN_OPTION = {
        CORDOVA: 'cordova', /* true | false */
        WEINRE: 'weinre', /* WEINRE target script url */
        DEVICE: 'device' /* device regid */
    };

    // https://sim.webida.mine/emulate/100001/test/mobilesample/pf1/?access_token=
    // 1a2b3c4d5e6f7g&enableripple=cordova-3.0.0-iPhone5
    Launcher.prototype.runToRipple = function (projectPath, profileName) {
        logger.log('runToRipple', profileName);
        webida.auth.getMyInfo(function (err, data) {
            if (err) {
                logger.error(err);
            } else {
                logger.log(data);
                var uid = data.uid;
                var workspace = Util.getWorkspaceName(projectPath);
                var project = pathUtil.getName(projectPath);
                var token = webida.auth.getToken();
                var url = Constants.getSimulateUrl() + '/' + uid + '/' + workspace + '/' + project + '/' + profileName +
                    '/?access_token=' + token + '&enableripple=cordova-3.0.0';
                window.open(url);
            }
        });
    };

    Launcher.prototype.runToRippleWithAlias = function (node) {
        Util.getAliasPath(node.parent).then(
            function (resolve) {
                var url = resolve.url;
                alert('Open with emulator with alias url: ' + (url + '/' + node.name));
            },
            function (err) {
                logger.error(err);
            }
        );
    };

    Launcher.prototype.runToDevice = function (projectPath, options, cb) {
        var self = this;
        var _run = function (regid) {
            var workspace = Util.getWorkspaceName(projectPath);
            var project = pathUtil.getName(projectPath);
            var message = {
                action: Launcher.ACTION.RUN,
                workspace: workspace,
                project: project
            };
            if (options) {
                $.extend(message, options);
            }
            logger.log('runToDevice');
            self.sendGCM(regid, message, cb);
        };

        var device;
        if (options && options[Launcher.RUN_OPTION.DEVICE]) {
            device = options[Launcher.RUN_OPTION.DEVICE];
        }
        if (device) {
            _run(device);
        } else {
            this.selectDevice(_run);
        }
    };

    Launcher.prototype.downloadToDevice = function (workspace, project, pkg) {
        var self = this;
        this.selectDevice(function (regid) {
            logger.log('downloadToDevice');
            self.sendGCM(regid, {
                'action': Launcher.ACTION.DOWNLOAD,
                'workspace': workspace,
                'project': project,
                'package': pkg
            });
        });
    };

    Launcher.prototype.sendGCM = function (regid, data, cb) {
        if (!regid) {
            logger.error('No regid');
            return;
        }

        var gcmUrl = Constants.GCM_URL;
        // TODO: domain
        var url = Constants.getProxyUrl(gcmUrl);
        logger.log('sendGCM');
        var paramsObj = {
            'registration_ids': [regid],
            'data': data
        };
        var params = JSON.stringify(paramsObj);

        var cbXHR = function (response) {
            if (cb) {
                cb(regid, response);
            }
        };
        var xhr = Util.createXHR('POST', url, cbXHR);
        xhr.setRequestHeader('Authorization', 'key=' + gcmAPIKey);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.send(params);
    };

    Launcher.prototype.selectDevice = function (cb) {
        require(['plugins/project-wizard/device/device-select'], function (SelectDevice) {
            var delegate = new SelectDevice();
            delegate.openDialog().then(cb);
        });
    };

    return Launcher;
});
