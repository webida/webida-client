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
 * EngineAdapter interface
 *
 * @constructor
 * @see EditorViewer, EngineAdapterFactory
 * @constructor
 * @since: 2015.07.11
 * @author: h.m.kwon
 * 
 */

define([
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client'
], function (
       genetic,
        logger
       ) {
    'use strict';

    function EngineAdapter() {
        logger.info('new EngineAdapter()');
    }

    genetic.inherits(EngineAdapter, Object, {
        start : function () {
            throw new Error('start() should be implemented by subclass');
        },

        destroy: function () {
            throw new Error('destroy() should be implemented by subclass');
        },

        addFocusListener: function (listener) {
            throw new Error('addFocusListener() should be implemented by subclass'); 
        },

        addBlurListener: function (listener) {
            throw new Error('addBlurListener() should be implemented by subclass'); 
        },

        addEventListener: function (type, listener) {
            throw new Error('addEventListener() should be implemented by subclass');
        },

        triggerEvent: function (type, event) {
            throw new Error('triggerEvent() should be implemented by subclass');
        },

        setSize: function (width, height) {
            throw new Error('setSize() should be implemented by subclass');
        },

        getKeymap: function () {
            throw new Error('getKeymap() should be implemented by subclass');
        },

        setKeymap: function (keymap) {
            throw new Error('setKeymap() should be implemented by subclass');
        },

        clearHistory: function () {
            throw new Error('clearHistory() should be implemented by subclass');
        },

        markClean: function () {
            throw new Error('markClean() should be implemented by subclass');
        },

        focus: function () {
            throw new Error('focus() should be implemented by subclass');
        },

        refresh: function () {
            throw new Error('refresh() should be implemented by subclass');
        },

        undo: function () {
            throw new Error('undo() should be implemented by subclass');
        },

        redo: function () {
            throw new Error('redo() should be implemented by subclass');
        },

        isDefaultKeyMap: function () {
            throw new Error('isDefaultKeyMap() should be implemented by subclass');
        },

        getWorkbenchShortcuts: function (desc) {
            throw new Error('getWorkbenchShortcuts() should be implemented by subclass');
        },

        getMenuItemsUnderEdit: function (items, menuItems, deferred) {
            throw new Error('getWorkbenchShortcuts() should be implemented by subclass');
        },

        getContextMenuItems: function (opened, items, menuItems, deferred) {
            throw new Error('getWorkbenchShortcuts() should be implemented by subclass');
        }
    });

    return EngineAdapter;
});