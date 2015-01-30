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
 * @example Using fileloc transformer. "<fileloc>" is fileloc transformer and
 *      transforms the next element to a link to the file.
 * require(['plugins/output/plugin'],
 *      function (c) {
 *          c.log("<fileloc>", "/ws1/settings.json:15");
 *          c.log("<fileloc>", "/ws1/settings.json:15:comment);
 *      });
 */

/* global timedLogger: true */

var time;
define([(time = timedLogger.getLoggerTime(), 'webida-lib/plugins/workbench/plugin'),
    'other-lib/underscore/lodash.min',
    'dojo/topic',
    'dijit/form/CheckBox',
    'dijit/form/Button',
    'text!./output-view.html',
    'text!./templates/_tmplToolbar.html',
    'webida-lib/widgets/views/view'
],
function (workbench, _, topic, CheckBox, Button, consoleViewHtml, toolbarTmpl, View) {
    'use strict';

    time = timedLogger.log('loaded modules required by output. initializing output plugin\'s module', time);

    var consoleMgr;
    var mod = {};
    var defaultConsoleId = 'Output';
    var tabs;

    function transformerFileLoc(filelocInfo) {
        if (filelocInfo) {
            if (filelocInfo.hasOwnProperty('path')) {
                var path = filelocInfo.path;
                var pos = {row: 0, col: 0};
                var text = '';
                if (filelocInfo.hasOwnProperty('line')) {
                    pos.row = filelocInfo.line - 1;
                }
                if (filelocInfo.hasOwnProperty('text')) {
                    text = filelocInfo.text;
                }

                var elm = $('<span>').addClass('fileloc_link pre_whitespace').text(text);
                elm.on('click', function () {
                    topic.publish('#REQUEST.openFile', path, { pos: pos });
                    elm.addClass('fileloc_link_clicked');
                });

                return elm;
            }
            return null;
        }
    }

    function transformerUri(text) {
        var myRe = new RegExp(
            '(http|ftp|https)://[\\w-]+(\\.[\\w-]+)+([\\w-.,@?^=%&:/~+#-]*[\\w@?^=%&;/~+#-])?', 'ig');
        var myArray;

        var uriList = [];
        while ((myArray = myRe.exec(text)) !== null) {
            console.log(myArray);
            var msg = 'Found ' + myArray[0] + '.  ';
            msg += 'Next match starts at ' + myRe.lastIndex;
            var item = {text: myArray[0], index: myArray.index, lastIndex: myRe.lastIndex};
            uriList.push(item);
            console.log(msg);
        }

        _.each(uriList, function (uri) {
            uri.text = uri.text.replace(myRe, '<a href="$&" target="uri" class="console_link">$&</a>');
            console.log(uri);
        });

        var result = [];
        var edLoc;
        var stLoc = 0;
        _.each(uriList, function (uri, index) {
            edLoc = uri.index;
            if (edLoc !== stLoc) {
                result.push($('<span>').text(text.substr(stLoc, edLoc - stLoc)));
            }
            result.push(uri.text);
            stLoc = uri.lastIndex;
            if (index === uriList.length - 1) {
                result.push($('<span>').text(text.substr(stLoc, text.length - stLoc)));
            }
        });

        if (result.length > 0) {
            var elm = $('<span>');
            _.each(result, function (value) {
                elm.append(value);
            });

            return elm;
        } else {
            return text;
        }

    }

    mod.TRANSFORMERS_MAP = {
//        'htmlescape': transformerHtmlEscape,
        'fileloc': transformerFileLoc,
        'uri': transformerUri,
//        'error': transformerError
    };

    function getTransformer(type) {
        if (mod.TRANSFORMERS_MAP.hasOwnProperty(type)) {
            return mod.TRANSFORMERS_MAP[type];
        }
    }

    /**
     *  @class ConsoleManager
     */
    function ConsoleManager() {
        this.consoles = {};
        this.consoles[defaultConsoleId] = new Console(defaultConsoleId);
    }
    ConsoleManager.prototype.getConsole = function (consoleId) {
        if (this.consoles.hasOwnProperty(consoleId)) {
            return this.consoles[consoleId];
        } else {
            return this.addNewConsole(consoleId);
        }
    };
    ConsoleManager.prototype.addNewConsole = function (consoleId, opt) {
        if (this.consoles.hasOwnProperty(consoleId)) {
            return null;
        } else {
            var con = new Console(consoleId, opt);
            this.consoles[consoleId] = con;
            return this.consoles[consoleId];
        }
    };

    /**
     * @class Console
     */
    function Console(consoleId, opt) {
        var self = this;
        self.consoleId = consoleId;
        if (!opt) {
            opt = {};
        }
        self.scrollLocked = opt.scrollLocked || false;
        self.showLineNumber = opt.showLineNumber || false; // TODO
        self.lineNumber = 0; // TODO
        self.showOnNewMessage = opt.showOnNewMessage || true;
        self.showOnNewMessage = true;
        self.defaultTransformers = opt.defaultTransformers ||
//            [mod.TRANSFORMERS_MAP.htmlescape, mod.TRANSFORMERS_MAP.uri]; TODO : FIXME
                        [mod.TRANSFORMERS_MAP.uri];

        self.elemId = this.getContentElemId();
        self.contentElem = null;
        self.logQueue = [];
        self.interval = null;

        var topContent = $('<div style="position:relative; width:100%; height:100%"></div>');

        var contentHtml =
            '<div class="consoleViewContentContainer" style="position:absolute; top:28px; width:100%"><div id="' +
            this.getContentElemId() + '" style="margin:0px;display:block; padding: 5px;"></div></div>';

        topContent.append(toolbarTmpl);
        topContent.append(contentHtml);

        var view = new View(consoleId, consoleId);
        self.view = view;
        view.setContent(topContent[0]);

        self.$titleElem = $(this.getTitleElem());
        var chkNewMeaasge = new CheckBox({
            checked: self.showOnNewMessage,
            onChange: function (value) {
                self.setShowOnMeaasge(value);
            }
        }, self.$titleElem.find('.chk-showonmessage')[0]);

        var chkScrollLock = new CheckBox({
            checked: self.scrollLocked,
            onChange: function (value) {
                self.scrollLock(value);
            }
        }, self.$titleElem.find('.chk-scrolllock')[0]);

        void new Button({
            label: 'Clear',
            style: 'position:absolute; right:5px',
            onClick: function () {
                self.clearContents();
            }
        }, self.$titleElem.find('.btn-clear')[0]);

        chkNewMeaasge.set('checked', self.showOnNewMessage);
        chkScrollLock.set('checked', self.scrollLocked);

        if (consoleId !== defaultConsoleId) {
            workbench.appendView(view, 'bottom');
        }
    }

    Console.prototype.log = function () {
        var self = this;
        var args = Array.prototype.slice.call(arguments);

        self.logQueue.push({type : 'log', args : args});
        self.startTimer();
    };

    Console.prototype.logs = function () {
        var self = this;
        var args = Array.prototype.slice.call(arguments);

        self.logQueue.push({type : 'log', args : args});
        self.startTimer();
    };

    Console.prototype.startTimer = function (rotateCount, maxItemCount) {
        var self = this;
        if (self.interval === null) {
            var rCount = 1;
            var MAX_COUNT = 50;

            if (rotateCount) {
                rCount = rotateCount;
            }

            if (maxItemCount) {
                MAX_COUNT = maxItemCount;
            }

            var processQueue = function () {
                _.range(rCount).forEach(function () {
                    if (self.logQueue.length > 0) {
                        var args, i;
                        var $contentElem = $(self.getContentElem());
                        var $groupContent = $('<div>');
                        var $messageElem;
                        var type;

                        try {
                            _.range(self.logQueue.length).forEach(function (i) {
                                if (i >= MAX_COUNT) {
                                    throw 'break';
                                }
                                args = self.logQueue[i].args;
                                type = self.logQueue[i].type;
                                $messageElem = $('<div class="console_message_item pre_whitespace">');
                                _.each(args, function (arg) {
                                    var transformer = null;
                                    var data = null;
                                    if (typeof(arg) === 'object') {
                                        if (arg.hasOwnProperty('type')) {
                                            transformer = getTransformer(arg.type);
                                        }
                                    } else if (typeof(arg) === 'string') {
                                        transformer = getTransformer('uri');
                                    }

                                    if (transformer) {
                                        data = transformer(arg);
                                    } else {
                                        data = arg;
                                    }

                                    if (data) {
                                        $messageElem.append(data);
                                        $messageElem.append(' ');
                                        if (type === 'err') {
                                            $messageElem.addClass('console_error_message');
                                        }
                                    }
                                });

                                $messageElem.append('<br>');
                                $groupContent.append($messageElem);
                            });
                        } catch (e) {
                            if (e !== 'break') {
                                throw e;
                            }
                        }

                        if (i === MAX_COUNT) {
                            self.logQueue.splice(0, MAX_COUNT);
                        } else {
                            self.logQueue = [];
                            clearInterval(self.interval);
                            self.interval = null;
                        }

                        $contentElem.append($groupContent);

                        if (!self.scrollLocked) {
                            self.scrollBot();
                        }

                        if (self.showOnNewMessage && self.view) {
                            self.view.select();
                        }
                    }
                });
            };

            self.interval = setInterval(function () {
                processQueue();
                return false;
            }, 100);
        }
    };

    Console.prototype.err = function () {
        var self = this;
        var args = Array.prototype.slice.call(arguments);
        self.logQueue.push({type : 'err', args : args});
    };
    Console.prototype.getTitleElemId = function () {
        return 'consoleTitle_' + this.consoleId;
    };
    Console.prototype.getContentElemId = function () {
        return 'consoleContent_' + this.consoleId;
    };
    Console.prototype.getContentElem = function () {
        if (!this.contentElem) {
            var elemId = this.getContentElemId();
            if (this.view) {
                this.contentElem = $(this.view.contentPane.domNode).find('#' + elemId)[0];
            }
        }

        return this.contentElem;
    };
    Console.prototype.getTitleElem = function () {
        var content = this.view.getContent();
        if (content) {
            return content.children[0];
        }
        //return $('#' + elemId)[0];
    };
    Console.prototype.scrollBot = function () {
        var elem = $(this.getContentElem());
        var tab = elem.parent();
        tab.scrollTop(elem[0].scrollHeight);
    };
    Console.prototype.addTransformer = function (transformer) {
        this.transformers.push(transformer);
    };
    Console.prototype.show = function () {
        this.view.select();
    };
    Console.prototype.setShowOnMeaasge = function (value) {
        if (value === false) {
            this.showOnNewMessage = false;
        } else {
            this.showOnNewMessage = true;
        }
    };
    Console.prototype.scrollLock = function (value) {
        if (value === false) {
            this.scrollLocked = false;
        } else {
            this.scrollLocked = true;
        }
    };
    Console.prototype.clearContents = function () {
        $(this.getContentElem()).empty();
        this.logQueue = [];
    };

    mod.getConsole = function () {
        if (!consoleMgr) {
            consoleMgr = mod.consoleMgr = new ConsoleManager();
        }

        if (consoleMgr) {
            return consoleMgr.getConsole.apply(consoleMgr, arguments);
        } else {
            return null;
        }
    };
    mod.addNewConsole = function () {
        if (consoleMgr) {
            return consoleMgr.addNewConsole.bind(consoleMgr);
        } else {
            return null;
        }
    };
    mod.Console = Console;

    mod.openConsole = function () {
        workbench.horzSplitter.expand();
    };

    mod.getDefaultConsole = function () {
        return consoleMgr.getConsole(defaultConsoleId);
    };

    mod.addTransformer = function (name, tfm) {
        if (mod.TRANSFORMERS_MAP.hasOwnProperty(name)) {
            return false;
        } else {
            mod.TRANSFORMERS_MAP[name] = tfm;
            return true;
        }
    };

    mod.removeTransformer = function (name) {
        if (mod.TRANSFORMERS_MAP.hasOwnProperty(name)) {
            delete mod.TRANSFORMERS_MAP[name];
            return true;
        } else {
            return false;
        }
    };

    mod.log = function () {
        var defaultConsole = mod.getDefaultConsole();
        defaultConsole.log.apply(defaultConsole, arguments);
    };

    mod.err = function () {
        var defaultConsole = mod.getDefaultConsole();
        defaultConsole.err.apply(defaultConsole, arguments);
    };

    mod.getView = function () {
        consoleMgr = mod.consoleMgr = new ConsoleManager();
        var defaultConsole = mod.getDefaultConsole();
        return defaultConsole.view;
    };

    mod.onViewAppended = function () {
        var view = this.getDefaultConsole().view;
        if (view) {
            var opt = {};
            opt.title = 'Output';
            opt.key = 'O';
            workbench.registToViewFocusList(view, opt);
        }
    };

    mod.getTabs = function () {
        return tabs;
    };

    topic.subscribe('#REQUEST.log', mod.log);

    timedLogger.log('initialized output plugin\'s module', time);

    return mod;
});
