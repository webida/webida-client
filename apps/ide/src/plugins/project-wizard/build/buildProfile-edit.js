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
        'dojo/store/Memory',
        'dojo/store/Observable',
        'dojox/grid/EnhancedGrid',
        'dojox/grid/enhanced/plugins/IndirectSelection',
        'dijit/registry',
        'plugins/project-configurator/projectConfigurator',
        'text!plugins/project-wizard/layer/buildprofile-edit.html',
        './buildProfile',
        '../dialog',
        '../messages',
        '../lib/util'
       ],
function (ide, ButtonedDialog, dojo, Deferred, ObjectStore, Memory, Observable, EnhancedGrid, IndirectSelection, reg,
    projectConfigurator, tplLayout, BuildProfile, Dialog, Messages, Util) {
    'use strict';

    // constructor
    var EditBuildProfile = function (projectInfo, buildStore) {
        this.projectInfo = projectInfo;
        this.buildStore = buildStore;
    };

    // inherit Dialog
    var _super = EditBuildProfile.prototype = new Dialog();
    // correct the constructor pointer because it points to Dialog
    EditBuildProfile.prototype.constructor = EditBuildProfile;

    EditBuildProfile.prototype._getBuildProfile = function (profileName) {
        var profile = BuildProfile.getBuildProfile(this.buildStore.data, profileName);
        if (!profile) {
            _super.setError(Messages.INVALID_PROFILE.format(profileName));
        }
        return profile;
    };

    EditBuildProfile.prototype._save = function (cb) {
        this.projectInfo.build = this.buildStore.data;
        console.log('_save', this.buildStore.data);
        Util.saveProject(this.projectInfo, cb);
    };

    EditBuildProfile.prototype.doEdit = function (selected) {
        //console.log('doEdit', selected);
        var self = this;

        var deferred = new Deferred();
        var COMBO_ID = 'editBuildProfileCombo';
        var dlg = new ButtonedDialog({
            FORM: {
                'editInfoLabel': { type: 'text', prop: 'label' },
                'editInfoIcon': { type: 'text', prop: 'icon' },
                'editInfoPackageName': { type: 'text', prop: BuildProfile.PLATFORM.ANDROID + '.packageName' },
                'editInfoMinSdkVersion': { type: 'text', prop: BuildProfile.PLATFORM.ANDROID + '.minSdkVersion' },
                'editInfoTargetSdkVersion': { type: 'text', prop: BuildProfile.PLATFORM.ANDROID + '.targetSdkVersion' },
                'editInfoVersionCode': { type: 'text', prop: BuildProfile.PLATFORM.ANDROID + '.versionCode' },
                'editInfoVersionName': { type: 'text', prop: BuildProfile.PLATFORM.ANDROID + '.versionName' },
                'type': { type: 'radio', prop: 'type' },
                'platform': { type: 'radio', prop: 'platform' }
            },
            SIGNING_FORM: {
                /*
                'editInfoSignKey': { type: 'combo', prop: 'name' }, // signing[key1]
                'editInfoSignAlias': { type: 'text', prop: 'alias' }, // signing[key1][alias]
                'editInfoSignKSFile': { type: 'text', prop: 'file' },
                'editInfoSignKeyPwd': { type: 'text', prop: 'password' },
                'editInfoSignKSPwd': { type: 'text', prop: BuildProfile.PLATFORM.ANDROID + '.keystorePassword' }
                */
            },

            buttons: [
                { id: 'pwClose',
                  caption: 'Close',
                  methodOnClick: 'hide'
                }
            ],
            methodOnEnter: null,
            title: 'Manage Configurations',
            refocus: false,

            pluginStore: null,
            grid: null,

            onHide: function () {
                dlg.destroyRecursive();
                return deferred.resolve(self.buildStore.data);
            },

            onLoad: function () {
                reg.byId(COMBO_ID).set('store', self.buildStore);
                if (selected && selected.length === 1) {
                    _super.setComboValue(COMBO_ID, selected[0]);
                } else {
                    _super.setMessage(Messages.NO_PROFILE);
                }
                /*
                var tip = 'We do not currently support <b>iOS</b>.';
                Util.addTooltip('editInfoPlatformIOS', tip);
                Util.addParentTooltip('editInfoPlatformIOS', tip);
                */
                //dijit.byId(COMBO_ID).set('readOnly', true);
                dojo.connect(reg.byId(COMBO_ID), 'onChange', function (evt) {
                    console.log('onChange', evt);
                    dlg._resetForm();
                    dlg._resetSigningForm();
                    var profileName = evt;
                    if (profileName) {
                        _super.setMessage('');
                        dlg._setForm(profileName);
                        var cb = reg.byId('editInfoSignKey');
                        if (cb) {
                            var cbStore = cb.get('store');
                            var profile = self._getBuildProfile(profileName);
                            //console.log('cbStore > add', profile[BuildProfile.SIGNING_PROPERTY]);
                            $.each(profile[BuildProfile.SIGNING_PROPERTY], function (index, obj) {
                                cbStore.add({ name: obj.name });
                            });
                        }
                    }
                });
                dojo.connect(reg.byId(COMBO_ID), 'onKeyDown', function (evt) {
                    if (evt.keyCode === 13) {
                        evt.preventDefault();
                    }
                });
                dojo.connect(reg.byId('editBuildProfileAdd'), 'onClick', function () {
                    require(['plugins/project-wizard/build/buildProfile-new'], function (NewBuildProfile) {
                        var delegate = new NewBuildProfile(self.projectInfo, self.buildStore);
                        delegate.openDialog().then(
                            function (data) {
                                if (data !== null) {
                                    // It's sync with store.
                                    //self.projectInfo.build.push(profile);
                                    self.buildStore.add(data.profile);
                                    self._save(function (err) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            _super.setComboValue(COMBO_ID, data.name);
                                        }
                                    });
                                }
                            }
                        );
                    });
                });
                dojo.connect(reg.byId('editBuildProfileDelete'), 'onClick', function () {
                    var profileName = _super.checkCombo(COMBO_ID, Messages.NO_PROFILE);
                    if (profileName) {
                        Util.openDialog('Delete', Messages.DELETE.format(profileName), function () {
                            self.buildStore.remove(profileName);
                            self._save(function (err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    _super.setComboValue(COMBO_ID, null);
                                }
                            });
                        });
                    }
                });
                dojo.connect(reg.byId('editBuildProfileApply'), 'onClick', this.onApply.bind(this)
                );
                reg.byId('editInfoPlatformAndroid').on('change', function (isChecked) {
                    if (isChecked) {
                        var mainTab = dijit.byId('platformTab');
                        mainTab.selectChild(dijit.byId('platformAndroid'));
                    }
                });
                reg.byId('editInfoPlatformIOS').on('change', function (isChecked) {
                    if (isChecked) {
                        var mainTab = dijit.byId('platformTab');
                        mainTab.selectChild(dijit.byId('platformIOS'));
                    }
                });
                dojo.connect(reg.byId('editInfoSignKey'), 'onChange', function (evt) {
                    console.log('onChange', this.item);
                    if (this.item && this.item.value === '__new_') {
                        require(['plugins/project-wizard/build/buildProfile-key-new'], function (NewKey) {
                            var profileName = _super.checkCombo(COMBO_ID, Messages.NO_PROFILE);
                            if (profileName) {
                                var profile = self._getBuildProfile(profileName);
                                var cbStore = reg.byId('editInfoSignKey').get('store');
                                var delegate = new NewKey(self.projectInfo, profile);
                                delegate.openDialog().then(
                                    function (data) {
                                        if (!data) {
                                            dlg._resetSigningForm(true);
                                            return;
                                        }
                                        profile.addSigning(data.signing);
                                        self._save(function (err) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                cbStore.add({ name: data.name });
                                                _super.setValue('editInfoSignKey', data.name);
                                            }
                                        });
                                    }
                                );
                            }
                        });
                    } else {
                        var key = evt;
                        dlg._setSigningForm(key);
                    }
                });
                this._fillPluginsGrid(self.buildStore);
            },

            onApply: function () {
                var profileName = _super.checkCombo(COMBO_ID, Messages.NO_PROFILE);
                if (profileName) {
                    this._getForm(profileName);
                    this._getSigningForm(profileName);
                    self._save(function (err) {
                        if (err) {
                            console.log(err);
                            _super.setMessage('Failed to apply change(s): ' + err);
                        }
                    });
                }
            },

            _setPropValue: function (profile, prop, val) {
                var arr = prop.split('.');
                Util.setNestedObject(profile, arr, val);
            },

            _getForm: function (profileName) {
                var profile = self._getBuildProfile(profileName);
                if (profile) {
                    $.each(this.FORM, function (name, obj) {
                        var val = (obj.type === 'radio') ? _super.getRadioValue(name) : _super.getValue(name);
                        var prop = obj.prop;
                        dlg._setPropValue(profile, prop, val);
                    });
                    profile.removePlugins();
                    var items = dlg.grid.selection.getSelected();
                    items.forEach(function (item) {
                        profile.addPlugin(item.id);
                    });
                }
            },
            _setForm: function (profileName) {
                var profile = self._getBuildProfile(profileName);
                //console.log('_setForm', profile);
                if (profile) {
                    $.each(this.FORM, function (name, obj) {
                        var val = _super.getPropValue(profile, obj.prop);
                        if (obj.type === 'radio') {
                            _super.setRadioValue(name, val);
                        } else {
                            _super.setValue(name, val);
                        }
                    });
                    this.pluginStore.data.forEach(function (obj, idx) {
                        if (profile.pluginExists(obj.id)) {
                            dlg.grid.selection.setSelected(idx, true);
                        }
                    });
                }
            },
            _resetForm: function () {
                _super.resetForm(this.FORM);
                this.pluginStore.data.forEach(function (obj, idx) {
                    dlg.grid.selection.setSelected(idx, false);
                });
            },

            _getSigningForm: function (profileName) {
                var profile = self._getBuildProfile(profileName);
                var key;
                $.each(this.SIGNING_FORM, function (name, obj) {
                    if (obj.prop === 'name') {
                        key = _super.getValue(name);
                        return false;
                    }
                });
                if (!key) { // no key is selected
                    return;
                }
                var signing = profile.getSigning(key);
                //console.log('_getSigningForm', key, signing);
                $.each(this.SIGNING_FORM, function (name, obj) {
                    var val = (obj.type === 'radio') ? _super.getRadioValue(name) : _super.getValue(name);
                    var prop = obj.prop;
                    dlg._setPropValue(signing, prop, val);
                });
            },
            _setSigningForm: function (key) {
                if (!key) {
                    return;
                }
                var profileName = _super.getValue(COMBO_ID);
                var profile = self._getBuildProfile(profileName);
                var signing = profile.getSigning(key);
                $.each(this.SIGNING_FORM, function (name, obj) {
                    var prop = obj.prop;
                    var val = _super.getPropValue(signing, prop);
                    if (obj.type === 'radio') {
                        _super.setRadioValue(name, val);
                    } else {
                        _super.setValue(name, val);
                    }
                });
            },
            _resetSigningForm: function (soft) {
                $.each(this.SIGNING_FORM, function (name, obj) {
                    if (obj.type === 'radio') {
                        _super.setRadioValue(name, '');
                    } else {
                        _super.setValue(name, '');
                    }
                });
                if (typeof soft === 'undefined') {
                    Util.resetCombo('editInfoSignKey', function (store) {
                        store.add({
                            name: Messages.ADD_KEY,
                            id: '__new_',
                            value: '__new_'
                        });
                    });
                }
            },

            _fillPluginsGrid: function () {
                this.pluginStore = new Observable(new Memory({ data: this._getPlugins() }));
                var layout = [[
                    {
                        'name': 'Plugin',
                        'field': 'id',
                        'width': '50%'
                    },
                    {
                        'name': 'Name',
                        'field': 'name',
                        'width': 'auto'
                    }
                ]];
                this.grid = new EnhancedGrid({
                    store:  new ObjectStore({ objectStore: this.pluginStore }),
                    structure: layout,
                    noDataMessage: '<strong>No plugins</strong>',
                    /* rowSelector: '20px', */
                    autoHeight: true,
                    style: 'border: 1px solid gray;',
                    canSort: function () {
                        return false;
                    },
                    plugins: {
                        indirectSelection: {
                            width: '20px',
                            /* headerSelector: true, */
                        }
                    },
                    //onRowDblClick: function (test) { }
                }, dojo.query('#platformPluginsGrid')[0]);
                /*
                dojo.connect(this.grid.selection, 'onSelected', function (rowIndex) { });
                dojo.connect(this.grid.selection, 'onDeselected', function (rowIndex) { });
                dojo.connect(this.grid.rowSelectCell, 'toggleAllSelection', function (newValue) { });
                 */
                this.grid.startup();
            },

            _getPlugins: function () {
                var plugins = $.map(BuildProfile.PLUGIN, function (n) {
                    return { id: n.id, name: n.name };
                });
                return plugins;
            }
        });
        _super.setId(dlg.id);
        dlg.set('doLayout', false);
        dlg.setContentArea(tplLayout);
        dlg.show();

        return deferred.promise;
    };

    return EditBuildProfile;
});
