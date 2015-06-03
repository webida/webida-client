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

define([
    'lodash',
    'services/FS',
    'services/Auth',
    'q'
], function (_, FS, Auth, Q) {
    'use strict';
    var PUBLIC_KEY_PATH = '.userinfo/id_rsa.pub';
    var RSA_KEY_PATH = '.userinfo/id_rsa';
    var GITHUB_TOKEN_PATH = '.userinfo/github.json';

    var SettingsManager = function () {

    };

    $.extend(SettingsManager.prototype, {

        getPublicSSHKey: function () {
            var defer = Q.defer();

            FS.readFile(PUBLIC_KEY_PATH).then(function (key) {
                defer.resolve(key);

            }).fail(function (e) {
                defer.reject(e);
            });

            return defer.promise;
        },

        generatePublicSSHKey: function () {
            //var _this = this;
            var defer = Q.defer();

            Auth.getMyInfo().then(function (info) {

                var opts = {
                    cmd: 'ssh-keygen',
                    args: ['-t', 'rsa', '-C', info.email, '-f', RSA_KEY_PATH, '-N', '']
                };

                FS.exec('', opts).then(function () {
                    defer.resolve();

                });

            }).fail(function (e) {
                defer.reject(e);
            });

            return defer.promise;
        },

        removePublicSSHKey: function () {
            //var _this = this;
            var defer = Q.defer();

            FS.delete(PUBLIC_KEY_PATH, false)
            .then($.proxy(FS.delete, FS, RSA_KEY_PATH, false))
            .then(function () {
                defer.resolve();

            }).fail(function (e) {
                defer.reject(e);
            });

            return defer.promise;
        },

        getGitHubToken: function () {
            var defer = Q.defer();

            FS.readFile(GITHUB_TOKEN_PATH).then(function (token) {
                defer.resolve(token);

            }).fail(function (e) {
                console.log('readFile error: ' + e);
                defer.reject(e);
            });

            return defer.promise;
        },

        setGitHubToken: function (token) {
            var defer = Q.defer();
            var obj = {
                tokenKey: token
            };

            FS.writeFile(GITHUB_TOKEN_PATH, JSON.stringify(obj)).then(function () {
                defer.resolve();

            }).fail(function (e) {
                console.log('writeFile error: ' + e);
                defer.reject(e);
            });

            return defer.promise;
        },

        getPersonalTokens: function () {
            var defer = Q.defer();
            Auth.getPersonalTokens().then(function (personalTokens) {
                var tokens = _.sortBy(personalTokens, function (token) {
                    return new Date(token.issueTime).getTime();
                });
                defer.resolve(tokens);
            }).fail(function (e) {
                console.error('getPerosonalTokens error: ' + e);
                defer.reject(e);
            });
            return defer.promise;
        },

        addNewPersonalToken: function () {
            var defer = Q.defer();
            Auth.addNewPersonalToken().then(function (token) {
                defer.resolve(token);
            }).fail(function (e) {
                console.error('addNewPersonalToken error: ' + e);
                defer.reject(e);
            });
            return defer.promise;
        },

        deletePersonalToken: function (token) {
            var defer = Q.defer();
            Auth.deletePersonalToken(token).then(function () {
                defer.resolve();
            }).fail(function (e) {
                console.error('deletePersonalToken error: ' + e);
                defer.reject(e);
            });
            return defer.promise;
        }
    });

    if (SettingsManager.instance === undefined) {
        SettingsManager.instance = new SettingsManager();
    }

    return SettingsManager.instance;
});