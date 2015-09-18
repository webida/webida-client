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
 * Constructor function
 * CmEditorPart implementation of EditorPart
 * This should be an ancestor of all text based editors.
 *
 * @constructor
 * @see EditorPart
 * @since: 2015.06.11
 * @author: hw.shim
 *
 * file.__elemId removed
 */

// @formatter:off
define([
    'webida-lib/util/genetic', 
    'webida-lib/plugins/workbench/ui/Part', 
    'webida-lib/plugins/workbench/ui/EditorPart', 
    'webida-lib/plugins/editors/plugin', 
    'webida-lib/util/logger/logger-client', 
    './CmEditorViewer',
    'dojo/domReady!'
], function(
    genetic, 
    Part, 
    EditorPart, 
    editors, 
    Logger,
    CmEditorViewer
) {
	'use strict';
// @formatter:on

    var logger = new Logger();
    logger.off();

    function CmEditorPart(file) {
        logger.info('new CmEditorPart(' + file + ')');
        EditorPart.apply(this, arguments);
        this.preferences = null;
    }


    genetic.inherits(CmEditorPart, EditorPart, {

        initialize: function() {
            logger.info('initialize()');
            this.initializeViewer();
            this.initializeListeners();
            this.initializePreferences();
        },

        initializeViewer: function() {
            logger.info('initializeViewer()');
            var viewer = this.getViewer();
            var parent = this.getParentElement();
            viewer.createWidget(parent);
            viewer.refresh(this.file.savedValue);
            viewer.setSize(parent.offsetWidth, parent.offsetHeight);
        },

        /**
         * To initialize listeners you want
         * override this
         */
        initializeListeners: function() {
            logger.info('initializeListeners()');
        },

        initializePreferences: function() {
            logger.info('initializePreferences()');
        },

        /**
         * To use the Viewer you want, override this method
         * and return Class you want use
         *
         * @returns TextEditorViewer
         */
        getViewerClass: function() {
            return CmEditorViewer;
        },

        /**
         * @override
         */
        getViewer: function() {
            if (this.viewer !== null) {
                return this.viewer;
            }
            var ViewerClass = this.getViewerClass();
            var viewer = new (ViewerClass)();
            this.setViewer(viewer);
            return this.viewer;
        },

        getFoldingStatus: function() {
            return this.foldingStatus;
        },

        createViewer: function(parent) {
            logger.info('create(' + parent.tagName + ', callback)');
            if (this.getFlag(Part.CREATED) === true) {
                return;
            }
            this.setParentElement(parent);
            this.createCallback = callback;
            this.initialize();
            this.setFlag(Part.CREATED, true);
        },

        destroy: function() {
            logger.info('destroy()');
            if (this.viewer) {
                this.viewer.destroy();
                this.viewer = null;
            }
            //clear state
            this.setFlag(Part.CREATED, false);
        },

        focus: function() {
            if (this.viewer) {
                this.viewer.focus();
                //TODO : getViewer()
            } else {
                logger.info('this.viewer not found');
                logger.trace();
            }
        }
    });

    return CmEditorPart;
});
