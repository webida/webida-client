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
], function ( webida, Q) {
    'use strict';
    var App = function () {};
    
    $.extend(App.prototype, {
        getMyAppInfo: function () {
            var defer = Q.defer();
            
            webida.app.getMyAppInfo(function (e, info) {
                if (e) {
                    //e = JSON.parse(e);
                    defer.reject(e);
                    
                } else {
                    defer.resolve(info);
                }
            });
            
            return defer.promise;
        },
        getHost: function () {
            return webida.app.getHost();
        },
        launchApp: function (domain, mode, queryString, newWindowOption) {
            webida.app.launchApp(domain, mode, queryString, newWindowOption);
        },
        deleteApp: function (appID) {
            var defer = Q.defer();
            webida.app.deleteApp(appID, function (e) {
                if (e) {
                    //e = JSON.parse(e);
                    defer.reject(e);
                } else {
                    defer.resolve();
                }
            });
            return defer.promise;
        },
        getDeployedAppUrl: function(domain){
            return webida.app.getDeployedAppUrl(domain);
        }
    });
    
    if (App.instance === undefined) {
        App.instance = new App();
    }
    
    return App.instance;
});
