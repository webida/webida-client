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
 * FormEditorViewer
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
    'webida-lib/plugins/workbench/ui/EditorViewer'
], function(
    EventEmitter,
    genetic, 
    Logger,
    EditorViewer
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function FormEditorViewer() {
        logger.info('new FormEditorViewer()');
        this.form = null;
    }


    genetic.inherits(FormEditorViewer, EditorViewer, {

        /**
         * Creates Viewer Element
         */
        create: function() {
        	var that = this;
            var container = this.getContainerElement();
            if (container) {
                this.form = $("<textarea style='font-size:9pt; width:90%; height:90%'></textarea>")[0];
                container.appendChild(this.form);
                this.form.addEventListener('keyup', function(e) {
					if(e.target.value !== that.getModel().getText()){
						that.getModel().update(e.target.value, that);
					}
                });
            }
        },

        setModel: function(doc) {
            EditorViewer.prototype.setModel.call(this, doc);
            this.refresh();
        },

        refresh: function() {
            logger.info('refresh()', this.getModel().getText());
            logger.info('this.form = ', this.form);
            this.form.value = this.getModel().getText();
        }
    });

    return FormEditorViewer;
});
