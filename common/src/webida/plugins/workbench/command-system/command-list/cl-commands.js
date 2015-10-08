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
 * @fileoverview webida - command-list plugin
 *
 * @version: 0.1.0
 * @since: 2013.09.11
 *
 * Src:
 *   plugins/command-list/plugin.js
 */

define([
    'external/lodash/lodash.min',           // _
    'dojo/store/Memory',          // Memory
    'dijit/registry',             // reg
    'webida-lib/plugin-manager-0.1',             // pm
    'dojo/text!./command-list.html',   // markup
    'webida-lib/util/notify',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog'   // ButtonedDialog
],
function (
       _,
        Memory,
        reg,
        pm,
        markup,
        notify,
        ButtonedDialog
       )
{
    'use strict';
    //console.log('mira: Loading command-list module');

    var prevActiveElement = null;
    var CMD_LIST_DLG_ID = 'cmd-list-dlg';

    function showCommandListDlg(contributors) {
        var existing;
        if ((existing = reg.byId(CMD_LIST_DLG_ID))) {
            //return;
            existing.destroyRecursive();
        }

        var cbStore = new Memory();
        var dlg = new ButtonedDialog({
            buttons: [
                {
                    id: 'cmdListDlgRunButton',
                    caption: 'Run',
                    methodOnClick: 'runCommand'
                },
                {
                    id: 'cmdListDlgCancelButton',
                    caption: 'Cancel',
                    methodOnClick: 'hide'
                }
            ],
            methodOnEnter: 'runCommand',
            runCommand: function () {
                var cb = reg.byId('clDojoComboBox');
                var val = cb.get('value');
                val = (val && val.trim()) || '';
                if (!val) {
                    notify.error('Select a command');
                    return;
                }

                var items = cb.store.query(function (obj) {
                    return (obj.name === val);
                });
                var item = items && items[0];

                if (!item) {
                    notify.error('No such command');
                    return;
                }

                dlg.hide();	// This have to go before the following lines for proper focus management

                var plugin = item.plugin;
                var path = item.path;
                prevActiveElement = item.name;
                contributors[plugin].invoke(path);
            },

            id: CMD_LIST_DLG_ID,
            refocus: false,
            title: 'Run Command from List',
            style: 'width: 440px',

            // this dialog object destory in DOM
            onHide: function () {
                // dialog close
                dlg.destroyRecursive();
                //workbench.focusLastWidget();		not always appropriate in this case
            },

            fillCommands : function (nextJob) {

                function loadItems(plugins, i) {
                    //console.log('hina temp: entering loadItems. i = ' + i);
                    if (plugins.length === i) {
                        //console.log('hina temp: items got from all contributors');
                        nextJob();
                    } else {
                        var plugin = plugins[i];
                        var contributor = contributors[plugin];

                        // add item viableitems
                        contributor.getViableItems(function (items) {
                            //console.log('hina temp: items from contributor ' + i);
                            //console.debug(items);
                            addItemHierarchy(plugin, '', items, contributor.getWholeItems());
                            loadItems(plugins, i + 1);
                        });
                    }



                    function addItemHierarchy(plugin, path, items, wholeItems) {
                        function getDisplayedPath(path, cmndInfo) {
                            if (path.indexOf('__invisible__') < 0) {
                                return path.substr(1).split('&').join('');
                            } else {
                                var ret = _.last(path.split('/')) + ' (invisible';
                                if (cmndInfo) {
                                    if (cmndInfo.shortcut) {
                                        ret = ret + ', shortcut ' + cmndInfo.shortcut.keys;
                                    } else if (cmndInfo.toolbar) {
                                        ret = ret + ', toolbar item';
                                    }
                                }
                                ret = ret + ')';
                                return ret;
                            }
                        }

                        var valType = _.isArray(items) ? 'array' : typeof items;
                        if (valType === 'array') {
                            if (items[0] === 'cmnd') {
                                cbStore.put({plugin: plugin, path: path,
                                             name: plugin + ': ' + getDisplayedPath(path, wholeItems[1])});
                            }
                        } else if (valType === 'object') {
                            Object.keys(items).forEach(function (key) {
                                addItemHierarchy(plugin, path + '/' + key, items[key], wholeItems[key]);
                            });
                        } else if (valType !== 'string') {
                            notify.error('Invalid command specification from a plug-in');
                        }

                    }
                }

                var pluginNames = Object.keys(contributors).sort();
                loadItems(pluginNames, 0);
            },

            onLoad: function () {
                function nextJob() {

                    // sort ascending
                    //cbStore.data = cbStore.query({}, {sort: [{attribute: 'name', descending: false}]});

                    // auto select previous command
                    if (prevActiveElement) {
                        // cb data check
                        var items = cb.store.query(function (obj) {
                            return (obj.name === prevActiveElement);
                        });
                        if (items && items[0]) {
                            //cb.set('value', prevActiveElement);
                            cb.set('item', items[0]);
                        }
                    }

                    // auto focus
                    cb.focus();
                }

                //console.log('mira: command-list dialog onLoad');
                // dojo combobox default searchAttr is 'name'
                var cb = reg.byId('clDojoComboBox');
                cb.set('store', cbStore);
                cb.set('maxHeight', 120);
                cb.set('autoComplete', false);
                cb.set('queryExpr', '*${0}*');
                cb.set('style', 'width: 100%');
                cb.set('placeHolder', 'Enter a substring of the command to run');
                //dojo.connect(cb, 'onKeyPress', this.runCommands);

                // fill Commands in combobox
                this.fillCommands(nextJob);

            }
        });
        dlg.set('doLayout', false);
        dlg.setContentArea(markup);
        dlg.show();
    }

    return {
        show: showCommandListDlg
    };
});
