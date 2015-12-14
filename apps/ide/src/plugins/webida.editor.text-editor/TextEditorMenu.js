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
 * TextEditorMenu
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/plugins/workbench/ui/EditorPartMenu'
], function (
    genetic, 
    Logger,
    EditorPartMenu
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function TextEditorMenu(allItems, part) {
        logger.info('new TextEditorMenu(allItems, part)');
        EditorPartMenu.apply(this, arguments);
    }


    genetic.inherits(TextEditorMenu, EditorPartMenu, {

        _getAvailableEditItems: function () {
            logger.info('_getAvailableEditItems()');
            var items = {};
            var menuItems = this.getAllItems();
            var part = this.getPart();
            var viewer = part.getViewer();
            var editor;
            if (viewer) {
                editor = viewer.getWidget();

                // Undo, Redo
                var history = editor.getHistory();
                if (history) {
                    if (history.done && history.done.length > 0) {
                        items['&Undo'] = menuItems.editMenuItems['&Undo'];
                    }
                    if (history.undone && history.undone.length > 0) {
                        items['&Redo'] = menuItems.editMenuItems['&Redo'];
                    }
                }

                // Delete
                items['&Delete'] = menuItems.editMenuItems['&Delete'];

                // Select All, Select Line
                items['Select &All'] = menuItems.editMenuItems['Select &All'];
                items['Select L&ine'] = menuItems.editMenuItems['Select L&ine'];

                // Line
                items['&Line'] = {};
                items['&Line'].alternateLabel = menuItems.editMenuItems['&Line'].alternateLabel;

                // Line - Move Line Up, Move Line Down, Copy, Delete
                items['&Line']['&Indent'] = menuItems.editMenuItems['&Line']['&Indent'];
                items['&Line']['&Dedent'] = menuItems.editMenuItems['&Line']['&Dedent'];
                var pos = editor.getCursor();
                if (pos.line > 0) {
                    items['&Line']['Move Line U&p'] = menuItems.editMenuItems['&Line']['Move Line U&p'];
                }
                if (pos.line < editor.lastLine()) {
                    items['&Line']['Move Line Dow&n'] = menuItems.editMenuItems['&Line']['Move Line Dow&n'];
                }
                items['&Line']['D&elete Lines'] = menuItems.editMenuItems['&Line']['D&elete Lines'];
                
                // Source
                items['&Source'] = {};
                items['&Source'].alternateLabel = menuItems.editMenuItems['&Source'].alternateLabel;

                // Code Folding
                items['&Source']['&Fold'] = menuItems.editMenuItems['&Source']['&Fold'];
            }
            return items;
        },

        _getAvailableFindItems: function () {
            logger.info('_getAvailableFindItems()');
            var items = {};
            var menuItems = this.getAllItems();
            var part = this.getPart();
            var viewer = part.getViewer();
            if (viewer) {
                items['&Replace'] = menuItems.findMenuItems['&Replace'];
                items['F&ind'] = menuItems.findMenuItems['F&ind'];
                items['&Highlight to Find'] = menuItems.findMenuItems['&Highlight to Find'];
                if (viewer.execute('existSearchQuery')) {
                    items['Find &Next'] = menuItems.findMenuItems['Find &Next'];
                    items['Find &Previous'] = menuItems.findMenuItems['Find &Previous'];
                }
                return items;
            }
        }
    });

    return TextEditorMenu;
});
