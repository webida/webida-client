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
    'dijit/Tree',
    'dijit/form/Select',
    'dijit/layout/ContentPane',
    'dijit/registry',
    'dijit/tree/ForestStoreModel',
    'dojo/i18n!./nls/resource',
    'dojo/keys',
    'dojo/on',
    'dojo/store/Memory',
    'dojo/store/Observable',
    'dojo/topic',
    'external/lodash/lodash.min',
    'popup-dialog',
    'webida-lib/app',
    'webida-lib/plugin-manager-0.1',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/util/locale',
    'webida-lib/util/notify',
    'webida-lib/util/path',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog', // ButtonedDialog
    'webida-lib/widgets/dialogs/file-selection/FileSelDlg2States', // FileDialog
    './delegator',
    './run-configuration-manager',
    'text!./layout/default-run-configuration.html',
    'text!./layout/run-configuration.html',
    'xstyle/css!./style/style.css'
], function (
    Tree,
    Select,
    ContentPane,
    registry,
    ForestStoreModel,
    i18n,
    keys,
    on,
    Memory,
    Observable,
    topic,
    _,
    PopupDialog,
    ide,
    pluginManager,
    workbench,
    workspace,
    Locale,
    notify,
    pathUtil,
    ButtonedDialog,
    FileDialog,
    delegator,
    runConfManager,
    contentTemplate,
    windowTemplate
) {
    'use strict';

    var module = {};
    var current;
    var ui;
    var windowOpened = false;

    var PATTERN_QUERY_STRING = /^([\w-]+(=[\w\s%\/\-\(\)\[\],\.]*)?(&[\w-]+(=[\w\s\/%\-\(\)\[\],\.]*)?)*)?$/;

    var EVENT_CHANGE = 'webida.ide.project-management.run:configuration.changed';
    var EVENT_TYPE_SAVE = 'save';
    var EVENT_TYPE_STATE = 'state';

    var locale = new Locale(i18n);

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
        return [{id: '', name: i18n.labelGeneralWebApplication}].concat(availableTypesInUI);
    }

    current = {
        type: _getAllTypes()[0].id,
        runConf: undefined,
        state: {
            isValid: true,
            isDirty: false
        }
    };

    ui = {
        dialog: undefined,
        tree: undefined,
        contentArea: undefined,
        content: undefined,
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
            current.runConf = undefined;
            current.type = typeOrRunConf;
        } else if (typeOrRunConf) {
            current.runConf = typeOrRunConf;
            current.type = typeOrRunConf.type;
        }
    }

    function _checkUnsavedConf() {
        var runConfs = runConfManager.getAll();
        var unsavedConfs = _.filter(runConfs, function (runConf) {
            return runConf._dirty;
        });
        return _.isEmpty(unsavedConfs) ? '' : i18n.messageFailSaveConfiguration;
    }

    /**
     * Refresh run configuration list tree
     *
     * @method refreshTree
     * @memberOf module:webida.ide.project-management.run.viewController
     */
    module.refreshTree = function () {
        ui.tree = $('#run-configuration-list-tree').empty();
        var runByType = _.groupBy(runConfManager.getAll(), 'type');
        var allType = _getAllTypes();
        _.each(allType, function (type) {
            var $listElem = $('<li></li>');
            var $listLink = $('<a href data-type-id="' + type.id + '">' + type.name + '</a>');
            $listElem.append($listLink);
            if (type.id === current.type) {
                $listLink.addClass('selected');
            }
            var $subListElem = $('<ul></ul>');
            _.each(runByType[type.id], function (runObj) {
                if (runObj._deleted) {
                    return; //continue
                }
                var $runItemElem = $('<li></li>');
                var runId = runObj.originalName || runObj.name;
                var $runItemLink = $('<a href data-run-id="' + runId + '" data-type-id="' + type.id + '">' +
                runId + (runObj._dirty ? ' *' : '') + '</a>');
                $runItemElem.append($runItemLink);

                if (current.runConf) {
                    var currentRunId = current.runConf.originalName || current.runConf.name;
                    if (runId === currentRunId) {
                        $runItemLink.addClass('selected');
                    }
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
                    var runConf = runConfManager.getByName(runName);
                    _setSelection(runConf);
                    _addContentArea(new ContentPane());
                    delegator.loadConf(ui.content, runConf);
                } else {
                    _setSelection(typeId);
                }
                ui.tree.find('.selected').removeClass('selected');
                ui.tree.find('[data-run-id="' + runName + '"]').addClass('selected');
                ui.tree.find('[data-type-id="' + typeId + '"]:not([data-run-id])').addClass('selected');
            });
        });

        if (windowOpened && ui.btns.runButton) {
            if (!current.runConf || !current.state.isValid) {
                ui.btns.runButton.setDisabled(true);
            } else {
                ui.btns.runButton.setDisabled(false);
            }
        }
    };

    /**
     * Open run configuration dialog and initialize its UI
     *
     * @param {Object} defaultRun - selected run configuration by default
     * @param {string} mode - run mode e.g. 'run' | 'debug'
     * @memberOf module:webida.ide.project-management.run.viewController
     */
    module.openWindow = function (defaultRun, mode) {
        var title;
        var caption;
        switch (mode) {
            case runConfManager.MODE.RUN_MODE:
                title = i18n.titleRunConfiguration;
                caption = i18n.labelRunConfiguration;
                break;
            case runConfManager.MODE.DEBUG_MODE:
                title = i18n.titleDebugConfiguration;
                caption = i18n.labelDebugConfiguration;
                break;
        }
        _setSelection(defaultRun || _.first(_.toArray(runConfManager.getAll())));
        ui.dialog = new ButtonedDialog({
            buttons: [
                {id: 'dialogRunButton', caption: caption, methodOnClick: 'runConf'},
                {id: 'dialogOkButton', caption: i18n.labelClose, methodOnClick: 'okOnRunConf'}
            ],
            methodOnEnter: null,
            okOnRunConf: function () {
                var unSaveMsg = _checkUnsavedConf();
                if (unSaveMsg) {
                    PopupDialog.yesno({
                        title: title,
                        message: locale.formatMessage('messageConfirmCloseDialog',
                            {title: title, unSaveMsg: unSaveMsg}),
                        type: 'info'
                    }).then(function () {
                        ui.dialog.hide();
                    });
                } else {
                    ui.dialog.hide();
                }
            },
            runConf: function () {
                delegator.saveConf(current.runConf, function (err, runConf) {
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
                ui.btns.createNewButton = registry.byId('run-configuration-create-button');
                ui.btns.deleteButton = registry.byId('run-configuration-delete-button');

                function _deleteConfiguration() {
                    if (current.runConf) {
                        PopupDialog.yesno({
                            title: locale.formatMessage('titleDeleteDialog', {title: title}),
                            message: i18n.messageConfirmDeleteConfiguration,
                            type: 'info'
                        }).then(function () {
                            delegator.deleteConf(current.runConf.name, function (error) {
                                if (!error) {
                                    _setSelection(current.runConf.type);
                                    module.refreshTree();
                                    _removeContentArea();
                                }
                            });
                        }, function () {
                            notify.info(i18n.messageCancelDelete);
                        });
                    }
                }

                ui.dialog.own(on($('#run-configuration-list')[0], 'keydown', function (evt) {
                    if (evt.keyCode === keys.DELETE) {
                        _deleteConfiguration();
                    } else if (evt.keyCode === keys.UP_ARROW) {
                        ui.tree.find('.selected').last().parent().prev().find('a').trigger('click');
                    } else if (evt.keyCode === keys.DOWN_ARROW) {
                        ui.tree.find('.selected').last().parent().next().find('a').trigger('click');
                    }
                }));

                ui.contentArea.own(
                    on(ui.btns.createNewButton, 'click', function () {
                        // get project from selected context
                        var projectName;
                        var runConfs = runConfManager.getAll();
                        var dirty = _.where(runConfs, {_dirty: true});

                        var context = workbench.getContext();
                        if (context.projectPath) {
                            projectName = pathUtil.getName(context.projectPath) || undefined;
                        }

                        if (!_.isEmpty(dirty)) {
                            PopupDialog.yesno({
                                title: title,
                                message: i18n.messageConfirmClose,
                                type: 'info'
                            }).then(function () {
                                _addContentArea(new ContentPane());
                                delegator.newConf(ui.content, current.type, projectName, function (err, runConf) {
                                    if (!err) {
                                        _setSelection(runConf);
                                        module.refreshTree();
                                    }
                                });
                            });
                        } else {
                            _addContentArea(new ContentPane());
                            delegator.newConf(ui.content, current.type, projectName, function (error, newConf) {
                                if (!error) {
                                    _setSelection(newConf);
                                    module.refreshTree();
                                }
                            });
                        }
                    }),
                    on(ui.btns.deleteButton, 'click', function () {
                        _deleteConfiguration();
                    })
                );

                ui.btns.runButton = registry.byId('dialogRunButton');
                if (!current.runConf) {
                    ui.btns.runButton.setDisabled(true);
                }

                if (current.runConf) {
                    current.state.isDirty = false;
                    _addContentArea(new ContentPane());
                    delegator.loadConf(ui.content, current.runConf);
                }

                topic.publish('webida.ide.project-management.run:configuration.show');
                module.refreshTree();
            }
        });
        ui.dialog.set('doLayout', true);
        ui.dialog.setContentArea(windowTemplate);
        locale.convertMessage(ui.dialog.domNode);
        ui.dialog.show();

        windowOpened = true;
    };

    /**
     * Get the status of dialog window
     *
     * @returns {boolean} If it is true, it means dialog is opened. Otherwise, the dialog is closed.
     * @memberOf module:webida.ide.project-management.run.viewController
     */
    module.getWindowOpened = function () {
        return windowOpened;
    };

    /**
     * Reload current selected run configuration at the UI
     *
     * @memberOf module:webida.ide.project-management.run.viewController
     */
    module.reload = function () {
        _addContentArea(new ContentPane());
        delegator.loadConf(ui.content, current.runConf);
    };

    /**
     * Change UI status (isValid, isDirty) for the run configuration
     *
     * @param {Object} runConf - target run configuration
     * @param {Object} state - state for UI e.g. {isValid: true, isDirty: true}
     * @memberOf module:webida.ide.project-management.run.viewController
     */
    module.changeCurrentState = function (runConf, state) {
        current.state = _.extend(current.state, state);
        if (ui.btns.runButton) {
            ui.btns.runButton.setDisabled(!current.state.isValid);
        }
        runConf._dirty = current.state.isDirty;
    };

    /***************************************
     * General web type
     * TODO: Below block is needed to be seperated to other file
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
        var pathInputBox = ui.forms.readonlyInputBoxes[0];
        var nameInputBox = ui.forms.inputBoxes[0];
        var runConf = currentRunConf;
        var project = ui.forms.select.get('value');
        if (!runConf || !project || !pathInputBox) {
            notify.error(i18n.messageFailFindRoot);
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
                    pathInputBox.value = pathSplit[1];

                    if (nameInputBox && currentRunConf.__nameGen) {
                        // It is only called when the current run configuration is new and never get any user inputs
                        nameInputBox.value = pathInputBox.value;
                    }
                    var isValid = !_checkInvalidField();
                    topic.publish(EVENT_CHANGE, EVENT_TYPE_STATE, currentRunConf, {isValid: isValid, isDirty: true});
                } else {
                    notify.warning(i18n.validationNoSelectedFile);
                }
            }
        });
    }

    function _checkInvalidField(runConf) {
        var runConfToCheck = runConf || {
                name: ui.forms.inputBoxes[0].value,
                path: ui.forms.readonlyInputBoxes[0].value,
                argument: ui.forms.inputBoxes[1].value,
                fragment: ui.forms.inputBoxes[2].value,
                openArgument: ui.forms.inputBoxes[3].value,
                liveReload: (ui.forms.checkBoxes[0].checked) ? true : false,
                project: ui.forms.select.get('value')
            };

        if (!runConfToCheck.name) {
            return i18n.validationNoName;
        }
        if (!runConfToCheck.path) {
            return i18n.validationNoPath;
        }
        if (!PATTERN_QUERY_STRING.test(runConfToCheck.argument)) {
            return i18n.validationInvalidQueryString;
        }

        currentRunConf = _.extend(currentRunConf, runConfToCheck);
        return;
    }

    function _saveButtonClicked() {
        var invalidMsg = _checkInvalidField();
        if (invalidMsg) {
            notify.error(invalidMsg);
        } else {
            topic.publish(EVENT_CHANGE, EVENT_TYPE_SAVE, currentRunConf);
        }
    }

    function _drawContentPane() {
        var runConf = currentRunConf;
        var child;
        var projects = [];
        ui.content.setContent(contentTemplate);
        child = ui.content.domNode;

        ui.btns.pathButton = $(child).find('.rcw-action-path').get(0);
        _addButtonCssClass(ui.content, ui.btns.pathButton, '20');

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
            on(ui.btns.pathButton, 'click', _pathButtonClicked),
            on(ui.forms.inputBoxes[0], 'change', function () {
                currentRunConf.__nameGen = false;
            })
        );
        on(ui.content, 'input, select:change', function () {
            topic.publish(EVENT_CHANGE, EVENT_TYPE_STATE, currentRunConf, {
                isValid: !_checkInvalidField(),
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
                ui.forms.select = new Select({options: projects}, 'run-configuration-project');
                ui.forms.select.startup();
                ui.forms.select.set('value', runConf.project);
            }
        });
        locale.convertMessage(child);
    }

    module.newConf = function (content, runConf, callback) {
        currentRunConf = runConf;
        currentRunConf.__nameGen = true;
        _drawContentPane();
        topic.publish(EVENT_CHANGE, EVENT_TYPE_STATE, runConf, {
            isValid: !_checkInvalidField(runConf),
            isDirty: true
        });
        callback(null, runConf);
    };

    module.loadConf = function (content, runConf, callback) {
        currentRunConf = runConf;
        _drawContentPane();
        topic.publish(EVENT_CHANGE, EVENT_TYPE_STATE, runConf, {
            isValid: !_checkInvalidField(runConf)
        });
        callback(null, runConf);
    };

    module.saveConf = function (runConf, callback) {
        delete currentRunConf.__nameGen;
        topic.publish(EVENT_CHANGE, EVENT_TYPE_STATE, runConf, {
            isDirty: false
        });
        callback(null, runConf);
    };

    module.deleteConf = function (runConfName, callback) {
        callback(null, runConfName);
    };

    return module;
});
