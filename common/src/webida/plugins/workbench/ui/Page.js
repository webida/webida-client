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
 * Page
 *
 * @see EventEmitter, PartContainer, Part
 * @since: 2015.07.12
 * @author: hw.shim
 */

// @formatter:off
define([
	'webida-lib/util/genetic',
	'webida-lib/util/logger/logger-client',
	'./LayoutPane',
	'./LayoutTree',
	'./PartRegistry'
], function (
	genetic, 
	Logger,
	LayoutPane,
	LayoutTree,
	PartRegistry
) {
	'use strict';
// @formatter:on

    /**
     * @typedef {Object} PartRegistry
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function Page(id, name) {
        logger.info('new Page(' + id + ', ' + name + ')');

        LayoutTree.call(this, id);
        this.setName(name);

        /** @type {PartRegistry} */
        this.partRegistry = new PartRegistry();
    }


    genetic.inherits(Page, LayoutTree, {

        setName: function (name) {
            /** @type {string} */
            this.name = name;
        },

        getName: function () {
            return this.name;
        },

        /**
         * @return {PartRegistry}
         */
        getPartRegistry: function () {
            return this.partRegistry;
        },

        /**
         * Returns parts that only included in LayoutPanes,
         * not nested parts such as MultiContentEditorPart's nested parts.
         * @param {Function} [PartType]
         * @return {Array.<Part>}
         */
        getExposedParts: function (PartType) {
            var parts = [];
            function walk(layoutTree) {
                var children = layoutTree.getChildren();
                if (children.length > 0) {
                    children.forEach(function (child) {
                        if (child instanceof LayoutPane) {
                            child.getPartContainers().forEach(function (container) {
                                if (typeof PartType === 'function') {
                                    if (container.getPart() instanceof PartType) {
                                        parts.push(container.getPart());
                                    }
                                } else {
                                    parts.push(container.getPart());
                                }
                            });
                            walk(child);
                        }
                    });
                }
            }
            walk(this);
            return parts;
        }
    });

    return Page;
});
