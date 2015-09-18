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
 * Constructor
 * CodeEditorContextMenu
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'dojo/Deferred',
    'plugins/webida.editor.text-editor/TextEditorContextMenu',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './CodeEditorViewer'
], function(
    Deferred,
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

    function CodeEditorContextMenu(allItems, part) {
        logger.info('new CodeEditorContextMenu(allItems, part)');
        TextEditorContextMenu.apply(this, arguments);
    }


    genetic.inherits(CodeEditorContextMenu, TextEditorContextMenu, {

        /**
         * Creates Available Menu Items then return Thenable
         * @return {Thenable}
         */
        getPromiseForAvailableItems: function() {

            var superDeferred = TextEditorContextMenu.prototype.getPromiseForAvailableItems.call(this);

            var deferred = new Deferred();
            var allItems = this.getAllItems();
            var part = this.getPart();
            var viewer = part.getViewer();
            var widget = viewer.getWidget();
            var selected = widget.getSelection();
            var registry = this.getPartRegistry();
            var editorParts = registry.getEditorParts();

            superDeferred.then(function(items) {

                // Source
                var sourceItems = {};
                // Toggle Comments
                if (CodeEditorViewer.isLineCommentable(widget)) {
                    sourceItems['&Toggle Line Comments'] = allItems.editMenuItems['&Source']['&Toggle Line Comments'];
                }
                if (CodeEditorViewer.isBlockCommentable(widget)) {
                    sourceItems['Toggle Block Comment'] = allItems.editMenuItems['&Source']['Toggle Block Comment'];
                }
                if (CodeEditorViewer.selectionCommentable(widget)) {
                    sourceItems['Comment Out Selection'] = allItems.editMenuItems['&Source']['Comment Out Selection'];
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

                // Go to
                items['&Go to Definition'] = allItems.navMenuItems['&Go to Definition'];

                if (viewer.isDefaultKeyMap()) {
                    items['G&o to Line'] = allItems.navMenuItems['G&o to Line'];
                }

                if (viewer.isThereMatchingBracket()) {
                    items['Go to &Matching Brace'] = allItems.navMenuItems['Go to &Matching Brace'];
                }

                //TODO: widget._ternAddon -> viewer.getPlugin('tern')
                if (widget._ternAddon) {
                    widget._ternAddon.request(widget, {
                        type: 'rename',
                        newName: 'merong',
                        fullDocs: true
                    }, function(error/*, data*/) {
                        if (!error) {
                            sourceItems['&Rename Variables'] = allItems.editMenuItems['&Source']['&Rename Variables'];
                        }
                        deferred.resolve(items);
                    });
                } else {
                    deferred.resolve(items);
                }
            });

            return deferred;
        }
    });

    return CodeEditorContextMenu;
});

