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
 * @fileoverview webida - shortcutKey info plugin
 *
 * @version: 0.1.0
 * @since: 2013.09.26
 *
 * Src:
 *   plugins/shortcutKey-info/plugin.js
 */

define(['other-lib/underscore/lodash.min',    // _
        'webida-lib/plugin-manager-0.1',                   // pm
        'dojo',                             // dojo
        'dojo/on',                          // on
        'dojo/aspect',                      // aspect
        'dojo/dom-style',                   // domStyle
        'dojo/dom-attr',                    // domAttr
        'dojo/dom-construct',               // domConstruct
        'dojo/parser',                      // parser
        'dojo/_base/declare',               // declare
        'dojo/_base/lang',                  // lang
        'dojo/_base/window',                // win
        'dijit/registry',                   // reg
        'dijit/focus',                      // focusUtil
        '../plugin',                 // workbench
        'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',   // ButtonedDialog
        'dijit/Dialog',                     // Dialog
        'dijit/form/CheckBox',              // CheckBox
        'dijit/layout/TabContainer',        // TabContainer
        'dijit/layout/ContentPane',         // ContentPane
        'dojox/grid/DataGrid',              // DataGrid
        'external/dgrid/OnDemandGrid',               // OnDemandGrid
        'external/dgrid/Selection',                  // Selection
        'external/dgrid/Keyboard',                   // Keyboard
        'external/dgrid/extensions/Pagination',      // Pagination
        'dojo/fx/Toggler',                  // Toggler
        'dojo/query',                       // query
        'dojo/store/Memory',                // Memory
        'dojo/data/ItemFileWriteStore',     // ItemFileWriteStore
        'dojo/text!./layer/shortcutKeysListDlg.html' // dlgLayout
       ],
function (_,
          pm,
          dojo,
          on,
          aspect,
          domStyle,
          domAttr,
          domConstruct,
          parser,
          declare,
          lang,
          win,
          reg,
          focusUtil,
           workbench,
           ButtonedDialog,
          Dialog,
          CheckBox,
          TabContainer,
          ContentPane,
          DataGrid,
          OnDemandGrid,
          Selection,
          Keyboard,
          Pagination,
          Toggler,
          query,
          Memory,
          ItemFileWriteStore,
          dlgLayout
         )
{
    'use strict';

    //console.log('mira: Loading shortcutKey info module');
    var S_INFO_DLG_CONTENTS_ID = 'webida-shortcutkey-info-dialog-content';
    var S_INFO_DLG_ID = 'webida-shortcutkey-info-dialog';
    var S_INFO_GRID_PANE_ID = 'webida-shortcutkey-info-grid-pane';
    var S_INFO_CHECKBOX_PANE_ID = 'webida-shortcutkey-info-checkbox-pane';
    var S_INFO_CHECKBOX_ID = 'webida-shortcutkey-info-checkbox';
    var S_INFO_LABEL_ID = 'webida-shortcutkey-info-label';
    var S_INFO_SEARCH_ID = 'webida-shortcutkey-search';
    var S_INFO_VIABLE_ID = 'webida-shortcutkey-viable-info';
    var S_INFO_WHOLE_ID = 'webida-shortcutkey-whole-info';

    var viableStore = new Memory();
    var wholeStore = new Memory();
    var DGrid = declare([OnDemandGrid, Selection, Keyboard]);
    var timeoutId;

    function clearStore() {
        function clear(store) {
            if (store) {
                var allData = store.query();
                _.each(allData, function (data) {
                    var id = data.id;
                    store.remove(id);
                });
            }
        }

        clear(viableStore);
        clear(wholeStore);
    }

    function setCheckBoxAndSearch(isWhole) {
        var checkBox = reg.byId(S_INFO_CHECKBOX_ID);
        var label = reg.byId(S_INFO_LABEL_ID);
        var searchBox = reg.byId(S_INFO_SEARCH_ID);
        dojo.connect(checkBox, 'onChange', function (checked) {
            var infoDlg = reg.byId(S_INFO_DLG_ID);
            if (infoDlg) {
                if (checked) {
                    infoDlg.grid.set('store', viableStore);
                } else {
                    infoDlg.grid.set('store', wholeStore);
                }
            }
        });

        dojo.connect(searchBox, 'onChange', function () {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }

            timeoutId = setTimeout(function () {
                var infoDlg = reg.byId(S_INFO_DLG_ID);
                if (infoDlg && infoDlg.grid) {
                    console.log('grid refresh...');
                    infoDlg.grid.refresh();
                }
            }, 200);
        });

        if (isWhole) {
            checkBox.set('disabled', 'disabled');
            label.style.color = 'gray';
        }

        return checkBox;
    }

    function createGrid(store) {
        var searchQuery = function (item) {
            //console.log('searchInput...', item, index, items);
            var searchInput = reg.byId(S_INFO_SEARCH_ID);
            var searchKey = searchInput ? searchInput.value  : '';

            // serach key needed
            if (searchKey.length < 1) {
                return true;
            } else {
                searchKey = searchKey.toLowerCase();
            }

            // check comparison group
            if (!item.keys || !item.desc || !item.area) {
                return false;
            }

            // case insensitive
            var keys = item.keys.toLowerCase();
            var area = item.area.toLowerCase();
            var desc = item.desc.toLowerCase();

            // searchkey exist in comparison group
            if (keys.indexOf(searchKey) >= 0 ||
                desc.indexOf(searchKey) >= 0 ||
                area.indexOf(searchKey) >= 0) {
                return true;
            }

            return false;
        };

        var all = store.data.length;
        var pageSizeOptions = [10, 15];
        if (all > 25) {
            pageSizeOptions.push(all);
        } else {
            pageSizeOptions.push(25);
        }
        var grid = new DGrid({
            selectionMode: 'single',
            pageSkip: 16,
            //rowsPerPage: 15,
            //pageSizeOptions: pageSizeOptions,
            query: searchQuery,
            store: store,
            columns: {
                keys: 'Keys',
                desc: 'Function Description',
                area: 'Area'
            }
        }, 'grid');

        return grid;
    }

    function getShortcutKeys(viableItemTrees, wholeItemTrees,
                             additionalShortcuts, shortcutHolders, bubbleTouchers) {
        var ret = {};
        var wholeSInfo = [];
        var viableInfo = [];
        var alreadyViable = [];

        function _upperFirstChar(str) {
            try {
                return str.charAt(0).toUpperCase() + str.slice(1);
            } catch (e) {
                return '?';
            }
        }

        function collectSCKInfo(viableTree, wholeTree, pluginName) {
            if (_.isArray(wholeTree)) {
                var type = _.first(wholeTree);
                switch (type) {
                case 'cmnd':
                    if (wholeTree.length > 1) {
                        var info = _.last(wholeTree);
                        if (info && info.shortcut) {
                            // whole info
                            var title = info.shortcut.title;
                            var desc = _upperFirstChar(info.shortcut.desc);
                            var keys = info.shortcut.keys;
                            var id = pluginName + '_w' + wholeSInfo.length;
                            var area = pluginName;
                            wholeSInfo.push({id: id, title: title, desc: desc, keys: keys, area: area});

                            // viable info
                            if (viableTree && _.isArray(viableTree) && viableTree[0] === 'cmnd' &&
                                alreadyViable.indexOf(keys) < 0) {
                                id = pluginName + '_v' + viableInfo.length;
                                viableInfo.push({id: id, title: title, desc: desc, keys: keys, area: area});
                                alreadyViable.push(keys);
                            }
                        }
                    }
                    break;
                }
            } else if (typeof wholeTree === 'object') {
                _.each(_.keys(wholeTree), function (key) {
                    var subWhole = (wholeTree ? wholeTree[key] : null);
                    var subViable = (viableTree ? viableTree[key] : null);
                    collectSCKInfo(subViable, subWhole, pluginName);
                });
            }
        }

        function addAdditionalShortcuts(additional, area, addToViable) {
            additional.forEach(function (item) {
                wholeSInfo.push({
                    id: area + '_w' + wholeSInfo.length,
                    title: item.title,
                    desc: _upperFirstChar(item.desc),
                    keys: item.keys,
                    area: area
                });
                if (addToViable && item.viable && alreadyViable.indexOf(item.keys) < 0) {
                    viableInfo.push({
                        id: area + '_v' + viableInfo.length,
                        title: item.title,
                        desc: _upperFirstChar(item.desc),
                        keys: item.keys,
                        area: area
                    });
                    alreadyViable.push(item.keys);
                }
            });
        }

        var wholeMenuHolders = Object.keys(wholeItemTrees);
        var wholeShortcutHolders = Object.keys(additionalShortcuts);
        var wholeHolders = _.uniq(wholeMenuHolders.concat(wholeShortcutHolders));
        var keysInOrder = bubbleTouchers; // [];
        //console.log('hina temp: keysInOrder = ' + keysInOrder);

        var diff = _.difference(wholeHolders, keysInOrder);
        keysInOrder = keysInOrder.concat(diff);
        //console.log('hina temp: keysInOrder = ' + keysInOrder);

        var keys = keysInOrder;

        _.each(keys, function (pluginName) {
            //console.log('hina temp: A pluginName = ' + pluginName);
            var whole = (wholeItemTrees ? wholeItemTrees[pluginName] : null);
            if (whole) {
                var viable = (viableItemTrees ? viableItemTrees[pluginName] : null);
                collectSCKInfo(viable, whole, pluginName);
            }

            var additional;
            if ((additional = additionalShortcuts[pluginName])) {
                addAdditionalShortcuts(additional, pluginName,
                                       shortcutHolders.indexOf(pluginName) >= 0);
            }
        });

        ret[S_INFO_VIABLE_ID] = viableInfo;
        ret[S_INFO_WHOLE_ID] = wholeSInfo;
        return ret;
    }

    var lastpww = 0;
    function _resizeDialog() {
        var winInfo = dojo.window.getBox();
        var ww = (parseInt(winInfo.w * 0.8) >= 900 ? 900 : parseInt(winInfo.w * 0.8));
        var wh = 400;
        var cbh = 16;
        var cbp = 8;

        var layout = $('#' + S_INFO_DLG_ID);

        var pww = layout.find('#' + S_INFO_DLG_CONTENTS_ID).parent().width();
        if (pww < lastpww) {
            layout.find('#' + S_INFO_DLG_CONTENTS_ID)
            .css('height', wh + 'px')
            .css('width', pww + 'px');

            layout.find('#' + S_INFO_CHECKBOX_PANE_ID)
            .css('height', cbh + 'px')
            .css('width', pww + 'px')
            .css('padding', cbp + 'px 0px ' + cbp + 'px 0px')
            .css('overflow', 'hidden');

            layout.find('#' + S_INFO_GRID_PANE_ID)
            .css('height', (wh - (cbh + (cbp * 2))) + 'px')
            .css('width', pww + 'px')
            .css('padding', '0px');
        } else {
            layout.find('#' + S_INFO_DLG_CONTENTS_ID)
            .css('height', wh + 'px')
            .css('width', ww + 'px');

            layout.find('#' + S_INFO_CHECKBOX_PANE_ID)
            .css('height', cbh + 'px')
            .css('width', ww + 'px')
            .css('padding', cbp + 'px 0px ' + cbp + 'px 0px')
            .css('overflow', 'hidden');

            layout.find('#' + S_INFO_GRID_PANE_ID)
            .css('height', (wh - (cbh + (cbp * 2))) + 'px')
            .css('width', ww + 'px')
            .css('padding', '0px');

            layout
            .css('left', parseInt((winInfo.w - ww) / 2))
            .css('top', parseInt((winInfo.h - wh) / 2));
        }

        var infoDlg = reg.byId(S_INFO_DLG_ID);
        if (infoDlg.grid) {
            infoDlg.grid.resize();
        }

        lastpww = layout.find('#' + S_INFO_DLG_CONTENTS_ID).parent().width();
        console.log('resize...', winInfo.h, winInfo.w);
    }

    function createDialog(viableItemTrees, wholeItemTrees,
                          additionalShortcuts, shortcutHolders,
                          bubbleTouchers, isWhole) {

        var infoDlg = reg.byId(S_INFO_DLG_ID);

        if (!infoDlg) {
            // create dialog
            infoDlg = new ButtonedDialog({
                buttons: [ { id: 'shortcutsDlgCloseButton',
                            caption: 'Close',
                            methodOnClick: 'hide' } ],
                methodOnEnter: null,
                title: 'Shortcuts',
                id: S_INFO_DLG_ID,
                refocus: false,
                autofocus: false,
                onHide: function () {
                    lastpww = 0;
                    infoDlg.destroyRecursive();
                    infoDlg.resizeHandle.remove();
                    workbench.focusLastWidget();
                },
                resizeHandle: null,
                grid: null
            });
            infoDlg.setContentArea(dlgLayout);

            _resizeDialog();

            // dialog show completed then attach check box And grid
            aspect.after(infoDlg, 'show', function () {
                var _self = this;

                // user's last resize action time, resize dialog
                var id;
                _self.resizeHandle = on(win.global, 'resize', function () {
                    clearTimeout(id);
                    id = setTimeout(_resizeDialog, 300);
                });

                // setting checkbox and search filter
                setCheckBoxAndSearch(isWhole);

                // get info
                var info = getShortcutKeys(viableItemTrees, wholeItemTrees,
                                           additionalShortcuts, shortcutHolders, bubbleTouchers);

                // create store
                clearStore();
                _.each(_.keys(info), function (key) {
                    var items = info[key];

                    if (key === S_INFO_VIABLE_ID) {
                        viableStore.setData(items);
                    } else if (key === S_INFO_WHOLE_ID) {
                        wholeStore.setData(items);
                    }
                });

                // create data grid
                _self.grid = createGrid(isWhole ? wholeStore : viableStore);

                // autofocus search box
                focusUtil.focus(reg.byId(S_INFO_SEARCH_ID));

                // make shortcut list file
                //createShortcutlistFile(wholeStore, 'html');
            });
        }

        return infoDlg;
    }

    /**
     * @param itemTrees - whole
     */
    function open(viableItemTrees, wholeItemTrees,
                  additionalShortcuts, shortcutHolders,
                  bubbleTouchers, isWhole) {
        /*
        console.log('mira: shortcut key info open called...');
        console.debug(additionalShortcuts);
        console.debug(shortcutHolders);
         */

        var dlg = createDialog(viableItemTrees, wholeItemTrees,
                               additionalShortcuts, shortcutHolders,
                               bubbleTouchers, isWhole);
        dlg.startup();
        dlg.show();
    }

    var module = {
        open: open
    };

    return module;
});
