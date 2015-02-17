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
    'services/FS',
    'services/App',
    'q'
], function (FS, App, Q) {
    'use strict';
    var ApplicationManager = function () {
        
    };
    
    $.extend(ApplicationManager.prototype, {
        loadMyApps: function () {
            var defer = Q.defer();
            
//            var defer = Q.defer();
//            
//            Q.all([App.getMyAppInfo(), App.getHost()]).spread(function (appInfo, host) {
//                defer.resolve(appInfo, host);
//            }).fail(function () {
//                defer.reject(e);
//            });
//            
//            return defer.promise;
            
            App.getMyAppInfo().then(function (appInfo) {
                defer.resolve(appInfo);
            }).fail(function (e) {
                defer.reject(e);
            });
            
            return defer.promise;
        },
        getDeployHost: function () {
            return App.getHost();
        },
        launchApp: function (domain, mode, queryString, newWindowOption) {
            App.launchApp(domain, mode, queryString, newWindowOption);
        },
        deleteApp: function (appID) {
            var defer = Q.defer();
            
            App.deleteApp(appID).then(function () {
                defer.resolve();
            }).fail(function (e) {
                defer.reject(e);
            });
            
            return defer.promise;
            
        },
        getDeployedAppUrl: function(domain){
            return App.getDeployedAppUrl(domain);
        }
        
    });
    
    if (ApplicationManager.instance === undefined) {
        ApplicationManager.instance = new ApplicationManager();
    }
    
    return ApplicationManager.instance;
});