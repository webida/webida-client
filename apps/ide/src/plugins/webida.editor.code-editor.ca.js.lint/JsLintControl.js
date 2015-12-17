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
 * @file Constructor function for JavaScript linter control
 *
 * @constructor
 * @since: 1.6.1
 * @author: h.m.kwon@samsung.com
 *
 */

/*jshint unused:false*/

// @formatter:off
define([
    'external/codemirror/lib/codemirror',
    'external/lodash/lodash.min',
    'require',
    'webida-lib/util/genetic',    
    'webida-lib/util/loadCSSList',
    'webida-lib/util/logger/logger-client',
    'plugins/webida.editor.code-editor/content-assist/IContentAssist',
    'plugins/webida.editor.code-editor/CodeEditorViewer'
    
], function (
    codemirror,
     _,
    require,
    genetic,
    loadCSSList,
    Logger,
    IContentAssist,
    CodeEditorViewer
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    logger.off();
    
    var jsHintWorker = (function () {
        var listeners = {};
        var worker = null;
        return function (code, options, listener) {
            if (worker === null) {
                worker = new Worker(require.toUrl('./jshint-worker.js'));
                worker.onmessage = function (event) {
                    var data = event.data;
                    listeners[data.reqId](data);
                };
            }
            var reqId = _.uniqueId('jshint-worker-');
            worker.postMessage({
                reqId: reqId,
                code: code,
                options: options
            });
            listeners[reqId] = listener;
        };
    })();
    
    function setLinter(viewer, type, option)
    {
        /*jshint validthis:true*/
        if (type === undefined || option === undefined) {
            return;
        }
        if (type !== JsLintControl.TARGET_MODE) {
            return;
        }
        this.linterOption = option;
        if (option) {
            loadCSSList([
                require.toUrl('external/codemirror/addon/lint/lint.css'),
            ], function () {
                require([
                    'external/codemirror/addon/lint/lint',
                    'external/codemirror/addon/lint/javascript-lint'
                ], function () {
                    CodeEditorViewer.addAvailable('addon', 'lint');
                    CodeEditorViewer.addAvailable('addon', 'javascript-lint');
                    viewer.__applyLinter();
                });
            });
        } else {
            viewer.__applyLinter();
        }        
    }
    
    function applyLinter(cm, editorMode)
    {
        /*jshint validthis:true*/
        if (editorMode !== JsLintControl.TARGET_MODE) {
            return;
        }
        
        if (CodeEditorViewer.isAvailable('addon', 'lint') && 
            CodeEditorViewer.isAvailable('addon', 'javascript-lint')) {
            if ((typeof this.linterOption) === 'object') {
                var jshintrc = this.linterOption;
                cm.setOption('lint', 
                    {
                        async: true,
                        getAnnotations: function (editorValue, updateLinting, passOptions, editor) {
                            jsHintWorker(editorValue, jshintrc, function (data) {
                                updateLinting(editor, data.annotations);
                            });
                        }
                    }
                );
            } else {
                cm.setOption('lint', 
                    {
                        async: true,
                        getAnnotations: function (editorValue, updateLinting, passOptions, editor) {
                            jsHintWorker(editorValue, false, function (data) {
                                updateLinting(editor, data.annotations);
                            });
                        }
                    }
                );
            }
        }
    }

     /* Content assist commands */
    
    var caCommands = [
        'setLinter',
        'applyLinter'
    ];

    function JsLintControl(viewer, cm, options, c) {
        logger.info('new JsLintControl()');   

        if (c) {
            c();
        }    
    }
     
    function isCaCommand(command) {
        return caCommands.indexOf(command) >= 0;
    }

    genetic.inherits(JsLintControl, IContentAssist, {        

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
                    case 'setLinter':
                        func = setLinter;
                        break;                    
                    case 'applyLinter': 
                        func = applyLinter;
                        break;
                }
                return func.apply(this, args);
            } else {
                console.error('Command[' + command + '] is not supported.');
            }
        }
    }); 

    return JsLintControl;
});
