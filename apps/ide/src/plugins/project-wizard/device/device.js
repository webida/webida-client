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
        'webida-lib/plugins/workspace/plugin',
        'webida-lib/util/path',
        '../launcher',
        '../run-commands',
       ],
function (webida, wv, pathUtil, Launcher, runCommand) {
    'use strict';

    var DEVICES = [
        /* // TODO: Enable when sim server is separated
        {
            id: 'ripple',
            title: 'Ripple',
            url: '',
            description: 'Launch online simulator'
        },
        */
        {
            id: 'yod',
            title: 'Your own device',
            url: '',
            description: 'LYOD(Launch your own device)'
        }
    ];

    // constructor
    var Device = function () {
    };

    Device.prototype.init = function () {
        // Build device list.
        $.each(DEVICES, function () {
            $('<li>')
                .append($('<div>').addClass('device-drop')
                    .append($('<img>')
                            .attr('src', 'plugins/project-wizard/images/' + this.id + '.png'))) // attr('height')
                .append($('<div>').addClass('device-desc')
                    .html('<span class="device-desc-title">' + this.title + '</span><br>' + this.description))
                .data('deviceId', this.id)
                .appendTo('.device-list');
        });

        var _self = this;
        $('.device-list li')
            .on('dragover', function (evt) {
                $(this).addClass('drag-hover');
                if (evt.dataTransfer) {
                    evt.dataTransfer.dropEffect = 'link';
                }
                evt.preventDefault();
            })
            .on('dragleave', function () {
                $(this).removeClass('drag-hover');
            })
            .on('drop', function (evt) {
                $(this).removeClass('drag-hover');
                var deviceId = getDeviceById($(this).closest('li').data('deviceId'));
                evt.preventDefault();
                _self.drop(deviceId);
            });
    };

    function getDeviceById(id) {
        var result = $.grep(DEVICES, function (e) {
            return e.id === id;
        });
        return result[0];
    }

    /*
    Device.prototype.allowDrop = function (ev) { };

    Device.prototype.drag = function (ev) {
        //ev.dataTransfer.setData('app', $('#' + ev.target.id).text());
    };
     */

    Device.prototype.drop = function (device) {
        console.log('drop', device);
        if (!device) {
            return;
        }
        //var data = ev.dataTransfer.getData('app');
        /*
        // gkAn6LI4c/test/t1/www/index.html:
        var resPath = ev.dataTransfer.getData('text/webida-resource-path');
        // /test/t1/www/index.html
        var absPath = resPath.substring(resPath.indexOf('/'));
        var parentPath = absPath.substring(0, absPath.lastIndexOf('/'));
        // need to remove the last ':'
        var filePath = absPath.substring(absPath.lastIndexOf('/') + 1);
        */
        var projectPath = pathUtil.getProjectRootPath(wv.getSelectedPath());
        switch (device.id) {
        case 'ripple' :
            //launcher.runToRippleWithAlias(node);
            runCommand.executeRipple();
            break;
        case 'yod' :
            var launcher = new Launcher();
            launcher.runToDevice(projectPath);
            break;
        }
    };

    return Device;
});
