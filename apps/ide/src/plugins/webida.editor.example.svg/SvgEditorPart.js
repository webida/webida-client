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
 * SvgEditorPart
 *
 * @see
 * @since: 2015.09.17
 * @author: hw.shim
 */

// @formatter:off
define([
    'plugins/webida.editor.text-editor/Document',
    'webida-lib/plugins/workbench/ui/EditorPart',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './SvgEditorModel',
    './SvgEditorModelCommand',
    './SvgEditorModelManager',
    './SvgEditorViewer'
], function(
    Document,
    EditorPart,
    genetic,
    Logger,
    SvgEditorModel,
    SvgEditorModelCommand,
    SvgEditorModelManager,
    SvgEditorViewer
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} ChangeRequest
     * @typedef {Object} EditorViewer
     * @typedef {Object} HTMLElement
     * @typedef {Object} SvgEditorModelCommand
     * @typedef {Object} SvgEditorModel
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function SvgEditorPart(container) {
        logger.info('new SvgEditorPart(' + container + ')');
        EditorPart.apply(this, arguments);
    }


    genetic.inherits(SvgEditorPart, EditorPart, {

        /**
         * @param {HTMLElement} parentNode
         * @return {EditorViewer}
         */
        createViewer: function(parentNode) {
            var viewer = new SvgEditorViewer(parentNode);
            this.setViewer(viewer);
            return viewer;
        },

        /**
         * @return {SvgEditorModel}
         */
        createModel: function() {
            logger.info('%c createModel()', 'color:green');
            this.setModelManager(new SvgEditorModelManager(this.getDataSource()));
            var model = this.getModelManager().getSynchronized(SvgEditorModel);
            this.getModelManager().synchronize(Document);
            this.setModel(model);
            return model;
        },

        /**
         * @param {ChangeRequest} request
         * @return {SvgEditorModelCommand}
         */
        getCommand: function(request) {
            logger.info('getCommand(' + request + ')');
            return new SvgEditorModelCommand(this.getModel(), request);
        }
    });

    return SvgEditorPart;
});
