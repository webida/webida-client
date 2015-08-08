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
    './Viewer'
], function(
    genetic,
    Logger,
    Viewer
) {
	'use strict';
// @formatter:on

    var logger = new Logger();

    function EditorViewer() {
        logger.info('new EditorViewer()');
		Viewer.apply(this, arguments);
    }


    genetic.inherits(EditorViewer, Viewer, {

        addChangeListener: function(listener) {
            throw new Error('addChangeListener() should be implemented by subclass');
        },

        addFocusListener: function(listener) {
            throw new Error('addFocusListener() should be implemented by subclass');
        },

        addBlurListener: function(listener) {
            throw new Error('addBlurListener() should be implemented by subclass');
        },

        addEventListener: function(type, listener) {
            throw new Error('addEventListener() should be implemented by subclass');
        },

        triggerEvent: function(type, event) {
            throw new Error('triggerEvent() should be implemented by subclass');
        },

        getKeymap: function() {
            throw new Error('getKeymap() should be implemented by subclass');
        },

        setKeymap: function(keymap) {
            throw new Error('setKeymap() should be implemented by subclass');
        },

        isClean: function() {
            throw new Error('isClean() should be implemented by subclass');
        },

        clearHistory: function() {
            throw new Error('clearHistory() should be implemented by subclass');
        },

        markClean: function() {
            throw new Error('markClean() should be implemented by subclass');
        },

        focus: function() {
            throw new Error('focus() should be implemented by subclass');
        },

        undo: function() {
            throw new Error('undo() should be implemented by subclass');
        },

        redo: function() {
            throw new Error('redo() should be implemented by subclass');
        },

        isDefaultKeyMap: function() {
            throw new Error('isDefaultKeyMap() should be implemented by subclass');
        },

        getWorkbenchShortcuts: function(desc) {
            throw new Error('getWorkbenchShortcuts() should be implemented by subclass');
        },

        getMenuItemsUnderEdit: function(items, menuItems, deferred) {
            throw new Error('getWorkbenchShortcuts() should be implemented by subclass');
        },
        
        getContextMenuItems: function(opened, items, menuItems, deferred) {
            deferred.resolve(items);
        },
    });

    return EditorViewer;
});
