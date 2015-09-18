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
 * Interface
 * An ancestor of all EditorViewers.
 * This gives an interface of editor implements
 * (such as codemirror, ace) to the EditorPart.
 *
 * @constructor
 * @see TextEditorViewer, CodeEditorViewer
 * @since: 2015.06.25
 * @author: hw.shim
 *
 */

// @formatter:off
define([
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './PartViewer'
], function(
    genetic,
    Logger,
    PartViewer
) {
	'use strict';
// @formatter:on

    var logger = new Logger();

    function EditorViewer() {
        logger.info('new EditorViewer()');
        PartViewer.apply(this, arguments);
    }


    genetic.inherits(EditorViewer, PartViewer, {

        /**
         * Execute command for this EditorViewer
         * @param {Object} command
         * Command can be any form of object (String, Object)
         * @abstract
         */
        execute: function(command) {
            throw new Error('execute(command) should be implemented by ' + this.constructor.name);
        },

        /**
         * Whether this EditorViewer can execute given command
         * @param {Object} command
         * @return {boolean}
         * @abstract
         */
        canExecute: function(command) {
            throw new Error('canExecute(command) should be implemented by ' + this.constructor.name);
        },

        // ----------- TODO Legacy methods : To be refactored ----------- //

        addChangeListener: function(listener) {
            throw new Error('addChangeListener() should be implemented by ' + this.constructor.name);
        },

        addFocusListener: function(listener) {
            throw new Error('addFocusListener() should be implemented by ' + this.constructor.name);
        },

        addBlurListener: function(listener) {
            throw new Error('addBlurListener() should be implemented by ' + this.constructor.name);
        },

        addEventListener: function(type, listener) {
            throw new Error('addEventListener() should be implemented by ' + this.constructor.name);
        },

        triggerEvent: function(type, event) {
            throw new Error('triggerEvent() should be implemented by ' + this.constructor.name);
        },

        getKeymap: function() {
            throw new Error('getKeymap() should be implemented by ' + this.constructor.name);
        },

        setKeymap: function(keymap) {
            throw new Error('setKeymap() should be implemented by ' + this.constructor.name);
        },

        isClean: function() {
            throw new Error('isClean() should be implemented by ' + this.constructor.name);
        },

        clearHistory: function() {
            throw new Error('clearHistory() should be implemented by ' + this.constructor.name);
        },

        focus: function() {
            throw new Error('focus() should be implemented by ' + this.constructor.name);
        },

        undo: function() {
            throw new Error('undo() should be implemented by ' + this.constructor.name);
        },

        redo: function() {
            throw new Error('redo() should be implemented by ' + this.constructor.name);
        },

        isDefaultKeyMap: function() {
            throw new Error('isDefaultKeyMap() should be implemented by ' + this.constructor.name);
        },

        getWorkbenchShortcuts: function(desc) {
            throw new Error('getWorkbenchShortcuts() should be implemented by ' + this.constructor.name);
        },

        getMenuItemsUnderEdit: function(items, menuItems, deferred) {
            throw new Error('getMenuItemsUnderEdit() should be implemented by ' + this.constructor.name);
        },

        getContextMenuItems: function(opened, items, menuItems, deferred) {
            //TODO refactor the location of the implementaion
            deferred.resolve(items);
        }
    });

    return EditorViewer;
});
