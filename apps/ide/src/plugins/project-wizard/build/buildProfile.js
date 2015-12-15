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
 * @file Manager for build profiles (iOS is not supported)
 * @since 1.0.0 (2014.04.25)
 * @author cimfalab@gmail.com
 *
 * @module ProjectWizard/BuildProfile
 */

define([], function () {
    'use strict';

    /**
     * @typedef {Object} androidOptions
     * @property {string} packageName
     * @property {string} minSdkVersion
     * @property {string} targetSdkVersion
     * @property {string} versionCode
     * @property {string} versionName
     * @memberof module:ProjectWizard/BuildProfile
     */

    /**
     * @typedef {Object} iosOptions
     */

    /**
     * @typedef {Object} buildProfileSigning
     * @property {string} alias
     * @property {string} filename
     * @property {string} keypwd
     * @property {string} keystorepwd
     * @property {string} name
     * @memberof module:ProjectWizard/BuildProfile
     */

    var android = {
        packageName: '',
        minSdkVersion: '10',    // Android 2.3.3/4 (from Cordova)
        targetSdkVersion: '19', // Android 4.4 (from Cordova)
        versionCode: '1',
        versionName: '1.0.0'
    };
    var ios = {
        bundleId: '',
        version: ''
    };
    // Deprecated
    var DEFAULT_SIGNING = {
        name: '',
        alias: '',
        file: '',
        password: '',
        android: {
            keystorePassword: ''
        },
        ios: {
            provisioningProfile: ''
        }
    };

    var DEFAULT_PROFILE_ANDROID = 'default-android';
    var DEFAULT_PACKAGE = 'org.webida';

    /**
     * Build Profile
     * @param {string} name - profile name
     * @param {buildProfilePlatform} platform - platform
     * @param {string} label (this value is not used anywhere)
     * @param {string} icon (this value is not used anywhere)
     * @param {buildType} type - build type (RUN, DEBUG)
     * @constructor
     */
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

    /**
     * Add a Cordova plugin
     * @param {cordovaPlugin} plugin - plugin name to add
     */
    BuildProfile.prototype.addPlugin = function (plugin) {
        this.plugins.push(plugin);
    };

    /**
     * Remove a Cordova plugin
     * @param {cordovaPlugin} plugin
     */
    BuildProfile.prototype.removePlugin = function (plugin) {
        this.plugins.splice(this.plugins.indexOf(plugin), 1);
    };

    /**
     * Check if there is a Cordova plugin already added
     * @param {cordovaPlugin} plugin
     * @return {boolean}
     */
    BuildProfile.prototype.pluginExists = function (plugin) {
        return $.inArray(plugin, this.plugins) > -1;
    };

    /**
     * Remove all cordova plugin
     */
    BuildProfile.prototype.removePlugins = function () {
        this.plugins = [];
    };

    /**
     * Set Android options
     * @param {androidOptions} opts
     */
    BuildProfile.prototype.setAndroid = function (opts) {
        if (opts) {
            this.android = $.extend(android, opts);
        }
    };

    /**
     * Set iOS options
     * @param {iosOptions} opts
     */
    BuildProfile.prototype.setIOS = function (opts) {
        if (opts) {
            this.ios = $.extend(ios, opts);
        }
    };

    /**
     * Add singing
     * @param {buildProfileSigning} signing
     */
    BuildProfile.prototype.addSigning = function (signing) {
        this[BuildProfile.SIGNING_PROPERTY].push(signing);
    };

    /**
     * Get signing by its name
     * @param {string} key - name of the signing
     * @return {buildProfileSigning}
     */
    BuildProfile.prototype.getSigning = function (key) {
        var result = $.grep(this[BuildProfile.SIGNING_PROPERTY], function (e) {
            return e.name === key;
        });
        return result[0];
    };

    /**
     * Create new build profile
     * @param {module:ProjectWizard/BuildProfile} profile
     */
    BuildProfile.newProfile = function (profile) {
        return $.extend(BuildProfile.getDefaultProfile(profile.name), profile);
    };

    /**
     * Generate default build profile object
     * @param {string} name - seed for profile name
     * @return {BuildProfile}
     */
    BuildProfile.getDefaultProfile = function (name) {
        var profile = new BuildProfile(DEFAULT_PROFILE_ANDROID,
                                       BuildProfile.PLATFORM.ANDROID,
                                       name, '', BuildProfile.TYPE.DEBUG);
        profile.setAndroid(/* @type androidOptions */{
            packageName: BuildProfile.getDefaultPackageName(name),
            minSdkVersion: android.minSdkVersion,
            targetSdkVersion: android.targetSdkVersion,
            versionCode: this.getDefaultVersionCode(),
            versionName: this.getDefaultVersionName()
        });
        return profile;
    };

    /**
     * Generate default package name
     * @param {string} name - seed for name
     * @return {string}
     */
    BuildProfile.getDefaultPackageName = function (name) {
        return DEFAULT_PACKAGE + '.' + name;
    };

    /**
     * Get default Android version code
     * @return {string}
     */
    BuildProfile.getDefaultVersionCode = function () {
        return android.versionCode;
    };

    /**
     * Get default Android version name
     * @return {string}
     */
    BuildProfile.getDefaultVersionName = function () {
        return android.versionName;
    };

    /**
     * Get default signing
     * @deprecated
     * @param key
     */
    BuildProfile.getDefaultSigning = function (key) {
        var o = $.extend(DEFAULT_SIGNING, {});
        o.name = key;
        return o;
    };

    /**
     * Extract only names from build profile list
     *      FIXME it is not necessarily here. It is not for BuildProfile class.
     *      it is for management on build profile list.
     * @param {Array.<module:ProjectWizard/BuildProfile>} build
     * @return {Array.<string>}
     */
    BuildProfile.getBuildProfileNames = function (build) {
        var names = $.map(build, function (n) {
            return n.name;
        });
        return names;
    };

    /**
     * Get build profile object by its name from the received build list
     *      FIXME it is not necessarily here. It is not for BuildProfile class but
     *      it is for management on build profile list.
     * @param {Array.<module:ProjectWizard/BuildProfile>} build
     * @param {string} profileName
     * @return {*}
     */
    BuildProfile.getBuildProfile = function (build, profileName) {
        var result = $.grep(build, function (e) {
            return e.name === profileName;
        });
        var profile = result[0];
        return profile;
    };

    /**
     * Extract only the signing key names from received build profile object
     * @param profile
     * @return {*}
     */
    BuildProfile.getKeyNames = function (profile) {
        var names = $.map(profile[BuildProfile.SIGNING_PROPERTY], function (n) {
            return n.name;
        });
        return names;
    };

    /**
     * @constant {string}
     */
    BuildProfile.SIGNING_PROPERTY = 'signing';

    /**
     * @alias buildProfileSigningProps
     * @readonly
     * @enum {string}
     * @memberof module:ProjectWizard/BuildProfile
     */
    BuildProfile.SIGNING = {
        ALIAS: 'alias',
        KEYSTORE_FILE: 'filename',
        KEY_PASSWORD: 'keypwd',
        KEYSTORE_PASSWORD: 'keystorepwd'
    };

    /**
     * @enum {string}
     */
    BuildProfile.PACKAGE = {
        android: 'apk',
        ios: 'ipa'
    };

    /**
     * @alias buildProfilePlatform
     * @readonly
     * @enum {string}
     * @memberof module:ProjectWizard/BuildProfile
     */
    BuildProfile.PLATFORM = {
        ANDROID: 'android',
        IOS: 'ios'
    };

    /**
     * @constant {Array.<string>}
     */
    BuildProfile.SUPPORTED_PLATFORMS = [
        BuildProfile.PLATFORM.ANDROID
    ];

    /**
     * @alias buildType
     * @enum {string}
     * @readonly
     * @memberof module:ProjectWizard/BuildProfile
     */
    BuildProfile.TYPE = {
        'DEBUG': 'debug',
        'RELEASE': 'release'
    };

    /**
     * @alias cordovaPlugin
     * @enum {Object}
     * @readonly
     * @memberof module:ProjectWizard/BuildProfile
     */
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

    /**
     * @constant {string}
     */
    BuildProfile.STATE_SUCCESS = 'succ';
    /**
     * @constant {string}
     */
    BuildProfile.STATE_PROGRESS = 'progress';
    /**
     * @constant {string}
     */
    BuildProfile.STATE_ERROR = 'fail';
    /**
     * @constant {string}
     */
    BuildProfile.STATE_ERROR_MESSAGE = 'msg';

    /**
     * @alias buildStatusState
     * @enum {Object}
     * @readonly
     * @memberof module:ProjectWizard/BuildProfile
     */
    BuildProfile.STATE = {
        '0': { state: 'eInit', text: 'Generating initial folders...' },
        '1': { state: 'eDownloadSource', text: 'Downloading application sources...' },
        '2': { state: 'ePlatformAdd', text: 'Adding platform...' },
        '3': { state: 'ePluginAdd', text: 'Updating plugins...' },
        '4': { state: 'eBuild', text: 'Building...' },
        '5': { state: 'eSigning', text: 'Signing...' },
        '6': { state: 'eUploadPackage', text: 'Uploading package...' },
        '7': { state: 'eCompleted', text: 'Completed' }
    };

    /**
     * Get task id from the build result object
     *      FIXME It is better to move {@link module:ProjectWizard/BuildRunner}.
     * @param result
     * @return {*}
     */
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
