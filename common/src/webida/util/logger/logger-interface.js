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
 * LoggerInterface for client and server
 * @author hw.shim
 */
'use strict';
(function (global) {

    var LEVELS = {
        off: 0,
        log: 1,
        info: 2,
        warn: 4,
        error: 8,
        trace: 16,
        all: 31,
    };

    function LoggerInterface() {
        this.config = {};
        this.level = LEVELS.all;
        this.appenders = [];
        this.addAppender(console); //default logger for both sides
    }
    for (var k in LEVELS) {
        LoggerInterface.prototype[k.toUpperCase()] = LEVELS[k];
    }
    LoggerInterface.prototype.addAppender = function (appender) {
        if (typeof appender.trace !== 'function') {
            appender.trace = function () {};
        }
        this.appenders.push(appender);
    };
    LoggerInterface.prototype.removeAppender = function (appender) {
        var index = this.appenders.indexOf(appender);
        if (index >= 0) {
            return this.appenders.splice(index, 1);
        }
    };
    LoggerInterface.prototype.setConfigs = function (value) {
        for (var key in value) {
            this.setConfig(key, value[key]);
        }
    };
    LoggerInterface.prototype.setConfig = function (key, value) {
        this.config[key] = value;
    };
    LoggerInterface.prototype.getConfig = function (key) {
        return this.config[key];
    };
    LoggerInterface.prototype.setLevel = function (newLevel) {
        this.level = newLevel;
    };
    LoggerInterface.prototype.isLevel = function (flag) {
        if (typeof this.getConfig('level') !== 'undefined') {
            return (this.getConfig('level') & flag) !== 0;
        } else {
            return (this.level & flag) !== 0;
        }
    };
    LoggerInterface.prototype.setFormater = function (formater) {
        this.formater = formater;
    };
    LoggerInterface.prototype.log = function () {
        this.invoke('log', arguments);
    };
    LoggerInterface.prototype.info = function () {
        this.invoke('info', arguments);
    };
    LoggerInterface.prototype.warn = function () {
        this.invoke('warn', arguments);
    };
    LoggerInterface.prototype.error = function () {
        this.invoke('error', arguments);
    };
    LoggerInterface.prototype.trace = function () {
        this.invoke('trace', arguments);
    };
    LoggerInterface.prototype.invoke = function (action, args) {
        var appender;
        if (!this.isLevel(LEVELS[action])) {
            return;
        }
        if (typeof this.formater === 'function') {
            args = this.formater(args, action);
        }
        for (var k in this.appenders) {
            appender = this.appenders[k];
            appender[action].apply(appender, args);
        }
    };

    //amd
    if (global && typeof global.define === 'function') {
        define(function (require, exports, module) {
            module.exports = LoggerInterface;
        });
        //commonjs
    } else {
        module.exports = LoggerInterface;
    }
}(this));