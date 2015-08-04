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

define([
    'webida-lib/app',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/plugin-manager-0.1',
    './run-configuration-manager',
    './delegator',
    'dojo/topic',
    'dojo/on',
    'dojo/store/Memory',
    'dojo/store/Observable',
    'dijit/registry',
    'webida-lib/util/path',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog', // ButtonedDialog
    'webida-lib/widgets/dialogs/file-selection/FileSelDlg2States', // FileDialog
    'dijit/layout/ContentPane',
    'dijit/Tree',
    'dijit/tree/ForestStoreModel',
    'dijit/form/Select',
    'popup-dialog',
    'text!./run-configuration.html',
    'text!./default-run-configuration.html',
    'external/lodash/lodash.min',
    'plugins/webida.notification/notification-message',
    'xstyle/css!./style.css'
], function (ide, workbench, workspace, pluginManager, runConfManager, delegator,
             topic, on, Memory, Observable, registry,
             pathUtil, ButtonedDialog, FileDialog, ContentPane, Tree, ForestStoreModel, Select, PopupDialog,
             windowTemplate, contentTemplate, _, toastr) {
    'use strict';

    var module = {};
    var selected;
    var ui;
    var windowOpened = false;

    var PATTERN_QUERY_STRING = /^([\w-]+(=[\w\s%\/\-\(\)\[\],\.]*)?(&[\w-]+(=[\w\s\/%\-\(\)\[\],\.]*)?)*)?$/;
    
    var EVENT_CHANGE = 'webida.ide.project-management.run:configuration.changed';
    var EVENT_TYPE_SAVE = 'save';
    var EVENT_TYPE_VALID = 'valid';

    var extensionPoints = {
        RUN_CONFIGURATION_TYPE: 'webida.ide.project-management.run:type',
        RUN_CONFIGURATION: 'webida.ide.project-management.run:configuration',
        RUN_CONFIGURATION_RUNNER: 'webida.ide.project-management.run:runner'
    };

    function _getAllTypes() {
        var types = pluginManager.getExtensions(extensionPoints.RUN_CONFIGURATION_TYPE);
        var availableTypesInUI = _.filter(types, function (type) {
            return !type.hidden;
        });
        // add default type
        return [{id: '', name: 'General Web Application'}].concat(availableTypesInUI);
    }

    selected = {
        type: _getAllTypes()[0].id,
        runConf: undefined
    };

    ui = {
        dialog: undefined,
        contentArea: undefined,
        content: undefined,
        tree: undefined,
        btns: {
            createNewButton: undefined,
            saveButton: undefined,
            cancelButton: undefined,
            runButton: undefined,
            deleteButton: undefined
        },
        forms: {
            select: undefined,
            pathButton: undefined,
            inputBoxes: [],
            readonlyInputBoxes: [],
            checkBoxes: []
        }
    };

    function _removeContentArea() {
        if (ui.content) {
            ui.contentArea.removeChild(ui.content);
            ui.content.destroyRecursive();
            delete ui.content;
        }
    }

    function _addContentArea(newContent) {
        _removeContentArea();
        if (newContent) {
            ui.contentArea.addChild(newContent);
            ui.content = newContent;
        }
    }

    function _setSelection(typeOrRunConf) {
        if (typeof typeOrRunConf === 'string') {
            selected.runConf = undefined;
            selected.type = typeOrRunConf;
        } else if (typeOrRunConf) {
            selected.runConf = typeOrRunConf;
            selected.type = typeOrRunConf.type;
        }
    }

    module.refreshTree = function () {
        ui.tree = $('#run-configuration-list-tree').empty();
        var runByType = _.groupBy(runConfManager.getAll(), 'type');
        var allType = _getAllTypes();
        _.each(allType, function (type) {
            var $listElem = $('<li></li>');
            var $listLink = $('<a href data-type-id="' + type.id + '">' + type.name + '</a>');
            $listElem.append($listLink);
            if (type.id === selected.type) {
                $listLink.addClass('selected');
            }
            var $subListElem = $('<ul></ul>');
            _.each(runByType[type.id], function (runObj) {
                var $runItemElem = $('<li></li>');
                var $runItemLink = $('<a href data-run-id="' + runObj.name + '" data-type-id="' + type.id + '">' +
                    runObj.name + (runObj.unsaved ? ' *' : '') + '</a>');
                $runItemElem.append($runItemLink);
                if (selected.runConf && runObj.name === selected.runConf.name) {
                    $runItemLink.addClass('selected');
                }
                $subListElem.append($runItemElem);
            });
            $listElem.append($subListElem);
            ui.tree.append($listElem);

            ui.tree.undelegate('li a', 'click');
            ui.tree.delegate('li a', 'click', function (event) {
                event.preventDefault();
                var runName = $(this).attr('data-run-id');
                var typeId = $(this).attr('data-type-id');
                if (runName) {
                    _setSelection(runConfManager.getByName(runName));
                    _addContentArea(new ContentPane());
                    delegator.loadConf(ui.content, selected.runConf);
                } else {
                    _setSelection(typeId);
                }
                ui.tree.find('.selected').removeClass('selected');
                ui.tree.find('[data-run-id="' + runName + '"]').addClass('selected');
                ui.tree.find('[data-type-id="' + typeId + '"]:not([data-run-id])').addClass('selected');
            });
        });

        if (windowOpened && ui.btns.runButton) {
            if (!selected.runConf || selected.runConf.unsaved) {
                ui.btns.runButton.setDisabled(true);
            } else {
                ui.btns.runButton.setDisabled(false);
            }
        }
    };

    module.openWindow = function (defaultRun, mode) {
        var title;
        var caption;
        switch (mode) {
            case runConfManager.MODE.RUN_MODE:
                title = 'Run Configurations';
                caption = 'Run';
                break;
            case runConfManager.MODE.DEBUG_MODE:
                title = 'Debug Configurations';
                caption = 'Debug';
                break;
        }
        _setSelection(defaultRun || _.first(_.toArray(runConfManager.getAll())));
        ui.dialog = new ButtonedDialog({
            buttons: [
                {id: 'dialogRunButton', caption: caption, methodOnClick: 'runConf'},
                {id: 'dialogOkButton', caption: 'Close', methodOnClick: 'okOnRunConf'}
            ],
            methodOnEnter: null,
            okOnRunConf: function () {
                var unSaveMsg = checkUnsavedConf();
                if (unSaveMsg) {
                    PopupDialog.yesno({
                        title: title,
                        message: title + 'has ' + unSaveMsg + '. Are you sure you want to close this dialog?',
                        type: 'info'
                    }).then(function () {
                        ui.dialog.hide();
                    });
                } else {
                    ui.dialog.hide();
                }
            },
            runConf: function () {
                delegator.saveConf(selected.runConf, function (err, runConf) {
                    if (!err) {
                        switch (mode) {
                            case runConfManager.MODE.RUN_MODE:
                                delegator.run(runConf);
                                break;
                            case runConfManager.MODE.DEBUG_MODE:
                                delegator.debug(runConf);
                                break;
                        }
                        ui.dialog.hide();
                    }
                });
            },
            refocus: false,
            title: title,
            style: 'width: 800px',
            onHide: function () {
                console.debug('ui.dialog onHide', arguments);
                topic.publish('webida.ide.project-management.run:configuration.hide');
                runConfManager.flushRunConfigurations(function () {
                    windowOpened = false;
                    ui.contentArea.destroyRecursive();
                    ui.dialog.destroyRecursive();
                    workbench.focusLastWidget();
                });
            },
            onLoad: function () {
                ui.contentArea = registry.byId('run-configuration-list-contentpane');
                if (selected.runConf) {
                    _addContentArea(new ContentPane());
                    delegator.loadConf(ui.content, selected.runConf);
                }

                ui.btns.createNewButton = registry.byId('run-configuration-create-button');
                ui.btns.deleteButton = registry.byId('run-configuration-delete-button');

                ui.contentArea.own(
                    on(ui.btns.createNewButton, 'click', function () {
                        // get project from selected context
                        var projectName;
                        var runConfs = runConfManager.getAll();
                        var unsaved = _.where(runConfs, {unsaved: true});

                        var context = workbench.getContext();
                        if (context.projectPath) {
                            projectName = pathUtil.getName(context.projectPath) || undefined;
                        }

                        if (!_.isEmpty(unsaved)) {
                            PopupDialog.yesno({
                                title: title,
                                message: 'You will may lose unsaved data. Are you sure to continue?',
                                type: 'info'
                            }).then(function () {
                                _addContentArea(new ContentPane());
                                delegator.newConf(ui.content, selected.type, projectName, function (err, runConf) {
                                    if (!err) {
                                        _setSelection(runConf);
                                        module.refreshTree();
                                    }
                                });
                            });
                        } else {
                            _addContentArea(new ContentPane());
                            delegator.newConf(ui.content, selected.type, projectName, function (error, newConf) {
                                if (!error) {
                                    _setSelection(newConf);
                                    module.refreshTree();
                                }
                            });
                        }
                    }),
                    on(ui.btns.deleteButton, 'click', function() {
                        if (selected.runConf) {
                            PopupDialog.yesno({
                                title: 'Delete ' + title,
                                message: 'Are you sure you want to delete this configuration?',
                                type: 'info'
                            }).then(function () {
                                delegator.deleteConf(selected.runConf.name, function (error) {
                                    if (!error) {
                                        _setSelection(selected.runConf.type);
                                        module.refreshTree();
                                        _removeContentArea();
                                    }
                                });
                            }, function () {
                                toastr.info('Deletion canceled');
                            });
                        }
                    })
                );

                ui.btns.runButton = registry.byId('dialogRunButton');
                if (!selected.runConf || selected.runConf.unsaved) {
                    ui.btns.runButton.setDisabled(true);
                }

                topic.publish('webida.ide.project-management.run:configuration.show');
            }
        });
        ui.dialog.set('doLayout', true);
        ui.dialog.setContentArea(windowTemplate);

        module.refreshTree();
        ui.dialog.show();
        windowOpened = true;
    };

    function checkUnsavedConf() {
        var runConfs = runConfManager.getAll();
        var unsavedConfs = _.filter(runConfs, function(runConf){
            return runConf.unsaved;
        });
        return _.isEmpty(unsavedConfs) ? '' : 'not been saved';
    }

    function addButtonCssClass(container, button, size) {
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
        var pathInputBox = ui.forms.readonlyInputBoxes[0];
        var nameInputBox = ui.forms.inputBoxes[0];
        var runConf = selected.runConf;
        var project = ui.forms.select.get('value');
        if (!runConf || !project || !pathInputBox) {
            toastr.error('Cannot find root path');
            return;
        }

        var root = workspace.getRootPath() + project + '/';
        var initialPath;

        if (pathInputBox.value) {
            initialPath = root + pathInputBox.value;
        } else {
            initialPath = root;
        }

        var dlg = new FileDialog({
            mount: ide.getFSCache(),
            root: root,
            initialSelection: [initialPath],
            title: 'Select the Main File to Run',
            singular: true,
            dirOnly: false,
            showRoot: false
        });
        dlg.open(function (fileSelected) {
            if (fileSelected) {
                if (fileSelected.length <= 0) {
                    toastr.warning('Select a file.');
                    return;
                }
                var pathSplit = fileSelected[0].split(root);
                if (pathSplit.length > 0) {
                    pathInputBox.value = pathSplit[1];
                    
                    topic.publish(EVENT_CHANGE, EVENT_TYPE_VALID, !_checkInvalidField());
                    
                    if (!nameInputBox) {
                        return;
                    }
                    if (!nameInputBox.value || selected.runConf.unsaved) {
                        nameInputBox.value = pathInputBox.value;
                    }
                } else {
                    toastr.warning('Select a file.');
                }
            }
        });
    }
    
    function _checkInvalidField() {
        if (!ui.forms.inputBoxes[0].value) {
            return 'Enter a name.';
        }
        if (!ui.forms.readonlyInputBoxes[0].value) {
            return 'Select a path.';
        }
        if (!PATTERN_QUERY_STRING.test(ui.forms.inputBoxes[1].value)) {
            return 'Invalid query string';
        }
        
        selected.runConf.name = ui.forms.inputBoxes[0].value;
        selected.runConf.path = ui.forms.readonlyInputBoxes[0].value;
        selected.runConf.argument = ui.forms.inputBoxes[1].value;
        selected.runConf.fragment = ui.forms.inputBoxes[2].value;
        selected.runConf.openArgument = ui.forms.inputBoxes[3].value;

        selected.runConf.liveReload = (ui.forms.checkBoxes[0].checked) ? true : false;
        selected.runConf.project = ui.forms.select.get('value');

        return;
    }

    function _saveButtonClicked() {
        var invalidMsg = _checkInvalidField();
        if (invalidMsg) {
            toastr.error(invalidMsg);
            return;
        }
        topic.publish(EVENT_CHANGE, EVENT_TYPE_SAVE, selected.runConf);
    }

    function _drawContentPane(runConf) {
        var child;
        var projects = [];
        ui.content.setContent(contentTemplate);
        child = ui.content.domNode;

        ui.btns.pathButton = $(child).find('.rcw-action-path').get(0);
        addButtonCssClass(ui.content, ui.btns.pathButton, '20');

        ui.forms.inputBoxes = $(child).find('.rcw-content-table-inputbox-edit');
        ui.forms.inputBoxes[0].value = runConf.name ? runConf.name : '';
        ui.forms.inputBoxes[1].value = runConf.argument ? runConf.argument : '';
        ui.forms.inputBoxes[2].value = runConf.fragment ? runConf.fragment : '';
        ui.forms.inputBoxes[3].value = runConf.openArgument ? runConf.openArgument : '';

        ui.forms.readonlyInputBoxes = $(child).find('.rcw-content-table-inputbox-readonly');
        ui.forms.readonlyInputBoxes[0].value = runConf.path;

        ui.forms.checkBoxes = $(child).find('.rcw-content-table-checkbox');
        ui.forms.checkBoxes[0].checked = (runConf.liveReload) ? true : false;

        ui.btns.saveButton = registry.byId('rcw-action-save');
        ui.content.own(
            on(ui.btns.saveButton, 'click', _saveButtonClicked),
            on(ui.btns.pathButton, 'click', _pathButtonClicked)
        );
        on(ui.content, 'input, select:change', function () {
            var invalid = _checkInvalidField();
            topic.publish(EVENT_CHANGE, EVENT_TYPE_VALID, !invalid);
        });

        ide.getWorkspaceInfo(function (err, workspaceInfo) {
            if (err) {
                toastr.error('failed to get project list');
            } else {
                projects = workspaceInfo.projects.map(function (project) {
                    return {
                        value: project,
                        label: project
                    };
                });
                ui.forms.select = new Select({options: projects}, 'run-configuration-project');
                ui.forms.select.startup();
                ui.forms.select.set('value', runConf.project);
            }
        });
    }

    module.loadConf = function (content, runConfiguration, callback) {
        _drawContentPane(runConfiguration);
        callback(null, runConfiguration);
    };

    module.saveConf = function (runConf, callback) {
        callback(null, runConf);
    };

    module.deleteConf = function (runConfName, callback) {
        callback(null, runConfName);
    };

    module.getWindowOpened = function () {
        return windowOpened;
    };

    module.reload = function () {
        _addContentArea(new ContentPane());
        delegator.loadConf(ui.content, selected.runConf);
    };
    
    module.changeValidationState = function (valid) {
        ui.btns.runButton.setDisabled(!valid);
    };

    return module;
});
