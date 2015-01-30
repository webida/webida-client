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

define(['socket.io',
        'core/ide',
        'term',
        'dijit/Dialog',
        'dojox/layout/FloatingPane',
        'underscore',
        'webida-lib/webida-0.3'],
function (socketio, ide, Terminal, Dialog, FloatingPane, _, webida) {
    var showing = false;

    var socket = null;
    var counter = 1;

    var item = {
        'Terminal' : [ 'cmnd', 'plugins/terminal/plugin', 'start' ]
    };
    return {
        getViableItems: function () {
            return item;
        },

        start: function () {
            var working = -1;
            var workingPid = -1;
            var workingDiv = null;

            if (socket === null) {
                var url = webida.conf.fsServer + '/?access_token=' + webida.auth.getToken();
                socket = socketio.connect(url);
            }
            if (! showing) {
                showing = true;

                var terminal = new Terminal(80, 25);

                var terminalRoot = $('<div id="_terminalDlg"></div>').appendTo($('body'));
                var terminalView = $('<div style="width:100%; height:100%"></div>');

                terminalView.css({
                    width: '100%',
                    height: '100%',
                    color: '#ffffff',
                    margin: '0px',
                    padding: '0px',
                    fontFamily: 'Consolas, "Liberation Mono", Courier, monospace',
                    overflow: 'hidden',
                    lineHeight: 1.2
                }).attr({
                    tabindex: '0'
                });

//                var dlg = new Dialog({
//                    content: terminalView[0],
//                    title: 'Terminal',
//                    style: 'width:600px; height:500px; padding:0;',
//
//                    onCancel: function (event) {
//                        dlg.hide();
//                    },
//
//                    onHide: function (event) {
//                        showing = false;
//                        dlg.destroyRecursive();
//                    }
//                }, '_terminalDlg');

                var floatingPane = new FloatingPane({
                    content: terminalView[0],
                    title : 'Terminal',
                    style : 'width:600px; height:400px',
                    resizable : true,
                    dockable : false,

//                    onClose: function (event) {
//                        console.log("close");
//                        floatingPane.hide();
//                    },
//
//                    onHide: function (event) {
//                        console.log("hide");
//                    },

                    onUnload: function () {
                        console.log('unload');

                        socket.emit('console:write', {
                            pid: workingPid,
                            cmd: 'exit'
                        });

                        showing = false;
                        floatingPane.destroyRecursive();
                    },
                }, '_terminalDlg');


                floatingPane.show();
//                dlg.show();

                function resizeTerminal(viewWidth, viewHeight) {
                    var tester = $('<span>W</span>').appendTo(terminal.element);
                    var width = tester.width(), height = tester.height();

                    if (width > 0 && height > 0) {
                        if (viewWidth === undefined) {
                            viewWidth = terminalView.width();
                        }
                        if (viewHeight === undefined) {
                            viewHeight = terminalView.height();
                        }

                        tester.remove();

                        var rows = Math.floor(viewHeight / height),
                            cols = Math.floor(viewWidth / width);

                        console.log(viewWidth, viewHeight, width, height, cols, rows);

                        terminal.resize(cols, rows);
                        socket.emit('console:resize', {
                            pid: workingPid,
                            cols: cols,
                            rows: rows
                        });
                    }
                }

                terminalRoot.on('close', function () {
                    showing = false;
                });
                terminalRoot.on('resized', function () {
                    resizeTerminal();
                    terminalView.focus();
                });
                terminalRoot.on('moved', function () {
                    terminalView.focus();
                });

                $('<style type="text/css"> .reverse-video { color: #000; background: #f0f0f0; } </style>').appendTo('body');

                terminal.element = null;
                //terminal.open(terminalView[0]);
                //terminal.open(dlg.containerNode.childNodes[0]);
                terminal.open(floatingPane.containerNode.childNodes[0]);
                terminal.focus = true;

                terminalView.bind('keydown', function (e) {
                    terminal.keyDown(e);
                });
                terminalView.bind('keypress', function (e) {
                    terminal.keyPress(e);
                });
                terminalView.focus();
                terminalView.bind('focusin', function (e) {
                    terminal.focus = true;
                });
                terminalView.bind('focusout', function (e) {
                    terminal.focus = false;
                    terminal.showCursor();
                });

                terminal.on('key', function (key) {
                    socket.emit('console:write', {
                        pid: workingPid,
                        cmd: key
                    });
                });

                function runCommand(input) {
                    if (working < 0) {
                        // start new process
                        counter += 1;
                        var args = $.trim(input).split(' ');
                        socket.emit('console:exec', {
                            cid: counter,
                            fsid: ide.getFsid(),
                            cmd: args[0],
                            args: args.splice(1),
                            opt: {
                                cwd: './' + ide.getPath(),
                                env: { LANG: 'c' }
                            }
                        });
                        working = counter;
                        workingDiv = $('<div>').attr('cid', counter).appendTo(terminalView);
                        workingDiv.addClass('working').css({
                            backgroundColor: '#373832'
                        });
                    } else {
                        // working with existing thread
                        socket.emit('console:write', {
                            pid: workingPid,
                            cmd: input
                        });
                    }
                }
                runCommand('bash');

                function stopWorking() {
                    if (workingDiv !== null) {
                        workingDiv.removeClass('working');
                    }
                    working = -1;
                    workingDiv = null;
                }

                socket.on('ack', function (data) {
                    var cid = data.cid;
                    var pid = data.pid;
                    if (pid) {
                        if (cid === working) {
                            workingPid = pid;
                        }
                    }
                });
                socket.on('data', function (data) {
                    if (workingPid === data.pid) {
                        if (data.data.match(/exit\r*\n/)) {
                            floatingPane.destroyRecursive();
                            console.log('exit');
                        }
                        terminal.write(data.data);
                    }
                });
                socket.on('error', function (data) {
                    if (workingPid === data.pid) {
                        console.log(data);
                    }
                });
                socket.on('close', function (data) {
                    $('div[cid="' + data.cid + '"]').addClass('terminated').css({
                        backgroundColor: 'black'
                    });
                    if (data.cid === working) {
                        stopWorking();
                    }
                });
                var viewWidth, viewHeight;
                var sizeUpdater = function () {
                    if (showing) {
                        var width = terminalView.width();
                        var height = terminalView.height();
                        if (viewWidth !== width || viewHeight !== height) {
                            resizeTerminal(width, height);
                            viewWidth = width;
                            viewHeight = height;
                        }
                    }
                };
                setTimeout(sizeUpdater, 200);
            }
        }
    };
});
