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
 * @fileoverview webida - workspace selection dialog
 *
 * @version: 0.1.0
 * @since: 2013.10.16
 *
 */

define(['dojo/text!./workspaceSelectionDialog.html',
        'dijit/registry',
        'dojo/dom-construct',
        'dojo/data/ObjectStore',
        'dojo/store/Memory',
        'dijit/Dialog',
        'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog', // ButtonedDialog
        'dijit/form/Select',
        'webida-lib/app'],
function (markup, registry, domConstruct, ObjectStore, Memory, Dialog,
           ButtonedDialog, Select, app) {
    'use strict';
    var dialog;
    var selectWidget;
    var currentWorkspace = app.getPath().substring(1);
    var fsCache = app.getFSCache();
    var workspaces = [];

    function getCandidates() {
        fsCache.list('/', false, function (err, stats) {
            var dirStats = stats.filter(function (stat) { return stat.isDirectory; });
            var numDirs = dirStats.length;
            var numChecked = 0;
            var candidates = [];
            dirStats.forEach(function (dirStat) {
                var dirName = dirStat.name;
                var confDirPath = '/' + dirName + '/.workspace';
                fsCache.exists(confDirPath, function (err, flag) {
                    numChecked++;
                    if (err) {
                        console.log('Error: checking if "' + confDirPath +
                                    '" exists failed (' + err + ')');
                    } else {
                        if (flag) {
                            candidates.push(dirName);
                        }
                    }
                    if (numDirs === numChecked) {
                        getWorkspaces(candidates);
                    }
                });

            });
        });
    }

    function getWorkspaces(candidates) {
        var numDirs = candidates.length;
        var numChecked = 0;
        workspaces = [];
        candidates.forEach(function (candi) {
            var confDirPath = '/' + candi + '/.workspace';
            fsCache.isDirectory('/' + candi + '/.workspace', function (err, flag) {
                numChecked++;
                if (err) {
                    console.log('Error: checking if "' + confDirPath +
                                '" is a directory failed (' + err + ')');
                } else {
                    if (flag) {
                        workspaces.push({ id: candi, value: candi, label: candi });
                    }
                }
                if (numDirs === numChecked) {
                    putWorkspacesToWidget();
                }

            });
        });
    }

    function putWorkspacesToWidget() {
        workspaces.sort(function (a, b) {
            if (a.label < b.label) {
                return -1;
            } else if (a.label > b.label) {
                return 1;
            } else {
                return 0;
            }
        });
        for (var i = 0; i < workspaces.length; i++) {
            var option = selectWidget._getOptionObjForItem(workspaces[i]);
            selectWidget.addOption(option);
        }
        var options = selectWidget.options;
        for (var j = 0; j < options.length; j++) {
            if (options[j].label === currentWorkspace) {
                options[j].selected = true;
            } else {
                options[j].selected = false;
            }
        }
        selectWidget._setDisplayedValueAttr(currentWorkspace);
    }

    dialog = registry.byId('workspaceSelectionDialog');
    if (!dialog) {
        dialog = new ButtonedDialog({
            buttons: [
                {
                    id: 'workspaceSelectionOkButton',
                    caption: 'OK',
                    methodOnClick: 'switchWorkspace',
                    disabledOnShow: true
                },
                {
                    id: 'workspaceSelectionCancelButton',
                    caption: 'Cancel',
                    methodOnClick: 'hide'
                }
            ],
            methodOnEnter: 'switchWorkspace',
            switchWorkspace: function () {
                if (selectWidget.getValue() !== currentWorkspace) {
                    app.saveStatus(function () {
                        window.location.search =
                            '?workspace=' + app.getFsid() + '/' + selectWidget.getValue();
                    });
                } else {
                    dialog.hide();
                }
            },

            id: 'workspaceSelectionDialog',
            title: 'Switch Workspace',
            onCancel: function () {
                dialog.hide();
            },
            onShow: getCandidates,
            onHide: function () {
                for (var i = 0; i < workspaces.length; i++) {
                    var id = workspaces[i].id;
                    selectWidget.removeOption(id);
                }
            }
        });
        dialog.setContentArea(markup);
        var okButton = registry.byId('workspaceSelectionOkButton');

        var data = [];
        var memory = new Memory({data: data});
        var model = new ObjectStore(memory);
        selectWidget = new Select({store: model, style: 'width:100%;'});
        selectWidget.placeAt('workspaceSelectWidget');
        selectWidget.onChange = function (newValue) {
            if (newValue === currentWorkspace) {
                okButton.setDisabled(true);
            } else {
                okButton.setDisabled(false);
            }
        };
        selectWidget.startup();
    }

    return dialog;
});
