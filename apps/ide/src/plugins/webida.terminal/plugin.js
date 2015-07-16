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
 * Terminal plugin module
 * @module webida.terminal.plugin
 * @memberOf module:webida.terminal
 */
define(['webida-lib/util/logger/logger-client',          // Logger
        'external/lodash/lodash.min',  // _
        'webida-lib/app',                   // ide
        'webida-lib/webida-0.3',            // webida
        'webida-lib/widgets/views/view',    // View
        'dojo/query',                       // query
        'external/URIjs/src/URI',              // URI
        'external/socket.io-client/socket.io',    // io
        './lib/socket.io-stream',           // ss
        './lib/terminal',                   // Terminal
        'dojo/text!./layout/terminal.html'],  // terminalHtml
function (Logger,
          _,
          ide,
          webida,
          View,
          query,
          URI,
          io,
          ss,
          Terminal,
          terminalHtml) {
    'use strict';

    var logger = new Logger('webida.terminal.plugin');
    var mod = {};

    function measureText(text, styleObj) {
        var divElem = document.createElement('div');
        var textDim;

        document.body.appendChild(divElem);

        if (!styleObj) {
            _.extend(divElem.style, styleObj);
        }
        divElem.style.position = 'absolute';
        divElem.style.left = -1000;
        divElem.style.top = -1000;

        divElem.innerHTML = text;

        textDim = {
            width: divElem.clientWidth,
            height: divElem.clientHeight
        };

        document.body.removeChild(divElem);
        divElem = null;

        return textDim;
    }

    mod._init = function () {
        var TERMINAL_SERVICE_PATH = '/pty';
        var termUriObj = URI(webida.conf.fsServer).pathname(TERMINAL_SERVICE_PATH)
        .search('?access_token=' + webida.auth.getToken() +
                '&fsid=' + ide.getFsid());
        var containers = document.getElementsByClassName('terminaljs');
        var socket = io(termUriObj.href());
        var term;
        var stream;
        var i;
        var fontDim = measureText('A', {fontSize: '100%', 'fontFamily': 'Courier, monospace'});
        var container;
        var parent;
        var clientWidth;
        var clientHeight;
        var options;
        var cwd = ide.getPath();

        logger.info(fontDim);

        for (i = 0; i < containers.length; i++) {
            container = containers[i];
            parent = container.parentNode;
            clientWidth = parent.clientWidth;
            clientHeight = parent.clientHeight;

            logger.info(clientWidth);
            logger.info(clientHeight);

            options = {columns: Math.floor((clientWidth - 0) / fontDim.width),
                    rows: Math.floor((clientHeight - 0) / fontDim.height),
                    cwd: cwd};
            logger.info(options);

            // setting tabindex makes the element focusable
            container.tabindex = 0;

            // use data-* attributes to configure terminal and child_pty
            term = new Terminal(options);

            // Create bidirectional stream
            stream = ss.createStream({decodeStrings: false, encoding: 'utf-8'});

            // Send stream and options to the server
            ss(socket).emit('new', stream, options);

            // Connect everything up
            stream.pipe(term).dom(container).pipe(stream);
        }
    };

    /**
     * Get terminal view
     * @memberOf module:webida.terminal.plugin
     */
    mod.getView = function () {
        logger.log('getView');
        if (!mod._view) {
            mod._view = new View('generalTerminalView', 'Terminal');
        }
        return mod._view;
    };

    /**
     * Called when view is appended
     * @memberOf module: webida.terminal.plugin
     */
    mod.onViewAppended = function () {
        logger.log('onViewAppended');
        mod._view.setContent(terminalHtml);
        mod._init();
    };

    return mod;
});
