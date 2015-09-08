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
 * CompatiblePartContainerWidgetAdapter
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'external/eventEmitter/EventEmitter',
    'external/lodash/lodash.min',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/widgets/views/view',
    './PartContainer',
    './PartContainerWidgetAdapter',
    './WidgetAdapter'
], function(
    EventEmitter,
    _,
    genetic, 
    Logger,
    View,
    PartContainer,
    PartContainerWidgetAdapter,
    WidgetAdapter
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     * @typedef {Object} HTMLElement
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function CompatiblePartContainerWidgetAdapter(container) {
        logger.info('new CompatiblePartContainerWidgetAdapter()');
        var dataSource = container.getDataSource();
        var persistence = dataSource.getPersistence();
        var viewId = _.uniqueId('view_');
        var widget = new View(viewId, persistence.getName());
        widget.set('closable', true);
        widget.setContent('<div style="width:100%; height:100%; overflow:hidden"></div>');
        //TODO remove persistence.viewId
        persistence.viewId = viewId;
        //TODO remove widget.partContainer
        widget.partContainer = container;
        dojo.connect(widget.contentPane, 'resize', function(changeSize) {
            container.emit(PartContainer.CONTAINER_RESIZE, changeSize);
        });
        this.setWidget(widget);
    }


    genetic.inherits(CompatiblePartContainerWidgetAdapter, PartContainerWidgetAdapter, {

        /**
         * @param {string} title
         */
        setTitle: function(title) {
            this.getWidget().setTitle(title);
        },

        /**
         * @param {string} tooltip
         */
        setToolTip: function(tooltip) {
            this.getWidget().setTooltip(tooltip);
        },

        /**
         * @return {HTMLElement}
         */
        getContentNode: function() {
            return this.getWidget().getContent();
        }
    });

    return CompatiblePartContainerWidgetAdapter;
});
