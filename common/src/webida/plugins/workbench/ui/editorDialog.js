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
 * editorDialog
 * TODO : refactor
 *
 * @see
 * @since: 2015.09.06
 * @author: hw.shim
 */

// @formatter:off
define([
    'dojo/topic',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog'
], function (
    topic,
    genetic, 
    Logger,
    ButtonedDialog
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

   // var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    function _getPartRegistry() {
        var workbench = require('webida-lib/plugins/workbench/plugin');
        var page = workbench.getCurrentPage();
        return page.getPartRegistry();
    }

    var QUIT = 'Quit';

    var editorDialog = {
        create: function (file, title, action, canceled) {
            var dialog = new ButtonedDialog({
                title: 'Unsaved Changes in the File',
                buttons: [{
                    caption: 'Save and ' + title,
                    methodOnClick: 'saveAndAction'
                }, {
                    caption: title + ' without Saving',
                    methodOnClick: 'closeWithoutSave'
                }, {
                    caption: 'Cancel',
                    methodOnClick: 'canceled'
                }],
                methodOnEnter: 'saveAnd' + title,
                saveAndAction: function () {
                    if (title === QUIT) {
                        var registry = _getPartRegistry();
                        var parts = registry.getDirtyParts();
                        parts.forEach(function (part) {
                            part.save();
                        });
                        action();
                        dialog.hide();
                    } else {
                        topic.publish('editor/save/data-source-id', file.getPath(), function () {
                            action();
                            dialog.hide();
                        });
                    }
                },
                closeWithoutSave: function () {
                    action();
                    this.hide();
                },
                canceled: function () {
                    if (canceled) {
                        canceled();
                    }
                    this.hide();
                },
                buttonsWidth: '140px',
                onHide: function () {
                    dialog.destroyRecursive();
                },
                dialogClass: 'buttoned-dialog-text-only'
            });

            var name;
            if (title === QUIT) {
                name = file;
            } else {
                name = file.getName();
            }
            /* jshint quotmark:double */
            // @formatter:off
            dialog.setContentArea(
                "'" + name + "' has been modified. " +
                "Save and " + title + "?");
            // @formatter:on
             /* jshint quotmark:single */
            dialog.show();
        }
    };

    return editorDialog;
});
