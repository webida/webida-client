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
 * This modules is a controller for view of plugin setting's dialog
 *
 * @since: 15. 10. 19
 * @author: Koong Kyungmi (kyungmi.k@samsung.com)
 */

define([
    'dojo/dom',
    'dijit/form/CheckBox',
    'dojo/parser',
    'external/lodash/lodash.min',
    'popup-dialog',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/notify',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog', // ButtonedDialog
    './plugin-settings'
], function (
    dom,
    CheckBox,
    parser,
    _,
    PopupDialog,
    Logger,
    notify,
    ButtonedDialog,
    pluginSettings
) {
    'use strict';
    var logger = new Logger();
    logger.off();

    var ui = {
        dialog: undefined,
        checkboxes: []
    };

    var mod = {
        openDialog: function () {
            ui.dialog = new ButtonedDialog({
                title: 'Plugin Configurator',
                refocus: false,
                methodOnEnter: null,
                buttons: [
                    {id: 'pluginDialogOkButton', caption: 'Save', methodOnClick: 'ok'},
                    {id: 'pluginDialogCancelButton', caption: 'Cancel', methodOnClick: 'cancel'}
                ],
                style: 'width: 400px',
                ok: function () {
                    var disabledPlugin = this.getAllDisabledPlugins();
                    pluginSettings.saveUserPluginSettings(disabledPlugin, function (err) {
                        if (err) {
                            notify.error('Failed to save plugin configuration');
                            logger.error('Failed to save plugin configuration', err);
                        } else {
                            PopupDialog.yesno({
                                title: 'Apply Settings',
                                message: 'This modified settings will be applied after reloading. ' +
                                    'Do you want to reload IDE?',
                                type: 'info'
                            }).then(function () {
                                ui.dialog.hide();
                                notify.info('Starting to reload IDE now');
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