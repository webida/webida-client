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
 * BeautifyControl  class
 * Beautify content assist control module.
 *
 * @constructor
 * @since: 2015.12.02
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
    'plugins/webida.editor.code-editor/content-assist/IContentAssist'
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

    function getBeautifier(editor, callback) {
        var currentModeName = editor.getMode().name;
        var beautifierModuleID;
        var beautifyOptions;
        /* jshint camelcase: false */
        if (currentModeName === 'javascript') {
            beautifierModuleID = 'external/js-beautify/js/lib/beautify';
            // TODO .editorconfig-aware options
            beautifyOptions = {
                jslint_happy: true,
                wrap_line_length: 120
            };
            require([beautifierModuleID], function (beautifier) {
                callback(beautifier.js_beautify, beautifyOptions);
            });
        } else if (currentModeName === 'htmlmixed') {
            beautifierModuleID = 'external/js-beautify/js/lib/beautify-html';
            require([beautifierModuleID], function (beautifier) {
                callback(beautifier.html_beautify, beautifyOptions);
            });
        } else if (currentModeName === 'css') {
            beautifierModuleID = 'external/js-beautify/js/lib/beautify-css';
            require([beautifierModuleID], function (beautifier) {
                callback(beautifier.css_beautify, beautifyOptions);
            });
        } else {
            // Shouldn't be reached
            callback();
        }
        /* jshint camelcase: true */
    }
    
    function  beautifyCode(editor) {
        getBeautifier(editor, function (beautifier, options) {
            if (beautifier) {
                // reselect
                var startPos = editor.getCursor('from'),
                    startPosOrig;
                var endPos = editor.getCursor('to');
                var endPosInfo = editor.lineInfo(endPos.line);

                if (startPos.ch !== 0) {
                    startPosOrig = startPos;
                    startPos = {
                        line: startPos.line,
                        ch: 0
                    };
                }
                if (endPosInfo.text.length !== endPos.ch) {
                    endPos = {
                        line: endPos.line,
                        ch: endPosInfo.text.length
                    };
                }

                editor.replaceRange(beautifier(editor.getRange(startPos,
                                                               endPos), options), startPos, endPos);
            }
        });
    }
    
    function  beautifyAllCode(editor) {
        getBeautifier(editor, function (beautifier, options) {
            if (beautifier) {
                var doc = editor.getDoc();
                var cursor = editor.getCursor();                
                var contentsBeforeCursor = doc.getValue().slice(0, doc.indexFromPos(cursor));
                var originalNonWhiteSpaceMatchResult = contentsBeforeCursor.match(/\S/g);
                var originalNonWhiteSpaceCount = originalNonWhiteSpaceMatchResult ? 
                    contentsBeforeCursor.match(/\S/g).length: 0;
                var startPos = {
                    line: editor.firstLine(),
                    ch: 0
                };
                var lastLine = editor.lastLine();
                var endPos = {
                    line: lastLine,
                    ch: editor.getLine(lastLine).length
                };
                editor.replaceRange(beautifier(editor.getValue(), options), startPos, endPos);
                var beautifiedContents = doc.getValue();
                var movedIndex = 0;
                for (var nonWhiteSpaceCount = 0; 
                     movedIndex < beautifiedContents.length &&
                     nonWhiteSpaceCount < originalNonWhiteSpaceCount; 
                     movedIndex++) {
                    var matchResult = beautifiedContents.charAt(movedIndex).match(/\S/g);
                    if (matchResult) {
                        nonWhiteSpaceCount++;                        
                    }
                }
                editor.setCursor(doc.posFromIndex(movedIndex));
            }
        });
    }
    
     /* Content assist commands */
    
    var caCommands = [
        'beautifyCode',
        'beautifyAllCode'
    ];

    function BeautifyControl(viewer, cm, options, c) {
        logger.info('new BeautifyControl()');   

        if (c) {
            c();
        }    
    }
    
    function setCodemirrorCommandsAndHelpers() {       
    }
    
    setCodemirrorCommandsAndHelpers();
    
    function isCaCommand(command) {
        return caCommands.indexOf(command) >= 0;
    }

    genetic.inherits(BeautifyControl, IContentAssist, {        

        /**
         * Returns whether the command is supported
         *
         * @param {string} command
         * @return {boolean}
         */
        canExecute: function (command) {            
            return isCaCommand(command);
        },

        /**
         * Execute the command
         *
         * @param {string} command
         * @param {[args]} arguments
         * @return {all}
         */
        execCommand: function (command) {
            var slice = Array.prototype.slice;
            var args = slice.apply(arguments);
            args.splice(0, 1);
            var func;
            if (isCaCommand(command)) {
                switch (command) {
                    case 'beautifyCode':
                        func = beautifyCode;
                        break;                    
                    case 'beautifyAllCode': 
                        func = beautifyAllCode;
                        break;
                }
                return func.apply(undefined, args);
            } else {
                console.error('Command[' + command + '] is not supported.');
            }
        }
    }); 

    return BeautifyControl;
});
