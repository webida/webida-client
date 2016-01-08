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
 * @file This file is added the log on view of the git
 * @since 1.0.0
 * @author hyunik.na@samsung.com, minsung.jin@samsung.com
 */
define([
    'dojo/topic',
    'external/lodash/lodash.min',
    'external/moment/min/moment.min',
    'external/URIjs/src/URI',
    'webida-lib/widgets/views/viewmanager'
], function (
   topic,
   _,
   moment,
   URI,
   viewmanager
) {
    'use strict';

    var _logdb = [];

    function _getCurrentTime() {
        return moment(new Date()).format('YYYY/MM/DD hh:mm:ss A');
    }

    function _escape(str) {
        return _.escape(str).replace(/ /g, '&nbsp;');
    }
    /* jshint ignore:start */
    function _hidePassword(url) {
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
                    '" data-gitroot="' + gitroot + '">' + _escape(line) + '</div>';
            } else if (line.match(/Patch failed at \d* init\w*/)) {
                return '<div class="gv-contentbody-message">' + _escape(line) + '</div>';
            } else {
                var result = URI.withinString(line, function (url) {
                    var uri = new URI(url);
                    uri.normalize().userinfo('');
                    return '<a href="' + uri.toString() + '" target="_blank">' + _escape(uri.readable()) + '</a>';
                });
                return result;
            }
        }).join('<br>');

        return parseLog;
    }

    function _openEditor(path) {
        topic.publish('editor/open', path);
    }
    /**
     * @constructor
     * @param {string} gitroot - path for directory of root
     * @param {string} command
     * @param {string} message
     * @param {string} type
     */
    var GitView = function (gitroot, command, message, type) {
        this.gitroot = gitroot;
        this.title = _getCurrentTime() + ' - ' + gitroot + ' - git ' + command;
        this.log = message;
        this.id = _.uniqueId();
        this.type = type;
    };
    /**
     * Append log on view in the git.
     * @method appendLog
     */
    GitView.prototype.appendLog = function () {
        var title = '<div class="gv-title gv-' + this.type + '">' + this.title + '</div>';
        var msg = '<div class="gv-contentbody">' + _messageParse(this.gitroot, this.log, this.id) + '</div>';
        var content = '<div class="gv-content">' + title + msg + '</div>';

        var contents = $('.gv-contents');
        contents.append(content);

        var selector = '.gv-contentbody-issue.gv-issue' + this.id;

        // register event in the newly added log
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

