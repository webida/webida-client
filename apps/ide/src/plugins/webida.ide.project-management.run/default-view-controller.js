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
 * View controller for run configuration dialog
 * @module webida.ide.project-management.run.viewController
 */
define([
    'external/lodash/lodash.min',
    'dijit/form/CheckBox',
    'dijit/form/Form',
    'dijit/form/Select',
    'dijit/form/TextBox',
    'dijit/form/ValidationTextBox',
    'dijit/registry',
    'dojo/i18n!./nls/resource',
    'dojo/on',
    'dojo/topic',
    'webida-lib/app',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/locale',
    'webida-lib/util/notify',
    'webida-lib/widgets/dialogs/file-selection/FileSelDlg2States', // FileDialog
    'text!./layout/default-run-configuration.html'
], function (
    _,
    CheckBox,
    Form,
    Select,
    TextBox,
    ValidationTextBox,
    registry,
    i18n,
    on,
    topic,
    ide,
    workspace,
    Locale,
    notify,
    FileDialog,
    contentTemplate
) {
    'use strict';

    var module = {};
    var ui = {
        content: undefined,
            btns: {},
        forms: {
            select: undefined,
                inputs: {}
        }
    };

    var PATTERN_QUERY_STRING = '([\\w-]+(=[\\w\\s%\\/\\-\\(\\)\\[\\],\\.]*)?' +
            '(&[\\w-]+(=[\\w\\s\\/%\\-\\(\\)\\[\\],\\.]*)?)*)?';

    var EVENT_TYPE_SAVE = 'save';
    var EVENT_TYPE_STATE = 'state';

    var locale = new Locale(i18n);

    /***************************************
     * General web type
     ***************************************/

    var currentRunConf = {};

    function _addButtonCssClass(container, button, size) {
        container.own(
            on(button, 'mouseover', function () {
                $(button).addClass('rcw-button-hover-' + size);
            }),
            on(button, 'mouseout', function () {
                $(button).removeClass('rcw-button-hover-' + size);
                $(button).removeClass('rcw-button-push-' + size);
            }),
            on(button, 'mousedown', function () {
                $(button).addClass('rcw-button-push-' + size);
            }),
            on(button, 'mouseup', function () {
                $(button).removeClass('rcw-button-push-' + size);
            })
        );
    }

    function _pathButtonClicked() {
        var pathInputBox = ui.forms.inputs.path;
        var nameInputBox = ui.forms.inputs.name;
        var runConf = currentRunConf;
        var project = ui.forms.select.get('value');
        if (!runConf || !project || !pathInputBox) {
            notify.error(i18n.messageFailFindRoot);
            return;
        }

        var root = workspace.getRootPath() + project + '/';
        var initialPath;

        if (pathInputBox.getValue()) {
            initialPath = root + pathInputBox.getValue();
        } else {
            initialPath = root;
        }

        var dlg = new FileDialog({
            mount: ide.getFSCache(),
            root: root,
            initialSelection: [initialPath],
            title: i18n.titleSelectMain,
            singular: true,
            dirOnly: false,
            showRoot: false
        });
        dlg.open(function (fileSelected) {
            if (fileSelected) {
                if (fileSelected.length <= 0) {
                    notify.warning(i18n.validationNoSelectedFile);
                    return;
                }
                var pathSplit = fileSelected[0].split(root);
                if (pathSplit.length > 0) {
                    pathInputBox.setValue(pathSplit[1]);

                    if (nameInputBox && currentRunConf.__nameGen) {
                        // It is only called when the current run configuration is new and never get any user inputs
                        nameInputBox.setValue(pathInputBox.getValue());
                    }
                    var isValid = ui.form.validate();//!_checkInvalidField();
                    topic.publish('project/run/config/changed', EVENT_TYPE_STATE, currentRunConf, {
                        isValid: isValid, isDirty: true
                    });
                } else {
                    notify.warning(i18n.validationNoSelectedFile);
                }
            }
        });
    }

    function _applyFormData() {
        currentRunConf = _.extend(currentRunConf, {
            name: ui.forms.inputs.name.getValue(),
            path: ui.forms.inputs.path.getValue(),
            argument: ui.forms.inputs.queryString.getValue(),
            fragment: ui.forms.inputs.hash.getValue(),
            openArgument: ui.forms.inputs.windowFeature.getValue(),
            liveReload: ui.forms.inputs.liveReload.getValue(),
            project: ui.forms.select.getValue()
        });
    }

    function _validationExpGen(constraints) {
        if (constraints.type === 'queryString') {
            return PATTERN_QUERY_STRING;
        }
        return '.*';
    }

    function _saveButtonClicked() {
        if (ui.form.validate()) {
            _applyFormData();
            topic.publish('project/run/config/changed', EVENT_TYPE_SAVE, currentRunConf);
        } else {
            notify.error(i18n.validationInvalidForm);
        }
    }

    function _drawContentPane() {
        var runConf = currentRunConf;
        var child;
        var projects = [];
        ui.content.setContent(contentTemplate);
        child = ui.content.domNode;

        // caching and setting initial values to ui components
        ui.form = new Form({}, 'run-configuration-detail-form');
        ui.btns.pathButton = $(child).find('.rcw-action-path').get(0);
        _addButtonCssClass(ui.content, ui.btns.pathButton, '20');

        ui.forms.inputs.name = new ValidationTextBox({
            required: true,
            missingMessage: i18n.validationNoName,
            value: runConf.name ? runConf.name : ''
        }, 'run-configuration-detail-name');

        ui.forms.inputs.path = new ValidationTextBox({
            required: true,
            missingMessage: i18n.validationNoPath,
            value: runConf.path,
            readonly: true
        }, 'run-configuration-detail-path');

        ui.forms.inputs.queryString = new ValidationTextBox({
            constraints: {type: 'queryString'},
            regExpGen: _validationExpGen,
            invalidMessage: i18n.validationInvalidQueryString,
            value: runConf.argument ? runConf.argument : ''
        }, 'run-configuration-detail-query');

        ui.forms.inputs.hash = new TextBox({
            value: runConf.fragment ? runConf.fragment : ''
        }, 'run-configuration-detail-hash');

        ui.forms.inputs.windowFeature = new TextBox({
            value: runConf.openArgument ? runConf.openArgument : ''
        }, 'run-configuration-detail-window-features');

        ui.forms.inputs.liveReload = new CheckBox({
            value: !!runConf.liveReload
        });

        ui.btns.saveButton = registry.byId('rcw-action-save');
        ui.content.own(
            on(ui.btns.saveButton, 'click', _saveButtonClicked),
            on(ui.btns.pathButton, 'click', _pathButtonClicked),
            on(ui.forms.inputs.name, 'change', function () {
                currentRunConf.__nameGen = false;
            })
        );
        on(ui.content, 'input, select:change', function () {
            topic.publish('project/run/config/changed', EVENT_TYPE_STATE, currentRunConf, {
                isValid: ui.form.validate(),
                isDirty: true
            });
        });

        ide.getWorkspaceInfo(function (err, workspaceInfo) {
            if (err) {
                notify.error(i18n.messageFailGetProjects);
            } else {
                projects = workspaceInfo.projects.map(function (project) {
                    return {
                        value: project,
                        label: project
                    };
                });
                ui.forms.select = new Select({
                    options: projects,
                    required: true,
                    missingMessage: i18n.validationNoProject
                }, 'run-configuration-project');
                ui.forms.select.startup();
                ui.forms.select.set('value', runConf.project);
            }
        });
        locale.convertMessage(child);
    }

    module.newConf = function (content, runConf, callback) {
        ui.content = content;
        currentRunConf = runConf;
        currentRunConf.__nameGen = true;
        _drawContentPane();
        topic.publish('project/run/config/changed', EVENT_TYPE_STATE, runConf, {
            isValid: ui.form.validate(),
            isDirty: true
        });
        callback(null, runConf);
    };

    module.loadConf = function (content, runConf, callback) {
        ui.content = content;
        currentRunConf = runConf;
        _drawContentPane();
        topic.publish('project/run/config/changed', EVENT_TYPE_STATE, runConf, {
            isValid: ui.form.validate()
        });
        callback(null, runConf);
    };

    module.saveConf = function (runConf, callback) {
        delete currentRunConf.__nameGen;
        topic.publish('project/run/config/changed', EVENT_TYPE_STATE, runConf, {
            isDirty: false
        });
        callback(null, runConf);
    };

    module.deleteConf = function (runConfName, callback) {
        callback(null, runConfName);
    };

    return module;
});
