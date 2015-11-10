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
 * @since: 2015.09.18
 * @author: h.m.kwon
 *
 */

// @formatter:off
define([
    'external/codemirror/lib/codemirror',
    'require',
    'webida-lib/util/genetic',    
    'webida-lib/util/logger/logger-client',
    'plugins/webida.editor.code-editor/content-assist/IContentAssist'
], function (
    codemirror,
    require,
    genetic,
    Logger,
    IContentAssist
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    logger.off();     
    
    function jshint(cm, callback) {
        if (cm._contentAssistDelegator) {
            cm._contentAssistDelegator.execCommand('getHint', cm, callback);
        }
    }
        
    function setCodemirrorCommandsAndHelpers() {
        codemirror.registerHelper('hint', 'javascript', jshint);
    }

    setCodemirrorCommandsAndHelpers();
    
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
        require(['./tern-server-starter'], function (starter) {            
            options.engineName = TernControl.ENGINE_NAME;
            options.langMode = TernControl.TARGET_MODE;
            starter.startServer(viewer.file.path, cm, options, function (server) {               
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

    genetic.inherits(TernControl, IContentAssist, {
        

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
        execCommand: function (command) {
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
