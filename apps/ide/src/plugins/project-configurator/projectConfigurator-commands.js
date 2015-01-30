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
 * webida - project configurator
 *
 * Src:
 *   plugins/project-configurator/plugin.js
 */
define([
    'webida-lib/app',
    'webida-lib/plugin-manager-0.1',
    'webida-lib/util/path',
    'dojo/topic',
    'text!./run-configuration.html',
    'text!./run-widget.html',
    'dijit/registry',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog', // ButtonedDialog
    'dijit/layout/ContentPane',
    './projectConfigurator',
    './plugin',
    'webida-lib/plugins/workspace/plugin',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/widgets/dialogs/file-selection/FileSelDlg2States', // FileDialog
    'other-lib/toastr/toastr',
    'popup-dialog'
], function (ide, pm, pathUtil, topic, runConfHtml, runWidgetHtml, reg, ButtonedDialog,
              ContentPane, projectConfigurator, pc, workspace, workbench, FileDialog, toastr,
              PopupDialog) {

    'use strict';

    //console.log('loading project configurator module...');

    var module = {};
    var fsMount = ide.getFSCache();

    var liveReloadHandleList = [];
    var EXTENSION_POINTS = {
        RUN_CONFIGURATION_TYPE: 'project-configurator:run-configuration-type',
        RUN_CONFIGURATION: 'project-configurator:run-configuration'
    };
    var extpoint = (function () {
        var confTypes = pm.getExtensions(EXTENSION_POINTS.RUN_CONFIGURATION_TYPE);
        var confs = pm.getExtensions(EXTENSION_POINTS.RUN_CONFIGURATION);

        return {
            getRunConfigurationTypeList: function () {
                return confTypes;
            },
            getRunConfigurationList: function () {
                return confs;
            },
            getRunDelegate: function (type) {
                var result = $.grep(confs, function (e) {
                    return e.type === type;
                });
                return result[0] ? result[0] : null;
            },
        };
    })();

    function saveProjectPropertyToFile(projectProperty) {
        projectConfigurator.saveProjectProperty(
            workspace.getRootPath() + projectProperty.name + '/',
            projectProperty);
    }

    function releaseLiveReloadHandle(handle) {
        handle.remove();
        handle = null;
    }

    function runProject(projectProperty, runObject, mode) {
        console.log('runProject', runObject, mode);
        if (runObject.type) {
            console.log('runProject with type', runObject.type);
            var delegate = extpoint.getRunDelegate(runObject.type);
            if (delegate) {
                require([delegate.module], function (mod) {
                    if (typeof mod[delegate.handler] === 'function') {
                        mod[delegate.handler](projectProperty, mode, runObject);
                    }
                });
            }
        } else {
            runWithAlias(projectProperty, runObject);
        }
    }

    function runWithAlias(projectProperty, runObject) {
        var projectPath = workspace.getRootPath() + projectProperty.name;
        var openname = projectPath + projectProperty.name;
        var runningWin = window.open('', openname, runObject.openArgument);
        if (!runningWin) {
            toastr.error('Window can\'t be opened.<br />It might be interrupted by pop-up blocking, please check it.');
            return;
        }

        fsMount.addAlias(projectPath, 3600, function (err, data) {
            if (err) {
                toastr.error(err);
                return;
            }

            var argStr = runObject.argument ? '?' + runObject.argument : '';
            var sharpStr = runObject.fragment ? '#' + runObject.fragment : '';
            var url = data.url + '/' + runObject.path + argStr + sharpStr;

            runningWin.location.href = './redirect.html#' + url;

            toastr.success('\'' + projectProperty.name + '\' successfully launched');
            if (runningWin.focus) {
                runningWin.focus();
            }

            var reloadHandle = liveReloadHandleList[openname];
            if (reloadHandle) {
                releaseLiveReloadHandle(reloadHandle);
                liveReloadHandleList[openname] = null;
            }

            if (runObject.liveReload === true) {
                var handle = topic.subscribe('fs.cache.file.set', function (fsURL, target, reason, maybeModified) {
                    if (runningWin.closed) {
                        releaseLiveReloadHandle(handle);
                    } else {
                        if ((target.indexOf(projectPath) === 0) && (maybeModified)) {
                            runningWin.location.href = './redirect.html#' + url;
                        }
                    }
                });
                liveReloadHandleList[openname] = handle;
            }
        });
    }

    function checkUnsavedConf() {
        var saveButton = document.getElementsByClassName('rcw-action-save');
        if (!saveButton) {
            return;
        }
        var i;
        for (i = 0; i < saveButton.length; i++) {
            if ($(saveButton[i]).hasClass('rcw-display-none') === false) {
                return 'not been saved';
            }
        }

        saveButton = document.getElementsByClassName('rcw-action-newsave');
        if (!saveButton) {
            return;
        }
        for (i = 0; i < saveButton.length; i++) {
            if ($(saveButton[i]).hasClass('rcw-display-none') === false) {
                return 'not been created';
            }
        }
    }

    function isDuplicateRunName(projectProperty, name) {
        var runList = projectProperty.run;
        if (!runList || !runList.list) {
            return false;
        }

        for (var i = 0; i < runList.list.length; i++) {
            if (runList.list[i].name === name) {
                return true;
            }
        }
        return false;
    }

    function addButtonCssClass(button, size) {
        button.bind('mouseover', function () {
            button.addClass('rcw-button-hover-' + size);
        });

        button.bind('mouseout', function () {
            button.removeClass('rcw-button-hover-' + size);
            button.removeClass('rcw-button-push-' + size);
        });

        button.bind('mousedown', function () {
            button.addClass('rcw-button-push-' + size);
        });

        button.bind('mouseup', function () {
            button.removeClass('rcw-button-push-' + size);
        });
    }

    function foldButtonClicked(child, arrow, content) {
        var toggled = $(content).attr('toggled');
        if (toggled === 'unfold') {
            $(content).attr('toggled', 'fold');
            arrow.removeClass('rcw-title-arrow-unfold');
            if (arrow.hasClass('rcw-title-arrow-unfold-hover') === true) {
                arrow.removeClass('rcw-title-arrow-unfold-hover');
                arrow.addClass('rcw-title-arrow-hover');
            }

            content.removeClass('rcw-display-block');
        } else {
            $(content).attr('toggled', 'unfold');
            arrow.addClass('rcw-title-arrow-unfold');

            if (arrow.hasClass('rcw-title-arrow-hover') === true) {
                arrow.removeClass('rcw-title-arrow-hover');
                arrow.addClass('rcw-title-arrow-unfold-hover');
            }

            content.addClass('rcw-display-block');

            if (child) {
                $(child).css('height', '');
                $(child).css('width', '');
            }
        }
    }

    function addFoldButton(child, arrow, content) {
        var toggled;
        arrow.bind('mouseover', function () {
            toggled = $(content).attr('toggled');
            if (toggled === 'unfold') {
                arrow.addClass('rcw-title-arrow-unfold-hover');
            } else {
                arrow.addClass('rcw-title-arrow-hover');
            }
        });

        arrow.bind('mouseout', function () {
            arrow.removeClass('rcw-title-arrow-hover');
            arrow.removeClass('rcw-title-arrow-unfold-hover');
        });

        arrow.bind('mouseup', function () {
            foldButtonClicked(child, arrow, content);
        });
    }

    function makeConfigurationName(projectProperty, path) {
        var ret = path;

        if (isDuplicateRunName(projectProperty, ret) === true) {
            var temp;
            for (var i = 1; i < 100; i++) {
                temp = ret + '-' + i.toString();
                if (isDuplicateRunName(projectProperty, temp) !== true) {
                    return temp;
                }
            }
            var date = new Date();
            return ret + date.toGMTString();
        } else {
            return ret;
        }
    }

    function pathButtonClicked(projectProperty, pathInputBox, nameInputBox) {
        if (!projectProperty || !pathInputBox || !projectProperty.name) {
            toastr.error('Cannot find root path');
            return;
        }

        var root = workspace.getRootPath() + projectProperty.name + '/';
        var initialPath;

        if (pathInputBox.value) {
            initialPath = root + pathInputBox.value;
        } else {
            initialPath = root;
        }

        var dlg = new FileDialog({
            mount: fsMount,
            root: root,
            initialSelection: [initialPath],
            title: 'Select the Main File to Run',
            singular: true,
            dirOnly: false,
            showRoot: false
        });
        dlg.open(function (selected) {
            if (selected) {
                if (selected.length <= 0) {
                    toastr.warning('Select a file.');
                    return;
                }
                var pathSplit = selected[0].split(root);
                if (pathSplit.length > 0) {
                    pathInputBox.value = pathSplit[1];
                    if (!nameInputBox) {
                        return;
                    }
                    if (!nameInputBox.value) {
                        nameInputBox.value = makeConfigurationName(projectProperty, pathInputBox.value);
                    } else {
                        if ($(nameInputBox).attr('userinput') !== 'true') {
                            var splitName = nameInputBox.value.split(pathInputBox.value);
                            if (splitName.length > 0) {
                                nameInputBox.value = makeConfigurationName(projectProperty, pathInputBox.value);
                            }
                        }
                    }
                } else {
                    toastr.warning('Select a file.');
                    return;
                }
            }
        });
    }

    function runButtonClicked(projectProperty, run, runListPane, child, content, arrow) {
        var runList = projectProperty.run;
        var runs = runListPane.domNode;
        var titles = $(runs).find('.rcw-title-name');
        for (var i = 0; i < runList.list.length; i++) {
            if ($(titles[i]).text() === runList.selectedId + ' [latest run]') {
                $(titles[i]).text(runList.list[i].name);
            }
            if ($(titles[i]).text() === run.name) {
                $(titles[i]).text(run.name + ' [latest run]');
            }
        }
        runList.selectedId = run.name;

        var toggled = $(content).attr('toggled');
        if (toggled !== 'unfold') {
            foldButtonClicked(child, arrow, content);
        }

        runProject(projectProperty, run);
    }

    function modifyButtonClicked(modifyButton, saveButton, cancelButton,
                                  runButton, deleteButton, pathButton, inputBoxs, readonlyInputBoxs, checkBox) {
        modifyButton.addClass('rcw-display-none');
        saveButton.removeClass('rcw-display-none');
        cancelButton.removeClass('rcw-display-none');
        runButton.addClass('rcw-display-none');
        deleteButton.addClass('rcw-display-none');
        pathButton.removeClass('rcw-display-none');

        for (var i = 0; i < inputBoxs.length; i++) {
            $(inputBoxs[i]).addClass('rcw-content-table-inputbox-edit');
            $(inputBoxs[i]).removeAttr('readonly');
            inputBoxs[i].oldValue = inputBoxs[i].value ? inputBoxs[i].value : '';
        }

        readonlyInputBoxs[0].oldValue = readonlyInputBoxs[0].value ? readonlyInputBoxs[0].value : '';

        checkBox.removeAttr('disabled');
        checkBox[0].oldValue = checkBox[0].checked;
    }

    function saveButtonClicked(projectProperty, child, runList, run, title,
                                inputBoxs, readonlyInputBoxs, saveButton, cancelButton, modifyButton,
                                runButton, deleteButton, pathButton, checkBoxNode) {
        if (!inputBoxs[0].value) {
            toastr.error('Enter a name.');
            return;
        }

        if (isDuplicateRunName(projectProperty, inputBoxs[0].value) && inputBoxs[0].value !== run.name) {
            toastr.error('Duplicate name');
            return;
        }

        if (!readonlyInputBoxs[0].value) {
            toastr.error('Select a path.');
            return;
        }

        saveButton.addClass('rcw-display-none');
        cancelButton.addClass('rcw-display-none');
        modifyButton.removeClass('rcw-display-none');
        runButton.removeClass('rcw-display-none');
        deleteButton.removeClass('rcw-display-none');
        pathButton.addClass('rcw-display-none');

        for (var i = 0; i < inputBoxs.length; i++) {
            $(inputBoxs[i]).removeClass('rcw-content-table-inputbox-edit');
            $(inputBoxs[i]).attr('readonly', 'true');
        }
        checkBoxNode.attr('disabled', 'disabled');

        var titles = $(child).find('.rcw-title-name');

        if (runList) {
            if (runList.selectedId === run.name) {
                runList.selectedId = inputBoxs[0].value;
                $(titles[0]).text(inputBoxs[0].value + ' [latest run]');
            } else {
                $(titles[0]).text(inputBoxs[0].value);
            }
        } else {
            $(titles[0]).text(inputBoxs[0].value);
        }
        $(title[0]).attr('title', inputBoxs[0].value);

        run.name = inputBoxs[0].value;
        run.path = readonlyInputBoxs[0].value;
        run.argument = inputBoxs[1].value;
        run.fragment = inputBoxs[2].value;
        run.openArgument = inputBoxs[3].value;

        if (checkBoxNode[0].checked === true) {
            run.liveReload = true;
        } else {
            run.liveReload = false;
        }

        toastr.success('Successfully modified');
    }

    function cancelButtonClicked(saveButton, cancelButton, modifyButton,
                                  runButton, deleteButton, pathButton, inputBoxs, readonlyInputBoxs, checkBox) {
        saveButton.addClass('rcw-display-none');
        cancelButton.addClass('rcw-display-none');
        modifyButton.removeClass('rcw-display-none');
        runButton.removeClass('rcw-display-none');
        deleteButton.removeClass('rcw-display-none');
        pathButton.addClass('rcw-display-none');

        for (var i = 0; i < inputBoxs.length; i++) {
            $(inputBoxs[i]).removeClass(
                'rcw-content-table-inputbox-edit');
            $(inputBoxs[i]).attr('readonly', 'true');
            inputBoxs[i].value = inputBoxs[i].oldValue ?
                inputBoxs[i].oldValue : '';
        }

        readonlyInputBoxs[0].value = readonlyInputBoxs[0].oldValue ?
            readonlyInputBoxs[0].oldValue : '';

        checkBox.attr('disabled', 'disabled');
        checkBox[0].checked = checkBox[0].oldValue;

        toastr.info('Modification canceled');
    }

    function newSaveButtonClicked(projectProperty, child, runList, run, title,
                                   inputBoxs, readonlyInputBoxs, saveButton, newSaveButton, cancelButton,
                                   newCancelButton, modifyButton, runButton, deleteButton, pathButton, checkBox,
                                   createNewButton) {
        if (!inputBoxs[0].value) {
            toastr.error('Enter a name.');
            return;
        }

        if (isDuplicateRunName(projectProperty, inputBoxs[0].value) && inputBoxs[0].value !== run.name) {
            toastr.error('Duplicate name');
            return;
        }

        if (!readonlyInputBoxs[0].value) {
            toastr.error('Select a path.');
            return;
        }

        saveButton.addClass('rcw-display-none');
        newSaveButton.addClass('rcw-display-none');
        cancelButton.addClass('rcw-display-none');
        newCancelButton.addClass('rcw-display-none');
        modifyButton.removeClass('rcw-display-none');
        runButton.removeClass('rcw-display-none');
        deleteButton.removeClass('rcw-display-none');
        pathButton.addClass('rcw-display-none');

        for (var i = 0; i < inputBoxs.length; i++) {
            $(inputBoxs[i]).removeClass('rcw-content-table-inputbox-edit');
            $(inputBoxs[i]).attr('readonly', 'true');
        }
        checkBox.attr('disabled', 'disabled');

        var titles = $(child).find('.rcw-title-name');

        if (runList) {
            if (runList.selectedId === run.name) {
                runList.selectedId = inputBoxs[0].value;
                $(titles[0]).text(inputBoxs[0].value + ' [latest run]');
            } else {
                $(titles[0]).text(inputBoxs[0].value);
            }
        } else {
            $(titles[0]).text(inputBoxs[0].value);
        }
        $(title[0]).attr('title', inputBoxs[0].value);

        run.name = inputBoxs[0].value;
        run.path = readonlyInputBoxs[0].value;
        run.argument = inputBoxs[1].value;
        run.fragment = inputBoxs[2].value;
        run.openArgument = inputBoxs[3].value;

        if (checkBox[0].checked === true) {
            run.liveReload = true;
        } else {
            run.liveReload = false;
        }

        if (!runList) {
            var runListItem = [run];
            runList = {
                selectedId: null,
                list: runListItem
            };
            projectProperty.run = runList;
        } else {
            runList.list.unshift(run);
        }

        //pathButton.set('disabled', true);
        createNewButton.set('disabled', false);

        toastr.success('Successfully created');
    }

    function deleteButtonClicked(projectProperty, run, runListPane, markup) {
        var runList = projectProperty.run;
        if (!runList || !runList.list || runList.list.length < 1) {
            toastr.error('Cannot read run configurations information');
            return;
        }

        PopupDialog.yesno({
            title: 'Delete Run Configuration',
            message: 'Are you sure you want to delete this run configuration?',
            type: 'info'
        }).then(function () {
            for (var i = 0; i < runList.list.length; i++) {
                if (runList.list[i] === run) {
                    if (runList.selectedId ===  run.name) {
                        runList.selectedId = null;
                    }
                    runList.list.splice(i, 1);
                    break;
                }
            }

            runListPane.removeChild(markup);

            toastr.info('Successfully deleted');
        }, function () {
            toastr.info('Deletion canceled');
            return;
        });
    }

    function addNewRunToListPane(projectProperty, runListPane) {
        var markup = new ContentPane({
            style: 'text-indent:20px; line-height:100%',
            content: runWidgetHtml
        });

        var child = markup.domNode;
        var title = $(child).find('.rcw-title-name');
        var contentBody = $(child).find('.rcw-content');
        var arrow = $(child).find('.rcw-title-arrow');
        var createNewButton = reg.byId('run-configuration-crete-button');

        var run = projectConfigurator.makeEmptyRunObject();

        $(contentBody).attr('toggled', 'unfold');
        arrow.addClass('rcw-title-arrow-unfold');
        contentBody.addClass('rcw-display-block');

        addFoldButton(child, arrow, contentBody);

        var runButtonNode = $(child).find('.rcw-title-run');
        addButtonCssClass(runButtonNode, '20');

        runButtonNode.addClass('rcw-display-none');

        runButtonNode.bind('mouseup', function () {
            runButtonClicked(projectProperty, run, runListPane, child, contentBody, arrow);
        });

        var deleteButtonNode = $(child).find('.rcw-title-delete');
        addButtonCssClass(deleteButtonNode, '20');

        deleteButtonNode.addClass('rcw-display-none');

        deleteButtonNode.bind('mouseup', function () {
            deleteButtonClicked(projectProperty, run, runListPane, markup);

            createNewButton.set('disabled', false);
        });

        var runList = projectProperty.run;

        var inputBoxNodes = $(child).find('.rcw-content-table-inputbox');

        for (var i = 0; i < inputBoxNodes.length; i++) {
            $(inputBoxNodes[i]).addClass('rcw-content-table-inputbox-edit');
            $(inputBoxNodes[i]).removeAttr('readonly');
        }

        var readonlyInputBoxNodes = $(child).find('.rcw-content-table-inputbox-readonly');

        var checkBoxNode = $(child).find('.rcw-content-table-checkbox');
        checkBoxNode.removeAttr('disabled');

        $(inputBoxNodes[0]).bind('input', function () {
            $(inputBoxNodes[0]).attr('userinput', 'true');
        });

        var modifyButtonNode = $(child).find('.rcw-action-modify');
        addButtonCssClass(modifyButtonNode, '20');
        modifyButtonNode.addClass('rcw-display-none');

        var saveButtonNode = $(child).find('.rcw-action-save');
        addButtonCssClass(saveButtonNode, '24');
        saveButtonNode.addClass('rcw-display-none');

        var newSaveButtonNode = $(child).find('.rcw-action-newsave');
        addButtonCssClass(newSaveButtonNode, '24');

        var cancelButtonNode = $(child).find('.rcw-action-cancel');
        addButtonCssClass(cancelButtonNode, '24');
        cancelButtonNode.addClass('rcw-display-none');

        var newCancelButtonNode = $(child).find('.rcw-action-newcancel');
        addButtonCssClass(newCancelButtonNode, '24');

        var pathButtonNode = $(child).find('.rcw-action-path');
        addButtonCssClass(pathButtonNode, '20');

        createNewButton.set('disabled', true);

        modifyButtonNode.bind('mouseup', function () {
            modifyButtonClicked(modifyButtonNode, saveButtonNode,
                                cancelButtonNode, runButtonNode, deleteButtonNode, pathButtonNode, inputBoxNodes,
                                readonlyInputBoxNodes, checkBoxNode);
        });

        saveButtonNode.bind('mouseup', function () {
            saveButtonClicked(projectProperty, child, runList, run, title,
                              inputBoxNodes, readonlyInputBoxNodes, saveButtonNode,
                              cancelButtonNode, modifyButtonNode, runButtonNode, deleteButtonNode,
                              pathButtonNode, checkBoxNode);
        });

        newSaveButtonNode.bind('mouseup', function () {
            newSaveButtonClicked(projectProperty, child, runList, run, title,
                                 inputBoxNodes, readonlyInputBoxNodes, saveButtonNode,
                                 newSaveButtonNode, cancelButtonNode, newCancelButtonNode,
                                 modifyButtonNode, runButtonNode, deleteButtonNode, pathButtonNode, checkBoxNode,
                                 createNewButton);
        });
        cancelButtonNode.bind('mouseup', function () {
            cancelButtonClicked(saveButtonNode, cancelButtonNode,
                                modifyButtonNode, runButtonNode, deleteButtonNode, pathButtonNode, inputBoxNodes,
                                readonlyInputBoxNodes, checkBoxNode);
        });

        newCancelButtonNode.bind('mouseup', function () {
            runListPane.removeChild(markup);

            createNewButton.set('disabled', false);

            toastr.info('Creation canceled');
        });

        pathButtonNode.bind('mouseup', function () {
            pathButtonClicked(projectProperty, readonlyInputBoxNodes[0], inputBoxNodes[0]);
        });

        runListPane.addChild(markup, 0);

        $(document.getElementById('run-configuration-content')).animate({
            scrollTop: 0
        }, 500);

        pathButtonClicked(projectProperty, readonlyInputBoxNodes[0], inputBoxNodes[0]);
    }


    function addRunToListPane(projectProperty, runListPane, run) {
        var markup = new ContentPane({
            style: 'text-indent:20px; line-height:100%',
            content: runWidgetHtml
        });

        var child = markup.domNode;
        var title = $(child).find('.rcw-title-name');

        var contentBody = $(child).find('.rcw-content');
        var arrow = $(child).find('.rcw-title-arrow');

        var runList = projectProperty.run;
        var selected = false;

        if (runList.selectedId === run.name) {
            $(contentBody).attr('toggled', 'unfold');
            arrow.addClass('rcw-title-arrow-unfold');
            contentBody.addClass('rcw-display-block');
            $(title).text(run.name + ' [latest run]');
            selected = true;
        } else {
            $(title).text(run.name);
        }
        $(title).attr('title', run.name);

        addFoldButton(child, arrow, contentBody);

        var runButtonNode = $(child).find('.rcw-title-run');

        addButtonCssClass(runButtonNode, '20');

        runButtonNode.bind('mouseup', function () {
            runButtonClicked(projectProperty, run, runListPane, child, contentBody, arrow);
        });

        var deleteButtonNode = $(child).find('.rcw-title-delete');
        addButtonCssClass(deleteButtonNode, '20');

        deleteButtonNode.bind('mouseup', function () {
            deleteButtonClicked(projectProperty, run, runListPane, markup);
        });

        var inputBoxNodes = $(child).find('.rcw-content-table-inputbox');
        inputBoxNodes[0].value = run.name ? run.name : '';
        inputBoxNodes[1].value = run.argument ? run.argument : '';
        inputBoxNodes[2].value = run.fragment ? run.fragment : '';
        inputBoxNodes[3].value = run.openArgument ? run.openArgument : '';

        var readonlyInputBoxNodes = $(child).find('.rcw-content-table-inputbox-readonly');
        readonlyInputBoxNodes[0].value = run.path;

        var checkBoxNode = $(child).find('.rcw-content-table-checkbox'); //FIXME
        if (run.liveReload) {
            checkBoxNode[0].checked = true;
        } else {
            checkBoxNode[0].checked = false;
        }

        var modifyButtonNode = $(child).find('.rcw-action-modify');
        addButtonCssClass(modifyButtonNode, '20');

        var saveButtonNode = $(child).find('.rcw-action-save');
        addButtonCssClass(saveButtonNode, '24');
        saveButtonNode.addClass('rcw-display-none');

        var newSaveButtonNode = $(child).find('.rcw-action-newsave');
        addButtonCssClass(newSaveButtonNode, '24');
        newSaveButtonNode.addClass('rcw-display-none');

        var cancelButtonNode = $(child).find('.rcw-action-cancel');
        addButtonCssClass(cancelButtonNode, '24');
        cancelButtonNode.addClass('rcw-display-none');

        var newCancelButtonNode = $(child).find('.rcw-action-newcancel');
        addButtonCssClass(newCancelButtonNode, '24');
        newCancelButtonNode.addClass('rcw-display-none');

        var pathButtonNode = $(child).find('.rcw-action-path');
        addButtonCssClass(pathButtonNode, '20');
        pathButtonNode.addClass('rcw-display-none');

        modifyButtonNode.bind('mouseup', function () {
            modifyButtonClicked(modifyButtonNode, saveButtonNode,
                                cancelButtonNode, runButtonNode, deleteButtonNode, pathButtonNode, inputBoxNodes,
                                readonlyInputBoxNodes, checkBoxNode);
        });

        saveButtonNode.bind('mouseup', function () {
            saveButtonClicked(projectProperty, child, runList, run, title,
                              inputBoxNodes, readonlyInputBoxNodes, saveButtonNode,
                              cancelButtonNode, modifyButtonNode, runButtonNode, deleteButtonNode,
                              pathButtonNode, checkBoxNode);
        });

        cancelButtonNode.bind('mouseup', function () {
            cancelButtonClicked(saveButtonNode, cancelButtonNode,
                                modifyButtonNode, runButtonNode, deleteButtonNode, pathButtonNode, inputBoxNodes,
                                readonlyInputBoxNodes, checkBoxNode);
        });

        pathButtonNode.bind('mouseup', function () {
            pathButtonClicked(projectProperty, readonlyInputBoxNodes[0]);
        });

        runListPane.addChild(markup);
        if (selected === true) {
            return markup.id;
        }
    }

    function openRunConfigurationDialog(projectProperty) {
        var runConfigurationDialog = new ButtonedDialog({
            buttons: [
                {
                    caption: 'OK',
                    methodOnClick: 'okOnRunConf'
                }
            ],
            methodOnEnter: null,
            okOnRunConf: function () {
                var unSaveMsg = checkUnsavedConf();
                if (unSaveMsg) {
                    PopupDialog.yesno({
                        title: 'Run Configuration',
                        message: 'Run configuration has ' + unSaveMsg +
                        '. Are you sure you want to close this dialog?',
                        type: 'info'
                    }).then(function () {
                        runConfigurationDialog.hide();
                    }, function () {
                        return;
                    });
                } else {
                    runConfigurationDialog.hide();
                }
            },

            refocus: false,
            title: 'Run Configuration - ' + projectProperty.name,
            style: 'width: 600px',
            onHide: function () {
                saveProjectPropertyToFile(projectProperty); // ???
                runConfigurationDialog.destroyRecursive();
                workbench.focusLastWidget();
            },
            onLoad: function () {
                var runListPane = reg.byId('run-configuration-list-contentpane');
                var selectedID = null;
                if (projectProperty.run) {
                    var runList = projectProperty.run;
                    var temp;
                    if (runList && runList.list) {
                        for (var i = 0; i < runList.list.length; i++) {
                            temp = addRunToListPane(projectProperty, runListPane, runList.list[i]);
                            if (temp) {
                                selectedID = temp;
                            }
                        }
                    }
                }

                var createNewButton = reg.byId('run-configuration-crete-button');
                dojo.connect(createNewButton, 'onClick', function () {
                    createNewButton.set('disabled', true);
                    addNewRunToListPane(projectProperty, runListPane);
                });
            }
        });
        runConfigurationDialog.set('doLayout', false);
        runConfigurationDialog.setContentArea(runConfHtml);
        runConfigurationDialog.show();
    }

    function getRunConfigurationByName(projectProperty, name) {
        if (!projectProperty || !name) {
            return null;
        }

        var runObj = projectProperty.run;
        if (!runObj) {
            return null;
        }

        var runObjList = runObj.list;
        if (!runObjList) {
            return null;
        }

        for (var i = 0; i < runObjList.length; i++) {
            if (runObjList[i].name === name) {
                return runObjList[i];
            }
        }
        return null;
    }

    function _runBinded(projectProperty, mode) {
        var runConf;

        if (!projectProperty.run || !projectProperty.run.list || projectProperty.run.list.length === 0) {
            toastr.info('Cannot find a run configuration. Add a new one.');
            openRunConfigurationDialog(projectProperty);
        } else if (projectProperty.run.list.length === 1) {
            runConf = getRunConfigurationByName(projectProperty,
                                                projectProperty.run.list[0].name);
            if (runConf) {
                projectProperty.run.selectedId = runConf.name;
                runProject(projectProperty, runConf);
            } else {
                toastr.warning('Cannot find a run configuration. Add a new one.');
                openRunConfigurationDialog(projectProperty);
            }
            return;
        } else if (!projectProperty.run.selectedId) {
            toastr.warning('Cannot find the latest run. Choose a run configuration and click run button');
            openRunConfigurationDialog(projectProperty);
        } else {
            runConf = getRunConfigurationByName(projectProperty,
                                                projectProperty.run.selectedId);
            if (runConf) {
                runProject(projectProperty, runConf, mode);
            } else {
                toastr.warning('Cannot find the latest run. Choose a run configuration and click run button');
                openRunConfigurationDialog(projectProperty);
            }
        }
    }

    module.workspaceRunBinded = function () {
        var selectedPaths = workspace.getSelectedPaths();
        if (!selectedPaths || selectedPaths.length !== 1) {
            return null;
        }

        var selectedPath = selectedPaths[0];
        if (!selectedPath) {
            return;
        }
        var nodeSplit = selectedPath.split('/');
        var projectName = nodeSplit[2];
        var projectProperty = projectConfigurator.getConfigurationObjectByProjectName(projectName);
        if (!projectProperty) {
            projectConfigurator.createProjectProperty(
                workspace.getRootPath() + projectName + '/', function () {
                    projectProperty = projectConfigurator.getConfigurationObjectByProjectName(projectName);
                    _runBinded(projectProperty);
                });
        } else {
            _runBinded(projectProperty);
        }
    };

    module.workbenchDebugBinded = function () {
        this._workbenchRunBinded(projectConfigurator.DEBUG_MODE);
    };

    module.workbenchRunBinded = function () {
        this._workbenchRunBinded(projectConfigurator.RUN_MODE);
    };

    module._workbenchRunBinded = function (mode) {
        var context = workbench.getContext();
        var contextPaths;

        if (context && context.paths) {
            contextPaths = context.paths;
            if (contextPaths.length === 1) {
                var bRunnable = isRunnablePath(contextPaths[0]);
                if (bRunnable !== true) {
                    return;
                }
            } else {
                return;
            }
        }

        if (!contextPaths) {
            console.error('No valid context path');
            return;
        }
        var contextPath = contextPaths[0];
        if (contextPath === workspace.getRootPath()) {
            toastr.warning('Cannot run workspace directory');
        }

        var projectName = parseProjectNameFromPath(contextPath);
        var projectProperty = projectConfigurator.getConfigurationObjectByProjectName(projectName);
        if (!projectProperty) {
            projectConfigurator.createProjectProperty(
                workspace.getRootPath() + projectName + '/', function () {
                    projectProperty = projectConfigurator.getConfigurationObjectByProjectName(projectName);
                    _runBinded(projectProperty);
                });
        } else {
            _runBinded(projectProperty, mode);
        }
    };

    function _runListBinded(projectProperty, runConfName) {
        if (runConfName === 'Run configurations') {
            openRunConfigurationDialog(projectProperty);
        } else {
            var runConfNameSplit = runConfName.split(' [');
            var name = runConfNameSplit[0];
            var runConf = getRunConfigurationByName(projectProperty, name);
            if (runConf) {
                projectProperty.run.selectedId = name;
            } else {
                runConf = projectConfigurator.makeEmptyRunObject();
                runConf.name = name;
                runConf.path = name;

                if (!projectProperty.run) {
                    var runListItem = [runConf];
                    var runList = {
                        selectedId: runConf.name,
                        list: runListItem
                    };
                    projectProperty.run = runList;
                } else {
                    projectProperty.run.selectedId = runConf.name;
                    projectProperty.run.list.unshift(runConf);
                }
            }
            saveProjectPropertyToFile(projectProperty);
            runProject(projectProperty, runConf, projectConfigurator.RUN_MODE);
        }
    }

    function isRunnableProjectPath(projectLevelPath) {
        if (!projectLevelPath || !pathUtil.isDirPath(projectLevelPath)) {
            return false;
        }

        var projectName = pathUtil.getName(projectLevelPath);
        if (!projectName || projectName[0] === '.') {
            return false;
        }

        return true;
    }

    function isRunnablePath(path) {
        var projectPath = projectConfigurator.getProjectRootPath(path);
        return isRunnableProjectPath(projectPath);
    }

    module.workspaceRunListBinded = function (arg) {
        var runString = pc.getContextItem(arg);
        if (!runString) {
            return null;
        }
        var runStirngSplit = runString.split(' : ');
        var projectName = runStirngSplit[0];
        var runConfName = runStirngSplit[1];

        var projectProperty = projectConfigurator.getConfigurationObjectByProjectName(
            projectName);

        if (!projectProperty) {
            projectConfigurator.createProjectProperty(
                workspace.getRootPath() + projectName + '/', function () {
                    projectProperty = projectConfigurator.getConfigurationObjectByProjectName(projectName);
                    _runListBinded(projectProperty, runConfName);
                });
        } else {
            _runListBinded(projectProperty, runConfName);
        }
    };

    module.workbenchRunListBinded = function (arg) {
        var runString = pc.getContextItem(arg);
        if (!runString) {
            return null;
        }

        var runStirngSplit = runString.split(' : ');
        var projectName = runStirngSplit[0];
        var runConfName = runStirngSplit[1];
        var projectProperty = projectConfigurator.getConfigurationObjectByProjectName(projectName);
        if (!projectProperty) {
            projectConfigurator.createProjectProperty(
                workspace.getRootPath() + projectName + '/', function () {
                    projectProperty = projectConfigurator.getConfigurationObjectByProjectName(projectName);
                    _runListBinded(projectProperty, runConfName);
                });
        } else {
            _runListBinded(projectProperty, runConfName);
        }
    };

    function parseProjectNameFromPath(path) {
        if (!path) {
            return '';
        }

        var splitPath = path.split('/');
        if (!splitPath || splitPath.length < 3) {
            return '';
        }

        return splitPath[2];
    }

    return module;
});
