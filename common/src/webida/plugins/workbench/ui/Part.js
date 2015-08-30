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
 * Interface
 * An ancestor of all workbench UI parts
 *
 * @see View, Editor
 * @since: 2015.06.09
 * @author: hw.shim
 */

// @formatter:off
define([
    'external/eventEmitter/EventEmitter',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './PartModel',
    './Viewer'
], function(
	EventEmitter,
    genetic,
    Logger,
    PartModel,
    Viewer
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} ModelManager
     * @typedef {Object} DataSource
     * @typedef {Object} PartModel
     * @typedef {Object} Promise
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    var _partId = 0;

    function Part(container) {
        logger.info('new Part(' + container + ')');
        this._partId = ++_partId;
        this.flags = 0;
        this.parent = null;
        this.viewer = null;
        this.model = null;
        this.container = container;
    }


    genetic.inherits(Part, EventEmitter, {

        /**
         * Creates Viewer(s) and Model,
         * then binds all members together.
         * If different way is required override this method.
         */
        prepareMVC: function() {
            logger.info('%cprepareMVC()', 'color:orange');

            var part = this;
            var container = this.getContainer();

            //1. Create Viewer(s)
            var createViewers = this._promiseFor(Viewer, container.getContentNode());

            //2. Create Model
            var createModel = this._promiseFor(PartModel, container.getDataSource());

            //3. Binds events then sets inital contents for the view
            Promise.all([createViewers, createModel]).then(function(results) {

                var viewers = results[0];
                var model = results[1][0];

                viewers.forEach(function(viewer) {
                    //Viewer listen to model's content change
                    model.on(PartModel.CONTENTS_CHANGE, function(model, sender) {
                        viewer.setContents(model.getContents());
                        container.updateDirtyState();
                    });
                    //Viewer listen to container's size change
                    container.on('resize', function(changeSize) {
                        viewer.fitSize();
                    });
                    //Render initial model
                    viewer.setContents(model.getContents());
                });

                //Notify user can navigate contents
                part.emit(Part.CONTENT_READY, part);

            }, function(error) {
                logger.error(error);
            });
        },

        /**
         * Return Promise to create Viewer(s) or Model
         * @return {Promise}
         * @private
         */
        _promiseFor: function(Type, param) {
            var part = this;
            return new Promise(function(resolve, reject) {
                try {
                    var objs = part['create'+Type](param);
                    if (!( objs instanceof Array)) {
                        objs = [objs];
                    }
                    var promises = objs.map(function(obj) {
                        return new Promise(function(resolve, reject) {
                            obj.once(Type.READY, function(obj) {
                                if ( obj instanceof Type) {
                                    resolve(obj);
                                }
                            });
                        });
                    });
                    Promise.all(promises).then(function(objs) {
                        resolve(objs);
                    }, function(error) {
                        logger.warn(error);
                    });
                } catch(e) {
                    reject(e);
                }
            });
        },

        /**
         * @param {HTMLElement} parent
         * @abstract
         */
        createViewer: function(parentNode) {
            throw new Error('createViewer(parentNode) should be implemented by ' + this.constructor.name);
        },

        /**
         * @param {Viewer} viewer
         */
        setViewer: function(viewer) {
            this.viewer = viewer;
        },

        /**
         * @return {Viewer}
         */
        getViewer: function() {
            return this.viewer;
        },

        /**
         * @param {DataSource} dataSource
         * @abstract
         */
        createModel: function(dataSource) {
            throw new Error('createModel(dataSource) should be implemented by ' + this.constructor.name);
        },

        /**
         * @param {PartModel} model
         */
        setModel: function(model) {
            this.model = model;
        },

        /**
         * @return {PartModel}
         */
        getModel: function() {
            return this.model;
        },

        destroy: function() {
            throw new Error('destroy() should be implemented by ' + this.constructor.name);
        },

        /**
         * Convenient method to get DataSource
         * @return {DataSource}
         */
        getDataSource: function() {
            return this.getContainer().getDataSource();
        },

        getContainer: function() {
            return this.container;
        },

        setFlag: function(/*int*/flag, /*boolean*/value) {
            if (!flag) {
                throw new Error('Invalid flag name');
            }
            if (value) {
                this.flags |= flag;
            } else {
                this.flags &= ~flag;
            }
        },

        getFlag: function(/*int*/flag) {
            return (this.flags & flag) != 0;
        },

        setParentElement: function(/*HtmlElement*/parent) {
            this.parent = parent;
        },

        getParentElement: function() {
            return this.parent;
        },

        // ----------- unknowkn ----------- //
        //TODO refactor the follwings

        hide: function() {
            throw new Error('hide() should be implemented by ' + this.constructor.name);
        },

        focus: function() {
            throw new Error('focus() should be implemented by ' + this.constructor.name);
        },
    });

    /** @constant {string} */
    Part.PROPERTY_CHANGED = 'propertyChanged';

    /**
     * Part should emit this event when their Viewer's method
     * render(contents) called for the first time.
     * @constant {string}
     */
    Part.CONTENT_READY = 'contentReady';

    return Part;
});
