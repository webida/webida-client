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
 * MultiContentExampleEditorPart
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'plugins/webida.editor.example.svg/SvgEditorPart',
    'plugins/webida.editor.code-editor/CodeEditorPart',
    'webida-lib/plugins/workbench/ui/MultiContentEditorPart',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client'
], function(
    SvgEditorPart,
    CodeEditorPart,
    MultiContentEditorPart,
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

    function MultiContentExampleEditorPart(container) {
        logger.info('new MultiContentExampleEditorPart(' + container + ')');
        MultiContentEditorPart.apply(this, arguments);
    }


    genetic.inherits(MultiContentExampleEditorPart, MultiContentEditorPart, {

        /**
         * Adds multi-contents
         */
        createContents: function() {
            this.addPart('svgEditor', 'Svg Editor', 0, SvgEditorPart);
            this.addPart('codeEditor', 'Code Editor', 1, CodeEditorPart);
        }
    });

    return MultiContentExampleEditorPart;
});

