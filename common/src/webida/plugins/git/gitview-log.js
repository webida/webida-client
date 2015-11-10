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
    'external/lodash/lodash.min',
    'external/moment/min/moment.min',
    'external/URIjs/src/URI',
    'dojo/topic',
    'webida-lib/widgets/views/viewmanager'
], function (_, moment, URI, topic, viewmanager) {
    'use strict';

    function _getCurrentTime() {
        return moment(new Date()).format('YYYY/MM/DD hh:mm:ss A');
    }

    var _logdb = [];

    var GitView = function (gitroot, command, message, type) {
        this.gitroot = gitroot;
        this.title = _getCurrentTime() + ' - ' + gitroot + ' - git ' + command;
        this.log = message;
        this.id = _.uniqueId();
        this.type = type;
    };

    function escape(str) {
        return _.escape(str).replace(/ /g, '&nbsp;');
    }
    /* jshint ignore:start */
    function hidePassword(url) {
        var uri = new URI(url);
        if (uri.password()) {
            return uri.password('****').toString();
        } else {
            return url;
        }
    }
    /* jshint ignore:end */

    function _messageParse(gitroot, msg, id) {
        var parseLog = msg.split(/\r*\n/).map(function (line) {
            if (line.match(/(modified:|new file:|added:|CONFLICT)\w*/)) {
                return '<div class="gv-contentbody-issue gv-issue' + id +
                    '" data-gitroot="' + gitroot + '">' + escape(line) + '</div>';
            } else if (line.match(/Patch failed at \d* init\w*/)) {
                return '<div class="gv-contentbody-message">' + escape(line) + '</div>';
            } else {
                var result = URI.withinString(line, function (url) {
                    var uri = new URI(url);
                    uri.normalize().userinfo('');
                    return '<a href="' + uri.toString() + '" target="_blank">' + escape(uri.readable()) + '</a>';
                });
                return result;
            }
        }).join('<br>');

        return parseLog;
    }

    function _openEditor(path) {
        topic.publish('editor/open', path);
    }

    GitView.prototype.appendLog = function () {
        var title = '<div class="gv-title gv-' + this.type + '">' + this.title + '</div>';
        var msg = '<div class="gv-contentbody">' + _messageParse(this.gitroot, this.log, this.id) + '</div>';
        var content = '<div class="gv-content">' + title + msg + '</div>';

        var contents = $('.gv-contents');
        contents.append(content);

        var selector = '.gv-contentbody-issue.gv-issue' + this.id;

        // 새로 추가된 log에 이벤트 등록
        $(selector).click(function () {
            var self = $(this);
            var GIT_DIR = self.attr('data-gitroot');
            var text = self.text().replace(/\xa0/g, ' ');
            var path;

            var m = text.match(/(modified|new file|added): (.*)/);
            if (m) {
                path = GIT_DIR + m[2].trim();
                _openEditor(path);
            }

            m = text.match(/Merge conflict in (.*)/);
            if (m) {
                path = GIT_DIR + m[1].trim();
                _openEditor(path);
            }
        });

        // move to the bottom of scroll
        viewmanager.getView('gitviewTab').select();
        contents.scrollTop(contents[0].scrollHeight);
    };

    var gitView = {
        success: function (gitroot, command, message) {
            var logObj = new GitView(gitroot, command, message, 'success');

            _logdb.push(logObj);
            logObj.appendLog();
        },

        error: function (gitroot, command, message) {
            var logObj = new GitView(gitroot, command, message, 'error');

            _logdb.push(logObj);
            logObj.appendLog();
        },

        warning: function (gitroot, command, message) {
            var logObj = new GitView(gitroot, command, message, 'warning');
            console.log(logObj);
            _logdb.push(logObj);
            logObj.appendLog();
        },

        info: function (gitroot, command, message) {
            var logObj = new GitView(gitroot, command, message, 'info');

            _logdb.push(logObj);
            logObj.appendLog();
        },

        getAllLoginfo: function () {
            return _logdb;
        },

        deleteLoginfo: function (/*id*/) { },

        clear: function () {
            _logdb = [];
        }
    };

    return gitView;
});
