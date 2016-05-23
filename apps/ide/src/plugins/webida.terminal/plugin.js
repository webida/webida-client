/*
 * Copyright (c) 2015 Samsung Electronics Co., Ltd. All rights reserved.
 *
 * Contact:
 * WooYoung Cho <wy1.cho@samsung.com>
 * KangHo Kim <kh5325.kim@samsung.com>
 * KiHyuk Ryu <kihyuck.ryu@samsung.com>
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Contributors:
 * - S-Core Co., Ltd.
 *
 */

/**
 * @file Terminal plugin module
 * @module Terminal
 * @since 1.3.0
 * @author wy1.cho@samsung.com
 */
define([
    'dojo/i18n!./nls/resource',
    'dojo/query',                           // query
    'dojo/topic',                           // topic
    'external/lodash/lodash.min',           // _
    'external/socket.io-client/socket.io',  // io
    'external/term.js/src/term',            // Terminal
    'external/URIjs/src/URI',               // URI
    'webida-lib/app',                       // ide
    'webida-lib/plugins/workbench/plugin',  // workbench
    'webida-lib/util/locale',
    'webida-lib/util/logger/logger-client', // Logger
    'webida-lib/server-api',                // webida
    'webida-lib/widgets/views/view',        // View
    'dojo/text!./layout/terminal.html',     // terminalHtml
    'xstyle/css!./style/terminal.css'
], function (
    i18n,
    query,
    topic,
    _,
    io,
    Terminal,
    URI,
    ide,
    workbench,
    Locale,
    Logger,
    webida,
    View,
    terminalHtml
) {
    'use strict';

    /**
     * @type {Terminal}
     */
    Terminal = window.Terminal; // Required because term.js is not an AMD module
    /**
     * @type {Logger}
     */
    var logger = new Logger('webida.terminal.plugin');
    /**
     * @type {module:Locale}
     */
    var locale = new Locale(i18n);
    /**
     * @type {Object}
     */
    var viableItems = {
        Terminal: ['cmnd', 'plugins/webida.terminal/plugin', 'showView']
    };
    /**
     * Convert menu items by current locale
     */
    (function _convertMenuLocale() {
        locale.convertMenuItem(viableItems, 'menu');
    })();

    /**
     * This module object
     * @type {Object}
     */
    var mod = {
        term: null,
        socket: null,
        terminalNode: null,
        viewNode: null,
        _view: null,
        width: 800,
        height: 400
    };

    /**
     * @constant {string}
     */
    var VIEW_ID = 'generalTerminalView';
    /**
     * @constant {number}
     */
    var DEFAULT_COLS = 80;
    /**
     * @constant {number}
     */
    var DEFAULT_ROWS = 24;

    /**
     * Create terminal with the socket.io connection
     * @param socket
     * @param opts
     */
    function createTerm(socket, opts) {
        destroy();
        socket.emit('create', {
            cols: opts.cols || DEFAULT_COLS,
            rows: opts.rows || DEFAULT_ROWS,
            cwd: opts.cwd
        }, function (err) {
            var term;
            if (err) {
                logger.error('failed to create term');
                destroy();
                return;
            }
            logger.info('create');
            term = mod.term = new Terminal({
                cols: opts.cols || DEFAULT_COLS,
                rows: opts.rows || DEFAULT_ROWS,
                screenKeys: true,
                cursorBlink: true
            });
            term.on('data', function (data) {
                socket.emit('data', data);
            });
            term.on('title', function (title) {
                logger.info('title changed', title);
                // TODO: show title somewhere
            });
            term.open(mod.viewNode);
            adjustTermSize();
            mod.terminalNode = query('.terminal', mod._view.getTopContainer().containerNode)[0];
        });
    }

    /**
     * Initialize the connection
     */
    function init() {
        var TERMINAL_SERVICE_PATH = '/pty';
        var termUri = URI(webida.conf.fsServer).pathname(TERMINAL_SERVICE_PATH)
            .search('?access_token=' + webida.auth.getToken() +
                '&fsid=' + ide.getFsid()).href();
        var socket = mod.socket = io(termUri);
        var cwd = ide.getPath();
        var opts = {
            cwd: cwd
        };

        socket.on('connect', function () {
            logger.info('terminal connect');
            createTerm(socket, opts);
        });
        socket.on('data', function (data) {
            mod.term.write(data);
        });
        socket.on('disconnect', function () {
            logger.info('terminal disconnect');
            // TODO: defer destroy to keep connection during short disconnection
            destroy();
        });
        socket.on('close', function () {
            logger.info('terminal close');
            // reconnect on close(ie. shell exit)
            createTerm(socket, opts);
        });
    }

    /**
     * Adjust terminal size
     */
    function adjustTermSize() {
        resizeTerm({w: mod.width, h: mod.height});
    }

    /**
     * Resize terminal
     * @param {Object} resizeEvent
     */
    function resizeTerm(resizeEvent) {
        mod.width = resizeEvent.w;
        mod.height = resizeEvent.h;
        var col = Math.floor(resizeEvent.w / 9);
        var row = Math.floor(resizeEvent.h / 16);
        if (!mod.term) {
            return;
        }
        logger.info('terminal resize', resizeEvent, col, row);
        mod.term.resize(col, row);
        mod.socket.emit('resize', col, row);
    }

    /**
     * Destroy terminal
     */
    function destroy() {
        if (mod.term) {
            mod.term.destroy();
            mod.term = null;
        }
    }

    /**
     * Get terminal view
     * @memberof module:Terminal
     */
    mod.getView = function () {
        logger.log('getView');
        if (!mod._view) {
            mod._view = new View(VIEW_ID, i18n.titleView, {
                resize: function (ev) {
                    resizeTerm(ev);
                }
            });
        }
        return mod._view;
    };

    /**
     * Called when view is appended and initialize terminal
     * @memberof module:Terminal
     */
    mod.onViewAppended = function () {
        logger.log('onViewAppended');
        var opt = {};
        opt.title = i18n.titleView;
        opt.key = 'T';
        workbench.registToViewFocusList(mod._view, opt);
        mod._view.setContent(terminalHtml);
        mod.viewNode = query('.terminal-view', mod._view.getTopContainer().containerNode)[0];
        init();
        topic.subscribe('view.selected', function (event) {
            var view = event.view;
            if (view.getId() === VIEW_ID) {
                // to enable key input directly after view is changed by shortcut or selection
                mod._focusTerminalView();
            }
        });
    };

    /**
     * Show this view
     * @memberof module:Terminal
     */
    mod.showView = function () {
        var view = mod._view;

        if (view) {
            view.select();
            mod._focusTerminalView();
        }
    };

    /**
     * Focus terminal view then you can type in the terminal commands
     */
    mod._focusTerminalView = function () {
        if (!mod.terminalNode) {
            return;
        }
        mod.terminalNode.focus();
    };

    /**
     * Get viable menu items for the menu system
     * @return {Object}
     */
    mod.getViableItems = function () {
        return viableItems;
    };

    return mod;
});
