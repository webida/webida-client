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
 * @file Manage device selecting dialog and related data
 * @since 1.0.0
 * @author cimfalab@gmail.com
 *
 * @extends module:ProjectWizard/Dialog
 */

define(['webida-lib/webida-0.3',
        'webida-lib/app',
        'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
        'dojo',
        'dojo/Deferred',
        'dojo/data/ObjectStore',
        'dojo/store/Memory',
        'dojox/grid/EnhancedGrid',
        'dojox/grid/enhanced/plugins/IndirectSelection',
        'dijit/registry',
        'text!plugins/project-wizard/layer/device-select.html',
        './gcm',
       ],
function (webida, ide, ButtonedDialog, dojo, Deferred, ObjectStore, Memory,
           EnhancedGrid, IndirectSelection, reg, tplLayout, GCM) {
    'use strict';

    // constructor
    var SelectDevice = function () {
        this.store = null;
    };

    SelectDevice.prototype.openDialog = function () {
        var self = this;

        var deferred = new Deferred();
        var dlg = new ButtonedDialog({
            selected: null,

            buttons: [
                { id: 'pwSelect',
                 caption: 'OK',
                 methodOnClick: 'select'
                },
                { id: 'pwCancel',
                 caption: 'Cancel',
                 methodOnClick: 'hide'
                }
            ],
            methodOnEnter: 'checkAndCreate',
            title: 'Select Device',
            refocus: false,

            onHide: function () {
                dlg.destroyRecursive();
                return deferred.resolve(dlg.selected);
            },

            grid: null,

            onLoad: function () {
                function formatDevice(info) {
                    var json = JSON.parse(info);
                    return json[GCM.Info.NAME];
                }

                var layout = [[
                    {
                        'name': 'Device',
                        'field': GCM.INFO,
                        'width': '100%',
                        'formatter': formatDevice,
                        'styles': 'border-right-width: 0px;'
                    }
                ]];

                webida.build.getGCMInfo(function (err, data) {
                    //console.log('getGCMInfo', data);
                    self.store = new Memory({
                        data: data,
                        idProperty: GCM.REGID
                    });

                    dlg.grid = new EnhancedGrid({
                        selectionMode: 'single',
                        store: new ObjectStore({ objectStore: self.store }),
                        structure: layout,
                        noDataMessage: 'No device.<br />Please install Companion App on ' +
                                        'your device and<br />sign-in to register.',
                        /* rowSelector: '20px', */
                        autoHeight: true,
                        style: 'border: 1px solid gray;',
                        canSort: function () {
                            return false;
                        },
                        plugins: {
                            indirectSelection: {
                                width: '20px'
                            }
                        },
                        //onRowDblClick: function (test) { }
                    }, dojo.query('#deviceGrid')[0]);
                    /*
                    dojo.connect(dlg.grid.selection, 'onSelected', function (rowIndex) { });
                    dojo.connect(dlg.grid.selection, 'onDeselected', function (rowIndex) { });
                    dojo.connect(dlg.grid.rowSelectCell, 'toggleAllSelection', function (newValue) { });
                     */
                    dlg.grid.startup();
                    dlg.show();
                });
            },

            select: function () {
                var items = dlg.grid.selection.getSelected();
                if (items.length > 0) {
                    dlg.selected = items[0][GCM.REGID];
                }
                dlg.hide();
            }
        });
        dlg.set('doLayout', false);
        dlg.setContentArea(tplLayout);

        return deferred.promise;
    };

    return SelectDevice;
});
