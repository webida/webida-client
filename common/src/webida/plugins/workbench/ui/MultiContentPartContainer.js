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
 * MultiContentPartContainer
 *
 * @see
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './MultiContentPartContainerWidgetAdapter',
    './PartContainer'
], function(
    genetic, 
    Logger,
    MultiContentPartContainerWidgetAdapter,
    PartContainer
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function MultiContentPartContainer(dataSource, contentPane) {
        logger.info('new MultiContentPartContainer(' + dataSource + ', ' + contentPane + ')');
        this.setContentPane(contentPane);
        PartContainer.call(this, dataSource);
        var contentNode = $('<div style="width:100%; height:100%; overflow:hidden"></div>')[0];
        contentPane.domNode.appendChild(contentNode);
        this.setContentNode(contentNode);
    }


    genetic.inherits(MultiContentPartContainer, PartContainer, {

        /**
         * @override
         */
        createWidgetAdapter: function() {
            logger.info('createWidgetAdapter()');
            this.setWidgetAdapter(new MultiContentPartContainerWidgetAdapter(this));
        },

        setContentPane: function(contentPane) {
            this.contentPane = contentPane;
        },

        getContentPane: function(contentPane) {
            return this.contentPane;
        },

        updateDirtyState: function() {
            this.getParent().updateDirtyState();
        }
    });

    return MultiContentPartContainer;
});
