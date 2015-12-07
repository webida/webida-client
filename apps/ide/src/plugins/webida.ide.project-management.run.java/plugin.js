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
    'external/lodash/lodash.min',
    'dijit/form/Form',
    'dijit/form/Select',
    'dijit/form/TextBox',
    'dijit/form/ValidationTextBox',
    'dijit/layout/ContentPane',
    'dijit/registry',
    'dojo/i18n!./nls/resource',
    'dojo/on',
    'dojo/store/Memory',
    'dojo/store/Observable',
    'dojo/topic',
    'webida-lib/app',
    'webida-lib/util/locale',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/notify',
    'webida-lib/widgets/dialogs/file-selection/FileSelDlg2States', // FileDialog
    'text!./layout/java-run-configuration.html'
], function (
    _,
    Form,
    Select,
    TextBox,
    ValidationTextBox,
    ContentPane,
    registry,
    i18n,
    on,
    Memory,
    Observable,
    topic,
    ide,
    Locale,
    Logger,
    notify,
    FileDialog,
    template
) {
    'use strict';

    var logger = new Logger();
    logger.off();

    var EVENT_TYPE_SAVE = 'save';
    var EVENT_TYPE_STATE = 'state';

    // original regexp: /^((?:[^\\/:\*\?"<>\|]*\/)*)([^\\/:\*\?"<>\|]*)\.java$/i;
    var PATTERN_MAIN_FILE = '((?:[^\\\/:\\*\\?"<>\\|]*\\/)*)([^\\\/:\\*\\?"<>\\|]*)\\.(j|J)(a|A)(v|V)(a|A)';
    var REGEXP_MAIN_FILE = new RegExp('^' + PATTERN_MAIN_FILE + '$');

    var FS = ide.getMount();
    var SRC_DIR = 'src';
    var TARGET_DIR = 'target';
    var currentRunConf;
    var ui = {
        forms: {
            inputs: {}
        }
    };

    var locale = new Locale(i18n);

    function _applyFormData() {
        var matchResult = REGEXP_MAIN_FILE.exec(ui.forms.inputs.path.getValue());
        var path = (matchResult) ? matchResult[1].split('/').join('.') + matchResult[2] : '';

        currentRunConf = _.extend(currentRunConf, {
            name: ui.forms.inputs.name.getValue(),
            path: path,
            project: ui.forms.select.getValue(),
            outputDir: TARGET_DIR,
            srcDir: SRC_DIR
        });
    }

    function _validate() {
        if (ui.form.validate()) {
            _applyFormData();
            return true;
        } else {
            return false;
        }
    }

    function _pathButtonClicked() {
        var pathInputBox = ui.forms.inputs.path;
        var nameInputBox = ui.forms.inputs.name;
        var project = ui.forms.select.getValue();
        var initialPath;
        var root;
        var dlg;

        if (!currentRunConf || !project || !pathInputBox) {
            notify.error(i18n.messageFailFindRoot);
            return;
        }

        root = ide.getPath() + '/' + project + '/' + SRC_DIR + '/';
        if (pathInputBox.getValue()) {
            initialPath = root + pathInputBox.getValue();
        } else {
            initialPath = root;
        }

        dlg = new FileDialog({
            mount: ide.getFSCache(),
            root: root,
            initialSelection: [initialPath],
            title: i18n.titleSelectMain,
            singular: true,
            dirOnly: false,
            showRoot: false
        });
        dlg.open(function (selected) {
            var pathSplit;
            if (selected) {
                if (selected.length <= 0) {
                    notify.warning(i18n.validationNoJavaFile);
                    return;
                }
                pathSplit = selected[0].split(root);
                if (pathSplit.length > 0) {
                    pathInputBox.setValue(pathSplit[1]);

                    if (nameInputBox && currentRunConf.__nameGen) {
                        // It is only called when the current run configuration is new and never get any user inputs
                        nameInputBox.setValue(pathInputBox.getValue());
                    }
                    topic.publish('project/run/config/changed', EVENT_TYPE_STATE, currentRunConf, {
                        isValid: _validate(),
                        isDirty: true
                    });
                } else {
                    notify.warning(i18n.validationNoJavaFile);
                }
            }
        });
    }

    function _setTemplate(callback) {
        var runConf = currentRunConf;
        ui.content.setContent(template);
        if (runConf) {
            var child = ui.content.domNode;

            ui.form = new Form({}, 'run-configuration-java-form');

            ui.forms.inputs.name = new ValidationTextBox({
                required: true,
                missingMessage: i18n.validationNoName,
                value: runConf.name ? runConf.name : ''
            }, 'run-configuration-java-name');

            ui.forms.inputs.path = new ValidationTextBox({
                required: true,
                regExp: PATTERN_MAIN_FILE,
                missingMessage: i18n.validationNoPath,
                invalidMessage: i18n.validationInvalidPath,
                value: runConf.path ? (runConf.path.split('.').join('/') + '.java') : '',
                readonly: true
            }, 'run-configuration-java-path');

            var projectStore = new Observable(new Memory({data: [], idProperty: 'value'}));
            ide.getWorkspaceInfo(function (err, workspaceInfo) {
                if (err) {
                    notify.error(i18n.messageFailGetProjects);
                } else {
                    workspaceInfo.projects.forEach(function (project) {
                        projectStore.put({value: project, label: project});
                    });
                    ui.forms.select.setValue(runConf.project);
                }
                callback();
            });

            ui.forms.select = new Select({
                store: projectStore,
                labelAttr: 'label',
                required: true,
                missingMessage: i18n.validationNoProject
            }, 'run-configuration-java-project');
            ui.forms.select.startup();

            ui.saveButton = registry.byId('rcw-action-save');
            ui.pathButton = $(child).find('.rcw-action-path').get(0);

            on(ui.content, 'input, select:change', function () {
                topic.publish('project/run/config/changed', EVENT_TYPE_STATE, currentRunConf,
                        {isValid: _validate(), isDirty: true});
            });

            ui.content.own(
                on(ui.saveButton, 'click', function () {
                    if (_validate()) {
                        topic.publish('project/run/config/changed', EVENT_TYPE_SAVE, currentRunConf);
                    } else {
                        notify.error(i18n.validationInvalidForm);
                    }
                }),
                on(ui.pathButton, 'click', _pathButtonClicked),
                on(ui.forms.inputs.name, 'change', function () {
                    currentRunConf.__nameGen = false;
                })
            );
        }
        locale.convertMessage(ui.content.domNode);
    }


    return {
        run: function (runConf, callback) {
            var rootPath = ide.getPath() + '/' + runConf.project;
            var filePath = runConf.srcDir + '/' + runConf.path.replace(/\./g, '/') + '.java';
            FS.exec(rootPath, {cmd: 'javac', args: ['-d', runConf.outputDir, filePath]},
                function (err, stdout, stderr) {
                    logger.info('###javac', runConf.path, stdout, stderr);
                    topic.publish('#REQUEST.log', stdout);
                    topic.publish('#REQUEST.log', stderr);
                    if (!err && !stderr) {
                        FS.exec(rootPath, {cmd: 'java', args: ['-cp', runConf.outputDir, runConf.path]},
                            function (err, stdout, stderr) {
                                logger.info('###java', runConf.path, stdout, stderr);
                                topic.publish('#REQUEST.log', stdout);
                                topic.publish('#REQUEST.log', stderr);
                                callback(null, runConf);
                            });
                    }
                });
        },
        newConf: function (content, runConf, callback) {
            currentRunConf = runConf;
            currentRunConf.__nameGen = true;
            ui.content = content;
            _setTemplate(function () {
                topic.publish('project/run/config/changed', EVENT_TYPE_STATE, runConf, {
                    isValid: _validate(),
                    isDirty: true
                });
            });
            callback(null, runConf);
        },
        loadConf: function (content, runConf, callback) {
            currentRunConf = runConf;
            ui.content = content;
            _setTemplate(function () {
                topic.publish('project/run/config/changed', EVENT_TYPE_STATE, runConf, {
                    isValid: _validate()
                });
            });
            callback(null, runConf);
        },
        saveConf: function (runConf, callback) {
            delete currentRunConf.__nameGen;
            topic.publish('project/run/config/changed', EVENT_TYPE_STATE, runConf, {
                isDirty: false
            });
            callback(null, runConf);
        },
        deleteConf: function (runConfName, callback) {
            callback(null, currentRunConf);
        }
    };
});
