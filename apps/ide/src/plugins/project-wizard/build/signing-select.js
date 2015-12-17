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
 * @file Manage build singing selecting dialog and related data
 * @since 1.0.0
 * @author kh5325.kim@samsung.com
 *
 * @module ProjectWizard/SigningSelectionDialog
 * @extends module:ProjectWizard/Dialog
 */

define([
    'dijit/registry',
    'dojo',
    'dojo/Deferred',
    'dojo/store/Memory',
    'webida-lib/webida-0.3',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
    'text!plugins/project-wizard/layer/export-signing-select.html',
    './buildProfile',
    '../dialog',
    '../messages',
    '../lib/util'
], function (
    reg,
    dojo,
    Deferred,
    Memory,
    webida,
    ButtonedDialog,
    tplLayout,
    BuildProfile,
    Dialog,
    Messages,
    Util
) {
    'use strict';

    var SelectSigning = function (projectInfo) {
        this.projectInfo = projectInfo;
        this.store = null;
    };

    // inherit Dialog
    var _super = SelectSigning.prototype = new Dialog();
    // correct the constructor pointer because it points to Dialog
    SelectSigning.prototype.constructor = SelectSigning;

    SelectSigning.prototype._getSigning = function (alias) {
        var signing = this.store.get(alias);
        if (!signing) {
            _super.setError(Messages.INVALID_SIGNING.format(alias));
        }
        return signing;
    };

    SelectSigning.prototype.openDialog = function () {
        var self = this;

        var deferred = new Deferred();
        var COMBO_ID = 'editSigningCombo';
        var dlg = new ButtonedDialog({
            FORM: {
                'editSigningKeystoreFile': { type: 'text', prop: BuildProfile.SIGNING.KEYSTORE_FILE },
                'editSigningKeyPassword': { type: 'text', prop: BuildProfile.SIGNING.KEY_PASSWORD },
                'editSigningKeystorePassword': { type: 'text', prop: BuildProfile.SIGNING.KEYSTORE_PASSWORD }
            },

            selected: null,

            buttons: [
                { id: 'pwCreate',
                 caption: 'OK',
                 methodOnClick: 'select'
                },
                { id: 'pwCancel',
                 caption: 'Cancel',
                 methodOnClick: 'hide'
                }
            ],
            methodOnEnter: null,
            title: Messages.GEN_SIGNED_WIZARD,
            refocus: false,

            onHide: function () {
                dlg.destroyRecursive();
                return deferred.resolve(dlg.selected);
            },

            onLoad: function () {
                var cb = reg.byId(COMBO_ID);
                cb.set('labelAttr', BuildProfile.SIGNING.ALIAS);
                cb.set('searchAttr', BuildProfile.SIGNING.ALIAS);
                cb.set('placeholder', Messages.SELECT_ALIAS);
                webida.fs.getMyFS(function (err, fs) {
                    if (err) {
                        _super.setError(err);
                    } else {
                        fs.getKeystoreList(function (err, data) {
                            if (err) {
                                _super.setError(err);
                            } else {
                                self.store = new Memory({
                                    data: data,
                                    idProperty: BuildProfile.SIGNING.ALIAS
                                });

                                cb.set('store', self.store);
                            }
                        });
                    }
                });

                dojo.connect(cb, 'onChange', function (evt) {
                    dlg._resetForm();
                    var alias = evt;
                    if (alias) {
                        self.setMessage('');
                        dlg._setForm(alias);
                    }
                });
                dojo.connect(cb, 'onKeyDown', function (evt) {
                    if (evt.keyCode === 13) {
                        evt.preventDefault();
                    }
                });
                dojo.connect(reg.byId('editSigningAdd'), 'onClick', function () {
                    require(['plugins/project-wizard/build/signing-new'], function (NewSigning) {
                        var delegate = new NewSigning(self.projectInfo, self.store);
                        delegate.openDialog().then(
                            function (data) {
                                if (data) {
                                    self.store.add(data);
                                    _super.setComboValue(COMBO_ID, data.alias);
                                }
                            }
                        );
                    });
                });
                dojo.connect(reg.byId('editSigningDelete'), 'onClick', function () {
                    var alias = _super.checkCombo(COMBO_ID, Messages.NO_SIGNING);
                    if (alias) {
                        // FIXME just use directly `popupDialog.yesno()`
                        Util.openDialog('Delete', Messages.DELETE.format(alias), function () {
                            // Remove keystore file from user file system
                            webida.fs.getMyFS(function (err, fs) {
                                if (err) {
                                    _super.setError(err);
                                } else {
                                    var signing = self._getSigning(alias);
                                    fs.removeKeystoreFile(signing[BuildProfile.SIGNING.ALIAS],
                                                          signing[BuildProfile.SIGNING.KEYSTORE_FILE],
                                                          function (err) {
                                        if (err) {
                                            _super.setError(err);
                                        } else {
                                            //console.log(result); // _id, alias, filename, fsid, keypwd, uid
                                            self.store.remove(alias);
                                            _super.setComboValue(COMBO_ID, null);
                                        }
                                    });
                                }
                            });
                        });
                    }
                });
            },

            _setForm: function (alias) {
                var signing = self._getSigning(alias);
                if (signing) {
                    //console.log('_setForm', signing);
                    $.each(this.FORM, function (name, obj) {
                        var val = _super.getPropValue(signing, obj.prop);
                        if (obj.type === 'radio') {
                            _super.setRadioValue(name, val);
                        } else {
                            _super.setValue(name, val);
                        }
                    });
                }
            },
            _resetForm: function () {
                _super.resetForm(this.FORM);
            },

            select: function () {
                var alias = _super.checkCombo(COMBO_ID, Messages.NO_SIGNING);
                var signing = self._getSigning(alias);
                dlg.selected = signing;
                dlg.hide();
            }
        });
        _super.setId(dlg.id);
        dlg.set('doLayout', false);
        dlg.setContentArea(tplLayout);
        dlg.show();

        return deferred.promise;
    };

    return SelectSigning;
});
