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
 * PartRegistry
 *
 * @see DataSource, Workbench, PartContainer, Part
 * @since: 2015.07.15
 * @author: hw.shim
 */

// @formatter:off
define([
	'dojo/topic',
	'external/eventEmitter/EventEmitter',
	'webida-lib/util/genetic',
	'webida-lib/util/logger/logger-client',
	'./DataSource',
	'./DataSourceRegistry',
	'./EditorPart',
	'./Part'
], function(
	topic,
	EventEmitter,
	genetic, 
	Logger,
	DataSource,
	DataSourceRegistry,
	EditorPart,
	Part
) {
	'use strict';
// @formatter:on

    /**
     * @typedef {Object.<Object, Object>} Map
     * @typedef {Object} EditorPart
     * @typedef {Object} Part
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function PartRegistry() {
        logger.info('new PartRegistry()');

        /** @type {Map.<DataSource, {Array.<Part>}>} */
        this.parts = new Map();

        /** @type {Map.<DataSource, {Map.<Function, EditorPart>}>} */
        this.recentEditorParts = new Map();

        /** @type {Array.<String>} */
        this.recentDataSourceIds = [];

        /** @type {EditorPart} */
        this.currentEditorPart = null;
    }


    genetic.inherits(PartRegistry, EventEmitter, {

        /**
         * @param {Part} part
         */
        registerPart: function(part) {
            if (!( part instanceof Part)) {
                throw new Error('part should implement Part interface');
            }
            var dataSource = part.getContainer().getDataSource();
            var parts = this.getParts();
            if (parts.has(dataSource) === false) {
                parts.set(dataSource, []);
            }
            parts.get(dataSource).push(part);
            this.emit(PartRegistry.PART_REGISTERED, part);
        },

        /**
         * @param {Part} part
         */
        unregisterPart: function(part) {
            logger.info('unregisterPart(' + part + ')');
            var dataSource = part.getContainer().getDataSource();
            var parts = this.getParts();
            if (parts.has(dataSource) === true) {
                var partsOfDs = parts.get(dataSource);
                var index = partsOfDs.indexOf(part);
                partsOfDs.splice(index, 1);
                if (partsOfDs.length === 0) {
                    parts['delete'](dataSource);
                }
                this.emit(PartRegistry.PART_UNREGISTERED, part);
                if (this.getEditorParts().length === 0) {
                    this.setCurrentEditorPart(null);
                    topic.publish('editor/not-exists');
                }
            }
        },

        /**
         * @param {DataSource} dataSource
         * @return {Array} Parts related to the specified dataSource.
         * If not found returns undefined.
         */
        getPartsByDataSource: function(dataSource) {
            return this.getParts().get(dataSource) || [];
        },

        /**
         * @param {DataSource} dataSource
         * @param {Function} PartClass
         * @return {Array} Parts with DataSource and PartClass
         */
        getPartsByClass: function(dataSource, PartClass) {
            var partsOfDs = this.getPartsByDataSource(dataSource);
            var result = [];
            if (partsOfDs) {
                partsOfDs.forEach(function(part) {
                    if ( part instanceof PartClass) {
                        result.push(part);
                    }
                });
            }
            return result;
        },

        /**
         * @param {DataSource} dataSource
         * @param {string} PartClassName
         * @return {Array} Parts with DataSource and PartClass
         */
        getPartsByClassName: function(dataSource, PartClassName) {
            var partsOfDs = this.getPartsByDataSource(dataSource);
            var result = [];
            if (partsOfDs) {
                partsOfDs.forEach(function(part) {
                    if (part.constructor === PartClassName) {
                        result.push(part);
                    }
                });
            }
            return result;
        },

        /**
         * Remember recently opened EditorPart
         * @param {EditorPart} part
         */
        setRecentEditorPart: function(part) {
            logger.info('setRecentEditorPart(' + part + ')');
            if ( part instanceof EditorPart) {
                var dataSource = part.getContainer().getDataSource();
                if (this.recentEditorParts.has(dataSource) === false) {
                    this.recentEditorParts.set(dataSource, new Map());
                }
                this.recentEditorParts.get(dataSource).set(part.constructor, part);
            }
        },

        /**
         * @param {DataSource} dataSource
         * @param {Function} PartClass
         * @return {EditorPart} Recently opened EditorPart with given DataSource
         * and PartClass. If not found returns undefined.
         */
        getRecentEditorPart: function(dataSource, PartClass) {
        	logger.info('getRecentEditorPart('+dataSource+', PartClass)');
            if (this.recentEditorParts.has(dataSource)) {
                var partsOfDs = this.recentEditorParts.get(dataSource);
                logger.info('return --> ' + partsOfDs.get(PartClass));
                return partsOfDs.get(PartClass);
            }
        },

        /**
         * Remember recently opened DataSource's Id
         * @param {String} dataSourceId
         */
        setRecentDataSourceId: function(dataSourceId) {
            logger.info('setRecentDataSourceId(' + dataSourceId + ')');
            var recents = this.getRecentDataSourceIds();
            var index = recents.indexOf(dataSourceId);
            if (index >= 0) {
                recents.splice(index, 1);
            }
            if (recents.length >= 20) {
                recents.shift();
            }
            recents.push(dataSourceId);
        },

        /**
         * Returns recently opened DataSources's Ids
         * @param {Array.<String>}
         */
        getRecentDataSourceIds: function() {
            return this.recentDataSourceIds;
        },

        /**
         * Remember currently focused EditorPart
         * This method calls setRecentEditorPart()
         * @see setRecentEditorPart()
         * @param {EditorPart} part
         */
        setCurrentEditorPart: function(part) {
            logger.info('setCurrentEditorPart(' + part + ')');
            if (part === null || part instanceof EditorPart) {
                var oldPart = this.getCurrentEditorPart();
                this.currentEditorPart = part;
                this.setRecentEditorPart(part);
                //For compatibility 1.3.0
                //TODO : remove with editors.setCurrentFile
                topic.publish('current-part-changed', oldPart, part);
            }
        },

        /**
         * Returns currently focused EditorPart
         * @return {EditorPart}
         */
        getCurrentEditorPart: function() {
            return this.currentEditorPart;
        },

        /**
         * @return {Map.<DataSource, {Array.<Part>}>} PartMap
         */
        getParts: function() {
            return this.parts;
        },

        /**
         * @return {Array.<Part>} Dirty state Part array
         */
        getDirtyParts: function() {
            var dirtyParts = [];
            this.getParts().forEach(function(parts, dataSource) {
                parts.forEach(function(part) {
                    if (part.isDirty()) {
                        dirtyParts.push(part);
                    }
                });
            });
            return dirtyParts;
        },

        /**
         * @return {Array.<EditorPart>} EditorPart array
         */
        getEditorParts: function() {
            var editorParts = [];
            this.getParts().forEach(function(parts, dataSource) {
                parts.forEach(function(part) {
                    if ( part instanceof EditorPart) {
                        editorParts.push(part);
                    }
                });
            });
            return editorParts;
        },

        /**
         * @return {Array.<ViewPart>} ViewPart array
         */
        getViewParts: function() {
            var viewParts = [];
            this.getParts().forEach(function(parts, dataSource) {
                parts.forEach(function(part) {
                    if ( part instanceof ViewPart) {
                        viewParts.push(part);
                    }
                });
            });
            return viewParts;
        }
    });

    /** @type {string} */
    PartRegistry.PART_REGISTERED = 'partRegistered';

    /** @type {string} */
    PartRegistry.PART_UNREGISTERED = 'partUnregistered';

    return PartRegistry;
});
