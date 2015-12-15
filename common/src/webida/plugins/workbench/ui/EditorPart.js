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
 * An ancestor of all workbench editorParts.
 * This is an abstract constructor function (class).
 * This class can check dirty state, save model to a persistence.
 * This acts as a controller for mvc architecture for the editor.
 *
 * @see Part, ViewPart
 * @since: 2015.06.09
 * @author: hw.shim@samsung.com
 */

// @formatter:off
define([
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './editorDialog',
    './EditorPartMenu',
    './Part'
], function (
    genetic,
    Logger,
    editorDialog,
    EditorPartMenu,
    Part
) {
    'use strict';
// @formatter:on

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    /**
     * Creates a new EditorPart.
     * @constructor
     * @extends Part
     */
    function EditorPart(container) {
        Part.call(this, container);
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
        isDirty: function () {
            var manager = this.getModelManager();
            return manager ? manager.canSaveModel() : false;
        },

        /**
         * Saves the contents of this part.
         * @param {EditorPart~saveCallback} callback
         */
        /**
         * @callback EditorPart~saveCallback
         * @param {Part} part
         */
        save: function (callback) {
            logger.info('save(' + typeof callback + ')');
            var that = this;
            if (this.getModelManager()) {
                this.getModelManager().saveModel(function () {
                    that._execFunc(callback, that);
                });
            }
        },

        /**
         * Saves the contents of this part to another object.
         * @abstract
         */
        saveAs: function () {
            throw new Error('saveAs() should be implemented by ' + this.constructor.name);
        },

        /**
         * Returns whether the "Save As" operation is
         * supported by this part.
         * @abstract
         */
        canSaveAs: function () {
            throw new Error('canSaveAs() should be implemented by ' + this.constructor.name);
        },

        /**
         * Let this part to take focus within the workbench.
         * Basically does noting.
         */
        focus: function () {
            logger.info('focus() //do nothing');
        },

        /**
         * Closes EditorPart
         * @param {boolean} isForced
         */
        close: function (isForced) {
            logger.info('close(' + isForced + ')');
            var that = this;
            if (!isForced && this.isDirty()) {
                this._askSaveThen(function () {
                    Part.prototype.close.call(that);
                });
            } else {
                Part.prototype.close.call(this);
            }
        },

        /**
         * Reset model it's last saved state
         */
        resetModel: function () {
            logger.info('resetModel()');
            if (this.getModelManager()) {
                this.getModelManager().resetModel();
            }
        },

        /**
         * @See Part's onViewerChange()
         * @param {ChangeRequest} request
         */
        onViewerChange: function (request) {
            logger.info('onViewerChange(' + request + ')');
            var command = this.getCommand(request);
            if (this.hasCommandStack()) {
                this.getCommandStack().execute(command);
            } else {
                command.execute();
            }
        },

        /**
         * @See Part's onModelChange()
         * @param {PartModelEvent} modelEvent
         */
        onModelChange: function (modelEvent) {
            logger.info('onModelChange(' + modelEvent + ')');
            this.getViewer().render(modelEvent.getDelta());
        },

        /**
         * Returns PartMenu that consists of menu-items for this Part
         * @see Part
         * @override
         * @protected
         * @return {PartMenu}
         */
        _getMenuClass: function () {
            return EditorPartMenu;
        },

        /**
         * @override
         * @return {string}
         */
        toString: function () {
            var res = '<' + this.constructor.name + '>#' + this._partId;
            if (this.file) {
                res += '(' + this.file.name + ')';
            }
            return res;
        },

        /**
         * @protected
         * TODO : refactor
         */
        _askSaveThen: function (callback) {
            var file = this.getDataSource().getPersistence();
            editorDialog.create(file, 'Close', callback);
        }
    });

    return EditorPart;
});
