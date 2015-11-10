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
 * HtmlLinkControl  class
 * Html link  content assist control module.
 *
 * @constructor
 * @since: 2015.11.09
 * @author: h.m.kwon
 *
 */

/*jshint unused:false*/

// @formatter:off
define([
    'external/codemirror/lib/codemirror',
    'external/lodash/lodash.min',
    'require',
    'webida-lib/util/genetic',    
    'webida-lib/util/logger/logger-client',
    'plugins/webida.editor.code-editor/content-assist/IContentAssist',
    './html-hint-link'
], function (
    codemirror,
     _,
    require,
    genetic,
    Logger,
    IContentAssist
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    logger.off();

    function HtmlLinkControl(viewer, cm, options, c) {
        logger.info('new HtmlLinkControl()');
     
        if (c) {
            c();
        }   
    }    
    
    genetic.inherits(HtmlLinkControl, IContentAssist, {
        

        /**
         * Returns whether the command is supported
         *
         * @param {string} command
         *
         * @return {boolean}
         */
        canExecute: function (command) {            
            return  false;
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
            console.error('Command[' + command + '] is not supported.');
        }
    }); 

    return HtmlLinkControl;
});
