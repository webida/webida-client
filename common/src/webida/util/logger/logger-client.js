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
 * Logger implement for amd
 * @author hw.shim
 */
'use strict';
define([
    './logger-interface',
    './config/client-config'
], function (
       LoggerInterface,
       clientConfig
) {

    var singlton;

    function Logger() {
        LoggerInterface.apply(this, arguments);
        this.setFormater(formater);
        this.setConfigs(clientConfig);
        this.startMS = (new Date()).getTime();
    }
    Logger.prototype = Object.create(LoggerInterface.prototype);
    Logger.prototype.constructor = Logger;

	Logger.prototype.getDuration = function () {
		return (new Date()).getTime() - this.startMS;
	};

    function formater(args, action, logger) {

        var pathDepth = 1; //depth of path (In default it only shows filename);
        if (typeof logger.getConfig('pathDepth') === 'number') {
            pathDepth = logger.getConfig('pathDepth');
        }

        function getNow() {
            var result = [],
                now = new Date();
            result.push(now.getHours());
            result.push(now.getMinutes());
            result.push(now.getSeconds());
            var resultToString;
            for (var i = 0; i < result.length; i++) {
                resultToString = result[i].toString();
                if (resultToString.length === 1) {
                    result[i] = '0' + resultToString;
                }
            }
            result.push(now.getMilliseconds().toString());
            if (result[3].length === 1) {
                result[3] = '00' + result[3];
            } else if (result[3].length === 2) {
                result[3] = '0' + result[3];
            }
            return result.join(':');
        }

        var prefix = '[' + getNow() + ']';
        //style
        if (args.length === 2 && typeof args[0] === 'string' && args[0].substr(0, 2) === '%c') {
            prefix = '%c' + prefix + ' ' + args[0].substr(2);
            ([]).shift.call(args);
        }

        var path = '';
        var callPath = (new Error()).stack.split('\n')[4].split('/');
        var lastIndex = callPath.length - 1;
        for (var j = callPath.length - pathDepth; j < lastIndex ; j++) {
            if (callPath[j]) {
                path += callPath[j] + '/';
            }
        }
        var fileToken = callPath[lastIndex].split(':');
        var basename = '<' + path + fileToken[0].split('?')[0] + ':' + fileToken[1] + '>';

        ([]).unshift.call(args, prefix);
        ([]).push.call(args, basename);

        return args;
    }

    Logger.getSingleton = function getSingleton() {
        if (!singlton) {
            singlton = new Logger();
        }
        return singlton;
    };

	Logger.LEVELS = LoggerInterface.LEVELS;

    return Logger;
});