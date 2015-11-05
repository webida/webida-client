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


define(['webida'], function (webida) {
    'use strict';
    
    var mod = {};
    var webidaHost = webida.conf.webidaHost;
    var monitorServer = webida.getHostParam('webida.monHostUrl', 'mon', webida.conf.webidaHost);

  
    mod.conf = {
        webidaHost: webidaHost,
        monApiBaseUrl: monitorServer + '/webida/api/mon',
        monitorServer: monitorServer
    };
    
    
    mod.ProfilingService = function () {};
    mod.ProfilingService.prototype.getSvcTypeList = function (cb) {
        function restApi() {
            webida.ajaxCall({
                url: mod.conf.monApiBaseUrl + '/pf/getSvcTypeList',
                type: 'GET',
                callback: cb
            });
        }
        webida.ensureAuthorize(restApi);
    };
    
    mod.ProfilingService.prototype.getInstNameList = function (cb) {

        function restApi() {
            webida.ajaxCall({
                url: mod.conf.monApiBaseUrl + '/pf/getInstNameList',
                type: 'GET',
                callback: cb
            });
        }
        webida.ensureAuthorize(restApi);
    };
    
    mod.ProfilingService.prototype.getInstList = function (cb) {

        function restApi() {
            webida.ajaxCall({
                url: mod.conf.monApiBaseUrl + '/pf/getInstList',
                type: 'GET',
                callback: cb
            });
        }
        webida.ensureAuthorize(restApi);
    };
    
    mod.ProfilingService.prototype.getInstListByInstName = function (instName, cb) {

        function restApi() {
            
            var data = {
                instname: instName  
            };
            webida.ajaxCall({
                url: mod.conf.monApiBaseUrl + '/pf/getInstListByInstName',
                type: 'GET',
                data: data,
                callback: cb
            });
        }
        webida.ensureAuthorize(restApi);
    };


    mod.ProfilingService.prototype.getUrlList = function (cb) {

        function restApi() {
            webida.ajaxCall({
                url: mod.conf.monApiBaseUrl + '/pf/getUrlList',
                type: 'GET',
                callback: cb
            });
        }
        webida.ensureAuthorize(restApi);
    };
    
    mod.ProfilingService.prototype.getCurrentReqs = function (isPeriod, startTime, endTime, options, params, cb) {
        function restApi() {
            var data = {
                period: isPeriod,
                startTime: startTime,
                endTime: endTime,
                options: JSON.stringify(options),
                params: params
            };

            webida.ajaxCall({
                url: mod.conf.monApiBaseUrl + '/pf/getCurrentReqs',
                data: data,
                type: 'GET',
                callback: cb
            });
        }
        webida.ensureAuthorize(restApi);
    };
    
    mod.ProfilingService.prototype.getCurrentReqsStat = 
        function (isPeriod, startTime, endTime, options, params, isMergeResult, cb) {
        
        function restApi() {
            var data = {
                period: isPeriod,
                startTime: startTime,
                endTime: endTime,
                options: JSON.stringify(options),
                params: params,
                isMergeResult: isMergeResult
            };
            
            webida.ajaxCall({
                url: mod.conf.monApiBaseUrl + '/pf/getCurrentReqsStat',
                data: data,
                type: 'GET',
                callback: cb
            });
        }
        webida.ensureAuthorize(restApi);
    };
    
    
    mod.ProfilingService.prototype.getStatisticsHistory = 
        function (unitTime, startTime, endTime, options, isMergeResult, cb) {
        
        function restApi() {
            var data = {
                unitTime: unitTime,
                startTime: startTime,
                endTime: endTime,
                options: JSON.stringify(options),
                isMergeResult: isMergeResult
            };

            webida.ajaxCall({
                url: mod.conf.monApiBaseUrl + '/pf/getStatisticsHistory',
                data: data,
                type: 'GET',
                callback: cb
            });
        }
        webida.ensureAuthorize(restApi);
    };

    mod.pf = new mod.ProfilingService();


    return mod;
});


