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
 * @file Messages for UI
 * @since 1.0.0
 * @author hyunik.na@samsung.com
 */
define([], function () {
    'use strict';

    // constructor
    var Messages = function () {
    };

    Messages.NO_PROFILE = 'Please select a configuration';
    Messages.DUPLICATE_PROFILE = 'A configuration with that name already exists';
    Messages.INVALID_PROFILE = 'Invalid or non-existing configuration \'{0}\'';

    Messages.DUPLICATE_KEY = 'A key with that name already exists';
    Messages.ADD_KEY = 'Add a key...';

    Messages.NO_SIGNING = 'Please select a signing';
    Messages.INVALID_SIGNING = 'Invalid or non-existing signing \'{0}\'';
    Messages.SELECT_ALIAS = 'Select an alias';
    Messages.SELECT_RELEASE_CONFIGURATION = 'Please select \'release\' mode';
    Messages.DUPLICATE_ALIAS = 'An alias with that name already exists';
    Messages.DUPLICATE_FILE = 'A file with that name already exists';

    Messages.NO_INPUT = 'Please enter a value';

    Messages.NO_PROJECT = 'No selected project';

    Messages.NO_BUILD_INFO = 'No build info';

    Messages.DELETE = 'Are you sure you want to delete \'{0}\'?';
    Messages.SUCCESS = 'Finished successfully';

    Messages.SELECT_RESOLUTIONS = 'Please select one or more resolutions';

    Messages.PW_OPTIONS_CORDOVA = 'Please check this option if you want to build a mobile application';

    Messages.GEN_SIGNED_WIZARD = 'Generate Signed Package Wizard';
    Messages.GEN_SIGNED_WIZARD_NEW_KEY_STORE = 'New Key Store';

    Messages.DOWNLOAD_FAIL = 'Failed to download \'{0}\'';

    Messages.GUIDE_EMULATE = 'You can emulate Cordova API via browser.';
    Messages.GUIDE_CORDOVA = 'You can use device features like camera or capture.<br />' +
        'Just create the project with the option "Enable Cordova support", build and install to your device.';

    Messages.INSTALL_TO_PHONE = 'Install to phone';

    // FIXME It is not good way to provide format method.
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/\{(\d+)\}/g, function ($0, $1) {
            // "ab {0}".format('fff') -> $0 = {0}, $1 = 0 cf.)) capturing group
            return args[$1] !== void 0 ? args[$1] : $0;
        });
    };

    return Messages;
});
