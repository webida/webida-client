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
 * Constructor function
 * CssSmartControl  class
 * Css smart  content assist control module.
 *
 * @constructor
 * @since: 2015.11.10
 * @author: h.m.kwon
 *
 */

// @formatter:off
define([
    'external/codemirror/lib/codemirror',
    'external/lodash/lodash.min',
    'require',
    'webida-lib/util/genetic',    
    'webida-lib/util/logger/logger-client',
    'plugins/webida.editor.code-editor/content-assist/IContentAssist',
    './css-hint'
], function (
    codemirror,
     _,
    require,
    genetic,
    Logger,
    IContentAssist,
    server
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    logger.off();     
    
    
    var serverCommands = [
        'addFile'
    ];
    
    function CssSmartControl(viewer, cm, options, c) {
        logger.info('new CssSmartControl()');
        
        this.server = server;
        server.setModes(CssSmartControl.TARGET_MODE, CssSmartControl.ENGINE_NAME);

        if (c) {
            c();
        }     
    }
    
    function isServerCommand(command) {
        return serverCommands.indexOf(command) >= 0;
    }  

    genetic.inherits(CssSmartControl, IContentAssist, {
        

        /**
         * Returns whether the command is supported
         *
         * @param {string} command
         *
         * @return {boolean}
         */
        canExecute: function (command) {            
            return  isServerCommand(command);
        },

        /**
         * Execute the command
         *
         * @param {string} command
         *
         * @param {[args]} arguments
         *
         * @return {all}
         */
        execCommand: function (command) {
            var slice = Array.prototype.slice;
            var args = slice.apply(arguments);
            args.splice(0, 1);
            if (isServerCommand(command)) {
                return this.server[command].apply(this.server, args);
            } else {
                console.error('Command[' + command + '] is not supported.');
            }
        }
    }); 

    return CssSmartControl;
});
