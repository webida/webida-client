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
 * @file View controller for run configuration dialog
 * @since 1.1.0
 * @author kyungmi.k@samsung.com
 * @module RunConfiguration/viewController
 */
define([
    'dijit/Tree',
    'dijit/layout/ContentPane',
    'dijit/registry',
    'dojo/i18n!./nls/resource',
    'dojo/keys',
    'dojo/on',
    'dojo/topic',
    'external/lodash/lodash.min',
    'popup-dialog',
    'webida-lib/plugin-manager-0.1',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/util/locale',
    'webida-lib/util/notify',
    'webida-lib/util/path',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog', // ButtonedDialog
    './delegator',
    './run-configuration-manager',
    'text!./layout/run-configuration.html',
    'xstyle/css!./style/style.css'
], function (
    Tree,
    ContentPane,
    registry,
    i18n,
    keys,
    on,
    topic,
    _,
    PopupDialog,
    pluginManager,
    workbench,
    Locale,
    notify,
    pathUtil,
    ButtonedDialog,
    delegator,
    runConfManager,
    windowTemplate
) {
    'use strict';

    var module = {};
    var current;
    var ui;
    var windowOpened = false;

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
     * @memberOf module:RunConfiguration/viewController
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
     * @memberOf module:RunConfiguration/viewController
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
                topic.publish('project/run/config/hide');
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

                topic.publish('project/run/config/show');
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
     * @memberOf module:RunConfiguration/viewController
     */
    module.getWindowOpened = function () {
        return windowOpened;
    };

    /**
     * Reload current selected run configuration at the UI
     *
     * @memberOf module:RunConfiguration/viewController
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
     * @memberOf module:RunConfiguration/viewController
     */
    module.changeCurrentState = function (runConf, state) {
        current.state = _.extend(current.state, state);
        if (ui.btns.runButton) {
            ui.btns.runButton.setDisabled(!current.state.isValid);
        }
        runConf._dirty = current.state.isDirty;
    };

    return module;
});
