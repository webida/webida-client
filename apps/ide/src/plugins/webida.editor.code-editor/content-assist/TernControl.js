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
 * TernControl  class
 * Tern based javascript content assist control module.
 *
 * @constructor
 * @see CaControl
 * @since: 2015.09.18
 * @author: h.m.kwom
 *
 */

// @formatter:off
define([
    'external/codemirror/lib/codemirror',
    'require',
    'webida-lib/util/genetic',    
    'webida-lib/util/logger/logger-client',
    './CaControl'
], function(
    codemirror,
    require,
    genetic,
    Logger,
    CaControl
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    logger.off();     
    
    /* Assist server commands
     * Refer js-jints.js    
    */
    
    var serverCommands = [
        'start', 
        'stop',
        'addFile',
        'delFile',
        'request',
        'getFile'        
    ];

    /* Content assist commands
     * Refer codemirror's tern addon
    */

    var caCommands = [
        'showType',
        'jumpToDef',
        'jumpBack',
        'rename',
        'closeArgHints',
        'getHint',
        'request'
    ];

    function TernControl(viewer, cm, options, c) {
        logger.info('new TernControl()');
     
        var that = this;
        require(['./js-hint'], function (jshint) {            
            options.engineName = TernControl.ENGINE_NAME;
            options.langMode = TernControl.TARGET_MODE;
            jshint.startServer(viewer.file.path, cm, options, function (server) {               
                that.ternAddon = server.ternAddon;
                that.server = server;
                viewer.assister = server;                
                if (c) {
                    c();
                }
            });
        });
    }

    function isCaCommand(command) {
        return caCommands.indexOf(command) >= 0;
    }
    
    function isServerCommand(command) {
        return serverCommands.indexOf(command) >= 0;
    }  

    genetic.inherits(TernControl, CaControl, {
        

        /**
         * Returns whether the command is supported
         *
         * @param {string} command
         *
         * @return {boolean}
         */
        canExecute: function (command) {
            if (this.ternAddon) {
                return isCaCommand(command) || isServerCommand(command);
            } else {
                return false; 
            }
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
        execCommand: function(command) {
            var slice = Array.prototype.slice;
            var args = slice.apply(arguments);
            args.splice(0, 1);
            if (isCaCommand(command)) {                
                return this.ternAddon[command].apply(this.ternAddon, args);                               
            } else if (isServerCommand(command)) {
                return this.server[command].apply(this.server, args);
            } else {
                console.error('Command[' + command + '] is not supported.');
            }
        }
    }); 

    return TernControl;
});
