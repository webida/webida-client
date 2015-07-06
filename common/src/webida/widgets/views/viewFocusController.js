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

define(['external/lodash/lodash.min', // _
        'dojo/topic',                             // topic
        'dojox/grid/DataGrid',                    // DataGrid
        'dojo/data/ItemFileWriteStore',           // ItemFileWriteStore
        'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog'],   // ButtonedDialog
function (_, topic, DataGrid, ItemFileWriteStore, ButtonedDialog) {
    'use strict';

    var keyIdList = ['1', '2', '3', '4', '5', '6', '7', '8', '9',
                     'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
                     'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
                     'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    var keyIdPrefix = '`';
    var viewFocusController = function (fields) {
        this._cbList = {};
        this._fields = fields;
        this._keyMap = {};
    };

    viewFocusController.prototype = {

        isEmptyKey : function (key) {
            var _self = this;
            var keysCount = keyIdList.length;
            for (var i = 0; i < keysCount; i++) {
                if ((keyIdList[i] === key) && (!_self._keyMap.hasOwnProperty(key))) {
                    return true;
                }
            }
            return false;
        },

        getKey : function () {
            var _self = this;
            var i;
            var key = null;
            var prefix = '';
            var keysCount = keyIdList.length;
            for (i = 0; i < keysCount * 2; i++) {
                if (i >= keysCount) {
                    prefix = keyIdPrefix;
                }
                key = prefix + keyIdList[i % keysCount];
                if (!_self._keyMap.hasOwnProperty(key)) {
                    return key;
                }
            }
            return null;
        },

        registerView : function (view, opt) {
            var _self = this;
            var key;
            var fields = {};
            var focusElem = null;

            if (opt) {
                if (opt.hasOwnProperty('fields')) {
                    fields = opt.fields;
                }

                if (opt.hasOwnProperty('key')) {
                    key = opt.key;
                }

                if (opt.hasOwnProperty('focusElem')) {
                    focusElem = opt.focusElem;
                }
            }

            if (key) {
                if (!_self.isEmptyKey(key)) {
                    key = null;
                }
            } else {
                key = _self.getKey();
            }

            if (key && view) {

                var keyMap = _self._keyMap;
                var isExist = false;
                for (var indexKey in keyMap) {
                    if (keyMap.hasOwnProperty(indexKey) && keyMap[indexKey].type === 'view' &&
                        (keyMap[indexKey].view === view)) {
                        isExist = true;
                        break;
                    }
                }

                if (isExist === false) {
                    var item = {};
                    item.type = 'view';
                    item.view = view;
                    item.hotKey = key;
                    Object.keys(fields).forEach(function (field) {
                        item[field] = fields[field];
                    });
                    _self._keyMap[key] = item;
                    return true;
                }
            }
            return false;
        },

        unregisterView : function (view) {
            var _self = this;
            var keyMap = _self._keyMap;
            for (var key in keyMap) {
                if (keyMap.hasOwnProperty(key) && keyMap[key].type === 'view' && (keyMap[key].view === view)) {
                    delete keyMap[key];
                    return true;
                }
            }
        },

        moveFocusByKey : function (key) {
            var _self = this;
            var keyMap = _self._keyMap;

            if (key && keyMap.hasOwnProperty(key)) {
                if (keyMap[key].type === 'element') {
                    keyMap[key].elem.focus();
                } else if (keyMap[key].type === 'view') {
                    var view = keyMap[key].view;
                    view.select(true);
                }

                return true;
            }
            return false;
        },

        getViewList : function () {
            var viewList = [];
            var keyMap = this._keyMap;
            for (var key in keyMap) {
                if (keyMap.hasOwnProperty(key)) {
                    viewList.push(keyMap[key].view);
                }
            }
            return viewList;
        },

        showViewList : function (fieldLayout, title) {


            if (!fieldLayout) {
                return;
            }

            var _self = this;

            var data = {
                identifier: 'hotkey',
                items: []
            };

            var i;

            var keyMap = _self._keyMap;
            Object.keys(keyMap).forEach(function (key) {
                var item = keyMap[key];
                if ((item.type === 'view') || (item.type === 'element')) {
                    var gridItem = {};
                    var field;
                    gridItem.hotkey = key;
                    for (i = 0; i < fieldLayout.length; i++) {
                        field = fieldLayout[i].field;
                        if (item.hasOwnProperty(field)) {
                            gridItem[field] = item[field];
                        }
                    }
                    data.items.push(gridItem);
                }
            });

            var dataStore = new ItemFileWriteStore({
                data: data
            });

            var height = 70 + 25 * data.items.length;

            var width = 46;
            for (i = 0; i < fieldLayout.length; i++) {
                width += (parseInt(fieldLayout[i].width, 10) + 12);
            }

            var dlgContent =
                '<div tabindex="0" style="width:' + width + 'px; height: ' + height +
                'px"><p> &nbsp Enter the key to select an item.</p><div class="moveFocusGrid"></div></div>';

            var dlg = new ButtonedDialog({
                buttons: [
                    {
                        id: 'svlCloseButton',
                        caption: 'Close',
                        methodOnClick: 'hide'
                    }
                ],
                methodOnEnter: null,
                refocus: false,
                title: title,
                onHide: function () {
                    dlg.destroyRecursive();
                },
            });
            dlg.setContentArea(dlgContent);

            var layoutItems = [];
            layoutItems.push(
                {
                    'name': 'Key',
                    'field': 'hotkey',
                    'width': '30px'
                }
            );

            for (i = 0; i < fieldLayout.length; i++) {
                layoutItems.push(
                    {
                        'name': fieldLayout[i].name,
                        'field': fieldLayout[i].field,
                        'width': fieldLayout[i].width + 'px',
                    }
                );
            }

            void new DataGrid({
                autoHeight: true,
                store: dataStore,
                structure: [layoutItems],
                selectionMode: 'single',
            }, $(dlg.domNode).find('.moveFocusGrid')[0]);

            dojo.connect(dlg, 'onKeyDown', function (event) {
                event.preventDefault();
                event.stopPropagation();

                if (event.altKey || event.ctrlKey || event.shiftKey || event.metaKey) {
                    return;     // do nothing
                }

                var keycode = event.keyCode;
                var key = null;
                var keyIndex = -1;
                if ((keycode >= 49) && (keycode <= 57)) {
                    keyIndex = keycode - 49;
                } else if ((keycode >= 65) && (keycode <= 90)) {
                    keyIndex = keycode - 56;
                }
                if (keyIndex >= 0) {
                    key = keyIdList[keyIndex];
                    console.log(dlg);
                    dlg.hide();
                    _self.moveFocusByKey(key);
                }
            });

            dlg.show();
        },

    };

    return viewFocusController;

});
