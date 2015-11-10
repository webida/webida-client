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
 * Logger implement for commonjs
 * @author hw.shim
 */

/* jshint unused:false */

'use strict';

var LoggerInterface = require('./logger');
var FileAppender = require('./appenders/file-appender');
var singlton;

function formater(args, action, logger) {
    var now = new Date();
    var prefix = '[' + now.toISOString() + '] [' + action.toUpperCase() + ']';
    var regExp = /\(([^)]+)\)/;
    var x = regExp.exec((new Error()).stack.split('\n')[4])[1].split(':');
    x.pop();
    var basename = x.join(':');

    ([]).unshift.call(args, prefix);
    ([]).push.call(args, basename);

    return args;
}

function Logger() {
	LoggerInterface.apply(this, arguments);
	this.setFormater(formater);
	this.setConfigs(require('./config/server-config'));
	this.addAppender(new FileAppender(this.getConfig('logDir')));
}

Logger.prototype = Object.create(LoggerInterface.prototype);
Logger.prototype.constructor = Logger;


function getNow() {
	var result = [], now = new Date();
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

Logger.getSingleton = function getSingleton() {
	if (!singlton) {
		singlton = new Logger();
	}
	return singlton;
};

Logger.LEVELS = LoggerInterface.LEVELS;

module.exports = Logger;
