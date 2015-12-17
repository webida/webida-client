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
 * @file Manage build profile creating dialog and related data
 * @since 1.0.0
 * @author kh5325.kim@samsung.com
 *
 * @module ProjectWizard/ProfileCreatingDialog
 * @extends module:ProjectWizard/Dialog
 */

define([
    'dijit/registry',
    'dojo/Deferred',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
    'text!plugins/project-wizard/layer/buildprofile-new.html',
    './buildProfile',
    '../dialog',
    '../messages'
], function (
    reg,
    Deferred,
    ButtonedDialog,
    tplLayout,
    BuildProfile,
    Dialog,
    Messages
) {
    'use strict';

    var NewBuildProfile = function (projectInfo, buildStore) {
        this.projectInfo = projectInfo;
        this.buildStore = buildStore;
    };

    // inherit Dialog
    var _super = NewBuildProfile.prototype = new Dialog();
    // correct the constructor pointer because it points to Dialog
    NewBuildProfile.prototype.constructor = NewBuildProfile;

    NewBuildProfile.prototype.validate = function (name) {
        var chks = ['newBuildProfileName'];
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
        if ($.inArray(name, BuildProfile.getBuildProfileNames(this.buildStore.data)) > -1) {
            _super.setError(Messages.DUPLICATE_PROFILE);
            return false;
        }
        return true;
    };

    NewBuildProfile.prototype.openDialog = function () {
        var self = this;
        var data = null;

        function doCreation(newName) {
            var cloneChecked = reg.byId('newBuildProfileCloneChk').checked;
            var cloneProfileName = reg.byId('newBuildProfileCloneCombo').get('value');
            var profile = null;
            if (cloneChecked) {
                if (!cloneProfileName) {
                    _super.setError(Messages.NO_PROFILE);
                    return;
                }
                profile = $.extend(true, {}, BuildProfile.getBuildProfile(self.buildStore.data, cloneProfileName));
            } else {
                profile = BuildProfile.getDefaultProfile(self.projectInfo.name);
            }
            profile.name = newName;
            data = {};
            data.name = newName;
            data.profile = profile;
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
            title: 'Add Configuration',
            refocus: false,

            onHide: function () {
                dlg.destroyRecursive();
                return deferred.resolve(data);
            },

            onLoad: function () {
                var cloneCombo = reg.byId('newBuildProfileCloneCombo');
                cloneCombo.set('store', self.buildStore);
                cloneCombo.set('disabled', true);
                $('#newBuildProfileCloneChk').click(function () {
                    cloneCombo.set('disabled', !this.checked);
                });
            },

            checkAndCreate: function () {
                _super.setMessage('');
                var newName = reg.byId('newBuildProfileName').get('value');
                try {
                    if (self.validate(newName)) {
                        doCreation(newName);
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

    return NewBuildProfile;
});
