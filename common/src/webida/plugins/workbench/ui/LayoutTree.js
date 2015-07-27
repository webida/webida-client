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
 * LayoutTree
 *
 * This Class is binary tree node.
 *
 * TODO
 * [Layout Splitting Process]
 *
 * 1. setOrientation(0|1) //Select position
 * 2. setRatio([0.5, 0.5]) //Splits into two
 * 3. insertChild(new LayoutTree, index)
 *    //Add new LayoutTree with specified index
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
     * @typedef {Object} DataSource
     * @typedef {Object} LayoutTree
     * @typedef {Object} Rectangle
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function LayoutTree(id) {
        logger.info('new LayoutTree(' + id + ')');

        /**
         * @type {string}
         */
        this.id = id;

        /**
         * In the case of non-splitted LayoutTree instance,
         * this value is null.
         * @type {number} HORIZONTAL(0) | VERTICAL(1)
         */
        this.orientation = null;

        /**
         * The ratio of splitted child nodes
         * For example, [0.65, 0.35]
         * In the case of non-splitted LayoutTree instance,
         * this ratio is null.
         * @type {Array.<number, number>}
         */
        this.ratio = null;

        /**
         * @type {LayoutTree}
         */
        this.parent = null;

        /**
         * A layout model to be rendered
         * @type {Array.<LayoutTree>}
         */
        this.children = [];

        /**
         * @type {Rectangle}
         */
        this.bounds = null;
    }


    genetic.inherits(LayoutTree, EventEmitter, {

        /**
         * @example
         * new LayoutTree('webida.layout_pane.left')
         * @return {string} layout tree's id
         */
        getId: function() {
            return this.id;
        },

        /**
         *
         *
         * @param {LayoutTree} layoutTree
         * @param {number} [index=LayoutTree.FIRST] (LayoutTree.FIRST |
         * LayoutTree.SECOND)
         */
        insertChild: function(layoutTree, index) {
            if (arguments.length === 1) {
                index = LayoutTree.FIRST;
            }
            var children = this.getChildren();
            if (children[index]) {
                throw new Error(index + 'node already exists');
            }
            children[index] = layoutTree;
            layoutTree.setParent(this);
        },

        /**
         * @param {number} index
         */
        removeChild: function(index) {
            var children = this.getChildren();
            this.getChild(index).setParent(null);
            children.splice(index, 1);
        },

        /**
         * @return {Map.<number, LayoutTree>}
         */
        getChildren: function() {
            return this.children;
        },

        /**
         * @param {number} index
         * @return {LayoutTree}
         */
        getChild: function(index) {
            return this.getChildren()[index];
        },

        /**
         * @param {LayoutTree} parent
         */
        setParent: function(parent) {
            this.parent = parent;
        },

        /**
         * @return {LayoutTree} Parent node
         */
        getParent: function() {
            return this.parent;
        },

        /**
         * @param {number} orientation HORIZONTAL(0) | VERTICAL(1)
         */
        setOrientation: function(orientation) {
            this.orientation = orientation;
        },

        /**
         * @return {number} HORIZONTAL(0) | VERTICAL(1)
         */
        getOrientation: function() {
            return this.orientation;
        },

        /**
         * @param {Array.<number, number>}
         */
        setRatio: function(ratio) {
            this.ratio = ratio;
        },

        /**
         * @return {Array.<number, number>}
         */
        getRatio: function() {
            return this.ratio;
        },

        /**
         * @param {Rectangle} bounds
         */
        setBounds: function(bounds) {
            this.bounds = bounds;
            this.emit(LayoutTree.BOUNDS_CHANGED, bounds);
        },

        /**
         * @return {Rectangle} bounds
         */
        getBounds: function() {
            return this.bounds;
        },

        /**
         * Retrive child from this LayoutTree by assigned id
         * @param {string} layout tree's id
         * @return {LayoutTree}
         */
        getChildById: function(id) {
            var child;
            var result;
            var children = this.getChildren();
            for (var i in children) {
                child = children[i];
                if (child.getId() === id) {
                    return child;
                } else {
                    result = child.getChildById(id);
                    if ( result instanceof LayoutTree) {
                        return result;
                    }
                }
            }
            return null;
        }
    });

    LayoutTree.HORIZONTAL = 0;
    LayoutTree.VERTICAL = 1;
    LayoutTree.FIRST = 0;
    LayoutTree.SECOND = 1;
    LayoutTree.BOUNDS_CHANGED = 'boundsChanged';

    return LayoutTree;
});
