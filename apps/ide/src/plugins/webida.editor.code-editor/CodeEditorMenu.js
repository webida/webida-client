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
 * CodeEditorMenu
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'dojo/Deferred',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'plugins/webida.editor.text-editor/TextEditorMenu'
], function (
    Deferred,
    genetic, 
    Logger,
    TextEditorMenu
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    logger.off();

    function CodeEditorMenu(allItems, part) {
        logger.info('new CodeEditorMenu(' + allItems + ', ' + part + ')');
        TextEditorMenu.apply(this, arguments);
    }


    genetic.inherits(CodeEditorMenu, TextEditorMenu, {

        _getAvailableEditItems: function () {
            logger.info('_getAvailableEditItems()');
            var items = TextEditorMenu.prototype._getAvailableEditItems.call(this);
            var deferred = new Deferred();
            var menuItems = this.getAllItems();
            var part = this.getPart();
            var viewer = part.getViewer();
            var editor, selected;
            if (part && viewer) {
                editor = viewer.getWidget();
                selected = editor.getSelection();

                // Toggle Comments
                if (editor._contentAssistDelegator) {
                    if (editor._contentAssistDelegator.execCommand('isLineCommentable', editor) ) {
                        items['&Source']['&Toggle Line Comments'] =
                            menuItems.editMenuItems['&Source']['&Toggle Line Comments'];
                    }
                    if (editor._contentAssistDelegator.execCommand('isBlockCommentable', editor) ) {
                        items['&Source']['Toggle Block Comment'] =
                            menuItems.editMenuItems['&Source']['Toggle Block Comment'];
                    }
                }

                // Code Folding
                items['&Source']['&Fold'] = menuItems.editMenuItems['&Source']['&Fold'];

                // Beautify (All)
                if (editor.getMode().name === 'javascript') {
                    if (selected) {
                        items['&Source']['&Beautify'] = menuItems.editMenuItems['&Source']['&Beautify'];
                    }
                    items['&Source']['B&eautify All'] = menuItems.editMenuItems['&Source']['B&eautify All'];
                }

                // Rename async
                if (editor._contentAssistDelegator) {
                    if (editor._contentAssistDelegator.canExecute('request')) {
                        editor._contentAssistDelegator.execCommand(
                            'request', editor,
                            {type: 'rename', newName: 'someName', fullDocs: true},
                            function (error/*, data*/) {
                                if (!error) {
                                    items['&Source']['&Rename Variables'] =
                                        menuItems.editMenuItems['&Source']['&Rename Variables'];
                                }
                                deferred.resolve(items);
                            }
                        );
                    } else {
                        deferred.resolve(items);                    
                    }
                } else {
                    deferred.resolve(items);
                }
            }
            return deferred;
        },

        _getAvailableNavigateItems: function () {
            var items = TextEditorMenu.prototype._getAvailableNavigateItems.call(this);
            var menuItems = this.getAllItems();
            var part = this.getPart();
            var viewer = part.getViewer();
            if (viewer) {
                items['&Go to Definition'] = menuItems.navMenuItems['&Go to Definition'];
                if (viewer.execute('isDefaultKeyMap')) {
                    items['G&o to Line'] = menuItems.navMenuItems['G&o to Line'];
                }
                if (viewer.execute('isThereMatchingBracket')) {
                    items['Go to &Matching Brace'] = menuItems.navMenuItems['Go to &Matching Brace'];
                }
            }
            return items;
        }
    });

    return CodeEditorMenu;
});
