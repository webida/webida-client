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
 * @file This modules is a controller for view of plugin setting's dialog
 * @since 1.5.0
 * @author kyungmi.k@samsung.com
 */

define([
    'external/lodash/lodash.min',
    'dijit/form/CheckBox',
    'dojo/dom',
    'dojo/i18n!./nls/resource',
    'popup-dialog',
    'webida-lib/util/locale',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/notify',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog', // ButtonedDialog
    './plugin-settings'
], function (
    _,
    CheckBox,
    dom,
    i18n,
    PopupDialog,
    Locale,
    Logger,
    notify,
    ButtonedDialog,
    pluginSettings
) {
    'use strict';
    /**
     * @type {Logger}
     */
    var logger = new Logger();
    logger.off();

    /**
     * @type {Locale}
     */
    var locale = new Locale(i18n);

    /**
     * UI element cache
     * @type {Object}
     */
    var ui = {
        dialog: undefined,
        checkboxes: []
    };

    /**
     * module object
     * @type {Object}
     */
    var mod = {
        /**
         * Open dialog for setting plugins on/off
         */
        openDialog: function () {
            ui.dialog = new ButtonedDialog({
                title: i18n.titleDialog,
                refocus: false,
                methodOnEnter: null,
                buttons: [
                    {id: 'pluginDialogOkButton', caption: i18n.labelSave, methodOnClick: 'ok'},
                    {id: 'pluginDialogCancelButton', caption: i18n.labelCancel, methodOnClick: 'cancel'}
                ],
                style: 'width: 400px',
                ok: function () {
                    var disabledPlugin = this.getAllDisabledPlugins();
                    pluginSettings.saveUserPluginSettings(disabledPlugin, function (err) {
                        if (err) {
                            notify.error(i18n.messageFailSave);
                            logger.error('Failed to save plugin configuration', err);
                        } else {
                            PopupDialog.yesno({
                                title: i18n.titleConfirmReload,
                                message: i18n.messageConfirmReload,
                                type: 'info'
                            }).then(function () {
                                ui.dialog.hide();
                                notify.info(i18n.messageInformReload);
                                window.location.reload();
                            }, function () {
                                ui.dialog.hide();
                            });
                        }
                    });
                },
                cancel: function () {
                    this.hide();
                },
                onHide: function () {
                    this.destroyRecursive();
                },
                onLoad: function () {
                    var container = $('#plugin-settings-dialog-main');
                    var plugins = pluginSettings.getPluginSettings();
                    ui.checkboxes = [];
                    _.forEach(plugins, function (plugin) {
                        var wrapper = $('<div data-id="' + plugin.manifest.name + '"></div>');
                        var checkbox = $('<input>');
                        var label = $('<label>')
                            .attr('for', 'plugin-item-checkbox-' + plugin.manifest.name)
                            .text(plugin.manifest.name);
                        wrapper.append(checkbox).append(label);
                        wrapper.appendTo(container);
                        var checkboxObj = new CheckBox({
                            id: 'plugin-item-checkbox-' + plugin.manifest.name,
                            name: 'plugin-item-checkbox-' + plugin.manifest.name
                        }, checkbox.get(0));
                        checkboxObj.set('checked', !plugin.disabled);
                        checkboxObj.attr('data-id', plugin.manifest.name);
                        checkboxObj.attr('data-loc', plugin.loc);
                        ui.checkboxes.push(checkboxObj);
                    });
                    locale.convertMessage(ui.dialog.domNode);
                },
                getAllDisabledPlugins: function () {
                    var disabledPlugins = _.filter(ui.checkboxes, function (checkbox) {
                        return !checkbox.get('checked');
                    }) || [];
                    return _.map(disabledPlugins, function (checkbox) {
                        return checkbox.attr('data-loc');
                    });
                }
            });
            ui.dialog.set('doLayout', true);
            ui.dialog.setContentArea('<div id="plugin-settings-dialog-main"></div>');
            ui.dialog.show();
        }
    };

    return mod;
});