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
 * @file Manage build singing creating dialog and related data
 * @since 1.0.0
 * @author kh5325.kim@samsung.com
 *
 * @module ProjectWizard/SigningCreatingDialog
 * @extends module:ProjectWizard/Dialog
 */

define([
    'dijit/registry',
    'dojo/Deferred',
    'webida-lib/util/path',
    'webida-lib/server-api',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
    'text!plugins/project-wizard/layer/export-signing-new.html',
    './buildProfile',
    '../dialog',
    '../messages'
], function (
    reg,
    Deferred,
    pathUtil,
    webida,
    ButtonedDialog,
    tplLayout,
    BuildProfile,
    Dialog,
    Messages
) {
    'use strict';

    // constructor
    var NewSigning = function (projectInfo, store) {
        this.projectInfo = projectInfo;
        this.store = store;
    };

    // inherit Dialog
    var _super = NewSigning.prototype = new Dialog();
    // correct the constructor pointer because it points to Dialog
    NewSigning.prototype.constructor = NewSigning;

    NewSigning.prototype.validate = function () {
        var chks = ['alias', 'keystoreFile', 'keyPassword', 'keystorePassword'];
        var valid = true;
        $.each(chks, function (index, id) {
            var e = reg.byId(id);
            if (!e.get('value')) {
                _super.setError(Messages.NO_INPUT);
                e.focus();
                valid = false;
                return false;
            }
        });
        if (!valid) {
            return false;
        }
        var result = $.grep(this.store.data, function (e) {
            return e[BuildProfile.SIGNING.ALIAS] === reg.byId('alias').get('value');
        });
        if (result[0]) {
            _super.setError(Messages.DUPLICATE_ALIAS);
            return false;
        }
        result = $.grep(this.store.data, function (e) {
            return e[BuildProfile.SIGNING.KEYSTORE_FILE] === pathUtil.getName(reg.byId('keystoreFile').get('value'));
        });
        if (result[0]) {
            _super.setError(Messages.DUPLICATE_FILE);
            return false;
        }
        return true;
    };

    NewSigning.prototype.openDialog = function () {
        var self = this;
        var data = null;

        var dlg = new ButtonedDialog({
            buttons: [
                { id: 'signingCreate',
                    caption: 'OK',
                    methodOnClick: 'checkAndCreate'
                },
                { id: 'signingCancel',
                    caption: 'Cancel',
                    methodOnClick: 'hide'
                }
            ],
            methodOnEnter: 'checkAndCreate',
            title: Messages.GEN_SIGNED_WIZARD_NEW_KEY_STORE,
            refocus: false,

            onHide: function () {
                dlg.destroyRecursive();
                return deferred.resolve(data);
            },

            onLoad: function () {
            },

            checkAndCreate: function () {
                _super.setMessage('');
                var newName = reg.byId('alias').get('value');
                try {
                    if (self.validate()) {
                        doCreation(newName);
                    }
                } catch (err) {
                    _super.setError(err);
                }
            }
        });

        function doCreation(newName) {
            var alias = newName;
            var keyPassword = reg.byId('keyPassword').get('value');
            var keystorePassword = reg.byId('keystorePassword').get('value');

            // Registration of new keystore file into user file system
            webida.fs.getMyFS(function (err, fs) {
                if (err) {
                    _super.setError(err);
                } else {
                    var input = document.getElementById('keystoreFile');
                    var file = input.files[0];
                    var filename = file.name;
                    var keyInfo = {};
                    keyInfo[BuildProfile.SIGNING.ALIAS] = alias;
                    keyInfo[BuildProfile.SIGNING.KEY_PASSWORD] = keyPassword;
                    // TODO: android only
                    keyInfo[BuildProfile.SIGNING.KEYSTORE_PASSWORD] = keystorePassword;
                    //console.log('registerKeystoreFile', keyInfo);
                    fs.registerKeystoreFile(filename, keyInfo, file, function (err, result) {
                        if (err) {
                            _super.setError(err);
                        } else {
                            //console.log(data); // _id, alias, filename, fsid, keypwd, uid
                            data = result;
                            dlg.hide();
                        }
                    });
                }
            });
        }

        var deferred = new Deferred();

        _super.setId(dlg.id);
        dlg.set('doLayout', false);
        dlg.setContentArea(tplLayout);
        dlg.show();

        return deferred.promise;
    };

    return NewSigning;
});
