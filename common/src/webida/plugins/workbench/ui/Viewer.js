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

    var _viewerId = 0;

    function Viewer() {
        logger.info('new Viewer()');
        this._viewerId = ++_viewerId;

        /** @type {HTMLElement} */
        this.parentNode = null

        /** @type {width:number|string, height:number|string} */
        this.dimension = null;

        /** @type {Object} */
        this.contents = null;
    }


    genetic.inherits(Viewer, Object, {

        /**
         * @param {HTMLElement} parentNode
         */
        createAdapter: function(parentNode) {
            throw new Error('createAdapter(parentNode) should be implemented by ' + this.constructor.name);
        },

        destroyAdapter: function() {
            throw new Error('destroyAdapter() should be implemented by ' + this.constructor.name);
        },

        refresh: function() {
            throw new Error('refresh() should be implemented by ' + this.constructor.name);
        },

        setContents: function(contents) {
            this.contents = contents;
        },

        getContents: function(contents) {
            return this.contents;
        },

        /**
         * @param {HTMLElement} element
         */
        setParentNode: function(element) {
            //TODO remove this.elem
            this.elem = element;
            this.parentNode = element;
        },

        getParentNode: function() {
            return this.parentNode;
        },

        setSize: function(width, height) {
            this.dimension = {
                width: width,
                height: height
            };
        },

        toString: function() {
            var res = '<' + this.constructor.name + '>#' + this._viewerId;
            return res;
        }
    });

    return Viewer;
});
