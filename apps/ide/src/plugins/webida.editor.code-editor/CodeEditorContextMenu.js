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
 * @file
 * CodeEditorContextMenu
 * 
 * @see
 * @since 1.3.0
 * @author hw.shim@samsung.com
 * @author h.m.kwon@samsung.com
 */

/* jshint unused:false */

// @formatter:off
define([
    'dojo/Deferred',
    'dojo/i18n!./nls/resource',
    'plugins/webida.editor.text-editor/TextEditorContextMenu',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './CodeEditorViewer'
], function (
    Deferred,
    i18n,
    TextEditorContextMenu,
    genetic, 
    Logger,
    CodeEditorViewer
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    /**
     * ContextMenu for code editor
     * @constructor
     * @extends TextEditorContextMenu
     * 
     * @param {Object} allItems - Object containing all menu items
     * @param {Part} part
    */

    function CodeEditorContextMenu(allItems, part) {
        logger.info('new CodeEditorContextMenu(allItems, part)');
        TextEditorContextMenu.apply(this, arguments);
    }


    genetic.inherits(CodeEditorContextMenu, TextEditorContextMenu, {

        /**
         * Creates Available Menu Items then return Thenable
         * @return {Thenable}
         */
        getAvailableItems: function () {

            var superDeferred = TextEditorContextMenu.prototype.getAvailableItems.call(this);

            var deferred = new Deferred();
            var allItems = this.getAllItems();
            var part = this.getPart();
            var viewer = part.getViewer();
            var widget = viewer.getWidget();
            var selected = widget.getSelection();
            var registry = this.getPartRegistry();
            var editorParts = registry.getEditorParts();

            superDeferred.then(function (items) {

                // Source
                var sourceItems = {};
                // Toggle Comments
                if (widget._contentAssistDelegator) {
                    if (widget._contentAssistDelegator.execCommand('isLineCommentable', widget)) {
                        sourceItems['&Toggle Line Comments'] = 
                            allItems.editMenuItems['&Source']['&Toggle Line Comments'];
                    }
                    if (widget._contentAssistDelegator.execCommand('isBlockCommentable', widget)) {
                        sourceItems['Toggle Block Comment'] = 
                            allItems.editMenuItems['&Source']['Toggle Block Comment'];
                    }
                    if (widget._contentAssistDelegator.execCommand('isSelectionCommentable', widget)) {
                        sourceItems['Comment Out Selection'] = 
                            allItems.editMenuItems['&Source']['Comment Out Selection'];
                    }
                }
                // Code Folding
                sourceItems['&Fold'] = allItems.editMenuItems['&Source']['&Fold'];
                // Beautify (All)
                var currentModeName = widget.getMode().name;
                if (currentModeName === 'javascript' || currentModeName === 'htmlmixed' || currentModeName === 'css') {
                    if (selected) {
                        sourceItems['&Beautify'] = allItems.editMenuItems['&Source']['&Beautify'];
                    }
                    sourceItems['B&eautify All'] = allItems.editMenuItems['&Source']['B&eautify All'];
                }
                items['So&urce'] = sourceItems;
                items['So&urce'].alternateLabel = allItems.editMenuItems['&Source'].alternateLabel;

                // Go to
                items['&Go to Definition'] = allItems.navMenuItems['&Go to Definition'];

                if (viewer.isDefaultKeyMap()) {
                    items['G&o to Line'] = allItems.navMenuItems['G&o to Line'];
                }

                if (viewer.isThereMatchingBracket()) {
                    items['Go to &Matching Brace'] = allItems.navMenuItems['Go to &Matching Brace'];                   
                }                
                
                //TODO: widget._contentAssistDelegator -> viewer.getPlugin('tern-js')
                
                if (widget._contentAssistDelegator) {
                    if (widget._contentAssistDelegator.canExecute('request')) {
                        widget._contentAssistDelegator.execCommand('request', widget, {
                            type: 'rename',
                            newName: 'merong',
                            fullDocs: true
                        }, function (error) {
                            if (!error) {
                                sourceItems['&Rename Variables'] = 
                                    allItems.editMenuItems['&Source']['&Rename Variables'];
                            }
                            deferred.resolve(items);
                        });
                    } else {
                        deferred.resolve(items);
                    }
                  
                } else {
                    deferred.resolve(items);
                }                                                  
                
            });

            return deferred;
        }
    });

    return CodeEditorContextMenu;
});

