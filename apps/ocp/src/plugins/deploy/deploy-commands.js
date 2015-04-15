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
        'webida-lib/util/path',
        'webida-lib/plugins/workspace/plugin',
        'webida-lib/webida-0.3',
        'other-lib/toastr/toastr'
       ],

function (ide, pathUtil, wv, webida, toastr) {
    'use strict';

    var module = {};

    module.deploy = function () {
        var selectedPath = wv.getSelectedPath();
        var arg = 'apps/deploy/index.html?project=' + ide.getFsid() + pathUtil.detachSlash(selectedPath);

        // default size, pixels unit
        var width = 810;
        var height = 650;

        // center position
        var x = screen.width / 2 - width / 2;
        var y = screen.height / 2 - height / 2;

        // setting options
        var specs =
            'left=' + x + ',' +
            'top=' + y + ',' +
            'width=' + width + ',' +
            'height=' + height + ',' +
            'toolbar=0,' +
            'location=0,' +
            'directories=0,' +
            'status=0,' +
            'menubar=0,' +
            'scrollbars=0,' +
            'copyhistory=0,' +
            'resizable=0';

        // launch app
        var win = webida.app.launchApp('', true, arg, {
            name: 'deploy',
            specs: specs
        });
        if (!win) {
            var e = new Error('Window can\'t be opened.<br />' +
                              'It might be interrupted by pop-up blocking, please check it.');
            toastr.error(e.message);
            throw e;
        }

        win.focus();
    };

    return module;

});
