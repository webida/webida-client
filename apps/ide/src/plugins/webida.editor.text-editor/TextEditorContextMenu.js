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
 * TextEditorContextMenu
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

/*jshint unused:false*/

// @formatter:off
define([
    'dojo/Deferred',
    'dojo/i18n!./nls/resource',
    'webida-lib/plugins/workbench/ui/PartContextMenu',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client'
], function (
    Deferred,
    i18n,
    PartContextMenu,
    genetic, 
    Logger
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    
    function TextEditorContextMenu(menuItems, part) {
        logger.info('new TextEditorContextMenu(menuItems, part)');
        PartContextMenu.apply(this, arguments);
    }


    genetic.inherits(TextEditorContextMenu, PartContextMenu, {

        /**
         * Creates Available Menu Items then return Thenable
         * @return {Thenable}
         */
        getAvailableItems: function () {

            var items = {};
            var menuItems = this.getAllItems();
            var deferred = new Deferred();
            var part = this.getPart();
            var viewer = part.getViewer();
            var widget = viewer.getWidget();
            //var selected = widget.getSelection();
            var registry = this.getPartRegistry();
            var editorParts = registry.getEditorParts();

            logger.info(part, viewer, widget, registry);

            // Close Others, Close All
            if (editorParts.length > 1) {
                items['Close O&thers'] = menuItems.fileMenuItems['Cl&ose Others'];
            }
            items['&Close All'] = menuItems.fileMenuItems['C&lose All'];

            // Undo, Redo
            var history = widget.getHistory();
            if (history) {
                if (history.done && history.done.length > 0) {
                    items['U&ndo'] = menuItems.editMenuItems['&Undo'];
                }
                if (history.undone && history.undone.length > 0) {
                    items['&Redo'] = menuItems.editMenuItems['&Redo'];
                }
            }

            // Save
            if (part.isDirty()) {
                items['&Save'] = menuItems.fileMenuItems['&Save'];
            }

            // Delete
            items['&Delete'] = menuItems.editMenuItems['&Delete'];

            // Select All, Select Line
            items['Select &All'] = menuItems.editMenuItems['Select &All'];
            items['Select L&ine'] = menuItems.editMenuItems['Select L&ine'];

            // Line
            var lineItems = {};

            // Line - Move Line Up, Move Line Down, Copy, Delete
            lineItems['&Indent'] = menuItems.editMenuItems['&Line']['&Indent'];
            lineItems['&Dedent'] = menuItems.editMenuItems['&Line']['&Dedent'];
            var pos = widget.getCursor();
            if (pos.line > 0) {
                lineItems['Move Line U&p'] = menuItems.editMenuItems['&Line']['Move Line U&p'];
            }
            if (pos.line < widget.lastLine()) {
                lineItems['Move Line Dow&n'] = menuItems.editMenuItems['&Line']['Move Line Dow&n'];
            }
            lineItems['D&elete Lines'] = menuItems.editMenuItems['&Line']['D&elete Lines'];
            lineItems['Move Cursor Line to Middle'] = menuItems.editMenuItems['&Line']['Move Cursor Line to Middle'];
            lineItems['Move Cursor Line to Top'] = menuItems.editMenuItems['&Line']['Move Cursor Line to Top'];
            lineItems['Move Cursor Line to Bottom'] = menuItems.editMenuItems['&Line']['Move Cursor Line to Bottom'];

            items['&Line'] = lineItems;
            items['&Line'].alternateLabel = menuItems.editMenuItems['&Line'].alternateLabel;

            // Go to
            if (viewer.isDefaultKeyMap()) {
                items['G&o to Line'] = menuItems.navMenuItems['G&o to Line'];
            }
            if (viewer.isThereMatchingBracket()) {
                items['Go to &Matching Brace'] = menuItems.navMenuItems['Go to &Matching Brace'];
            }

            deferred.resolve(items);

            return deferred;
        }
    });

    return TextEditorContextMenu;
});

