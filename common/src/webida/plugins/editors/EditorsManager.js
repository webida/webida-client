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
 *
 * EditorsManager is a Mediator for EditorParts
 * EditorParts do not know each other,
 * only know their Mediator EditorsManager.
 *
 * @see
 * @since: 2015.07.19
 * @author: hw.shim
 */

// @formatter:off
define([
	'external/eventEmitter/EventEmitter',
	'dojo/topic',
	'webida-lib/plugins/workbench/plugin', //TODO : refactor
	'webida-lib/plugins/workbench/ui/Workbench',
	'webida-lib/plugins/workbench/ui/DataSource',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
], function(
	EventEmitter,
	topic,
	workbench,
	Workbench,
	DataSource,
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

    function EditorsManager() {
        logger.info('new EditorsManager()');

        /** @type {Object} */
        this.subscribed = {};

        //this.subscribe();
    }


    genetic.inherits(EditorsManager, EventEmitter, {

        /**
         * subscribe to topic
         */
        // @formatter:off
        subscribe: function() {
            this.subscribed['#REQUEST.openFile'] = topic.subscribe(
            	'#REQUEST.openFile', this.requestOpen.bind(this));
        },
        // @formatter:on

        unsubscribe: function() {
            for (var prop in this.subscribed) {
                this.subscribed[prop].remove();
            }
        },

        requestOpen: function(dataSourceId) {
            logger.info('requestOpen(' + dataSourceId + ')');

            var that = this;
            var dsRegistry = workbench.getDataSourceRegistry();

            //1. prepare DataSource
            var dataSource = dsRegistry.getDataSourceById(dataSourceId);
            if (dataSource === null) {
                workbench.on(Workbench.CREATE_DATA_SOURCE, function(dataSource) {
                    doWithData(dataSource);
                });
                workbench.createDataSource(dataSourceId);
            } else {
                doWithData(dataSource);
            }

            function doWithData(dataSource) {
                logger.info('doWithData(' + dataSource + ')');
                //2. create PartContainer
                //3. crate Part and add to PartContainer
                //4. dataSource.getContents(function(contents){
                //      part.setContents(contents);
                //   });
            }

        }
    });

    EditorsManager.DATA_SOURCE_OPENED = 'dataSourceOpened';

    return EditorsManager;
});

