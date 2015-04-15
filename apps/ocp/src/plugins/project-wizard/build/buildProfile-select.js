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

define(['webida-lib/app',
        'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
        'dojo',
        'dojo/Deferred',
        'dojo/data/ObjectStore',
        'dojox/grid/EnhancedGrid',
        'dojox/grid/enhanced/plugins/IndirectSelection',
        'dijit/registry',
        'text!plugins/project-wizard/layer/buildprofile-select.html',
        './build',
        './buildProfile',
       ],
function (ide, ButtonedDialog, dojo, Deferred, ObjectStore, EnhancedGrid,
           IndirectSelection, reg, tplLayout, Build, BuildProfile) {
    'use strict';

    // constructor
    var SelectBuildProfile = function (projectInfo, buildStore, options) {
        this.projectInfo = projectInfo;
        this.buildStore = buildStore;
        this.options = options;
    };

    SelectBuildProfile.prototype.openDialog = function () {
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
            methodOnEnter: 'select',
            title: 'Select Configuration',
            refocus: false,

            onHide: function () {
                dlg.destroyRecursive();
                return deferred.resolve(dlg.selected);
            },

            grid: null,

            onLoad: function () {
                function formatType(value) {
                    switch (value) {
                    case BuildProfile.PLATFORM.ANDROID :
                        return '<span class="platform android"></span>';
                    case BuildProfile.PLATFORM.IOS :
                        return '<span class="platform ios"></span>';
                    }
                    return '';
                }

                var layout = [[
                    {
                        'name': '',
                        'field': 'platform',
                        'width': '10px',
                        'formatter': formatType,
                        'styles': 'border-right-width: 0px;'
                    },
                    {
                        'name': 'Configuration',
                        'field': 'name',
                        'width': '100%',
                        'styles': 'border-right-width: 0px;'
                    }
                ]];

                this.grid = new EnhancedGrid({
                    selectionMode: 'single',
                    store:  new ObjectStore({ objectStore: self.buildStore }),
                    structure: layout,
                    noDataMessage: '<strong>No profile</strong>',
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
                }, dojo.query('#profilesGrid')[0]);
                /*
                dojo.connect(this.grid.selection, 'onSelected', function (rowIndex) { });
                dojo.connect(this.grid.selection, 'onDeselected', function (rowIndex) { });
                dojo.connect(this.grid.rowSelectCell, 'toggleAllSelection', function (newValue) { });
                 */
                this.grid.selection.setSelected(0, true);
                this.grid.startup();
                if (self.options) {
                    if (self.options.filter) {
                        self.options.filter(this.grid, this.grid.store.objectStore.data);
                    }
                    if (self.options.message) {
                        $('#optionsMessage').text(self.options.message);
                    }
                }
            },

            select: function () {
                var items = dlg.grid.selection.getSelected();
                if (items.length > 0) {
                    dlg.selected = items[0].name;
                }
                dlg.hide();
            }
        });
        dlg.set('doLayout', false);
        dlg.setContentArea(tplLayout);
        dlg.show();

        return deferred.promise;
    };

    return SelectBuildProfile;
});
