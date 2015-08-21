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
 * CompatibleLayoutPane
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
    './LayoutPane'
], function(
    EventEmitter,
    genetic, 
    Logger,
    LayoutPane
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function CompatibleLayoutPane(id) {
        logger.info('new CompatibleLayoutPane(' + id + ')');
        LayoutPane.call(this, id);
    }

    function getViewContainer(view, file, option, editors) {
        //cellCount=2, cellIndex=-1
        var viewContainer;
        var cellCount = editors.splitViewContainer.get('splitCount');
        var cellIndex;
        if ((option.cellIndex >= 0) && (option.cellIndex < cellCount)) {
            cellIndex = option.cellIndex;
        } else {
            cellIndex = -1;
        }
        var opt = {};
        opt.fields = {
            title: view.getTitle(),
            path: file.path
        };
        editors.editorTabFocusController.registerView(view, opt);
        if (cellIndex === -1) {
            viewContainer = editors.splitViewContainer.getFocusedViewContainer();
        } else {
            viewContainer = editors.splitViewContainer.getViewContainer(cellIndex);
        }
        return viewContainer;
    }

    function _findViewIndexUsingSibling(viewContainer, file, siblings, editors) {
        var previousSiblings = [];
        var nextSiblings = [];
        var i, j, sibling, siblingFile, view;
        var index = -1;
        if (!siblings) {
            return index;
        }
        var found = false;
        for ( i = 0; i < siblings.length; i++) {
            sibling = siblings[i];
            if (sibling === file.path) {
                found = true;
                continue;
            }
            siblingFile = editors.files[sibling];
            if (found) {
                nextSiblings.push(siblingFile && siblingFile.viewId);
            } else {
                previousSiblings.push(sibling && siblingFile.viewId);
            }
        }
        var views = viewContainer.getChildren();
        //find from nextSilings
        found = false;
        for ( i = 0; i < nextSiblings.length; i++) {
            sibling = nextSiblings[i];
            if (found) {
                break;
            }
            for ( j = 0; j < views.length; j++) {
                view = views[j];
                if (sibling === view.getId()) {
                    index = j;
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            //find from previousSiblings
            for ( i = previousSiblings.length - 1; i >= 0; i--) {
                sibling = previousSiblings[i];
                if (found) {
                    break;
                }
                for ( j = 0; j < views.length; j++) {
                    view = views[j];
                    if (sibling === view.getId()) {
                        index = j + 1;
                        found = true;
                        break;
                    }
                }
            }
        }
        return index;
    }


    genetic.inherits(CompatibleLayoutPane, LayoutPane, {

        /**
         * @override
         *
         * @param {PartContainer} container
         */
        addPartContainer: function(container, options, editors) {
            logger.info('addPartContainer(' + container + ', index, options)');
            LayoutPane.prototype.addPartContainer.call(this, container);
            var widget = container.getWidgetAdapter().getWidget();
            var dataSource = container.getDataSource();
            var persistence = dataSource.getPersistence();
            var viewContainer = getViewContainer(widget, persistence, options, editors);
            if (viewContainer) {
                var index = _findViewIndexUsingSibling(viewContainer, persistence, options.siblingList, editors);
                if (index >= 0) {
                    viewContainer.addAt(widget, index);
                } else {
                    viewContainer.addLast(widget);
                }
            } else {
            	logger.warn('viewContainer not found');
                //widget.destroy();
            }
        }
    });

    return CompatibleLayoutPane;
});
