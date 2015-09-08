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
 * FormEditorViewer
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'external/eventEmitter/EventEmitter',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/plugins/workbench/ui/EditorViewer',
    'webida-lib/plugins/workbench/ui/Viewer',
    './FormEditorAdapter'
], function(
    EventEmitter,
    genetic, 
    Logger,
    EditorViewer,
    Viewer,
    FormEditorAdapter
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function FormEditorViewer() {
        logger.info('new FormEditorViewer()');
        EditorViewer.apply(this, arguments);
        this.form = null;
    }


    genetic.inherits(FormEditorViewer, EditorViewer, {

        /**
         * Creates Viewer Element
         */
        createAdapter: function(parentNode) {
            if (parentNode) {
                var adapter = new FormEditorAdapter(this);
                this.setAdapter(adapter);
                this.setParentNode(parentNode);
                parentNode.appendChild(adapter.getWidget());
            }
        },

        render: function(contents) {
            logger.info('render(' + contents + ')');
            this.getAdapter().setContents(contents);
        },

        getContextMenuItems: function(opened, items, menuItems, deferred) {
            logger.info('getContextMenuItems(' + opened + ', items, menuItems, deferred)', items, menuItems);
            items['Select &All'] = menuItems.editMenuItems['Select &All'];
            deferred.resolve(items);
        },

        selectAll: function() {
            this.form.select();
        },

        getFoldings: function() {

        },

        /**
         * @override
         */
        getMenuItemsUnderEdit: function() {

        },

        /**
         * @override
         */
        isDefaultKeyMap: function() {

        },

        existSearchQuery: function() {

        },

        isThereMatchingBracket: function() {

        }
    });

    return FormEditorViewer;
});
