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
 * FormEditorAdapter
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
    'webida-lib/plugins/workbench/ui/EditorWidgetAdapter',
    'webida-lib/plugins/workbench/ui/Viewer'
], function(
    EventEmitter,
    genetic, 
    Logger,
    EditorWidgetAdapter,
    Viewer
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function FormEditorAdapter(viewer) {
        logger.info('new FormEditorAdapter()');

        var that = this;
        var widget = $("<textarea style='font-size:9pt; width:90%; height:90%'></textarea>")[0];
        widget.addEventListener('keyup', function(e) {
            viewer.emit(Viewer.CONTENT_CHANGE, that.getContents());
        });
        this.setWidget(widget);
    }


    genetic.inherits(FormEditorAdapter, EditorWidgetAdapter, {

        setContents: function(contents) {
            this.getWidget().value = contents;
        },

        getContents: function() {
            return this.getWidget().value;
        }
    });

    return FormEditorAdapter;
});
