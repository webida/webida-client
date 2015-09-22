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
 * @since: 2015.09.17
 * @author: hw.shim
 */

// @formatter:off
define([
    'plugins/webida.editor.text-editor/TextChangeRequest',
    'webida-lib/plugins/workbench/ui/EditorModel',
    'webida-lib/plugins/workbench/ui/PartModel',
    'webida-lib/plugins/workbench/ui/PartModelEvent',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client'
], function(
    TextChangeRequest,
    EditorModel,
    PartModel,
    PartModelEvent,
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
                return this.getContents().join('\n').trim();
            } else {
                return '';
            }
        },

        update: function(delta) {
            logger.info('update(' + delta + ')');
            var modelEvent = new PartModelEvent();
            this.getContents().push(delta);
            modelEvent.setDelta(delta);
            modelEvent.setContents(this.getContents());
            this.emit(PartModel.CONTENTS_CHANGE, modelEvent);
        }
    });

    return SvgEditorModel;
});
