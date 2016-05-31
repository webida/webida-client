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
 * @file The shortcut list.
 * @since: 1.7.0
 * @author: minsung.jin@samsung.com
 */

define([
    'external/lodash/lodash.min',
    'dijit/registry',
    'dojo/data/ItemFileWriteStore',
    'dojo/i18n!../nls/resource',
    'dojo/store/Memory',
    'dojo/store/Observable',
    'dojo/text!./layer/shortcut-list.html',
    'dojox/grid/DataGrid',
    'plugins/webida.preference/preference-service-factory',
    'webida-lib/plugins/command-system/system/command-system',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
    'webida-lib/util/notify',
    '../plugin'
], function (
    _,
    reg,
    ItemFileWriteStore,
    i18n,
    Memory,
    Observable,
    Layout,
    DataGrid,
    preference,
    commandSystem,
    ButtonedDialog,
    notify,
    workbench
) {
    'use strict';

    var commandService = commandSystem.service;
    var SHORTCUT_LIST_DIALOG = 'webida-shortcut-list-dialog';
    var SHORTCUT_LIST_GRID = 'webida-shortcut-list-grid';
    var changedItems = [];

    function getItem(items) {
        if (items.length > 0) {
            var shortcutKey = {
                old: items[0].shortcutKey[0],
                new: ''
            };
            changedItems.push(shortcutKey);
        }
    }

    function fetchFailed(error) {
        console.log(error);
    }

    function setChangedItem(store, elem) {
        var str;
        var data;
        if (typeof elem.textContent !== 'undefined') {
            str = elem.textContent;
        } else {
            str = elem.innerText;
        }
        if (store) {
            data = store.fetch({
                query: {shortcutKey: str},
                onComplete: getItem,
                onError: fetchFailed
            });
        }
    }

    function checkKeyInUse(keys) {
        if (commandService.getShortcutRegistry(keys)) {
            notify.error('These keys are used');
            return false;
        }
        return true;
    }

    function changeRegistry() {
        var shortcutItem;
        var shortcutList = commandService.getShortcutRegistry();
        var preferenceService = preference.get('WORKSPACE');
        if (changedItems.length > 0) {
            preferenceService.setValue(
                'webidaShortcut',
                'webida.shortcut:type',
                'custom',
                function () {
                _.each(changedItems, function (item) {
                    shortcutItem = commandService.getShortcutRegistry(item.old);
                    if (shortcutItem) {
                        shortcutList[item.new] = shortcutItem;
                        delete shortcutList[item.old];
                    }
                });
            });
        }
    }

    function changeText(elem, str) {
        if (typeof elem.textContent !== 'undefined') {
            elem.textContent = str;
        } else {
            elem.innerText = str;
        }
    }

    function createStore() {
        var data = {
            identifier: 'shortcutKey',
            items: []
        };
        var shortcutList = commandService.getShortcutRegistry();
        for (var key in shortcutList) {
            if (shortcutList.hasOwnProperty(key)) {
                var gridItem = {};
                gridItem.shortcutKey = key;
                gridItem.commandId = shortcutList[key].commandId;
                gridItem.description = shortcutList[key].description;
                data.items.push(gridItem);
            }
        }
        return new ItemFileWriteStore({ data: data });
    }

    function createGrid() {
        var layout = [
            {
                'name': 'Keys',
                'field': 'shortcutKey',
                'width': '250px'
            },
            {
                'name': 'Command',
                'field': 'commandId',
                'width': '250px'
            },
            {
                'name': 'Description',
                'field': 'description',
                'width': '350px'
            }
        ];
        var grid = new DataGrid({
            store: createStore(),
            height: '600px',
            structure: layout,
            noDataMessage: i18n.noDataToDisplay
        }, SHORTCUT_LIST_GRID);

        dojo.connect(grid, 'onKeyDown', function (event) {
            event.preventDefault();
            event.stopPropagation();
            var keys = commandService.shortcutBind.getKeys(event);
            if (keys) {
                if (checkKeyInUse(keys)) {
                    var changedItemsLength = changedItems.length;
                    setChangedItem(grid.store, event.target);
                    if (changedItemsLength < changedItems.length) {
                        changeText(event.target, keys);
                        changedItems[changedItemsLength].new = keys;
                    }
                }
            }
        });
    }

    function createDialog() {
        var shortcutDialog = reg.byId(SHORTCUT_LIST_DIALOG);
        if (!shortcutDialog) {
            shortcutDialog = new ButtonedDialog({
                buttons: [
                    {
                        id: 'shortcutListCancelButton',
                        caption: i18n.shortcutKeysSettingDialogCancel,
                        methodOnClick: 'hide'
                    },
                    {
                        id: 'shortcutListSaveButton',
                        caption: i18n.shortcutKeysSettingDialogSave,
                        methodOnClick: 'save'
                    }
                ],
                title: i18n.shortcutsDialogTitle,
                id: SHORTCUT_LIST_DIALOG,
                onHide: function () {
                    shortcutDialog.destroyRecursive();
                    workbench.focusLastWidget();
                },
                save: function () {
                    changeRegistry();
                    shortcutDialog.destroyRecursive();
                    workbench.focusLastWidget();
                },
                refocus: false,
                autofocus: false,
                methodOnEnter: null
            });
            shortcutDialog.setContentArea(Layout);
            createGrid(shortcutDialog);
        }
        return shortcutDialog;
    }

    function openDialog() {
        var dialog = createDialog();
        dialog.startup();
        dialog.show();
    }

    return {
        show: openDialog
    };
});
