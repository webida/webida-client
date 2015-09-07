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
 * CompatibleTabPartContainer
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'dojo/topic',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/plugins/workbench/ui/CompatiblePartContainerWidgetAdapter',
    'webida-lib/plugins/workbench/ui/EditorPart',
    'webida-lib/plugins/workbench/ui/TabPartContainer'
], function(
    topic,
    genetic, 
    Logger,
    workbench,
    CompatiblePartContainerWidgetAdapter,
    EditorPart,
    TabPartContainer
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function CompatibleTabPartContainer(dataSource) {
        logger.info('new CompatibleTabPartContainer(' + dataSource + ')');
        TabPartContainer.call(this, dataSource);
    }


    genetic.inherits(CompatibleTabPartContainer, TabPartContainer, {

        /**
         * @override
         */
        createWidgetAdapter: function() {
            logger.info('createWidgetAdapter()');
            var adapter = new CompatiblePartContainerWidgetAdapter(this);
            this.setWidgetAdapter(adapter);
            this.setContentNode(adapter.getContentNode());
        },

        /**
         * @override
         */
        setTitle: function(title) {
            TabPartContainer.prototype.setTitle.call(this, title);
            if (this.getWidgetAdapter()) {
                this.getWidgetAdapter().setTitle(title);
            }
        },

        setToolTip: function(tooltip) {
            TabPartContainer.prototype.setToolTip.call(this, tooltip);
            if (this.getWidgetAdapter()) {
                this.getWidgetAdapter().setToolTip(tooltip);
            }
        },

        setTitleImage: function(titleImage) {
            //TODO
        },

        /**
         * Convenient method for LayoutPane.CONTAINER_SELECT event
         * @see LayoutPane
         * @override
         */
        onSelect: function() {
            var part = this.getPart();
            var registry = this._getRegistry();
            var currentPart = registry.getCurrentEditorPart();
            if ( part instanceof EditorPart) {
                registry.setCurrentEditorPart(part);
                topic.publish('partContainerSelected', this);
            }
        }
    });

    return CompatibleTabPartContainer;
});
