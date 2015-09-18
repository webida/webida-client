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
 * SvgEditorModelCommand
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'webida-lib/plugins/workbench/ui/PartModelCommand',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client'
], function(
    PartModelCommand,
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

    function SvgEditorModelCommand(model, request) {
        logger.info('new SvgEditorModelCommand(' + model + ', ' + request + ')');
        this.setModel(model);
        this.setRequest(request);
    }


    genetic.inherits(SvgEditorModelCommand, PartModelCommand, {

        execute: function() {
            var request = this.getRequest();
            var delta = request.getDelta();
            this.getModel().update(delta);
        }
    });

    return SvgEditorModelCommand;
});
