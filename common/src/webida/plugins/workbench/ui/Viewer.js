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
 * Viewer
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
    './DataSource'
], function(
    EventEmitter,
    genetic, 
    Logger,
    DataSource
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} HTMLElement
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function Viewer() {
        logger.info('new Viewer()');

        /** @type {HTMLElement} */
        this.containerElement = null

        /** @type {width:number|string, height:number|string} */
        this.dimension = null;
    }


    genetic.inherits(Viewer, Object, {

        create: function() {
            throw new Error('create() should be implemented by ' + this.constructor.name);
        },

        destroy: function() {
            throw new Error('destroy() should be implemented by ' + this.constructor.name);
        },

        refresh: function() {
            throw new Error('refresh() should be implemented by ' + this.constructor.name);
        },

        setModel: function(model) {
            this.model = model;
        },

        getModel: function(model) {
            return this.model;
        },

        /**
         * @param {HTMLElement} element
         */
        setContainerElement: function(element) {
            //TODO remove this.elem
            this.elem = element;
            this.containerElement = element;
        },

        getContainerElement: function() {
            return this.containerElement;
        },

        setSize: function(width, height) {
            this.dimension = {
                width: width,
                height: height
            };
        }
    });

    return Viewer;
});
