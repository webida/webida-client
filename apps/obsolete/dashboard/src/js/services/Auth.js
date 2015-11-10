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
    'webida',
    'q'
], function (webida, Q) {
    'use strict';
    var Auth = function () {};

    $.extend(Auth.prototype, {
        getMyInfo: function () {
            var defer = Q.defer();

            webida.auth.getMyInfo(function (e, info) {
                if (e) {
                    //e = JSON.parse(e);
                    defer.reject(e);

                } else {
                    defer.resolve(info);
                }
            });

            return defer.promise;
        },

        getPersonalTokens: function () {
            var defer = Q.defer();
            webida.auth.getPersonalTokens(function (e, personalTokens) {
                if (e) {
                    defer.reject(e);
                } else {
                    defer.resolve(personalTokens);
                }
            });
            return defer.promise;
        },

        addNewPersonalToken: function () {
            var defer = Q.defer();
            webida.auth.addNewPersonalToken(function (e, token) {
                if (e) {
                    defer.reject(e);
                } else {
                    defer.resolve(token);
                }
            });
            return defer.promise;
        },

        deletePersonalToken: function (token) {
            var defer = Q.defer();
            webida.auth.deletePersonalToken(token, function (e) {
                if (e) {
                    defer.reject(e);
                } else {
                    defer.resolve();
                }
            });
            return defer.promise;
        }
    });

    if (Auth.instance === undefined) {
        Auth.instance = new Auth();
    }

    return Auth.instance;
});
