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

    function LayoutTree() {
        logger.info('new LayoutTree()');

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
         * @type {Map.<number, LayoutTree>}
         */
        this.children = new Map();

        /**
         * @type {Rectangle}
         */
        this.bounds = null;
    }


    genetic.inherits(LayoutTree, EventEmitter, {

        /**
         *
         *
         * @param {LayoutTree} layoutTree
         * @param {number} [orientation] HORIZONTAL(0) | VERTICAL(1)
         * @param {number} [index] (LayoutTree.FIRST | LayoutTree.SECOND)
         */
        insertChild: function(layoutTree, orientation, index) {
            if (arguments.length === 1) {
                var children = this.getChildren();
                if (children.has(LayoutTree.FIRST)) {
                    throw new Error(LayoutTree.FIRST + 'node already exists');
                }
                children.set(LayoutTree.FIRST, layoutTree);
                layoutTree.setParent(this);
            } else {

                /*
                * Splits into two LayoutTree and add new LayoutTree
                * with specified index and orientation.
                */
                //TODO
            }
        },

        /**
         * @param {number} index
         */
        removeChild: function(index) {
            var children = this.getChildren();
            this.getChild(index).setParent(null);
            children['delete'](index);
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
            return this.children.get(index);
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
        getOrientation: function(index) {
            return this.orientation;
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
        }
    });

    LayoutTree.HORIZONTAL = 0;
    LayoutTree.VERTICAL = 1;
    LayoutTree.FIRST = 0;
    LayoutTree.SECOND = 1;
    LayoutTree.BOUNDS_CHANGED = 'boundsChanged';

    return LayoutTree;
});
