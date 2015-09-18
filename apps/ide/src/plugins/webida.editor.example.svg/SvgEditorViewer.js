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
 * SvgEditorViewer
 *
 * @see
 * @since: 2015.09.17
 * @author: hw.shim
 */

// @formatter:off
define([
    'webida-lib/util/dom',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/plugins/workbench/ui/ChangeRequest',
    'webida-lib/plugins/workbench/ui/EditorViewer',
    'webida-lib/plugins/workbench/ui/PartViewer'
], function(
    dom,
    genetic,
    Logger,
    ChangeRequest,
    EditorViewer,
    PartViewer
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function SvgEditorViewer(parentNode) {
        logger.info('new SvgEditorViewer(' + parentNode + ')');
        EditorViewer.apply(this, arguments);
        this.pathId = 0;
    }


    genetic.inherits(SvgEditorViewer, EditorViewer, {

        /**
         * @param {HTMLElement} parentNode
         */
        createWidget: function(parentNode) {
            var that = this;
            this._prepareElements(parentNode);
            this._bindListeners();
            setTimeout(function() {
                that.emit(PartViewer.READY, that);
            });
        },

        /**
         * Refreshes all of the view with contents
         * @param {Object} contents
         */
        refresh: function(contents) {
            logger.info('refresh(' + contents + ')');
            var that = this, path;
            this.svg.innerHTML = '';
            if ( contents instanceof Array) {
                contents.forEach(function(line) {
                    path = that.svg.appendChild(that._createPath());
                    path.setAttribute('d', line);
                });
            }
        },

        render: function(delta) {
            logger.info('render(' + delta + ')');
            var path = this.svg.appendChild(this._createPath());
            path.setAttribute('d', delta);
        },

        /**
         * Updates widget size according to the parent of the widget
         */
        fitSize: function() {
            //logger.info('fitSize() //do nothing');
        },

        _bindListeners: function() {
            var that = this;
            var mask = this.mask;
            var feedback = this.feedback;
            var feedbackPath = null;
            var isDragStart = false;
            var isDragProgress = false;
            var startPos = {
                x: null,
                y: null
            };
            var currentPos = {
                x: null,
                y: null
            };
            var THRESHOLD = 1;
            var init = false;
            var dx, dy;
            var layerXBack, layerYBack;
            var desc = '';
            var posInEl = function(oEvent) {
                return {
                    x: oEvent.offsetX || oEvent.layerX,
                    y: oEvent.offsetY || oEvent.layerY
                };
            };
            mask.addEventListener('mousemove', function(ev) {
                if (isDragStart === true) {
                    var dxFromStart = Math.abs(startPos.x - posInEl(ev).x);
                    var dyFromStart = Math.abs(startPos.y - posInEl(ev).y);
                    if (dxFromStart > THRESHOLD || dyFromStart > THRESHOLD) {
                        isDragProgress = true;
                    }
                    if (isDragProgress === true) {
                        if ( typeof layerXBack !== 'undefined' && typeof layerYBack !== 'undefined') {
                            dx = posInEl(ev).x - layerXBack;
                            dy = posInEl(ev).y - layerYBack;
                        }
                        layerXBack = posInEl(ev).x;
                        layerYBack = posInEl(ev).y;
                        if (init === false) {
                            desc += ' M' + startPos.x + ',' + startPos.y;
                            init = true;
                        } else {
                            desc += ' l' + dx + ',' + dy;
                        }
                        //logger.info('desc = ', desc);
                        //path.setAttribute('d', desc);
                        feedbackPath.setAttribute('d', desc);
                    }
                }
            });
            mask.addEventListener('mousedown', function(ev) {
                desc = '';
                isDragStart = true;
                dx = dy = 0;
                startPos = {
                    x: posInEl(ev).x,
                    y: posInEl(ev).y
                };
                logger.info(startPos);
                feedbackPath = that._createPath();
                feedback.appendChild(feedbackPath);
            });
            mask.addEventListener('mouseup', function(ev) {
                isDragStart = false;
                isDragProgress = false;
                layerXBack = layerYBack = undefined;
                init = false;
                feedback.innerHTML = '';
                that.emit(PartViewer.CONTENT_CHANGE, new ChangeRequest(desc));
            });
        },

        _prepareElements: function(parentNode) {
            // @formatter:off
            var wrapper = dom.makeElement('DIV', {
                'style': 'position:relative; width:100%; height:100%'
            });
            this.svg = dom.makeSvgElement('svg', {
                'shape-rendering': 'optimizeQuality',
                'style': 'position:absolute; width:100%; height:100%'
            });
            wrapper.appendChild(this.svg);
            this.feedback = dom.makeSvgElement('svg', {
                'shape-rendering': 'optimizeQuality',
                'style': 'position:absolute; width:100%; height:100%'
            });
            wrapper.appendChild(this.feedback);
            this.mask = dom.makeElement('DIV', {
                'style': 'position:absolute; width:100%; height:100%; cursor:crosshair'
            });
            wrapper.appendChild(this.mask);
            parentNode.appendChild(wrapper);
            // @formatter:on
        },

        _createPath: function() {
            var path = dom.makeSvgElement('path', {
                'id': 'path' + (this.pathId++),
                'style': 'stroke:rgb(0,102,255); stroke-width:1; fill:none;'
            });
            return path;
        }
    });

    return SvgEditorViewer;
});
