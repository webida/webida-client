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
 * SvgEditorModel
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'plugins/webida.editor.text-editor/TextChangeRequest',
    'webida-lib/plugins/workbench/ui/EditorModel',
    'webida-lib/plugins/workbench/ui/PartModel',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client'
], function(
    TextChangeRequest,
    EditorModel,
    PartModel,
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

    function SvgEditorModel(dataSource) {
        logger.info('new SvgEditorModel(' + dataSource + ')');
        EditorModel.apply(this, arguments);
    }


    genetic.inherits(SvgEditorModel, EditorModel, {

        createContents: function(data) {
            var contents = data.split('\n');
            this.setContents(contents);
            this.emit(PartModel.CONTENTS_CREATED, contents);
        },

        serialize: function() {
            var contents = this.getContents();
            if ( contents instanceof Array) {
                return this.getContents().join('\n');
            } else {
                return '';
            }
        },

        /**
         * @param {Object} delta
         */
        update: function(delta) {
            logger.info('update(' + delta + ')');
            this.getContents().push(delta);
            this.emit(PartModel.CONTENTS_CHANGE, delta);
        },

        syncFrom: function(otherModel, request) {
            if ( request instanceof TextChangeRequest) {
                this.createContents(request.contents);
            }
        },

        syncTo: function(otherModel, request) {
            console.log('request = ', request);
            var contents = otherModel.getContents();
            otherModel.setContents(contents + '\n' + request);
            console.log(otherModel.getContents());
        }
    });

    return SvgEditorModel;
});
