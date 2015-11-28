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

define(['dojo/topic',
        'webida-lib/plugins/workbench/plugin',
        'webida-lib/widgets/views/view',
        'webida-lib/widgets/views/viewmanager',
        'webida-lib/widgets/views/viewToolbar',
        'webida-lib/plugins/workspace/plugin',
        'webida-lib/util/path'
       ],
function (topic, workbench, View, vm, ViewToolbar, wv, pathUtil) {
    'use strict';

    function ViewCommand(id) {
        this.id = id;
        this.handles = [];
        this.projectPath = null;
    }

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

    ViewCommand.prototype.getId = function () {
        return this.id;
    };

    ViewCommand.prototype.getProjectPath = function () {
        return this.projectPath;
    };

    ViewCommand.prototype.setProjectPath = function (projectPath) {
        this.projectPath = projectPath;
    };

    ViewCommand.prototype.addHandle = function (handle) {
        this.handles.push(handle);
    };

    ViewCommand.prototype.onViewClose = function () {
        //console.log('ViewCommand', 'onViewClose');
        $.each(this.handles, function (index, handle) {
            handle.remove();
        });
    };

    ViewCommand.prototype.initView = function (tplToolbar, cb) {
        var vt = new ViewToolbar($('#' + this.id + ' .toolbar-panel')[0], this.getView().contentPane);
        vt.setContent(tplToolbar);

        this.addHandle(topic.subscribe('workspace/node/selected', function (selectedPath) {
            console.log('workspace/node/selected', selectedPath || null);
            var selectedProjectPath = pathUtil.getProjectRootPath(selectedPath);
            if (!selectedProjectPath) {
                return;
            }
            cb(selectedProjectPath);
        }));
    };

    ViewCommand.prototype.createView = function (title, tooltip, template) {
        this.view = vm.getView(this.getId());
        if (!this.view) {
            this.view = new View(this.getId(), title);
            //view.setContent('<div id="TestTab" style="width: 100%; height: 100%;">');
            this.view.setContent(template);
            this.view.set('tooltip', tooltip);
            this.view.set('closable', true);

            workbench.appendView(this.view, 'bottom');
        }
    };

    ViewCommand.prototype.getView = function () {
        return this.view;
    };

    return ViewCommand;
});
