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
 * File
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
    'webida-lib/plugins/workbench/ui/Persistence'
], function (
    EventEmitter,
    genetic, 
    Logger,
    Persistence
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function File(path) {
        logger.info('new File(' + path + ')');

        Persistence.call(this, path);

        if (path.slice(-1) === '/') {
            throw new Error('Path should be end with file name');
        }

        this.setPath(path);
    }


    genetic.inherits(File, Persistence, {

        /**
         * @param {string} file's path
         */
        setPath: function (path) {

            /** @type {string} a/b/c.d.e */
            this.path = path;

            /** @type {string} c.d.e */
            this.name = path.split(/[\\/]/).pop();

            /** @type {string} c.d */
            this.basename = this.name.replace(/(.*)\.(.*)$/, '$1');

            /** @type {string} e */
            this.extension = path.indexOf('.') >= 0 ? path.split('.').pop() : '';
        },

        /**
         * a/b/c.d.txt
         * @return {string} file's path
         */
        getPath: function () {
            return this.path;
        },

        /**
         * c.d.txt
         * @return {string} file's name
         */
        getName: function () {
            return this.name;
        },

        /**
         * c.d
         * @return {string} file's basename
         */
        getBaseName: function () {
            return this.basename;
        },

        /**
         * txt
         * @return {string} file's extension
         */
        getExtension: function () {
            return this.extension;
        },

        toString: function () {
            return '<' + this.constructor.name + '>#' + this._persistenceId + this.path;
        }
    });

    return File;
});
