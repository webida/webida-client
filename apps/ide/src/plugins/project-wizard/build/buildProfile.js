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
 * @BuildProfile
 *
 * @version: 1.0.0
 * @since: 2014.04.25
 *
 * Src:
 *   plugins/project-wizard/build/buildProfile.js
 */

/*
    "name": "default-android",
    "platform": "android",
    "label": "app_label",
    "icon": "app_icon",
    "type": "debug",
    "android": {
        "packageName": "app_package_name",
        "minSdkVersion": "min_sdk_version",
        "targetSdkVersion": "target_sdk_version",
        "versionCode": "version_code",
        "versionName": "version_name"
    },
    "ios": {
        "bundleId": "bundle_id",
        "version": "version"
    },
    "plugins": [
        "org.apache.cordova.vibration",
        "org.apache.cordova.camera",
        "org.apache.cordova.media-capture",
        "org.apache.cordova.media"
    ]
 */
define([],
function () {
    'use strict';

    var android = {
        'packageName': '',
        'minSdkVersion': '10',    // Android 2.3.3/4 (from Cordova)
        'targetSdkVersion': '19', // Android 4.4 (from Cordova)
        'versionCode': '1',
        'versionName': '1.0.0'
    };
    var ios = {
        'bundleId': '',
        'version': ''
    };
    // Deprecated
    var DEFAULT_SIGNING = {
        'name': '',
        'alias': '',
        'file': '',
        'password': '',
        'android': {
            'keystorePassword': ''
        },
        'ios': {
            'provisioningProfile': ''
        }
    };

    var DEFAULT_PROFILE_ANDROID = 'default-android';
    var DEFAULT_PACKAGE = 'org.webida';

    var BuildProfile = function (name, platform, label, icon, type) {
        this.name = name;
        this.platform = platform || BuildProfile.PLATFORM.ANDROID;
        this.label = label || '';
        this.icon = icon || '';
        this.type = type || BuildProfile.TYPE.DEBUG;
        if (platform === BuildProfile.PLATFORM.ANDROID) {
            this.android = {};
        } else if (platform === BuildProfile.PLATFORM.IOS) {
            this.ios = {};
        }
        //this.signing = [];
        this.plugins = [];
    };

    BuildProfile.prototype.addPlugin = function (plugin) {
        this.plugins.push(plugin);
    };

    BuildProfile.prototype.removePlugin = function (plugin) {
        this.plugins.splice(this.plugins.indexOf(plugin), 1);
    };

    BuildProfile.prototype.pluginExists = function (plugin) {
        return $.inArray(plugin, this.plugins) > -1;
    };

    BuildProfile.prototype.removePlugins = function () {
        this.plugins = [];
    };

    BuildProfile.prototype.setAndroid = function (opts) {
        if (opts) {
            this.android = $.extend(android, opts);
        }
    };

    BuildProfile.prototype.setIOS = function (opts) {
        if (opts) {
            this.ios = $.extend(ios, opts);
        }
    };

    BuildProfile.prototype.addSigning = function (signing) {
        this[BuildProfile.SIGNING_PROPERTY].push(signing);
    };

    BuildProfile.prototype.getSigning = function (key) {
        var result = $.grep(this[BuildProfile.SIGNING_PROPERTY], function (e) {
            return e.name === key;
        });
        return result[0];
    };

    BuildProfile.newProfile = function (profile) {
        return $.extend(BuildProfile.getDefaultProfile(profile.name), profile);
    };

    BuildProfile.getDefaultProfile = function (name) {
        var profile = new BuildProfile(DEFAULT_PROFILE_ANDROID,
                                       BuildProfile.PLATFORM.ANDROID,
                                       name, '', BuildProfile.TYPE.DEBUG);
        profile.setAndroid({
            packageName: BuildProfile.getDefaultPackageName(name),
            minSdkVersion: android.minSdkVersion,
            targetSdkVersion: android.targetSdkVersion,
            versionCode: this.getDefaultVersionCode(),
            versionName: this.getDefaultVersionName()
        });
        return profile;
    };

    BuildProfile.getDefaultPackageName = function (name) {
        return DEFAULT_PACKAGE + '.' + name;
    };

    BuildProfile.getDefaultVersionCode = function () {
        return android.versionCode;
    };

    BuildProfile.getDefaultVersionName = function () {
        return android.versionName;
    };

    // Deprecated
    BuildProfile.getDefaultSigning = function (key) {
        var o = $.extend(DEFAULT_SIGNING, {});
        o.name = key;
        return o;
    };

    BuildProfile.getBuildProfileNames = function (build) {
        var names = $.map(build, function (n) {
            return n.name;
        });
        return names;
    };

    BuildProfile.getBuildProfile = function (build, profileName) {
        var result = $.grep(build, function (e) {
            return e.name === profileName;
        });
        var profile = result[0];
        return profile;
    };

    BuildProfile.getKeyNames = function (profile) {
        var names = $.map(profile[BuildProfile.SIGNING_PROPERTY], function (n) {
            return n.name;
        });
        return names;
    };

    // staticProperty
    BuildProfile.SIGNING_PROPERTY = 'signing';
    BuildProfile.SIGNING = {
        ALIAS: 'alias',
        KEYSTORE_FILE: 'filename',
        KEY_PASSWORD: 'keypwd',
        KEYSTORE_PASSWORD: 'keystorepwd'
    };

    BuildProfile.PACKAGE = {
        'android': 'apk',
        'ios': 'ipa'
    };
    BuildProfile.PLATFORM = {
        'ANDROID': 'android',
        'IOS': 'ios'
    };
    BuildProfile.SUPPORTED_PLATFORMS = [
        BuildProfile.PLATFORM.ANDROID
    ];
    BuildProfile.TYPE = {
        'DEBUG': 'debug',
        'RELEASE': 'release'
    };
    BuildProfile.PLUGIN = {
        'Battery':       { id: 'org.apache.cordova.battery-status', name: 'Battery Status' },
        'Camera':        { id: 'org.apache.cordova.camera', name: 'Camera' },
        'Contacts':      { id: 'org.apache.cordova.contacts', name: 'Contacts' },
        'Device':        { id: 'org.apache.cordova.device', name: 'Device' },
        'Accelerometer': { id: 'org.apache.cordova.device-motion', name: 'Device Motion (Accelerometer)' },
        'Compass':       { id: 'org.apache.cordova.device-orientation', name: 'Device Orientation (Compass)' },
        'Dialogs':       { id: 'org.apache.cordova.dialogs', name: 'Dialogs' },
        'FileSystem':    { id: 'org.apache.cordova.file', name: 'FileSystem' },
        'FileTransfer':  { id: 'org.apache.cordova.file-transfer', name: 'File Transfer' },
        'Geolocation':   { id: 'org.apache.cordova.geolocation', name: 'Geolocation' },
        'Globalization': { id: 'org.apache.cordova.globalization', name: 'Globalization' },
        'InAppBrowser':  { id: 'org.apache.cordova.inappbrowser', name: 'InAppBrowser' },
        'Media':         { id: 'org.apache.cordova.media', name: 'Media' },
        'MediaCapture':  { id: 'org.apache.cordova.media-capture', name: 'Media Capture' },
        'Network':       { id: 'org.apache.cordova.network-information', name: 'Network Information (Connection)' },
        'Splashscreen':  { id: 'org.apache.cordova.splashscreen', name: 'Splashscreen' },
        'Vibration':     { id: 'org.apache.cordova.vibration', name: 'Vibration' }
    };

    BuildProfile.STATE_SUCCESS = 'succ';
    BuildProfile.STATE_PROGRESS = 'progress';
    BuildProfile.STATE_ERROR = 'fail';
    BuildProfile.STATE_ERROR_MESSAGE = 'msg';
    BuildProfile.STATE = {
        '0': { state: 'eInit', text: 'Generating initial folders...' },
        '1': { state: 'eDownloadSource', text: 'Downloading application sources...' },
        '2': { state: 'ePlatformAdd', text: 'Adding platform...' },
        '3': { state: 'ePluginAdd', text: 'Updating plugins...' },
        '4': { state: 'eBuild', text: 'Building...' },
        '5': { state: 'eSigning', text: 'Signing...' },
        '6': { state: 'eUploadPackage', text: 'Uploading package...' },
        '7': { state: 'eCompleted', text: 'Completed' },
    };

    BuildProfile.getTaskId = function (result) {
        if (!result.status) {
            return null;
        }

        var resultTaskId;
        if (result.status.ret === BuildProfile.STATE_PROGRESS) {
            resultTaskId = result.status.info.taskId;
        } else if (result.status.ret === BuildProfile.STATE_SUCCESS) {
            resultTaskId = result.status.taskId;
        } else if (result.status.ret === BuildProfile.STATE_ERROR) {
            resultTaskId = result.status.taskInfo.taskId;
        }
        return resultTaskId;
    };

    return BuildProfile;
});
