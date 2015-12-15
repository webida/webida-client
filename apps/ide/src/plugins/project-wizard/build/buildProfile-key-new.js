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
 * @file Manage build profile key creating dialog and related data
 * @since 1.0.0
 * @author cimfalab@gmail.com
 *
 * @module ProjectWizard/ProfileKeyCreatingDialog
 * @extends module:ProjectWizard/Dialog
 */


define(['webida-lib/app',
        'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
        'dojo',
        'dojo/Deferred',
        'dijit/registry',
        'text!plugins/project-wizard/layer/buildprofile-key-new.html',
        './buildProfile',
        '../dialog',
        '../messages',
       ],
function (ide, ButtonedDialog, dojo, Deferred, reg,
    tplLayout, BuildProfile, Dialog, Messages) {
    'use strict';

    // constructor
    var NewKey = function (projectInfo, profile) {
        this.projectInfo = projectInfo;
        this.profile = profile;
    };

    // inherit Dialog
    var _super = NewKey.prototype = new Dialog();
    // correct the constructor pointer because it points to Dialog
    NewKey.prototype.constructor = NewKey;

    NewKey.prototype.validateNewName = function (name) {
        if (!name) {
            return false;
        }
        if ($.inArray(name, BuildProfile.getKeyNames(this.profile)) > -1) {
            throw Messages.DUPLICATE_KEY;
        }
        return true;
    };

    NewKey.prototype.openDialog = function () {
        var self = this;
        var data = null;

        function doCreation(newName) {
            data = {};
            data.name = newName;
            data.signing = BuildProfile.getDefaultSigning(newName);
            dlg.hide();
        }

        var deferred = new Deferred();
        var dlg = new ButtonedDialog({
            buttons: [
                { id: 'pwCreate',
                 caption: 'Create',
                 methodOnClick: 'checkAndCreate'
                },
                { id: 'pwCancel',
                 caption: 'Cancel',
                 methodOnClick: 'hide'
                }
            ],
            methodOnEnter: 'checkAndCreate',
            title: 'Add Key',
            refocus: false,

            onHide: function () {
                dlg.destroyRecursive();
                return deferred.resolve(data);
            },

            onLoad: function () {
            },

            checkAndCreate: function () {
                _super.setMessage('');
                var newName = reg.byId('newBuildProfileKey').get('value');
                try {
                    if (self.validateNewName(newName)) {
                        doCreation(newName);
                    } else {
                        _super.setMessage(Messages.INVALID_NAME.format(newName));
                    }
                } catch (err) {
                    _super.setMessage(err);
                }
            }
        });
        _super.setId(dlg.id);
        dlg.set('doLayout', false);
        dlg.setContentArea(tplLayout);
        dlg.show();

        return deferred.promise;
    };

    return NewKey;
});
