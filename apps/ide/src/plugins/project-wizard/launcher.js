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
 * @Launcher
 *
 * @version: 1.0.0
 * @since: 2014.04.18
 *
 * Src:
 *   plugins/project-wizard/launcher.js
 */

define(['webida-lib/webida-0.3',
        'webida-lib/util/path',
        './constants',
        './lib/util'
       ],
function (webida, pathUtil, Constants, Util) {
    'use strict';

    // TODO: temporary my account
    var gcmAPIKey = 'AIzaSyB_8WqaGg_SESmPzB37kr32vXetEDQHQ-Y';

    // constructor
    var Launcher = function () {
    };

    Launcher.ACTION = {
        'RUN': 'run',
        'DEBUG': 'debug',
        'DOWNLOAD': 'download'
    };
    Launcher.RUN_OPTION = {
        'CORDOVA': 'cordova', /* true | false */
        'WEINRE': 'weinre', /* WEINRE target script url */
        'DEVICE': 'device' /* device regid */
    };

    // https://sim.webida.mine/emulate/100001/test/mobilesample/pf1/?access_token=
    // 1a2b3c4d5e6f7g&enableripple=cordova-3.0.0-iPhone5
    Launcher.prototype.runToRipple = function (projectPath, profileName) {
        console.log('runToRipple', profileName);
        webida.auth.getMyInfo(function (err, data) {
            if (err) {
                console.error(err);
            } else {
                console.log(data);
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
                console.error(err);
            }
        );
    };

    Launcher.prototype.runToDevice = function (projectPath, options, cb) {
        var self = this;
        var _run = function (regid) {
            var workspace = Util.getWorkspaceName(projectPath);
            var project = pathUtil.getName(projectPath);
            var message = {
                'action': Launcher.ACTION.RUN,
                'workspace': workspace,
                'project': project
            };
            if (options) {
                $.extend(message, options);
            }
            console.log('runToDevice');
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
            console.log('downloadToDevice');
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
            console.error('No regid');
            return;
        }

        var gcmUrl = Constants.GCM_URL;
        // TODO: domain
        var url = Constants.getProxyUrl(gcmUrl);
        console.log('sendGCM');
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
