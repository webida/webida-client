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
 * @since: 2015.10.22
 * @author: Se-won Kim
 */

define([
    'require',
    'dojo/i18n!./nls/resource',
    'webida-lib/util/logger/logger-client',
    'external/codemirror/lib/codemirror',
    '../webida.editor.code-editor/content-assist/assist'
], function (
    require,
    i18n,
    Logger,
    CodeMirror,
    assist
) {
    'use strict';

    var logger = new Logger();
    logger.off();

    var server = Object.create(null);

    /* jshint unused: false */
    function getHint(cm, callback, options) {

        function callbackWrapper(error, data) {
            /* jshint unused:true */

            if (data) {
                var from = cm.posFromIndex(data.from);
                var to = cm.posFromIndex(data.to);
                var list = [];
                data.list.forEach(function (entry) {
                    if (typeof entry === 'string') {
                        list.push(entry);
                    } else {
                        list.push({
                            text: entry.text,
                            className: getIconClass(entry.icon)
                        });
                    }
                });
                callback({
                    list: list,
                    from: from,
                    to: to
                });
            }
        }

        assist.send({
            mode: server.mode,
            type: 'request',
            server: null,
            body: {
                type: 'completions',
                pos: cm.indexFromPos(cm.getCursor()),
                filePath: cm.calciumAddon.filePath,
                code: cm.getValue()
            }
        }, callbackWrapper);
    }

    function getIconClass(icon) {
        return cls + 'completion ' + cls + 'completion-' + icon;
    }

    var cls = 'CodeMirror-Tern-';

    function tempTooltip(cm, content) {
        var where = cm.cursorCoords();
        var tip = makeTooltip(where.right + 1, where.bottom, content);

        function clear() {
            if (!tip.parentNode) {
                return;
            }
            cm.off('cursorActivity', clear);
            fadeOut(tip);
        }
        setTimeout(clear, 1700);
        cm.on('cursorActivity', clear);
    }

    function makeTooltip(x, y, content) {
        var node = elt('div', cls + 'tooltip', content);
        node.style.left = x + 'px';
        node.style.top = y + 'px';
        document.body.appendChild(node);
        return node;
    }

    function elt(tagname, cls /*, ... elts*/ ) {
        var e = document.createElement(tagname);
        if (cls) {
            e.className = cls;
        }
        for (var i = 2; i < arguments.length; ++i) {
            var elt1 = arguments[i];
            if (typeof elt1 === 'string') {
                elt1 = document.createTextNode(elt1);
            }
            e.appendChild(elt1);
        }
        return e;
    }

    function remove(node) {
        var p = node && node.parentNode;
        if (p) {
            p.removeChild(node);
        }
    }

    function fadeOut(tooltip) {
        tooltip.style.opacity = '0';
        setTimeout(function () {
            remove(tooltip);
        }, 1100);
    }

    function showType(cm) {
        function doTooltip(error, data) {
            tempTooltip(cm, data.typeString);
        }
        var start = cm.indexFromPos(cm.getCursor('start'));
        var end = cm.indexFromPos(cm.getCursor('end'));

        assist.send({
            mode: server.mode,
            type: 'request',
            server: null,
            body: {
                type: 'showType',
                start: start,
                end: end,
                filePath: cm.calciumAddon.filePath,
                code: cm.getValue()
            }
        }, doTooltip);
    }

    var renameCount = 0;

    function renameVariableViaDialog(cm) {
        var sentValue = cm.getValue();

        function dialog(cm, text, dfltText, f) {
            if (typeof dfltText === 'function') {
                f = dfltText;
                dfltText = '';
            }
            if (cm.openDialog) {
                cm.openDialog(text + ': <input type=text value="' + dfltText + '">', f);
            } else {
                f(prompt(text, ''));
            }
        }

        withOccurrences('variableOccurrences', cm,
            function (error, data) {
                if (data === null || cm.getValue() !== sentValue) {
                    // if not on a variable or there is code change after the request,
                    // then do nothing.
                    return;
                }
                var oldName = data.varName;
                dialog(cm, i18n.newNameFor + oldName, oldName, function (newName) {
                    var lengthDiff = newName.length - oldName.length;
                    renameCount++;
                    for (var i = 0; i < data.length; i++) {
                        var node = data[i];

                        var startPos = cm.posFromIndex(node.start + lengthDiff * i);
                        var endPos = cm.posFromIndex(node.end + lengthDiff * i);
                        cm.replaceRange(newName, startPos, endPos, '*rename' + renameCount);
                    }
                });

            });
    }

    function selectVariables(cm) {
        var sentValue = cm.getValue();
        withOccurrences('variableOccurrences', cm,
            function (error, data) {
                if (data === null || cm.getValue() !== sentValue) {
                    // if not on a variable or there is code change after the request,
                    // then do nothing.
                    return;
                }
                var curPos = cm.getCursor();
                var ranges = [],
                    cur = 0;
                for (var i = 0; i < data.length; i++) {
                    var node = data[i];
                    var startPos = cm.posFromIndex(node.start);
                    var endPos = cm.posFromIndex(node.end);
                    ranges.push({
                        anchor: startPos,
                        head: endPos
                    });
                    if (CodeMirror.cmpPos(startPos, curPos) <= 0 &&
                        CodeMirror.cmpPos(curPos, endPos) <= 0) {
                        // when curPos is within the range
                        cur = i;
                    }
                }
                cm.setSelections(ranges, cur);
            }
        );
    }

    function highlightOccurrences(occurType, cm) {
        // assign clear and timeout variable for each cm instance
        var clear;
        var timeout;

        // remove the work for cursorActivity within 250ms
        function registerTimeout() {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(function () {
                work(cm);
            }, 250);
        }

        function highlighter(error, occurList) {
            // clear the previous highlights
            if (clear) {
                clear();
                clear = null;
            }
            // check whether we found occurrences
            if (occurList === null) {
                return;
            }
            var hls = [];
            for (var i = 0; i < occurList.length; i++) {
                var node = occurList[i];
                var startPos = cm.posFromIndex(node.start);
                var endPos = cm.posFromIndex(node.end);

                hls.push(cm.markText(startPos, endPos, {
                    className: 'cm-searching'
                }));
            }

            clear = function () {
                cm.operation(function () {
                    for (var i = 0; i < hls.length; i++) {
                        hls[i].clear();
                    }
                });
            };
        }

        // real work is done by this
        function work() {
            withOccurrences(occurType, cm, highlighter);
        }

        return registerTimeout;
    }

    function withOccurrences(reqType, cm, c) {
        var ranges = cm.listSelections();
        if (ranges.length > 1) {
            c(null, null);
            return;
        }
        var cursorIndexPos = cm.indexFromPos(cm.getCursor());
        assist.send({
            mode: server.mode,
            type: 'request',
            server: null,
            body: {
                type: reqType,
                pos: cursorIndexPos,
                filePath: cm.calciumAddon.filePath,
                code: cm.getValue()
            }
        }, c);
    }

    // Maintaining argument hints
    function updateArgHints(cm) {
        closeArgHints(cm);

        if (cm.somethingSelected()) {
            return;
        }
        var state = cm.getTokenAt(cm.getCursor()).state;
        var inner = CodeMirror.innerMode(cm.getMode(), state);
        if (inner.mode.name !== 'javascript') {
            return;
        }
        var lex = inner.state.lexical;
        if (lex.info !== 'call') {
            return;
        }

        var ch, argPos = lex.pos || 0,
            tabSize = cm.getOption('tabSize');
        for (var line = cm.getCursor().line, e = Math.max(0, line - 9), found = false; line >= e; --line) {
            var str = cm.getLine(line),
                extra = 0;
            for (var pos = 0;;) {
                var tab = str.indexOf('\t', pos);
                if (tab === -1) {
                    break;
                }
                extra += tabSize - (tab + extra) % tabSize - 1;
                pos = tab + 1;
            }
            ch = lex.column - extra;
            if (str.charAt(ch) === '(') {
                found = true;
                break;
            }
        }
        if (!found) {
            return;
        }
        var start = cm.indexFromPos(CodeMirror.Pos(line, ch));

        assist.send({
            mode: server.mode,
            type: 'request',
            server: null,
            body: {
                type: 'structuredFnTypes',
                pos: start,
                filePath: cm.calciumAddon.filePath,
                code: cm.getValue()
            }
        },
            function (error, data) {
                logger.info(data);
                closeArgHints(cm);
                showArgHints(data, cm, argPos);
            }
        );
    }

    function showArgHints(fnTypes, cm, argPos) {
        var tip = elt('span', null);
        for (var i = 0; i < fnTypes.length; i++) {
            var typeInfo = fnTypes[i];

            var aType = _createFnTypeDomElt(typeInfo, argPos);
            tip.appendChild(aType);
            tip.appendChild(elt('br', null));

        }
        var place = cm.cursorCoords(null, 'page');
        logger.info(place);
        cm.calciumAddon.status.activeArgHints =
            makeTooltip(place.right + 1, place.bottom, tip);
    }

    function _createFnTypeDomElt(fnType, pos) {
        var tip = elt('span', null, '(');
        for (var i = 0; i < fnType.params.length; ++i) {
            if (i) {
                tip.appendChild(document.createTextNode(', '));
            }
            var param = fnType.params[i];
            tip.appendChild(elt('span', cls + 'farg' + (i === pos ? ' ' + cls + 'farg-current' : ''), param.name));
            if (param.type !== undefined) {
                tip.appendChild(document.createTextNode(':\u00a0'));
                tip.appendChild(elt('span', cls + 'type', param.type));
            }
        }
        tip.appendChild(document.createTextNode(fnType.ret ? ') ->\u00a0' : ')'));
        if (fnType.ret) {
            tip.appendChild(elt('span', cls + 'type', fnType.ret));
        }
        return tip;
    }

    function closeArgHints(cm) {
        if (cm.calciumAddon.status.activeArgHints) {
            remove(cm.calciumAddon.status.activeArgHints);
            cm.calciumAddon.status.activeArgHints = null;
        }
    }

    function jumpToDef(cm) {
        var start = cm.indexFromPos(cm.getCursor('start'));
        var end = cm.indexFromPos(cm.getCursor('end'));

        assist.send({
            mode: server.mode,
            type: 'request',
            server: null,
            body: {
                type: 'definitionSites',
                start: start,
                end: end,
                filePath: cm.calciumAddon.filePath,
                code: cm.getValue()
            }
        }, function (error, data) {
            moveToPosition(cm, data);
        });
    }

    // Temporarily, jump within a single file
    function moveToPosition(cm, data) {
        // for now we use the first item from the data
        if (data.length === 0) {
            return;
        }
        var pos = cm.posFromIndex(data[0].at);
        cm.setCursor(pos.line, pos.ch);
    }

    function handleRequest(cm, req, c) {
        logger.info('handleRequest');
        switch (req.type) {
            case 'rename':
                assist.send({
                    mode: server.mode,
                    type: 'request',
                    server: null,
                    body: {
                        type: 'variableOccurrences',
                        pos: cm.indexFromPos(cm.getCursor()),
                        filePath: cm.calciumAddon.filePath,
                        code: cm.getValue()
                    }
                },
                    function (error, data) {
                        c(data === null);
                    });
                break;
            default:
                throw new Error('Unknown request type');
        }
        logger.info(arguments);
    }

    server.startServer = function (filePath, cm, option, c) {

        server.mode = option.langMode + ':' + option.engineName;
        server.calciumAddon = cm.calciumAddon = {
            filePath: filePath,
            rename: renameVariableViaDialog,
            withOccurrences: withOccurrences,
            jumpToDef: jumpToDef,
            showType: showType,
            getHint: getHint,
            closeArgHints: closeArgHints,
            selectVariables: selectVariables,
            request: handleRequest,
            status: {
                activeArgHints: null
            }
        };

        cm.on('cursorActivity', highlightOccurrences('variableOccurrences', cm));
        cm.on('cursorActivity', highlightOccurrences('returnOccurrences', cm));
        cm.on('cursorActivity', highlightOccurrences('thisOccurrences', cm));
        cm.on('cursorActivity', function () {
            updateArgHints(cm);
        });

        if (c) {
            c(server);
        }
    };
    return server;
});
