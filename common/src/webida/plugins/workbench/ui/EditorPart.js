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
 * An ancestor of all workbench editorParts.
 * This is an abstract constructor function.
 *
 * @see Part, EditorPart
 * @since: 2015.06.09
 * @author: hw.shim
 */

// @formatter:off
define([
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './Part'
], function(
    genetic,
    Logger,
    Part
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function EditorPart() {
        Part.apply(this, arguments);
        this.file = null;
        this.modelManager = null;
    }


    genetic.inherits(EditorPart, Part, {

        /**
         * Returns true if the model is updated
         * since last saved moment.
         *
         * @return {boolean}
         */
        isDirty: function() {
            var manager = this.getModelManager();
            return manager ? manager.canSaveModel() : false;
        },

        save: function(callback) {
            var that = this;
            var container = this.getContainer();
            this.emit(EditorPart.BEFORE_SAVE, this);
            this.getModelManager().saveModel(function() {
                that._execFunc(callback, that);
            });
        },

        saveAs: function() {
            throw new Error('saveAs() should be implemented by ' + this.constructor.name);
        },

        canSaveAs: function() {
            throw new Error('canSaveAs() should be implemented by ' + this.constructor.name);
        },

        toString: function() {
            var res = '<' + this.constructor.name + '>#' + this._partId;
            if (this.file) {
                res += '(' + this.file.name + ')';
            }
            return res;
        },

        /**
         * @private
         */
        _execFunc: function(callback, param) {
            if ( typeof callback === 'function') {
                callback(param);
            }
        },

        // ----------- TODO refactor the follwings ----------- //

        getValue: function() {
            throw new Error('getValue() should be implemented by ' + this.constructor.name);
        },
        markClean: function() {
            throw new Error('markClean() should be implemented by ' + this.constructor.name);
        },
        isClean: function() {
            throw new Error('isClean() should be implemented by ' + this.constructor.name);
        },
        addChangeListener: function() {
            throw new Error('addChangeListener() should be implemented by ' + this.constructor.name);
        },
        setFile: function(file) {
            this.file = file;
        },
        getFile: function() {
            return this.file;
        },
        getContextMenuItems: function(opened, items, menuItems, deferred) {
            deferred.resolve(items);
        }
    });

    return EditorPart;
});
