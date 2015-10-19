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
    'webida-lib/util/EventProxy',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './PartModel',
    './PartViewer'
], function(
	EventEmitter,
	EventProxy,
    genetic,
    Logger,
    PartModel,
    PartViewer
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} ChangeRequest
     * @typedef {Object} CommandStack
     * @typedef {Object} DataSource
     * @typedef {Object} ModelManager
     * @typedef {Object} PartModel
     * @typedef {Object} PartModelCommand
     * @typedef {Object} PartModelEvent
     * @typedef {Object} Promise
     * @typedef {Object} Thenable
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
        this.eventProxy = new EventProxy();
    }


    genetic.inherits(Part, EventEmitter, {

        /**
         * Called when this part is created.
         * Basically, Part prepares a PartViewer and a PartModel for itself.
         * But if you need to do different actions for this step,
         * you can override this.
         */
        onCreate: function() {
            logger.info('%conCreate()', 'color:orange');
            this.prepareVM();
        },

        /**
         * Creates a Viewer and a Model then binds together.
         * If you need different way for your Part,
         * override this method.
         */
        prepareVM: function() {
            logger.info('%cprepareVM()', 'color:orange');

            var container = this.getContainer();

            //1. Create Viewer
            var createViewer = this.promiseFor(PartViewer, container.getContentNode());

            //2. Create Model
            var createModel = this.promiseFor(PartModel);

            //3. Binds events then sets inital contents for the view
            this.bindVM(createViewer, createModel);
        },

        /**
         * If two Promises createModel, createModel resolved,
         * Bind each other with MVC Pattern.
         * @param {Promise} createViewer
         * @param {Promise} createModel
         */
        bindVM: function(createViewer, createModel) {
            logger.info('%cbindVM(' + createViewer + ', ' + createModel + ')', 'color:orange');

            var part = this;
            var eProxy = this.eventProxy;
            var container = this.getContainer();

            Promise.all([createViewer, createModel]).then(function(result) {

                var viewer = result[0];
                var model = result[1];

                //Refresh model's contents
                eProxy.on(model, PartModel.CONTENTS_CREATED, function(contents) {
                    viewer.refresh(contents);
                    container.updateDirtyState();
                });

                //Model listen to viewer's content change
                eProxy.on(viewer, PartViewer.CONTENT_CHANGE, function(request) {
                    part.onViewerChange(request);
                });

                //Viewer listen to model's content change
                eProxy.on(model, PartModel.CONTENTS_CHANGE, function(modelEvent) {
                    part.onModelChange(modelEvent);
                    container.updateDirtyState();
                });

                //Viewer listen to container's size change
                eProxy.on(container, 'resize', function(changeSize) {
                    viewer.fitSize();
                });

                //Refresh initial model
                viewer.refresh(model.getContents());

				//Focus to the part
				part.focus();

                //Notify user can navigate contents
                part.emit(Part.CONTENT_READY, part);

                //Check synchronized model's dirty state
                part.getContainer().updateDirtyState();

            }, function(error) {
                logger.error(error.stack || error);
            });
        },

        /**
         * Return Promise to create Viewer(s) or Model
         * @return {Promise}
         */
        promiseFor: function(Type, param) {
            logger.info('promiseFor(' + Type + ', ' + param + ')');
            var part = this;
            return new Promise(function(resolve, reject) {
                try {
                    var obj = part['create'+Type](param);
                    if ( obj instanceof Type) {
                        obj.once(Type.READY, function(obj) {
                            resolve(obj);
                        });
                    } else {
                        // @formatter:off
                        throw new Error(part.constructor.name + ' create' + Type 
                            + '(' + (param || '') + ') method should return ' + Type);
                        // @formatter:on
                    }
                } catch(e) {
                    reject(e);
                }
            });
        },

        /**
         * @param {HTMLElement} parent
         * @return {PartViewer}
         * @abstract
         */
        createViewer: function(parentNode) {
            throw new Error('createViewer(parentNode) should be implemented by ' + this.constructor.name);
        },

        /**
         * @param {PartViewer} viewer
         */
        setViewer: function(viewer) {
            this.viewer = viewer;
        },

        /**
         * @return {PartViewer}
         */
        getViewer: function() {
            return this.viewer;
        },

        /**
         * @return {PartModel}
         * @abstract
         */
        createModel: function() {
            throw new Error('createModel() should be implemented by ' + this.constructor.name);
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

        /**
         * Reset model it's last saved state
         * @abstract
         */
        resetModel: function() {
            throw new Error('resetModel() should be implemented by ' + this.constructor.name);
        },

        /**
         * When any event occured in the PartViewer,
         * It should send ChangeRequest to Part.
         * Then the Part receives the request and call onViewerChange() method.
         * @See bindVM()
         *
         * @param {ChangeRequest} request
         * @abstract
         */
        onViewerChange: function(request) {
            throw new Error('onViewerChange(request) should be implemented by ' + this.constructor.name);
        },

        /**
         * This method is called when the PartModel updated.
         * Part developers should implement this method to reflect the model's
         * change to the PartViewer.
         * Please use PartViewer.refresh() to update all contents of model
         * or use PartViewer.render() to update model's delta.
         *
         * @param {PartModelEvent} modelEvent
         * @abstract
         */
        onModelChange: function(modelEvent) {
            throw new Error('onModelChange(modelEvent) should be implemented by ' + this.constructor.name);
        },

        /**
         * Closes this Part
         */
        close: function() {
            logger.info('close()');
            this.getContainer().destroyPart();
        },

        /**
         * Convenient method for PartContainer.PART_DESTROYED event
         */
        onDestroy: function() {
            if (this.eventProxy) {
                this.eventProxy.offAll();
            }
        },

        /**
         * Convenient method to get DataSource
         * @return {DataSource}
         */
        getDataSource: function() {
            return this.getContainer().getDataSource();
        },

        setContainer: function(container) {
            this.container = container;
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

        /**
         * @param {ModelManager} modelManager
         */
        setModelManager: function(modelManager) {
            this.modelManager = modelManager;
        },

        /**
         * @return {ModelManager}
         */
        getModelManager: function() {
            return this.modelManager;
        },

        /**
         * @return {PartModelCommand}
         * @abstract
         */
        getCommand: function(request) {
            throw new Error('getCommand(request) should be implemented by ' + this.constructor.name);
        },

        /**
         * @return {boolean}
         */
        hasCommandStack: function() {
            return false;
        },

        /**
         * @return {CommandStack}
         * @abstract
         */
        getCommandStack: function() {
            throw new Error('getCommandStack() should be implemented by ' + this.constructor.name);
        },

        /**
         * Each Part should override
         * @param {Object} allItems
         * @return {Thenable}
         */
        getContextMenuItems: function(allItems) {
            return null;
        },

        /**
         * Let this part to take focus within the workbench.
         * Parts must assign focus to one of the widget contained
         * in the part's parent composite.
         */
        focus: function() {
            throw new Error('focus() should be implemented by ' + this.constructor.name);
        },

        /**
         * @private
         */
        _execFunc: function(callback, param) {
            if ( typeof callback === 'function') {
                callback(param);
            }
        }
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
