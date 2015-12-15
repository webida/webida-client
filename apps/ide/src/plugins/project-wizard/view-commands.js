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
 * @file Actions and UI manager for view and super class for other command modules
 * @since 1.0.0
 * @author cimfalab@gmail.com
 *
 * @module ProjectWizard/ViewCommands
 */
define([
    'dojo/topic',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/path',
    'webida-lib/widgets/views/view',
    'webida-lib/widgets/views/viewmanager',
    'webida-lib/widgets/views/viewToolbar'
], function (
    topic,
    workbench,
    Logger,
    pathUtil,
    View,
    vm,
    ViewToolbar
) {
    'use strict';

    var logger = new Logger();
    logger.off();

    /**
     * View command
     * @param {string} id - id attr for finding element
     * @constructor
     */
    function ViewCommand(id) {
        this.id = id;
        this.handles = [];
        this.projectPath = null;
    }

    /**
     * Set topic handlers for adding or removing this view
     */
    ViewCommand.prototype.setHandler = function () {
        //this.cbClose = onViewClose || this.onViewClose;

        var self = this;
        self.addHandle(topic.subscribe('view/added', function (event) {
            if (event.view.getId() === self.getId()) {
                self.onViewAppended();
            }
        }));
        self.addHandle(topic.subscribe('view/close', function (event, onClose) {
            if (event.view.getId() === self.getId()) {
                self.onViewClose();
                onClose();
            }
        }));
    };

    /**
     * Get id of this view
     *
     * @return {*} - view id
     */
    ViewCommand.prototype.getId = function () {
        return this.id;
    };

    /**
     * Get project path
     *
     * @return {string} - project path
     */
    ViewCommand.prototype.getProjectPath = function () {
        return this.projectPath;
    };

    /**
     * Set project path
     *
     * @param projectPath
     */
    ViewCommand.prototype.setProjectPath = function (projectPath) {
        this.projectPath = projectPath;
    };

    /**
     * Add topic handlers
     *
     * @param {object} - handler object that has the `remove()` method for destructing
     */
    ViewCommand.prototype.addHandle = function (handle) {
        this.handles.push(handle);
    };

    /**
     * A listener that will be called when this view is closed.
     * Remove all handlers before closing.
     */
    ViewCommand.prototype.onViewClose = function () {
        this.handles.forEach(function (handler) {
            handler.remove();
        });
    };

    /**
     * Initialize this view and manipulate its toolbar
     *
     * @param {string} tplToolbar - tool bar template to manipulate
     * @callback cb
     */
    ViewCommand.prototype.initView = function (tplToolbar, cb) {
        var vt = new ViewToolbar($('#' + this.id + ' .toolbar-panel')[0], this.getView().contentPane);
        vt.setContent(tplToolbar);

        this.addHandle(topic.subscribe('workspace/node/selected', function (selectedPath) {
            logger.log('workspace/node/selected', selectedPath || null);
            var selectedProjectPath = pathUtil.getProjectRootPath(selectedPath);
            if (!selectedProjectPath) {
                return;
            }
            cb(selectedProjectPath);
        }));
    };

    /**
     * Create this view with some options
     *
     * @param {string} title - view title
     * @param {string} tooltip - tooltip message for this view title
     * @param {string} template - view template
     */
    ViewCommand.prototype.createView = function (title, tooltip, template) {
        this.view = vm.getView(this.getId());
        if (!this.view) {
            this.view = new View(this.getId(), title);
            this.view.setContent(template);
            this.view.set('tooltip', tooltip);
            this.view.set('closable', true);

            workbench.appendView(this.view, 'bottom');
        }
    };

    /**
     * Get this view
     *
     * @return {object} - this view object
     */
    ViewCommand.prototype.getView = function () {
        return this.view;
    };

    return ViewCommand;
});
