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
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/plugins/workbench/ui/EditorModelManager',
    'webida-lib/plugins/workbench/ui/EditorPart',
    './SvgEditorViewer',
    './SvgEditorModel',
    './SvgEditorModelCommand'
], function(
    Document,
    genetic,
    Logger,
    EditorModelManager,
    EditorPart,
    SvgEditorViewer,
    SvgEditorModel,
    SvgEditorModelCommand
) {
    'use strict';
// @formatter:on

    /**
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
            this.setModelManager(new EditorModelManager(this.getDataSource(), SvgEditorModel));
            var model = this.getModelManager().getSynchronizedModel();
            this.getModelManager().synchronize(Document);
            this.setModel(model);
            return model;
        },

        /**
         * @return {SvgEditorModelCommand}
         */
        getCommand: function(request) {
            return new SvgEditorModelCommand(this.getModel(), request);
        }
    });

    return SvgEditorPart;
});
