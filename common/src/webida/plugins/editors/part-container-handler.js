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
 * Event Handler module for PartContainer
 *
 * @see
 * @since: 2015.12.04
 * @author: hw.shim@samsung.com
 */

// @formatter:off
define([
    'dojo/topic',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './plugin'
], function (
    topic,
    workbench,
    genetic, 
    Logger,
    editors
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    logger.off();

    var partContainerHandler = {

        /**
         * For legacy view system compatibility
         * @private
         */
        _onEditorRemoved: function (container, view) {
            editors.editorTabFocusController.unregisterView(view);
        },

        /**
         * For legacy view system compatibility
         * @private
         */
        _onNoEditor: function () {
            topic.publish('editor/clean/all');
            topic.publish('editor/clean/current');
        },

        /**
         * For legacy view system compatibility
         * @private
         */
        _onEditorSelected: function (oldPart, newPart) {

            if (oldPart !== newPart) {

                if (oldPart) {
                    var oldContainer = oldPart.getContainer();
                    if (oldContainer) {
                        var oldView = oldContainer.getWidgetAdapter().getWidget();
                        workbench.unregistFromViewFocusList(oldView);
                    }
                }

                if (newPart) {
                    var newContainer = newPart.getContainer();
                    var newView = newContainer.getWidgetAdapter().getWidget();
                    workbench.registToViewFocusList(newView, {title: 'Editor', key: 'E'});
                }
            }
        }
    };

    return partContainerHandler;
});
