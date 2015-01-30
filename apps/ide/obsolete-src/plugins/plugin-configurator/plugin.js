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
 * webida - plugin configurator plugin
 *
 * Src:
 *   plugins/plugin-configurator/plugin.js
 */

define(['underscore',                         // _
        'plugin-manager',                     // pm
        'core/ide',                           // ide
        'dojo',                               // dojo
        'dojo/parser',                        // parser
        'dijit/registry',                     // reg
        'dojo/store/Memory',                  // Memory
        'dojo/fx/Toggler',                    // Toggler
        'dijit/Dialog',                       // Dialog
        'dojo/store/Observable',              // Observable
        'dijit/tree/ObjectStoreModel',        // ObjectStoreModel
        'dijit/Tree',                         // Tree
        'dijit/form/ToggleButton',            // ToggleButton
        'text!./configurator.html',           // cfUILayout
        'text!./configurator-info.html',      // cfUIInfoLayout
        'text!./configurator-pluginAdd.html', // cfUIPluginAddLayout
        'text!./configurator-pluginRm.html',  // cfUIPluginRmLayout
        'toastr',
        'popup-dialog'
        ],
function (_,
          pm,
          ide,
          dojo,
          parser,
          reg,
          Memory,
          Toggler,
          Dialog,
          Observable,
          ObjectStoreModel,
          Tree,
          ToggleButton,
          cfUILayout,
          cfUIInfoLayout,
          cfUIPluginAddLayout,
          cfUIPluginRmLayout,
          toastr,
          PopupDialog
         )
{
    'use strict';

    //console.log('mira: Loading plugin configurator module');

    var PLUGIN_CONF_DLG_ID = 'webida-plugin-configurator-dialog';
    var fsMount = ide.getFSCache();         // ide.getMount();
    var workspacePath = ide.getPath();
    var userPluginList = [];
    var cpUserPluginList = [];
    var ignoredPluginList = []; // original value, using resotre, init first load, chane only ok button click time
    var cpIgnoredPluginList = []; // setting and file write, setting button click time
    var startPluginList = []; // all started plugin list (user, system)
    var cpStartPluginList = [];
    var oriAllPlugins = pm.getWholePlugins();
    var cpAllPlugins = _.clone(oriAllPlugins, true);
    var PLUGIN_SETTINGS_FILE = pm.getPluginSettingFilePath();
    var SYSTEM_PLUGIN_LOC_PREFIX = '$APPROOT';

    /**
     * write setting file,
     */
    function writePluginSettingInfo() {
        // remove system start plugin
        var startPL = startPluginList;
        _.each(getSystemStartPluginLocationList(), function (val) {
            startPL = _.without(startPL, val);
        });
        var info = JSON.stringify({
            'plugins' : userPluginList,
            'ignored-plugins' : ignoredPluginList,
            'start-plugins' : startPL,
        });

        //console.log('mira: plugin setting file write info > ', JSON.parse(info));

        fsMount.writeFile(workspacePath + PLUGIN_SETTINGS_FILE, info, function (err) {
            if (err) {
                toastr.error(err);
            } else {
                // restart IDE
                //console.log('mira: ' + fsMount.appid + PLUGIN_SETTINGS_FILE + ' write success');
                PopupDialog.alert({
                    title: 'Info',
                    message: 'This modification will be reflected in the next IDE boot'
                });
                //window.location.reload();
            }
        });
    }

    //console.log('mira: whole plugins number > ', oriAllPlugins, _.size(oriAllPlugins));

    // plugin configurator dialog start...
    function openConfiguratorDialog() {
        var cfgDlg = reg.byId(PLUGIN_CONF_DLG_ID);
        if (!cfgDlg) {
            cfgDlg = new Dialog({
                id: PLUGIN_CONF_DLG_ID,
                refocus: false,
                onOk: function () {
                    var bDelta = false;
                    // save
                    oriAllPlugins = _.clone(cpAllPlugins, true);
                    if (!_.isEqual(ignoredPluginList, cpIgnoredPluginList)) {
                        ignoredPluginList = _.clone(cpIgnoredPluginList, true);
                        bDelta = true;
                    }
                    if (!_.isEqual(startPluginList, cpStartPluginList)) {
                        startPluginList = _.clone(cpStartPluginList, true);
                        bDelta = true;
                    }
                    if (!_.isEqual(userPluginList, cpUserPluginList)) {
                        userPluginList = _.clone(cpUserPluginList, true);
                        bDelta = true;
                    }

                    if (bDelta) {
                        writePluginSettingInfo();
                    }
                    cfgDlg.hide();
                },

                onCancel: function () {
                    cpAllPlugins = _.clone(oriAllPlugins, true); // restore
                    cpIgnoredPluginList = _.clone(ignoredPluginList, true);
                    cpStartPluginList = _.clone(startPluginList, true);
                    cpUserPluginList = _.clone(userPluginList, true);
                    cfgDlg.hide();
                },

                onHide: function () {
                    cfgDlg.destroyRecursive();
                },

                onLoad: function () { // dojo element setting
                    // this dialog button
                    var oBt;
                    oBt = reg.byId('cfgOK');
                    dojo.connect(oBt, 'onClick', this.onOk);

                    oBt = reg.byId('cfgCancel');
                    dojo.connect(oBt, 'onClick', this.onCancel);

                    // tab
                    var oTabPane;
                    oTabPane = reg.byId('cfgInfoTabPane');
                    oTabPane.set('title', 'Info');
                    oTabPane.set('content', cfUIInfoLayout);

                    oTabPane = reg.byId('cfgSettingTabPane');
                    oTabPane.set('title', 'Setting');

                    // tree
                    var oTreeElem = getPluginKeyTreeObject();
                    var oTreeStore = new Memory({
                        data: oTreeElem,
                        getChildren: function (object) {
                            return this.query({parent: object.id});
                        },
                        getParent: function (id) {
                            var ids = [];
                            _.each(this.data, function (value) {
                                if (value.id === id) {
                                    ids.push(value.parent);
                                }
                            });
                            return ids;
                        },
                        getAllId: function () {
                            var ids = [];
                            _.each(this.data, function (value) {
                                if (value.id) {
                                    ids.push(value.id);
                                }
                            });
                            return ids;
                        },
                        getRootChildrens: function () {
                            return this.query({parent: 'root'});
                        }
                    });

                    oTreeStore = new Observable(oTreeStore);

                    var oTreeModel = new ObjectStoreModel({
                        store: oTreeStore,
                        query: {id: 'root'},
                        mayHaveChildren: function (item) {
                            //console.log('mira: called mayHaveChildren', item);
                            var children = this.store.getChildren(item);
                            return children.length > 0 ? true : false;
                        },
                        onChildrenChange: function(parent, newChildrenList) {
                            oTree.onLoad();
                        }
                    });

                    var oTree = new Tree({
                        id: 'cfgPTreeObj',
                        model: oTreeModel,
                        showRoot: false,
                        persist: true,
                        onStyle: function () {
                            // when tree and dialog showed
                            // tree ignore style setting
                            if (oTree.model.store) {
                                // if root is ignored then child all ignored (gray) mark
                                _.each(oTree.model.store.getRootChildrens(), function (value) {
                                    if (value.id) {
                                        setTreeNodeStyle(value.id, oTree, 'gray', false);
                                    }
                                });

                                // currently ignore mark
                                _.each(cpIgnoredPluginList, function (value) {
                                    var id = getPluginIDUsingLoc(value);
                                    setTreeNodeStyle(id, oTree, 'gray', true);
                                });
                            }
                        },
                        onLoad: function () {
                            setTimeout(this.onStyle, 1000);
                        },
                        getIconClass: function (item, opened) {
                            //return (!item || this.model.mayHaveChildren(item)) ? (opened ? "dijitFolderOpened" : "dijitFolderClosed") : "dijitLeaf")
                            return '';
                        }
                    }, 'pluginTree');


                    // tree expand all
                    oTree.expandAll();

                    dojo.connect(oTree, 'onClick', onClickPluginTree);

                    var oTreePane = reg.byId('cfgTreeArea');
                    oTreePane.set('content', oTree);

                    // plugin add
                    var oPluginAddbt = reg.byId('cfgPluginAdd');
                    dojo.connect(oPluginAddbt, 'onClick', onClickPluginAddBt);

                    // plugin Rm
                    var oPluginRmbt = reg.byId('cfgPluginRm');
                    dojo.connect(oPluginRmbt, 'onClick', onClickPluginRmBt);

                    // setting
                    var oSettingIgBt = reg.byId('cfgIgBt');
                    dojo.connect(oSettingIgBt, 'onClick', dojo.partial(onClickSettingIgBt, oTree));

                    var oSettingStBt = reg.byId('cfgStBt');
                    dojo.connect(oSettingStBt, 'onClick', dojo.partial(onClickSettingStBt, oTree));

                } // onLoad close
            });
            cfgDlg.set('title', 'Plugin configurator');
            cfgDlg.set('content', cfUILayout);
        }

        cfgDlg.show();
    }

    function setTreeNodeStyle(id, tree, color, force) {
        var oPlugin = getPluginObject(id);
        var oTree = tree;
        var sColor = color;

        if (!force) {
            if (oPlugin.ignored) {
                sColor = 'gray';
            } else if (!oPlugin.ignored) {
                sColor = 'black';
            }
        }

        if (oTree) {
            var node = oTree.getNodesByItem(id);
            if (node && node.length > 0) {
                _.each(node, function (value) {
                    var nd = value;

                    // child node color change
                    var oChildrenNode = oTree.model.store.getChildren({id: id});
                    _.each(oChildrenNode, function (value) {
                        if (value.id) {
                            if(!force && sColor === 'gray') {
                                setTreeNodeStyle(value.id, oTree, sColor, true);
                            } else {
                                setTreeNodeStyle(value.id, oTree, sColor, force);
                            }
                        }
                    });

                    // this node color change
                    if (nd.domNode.childNodes && nd.domNode.childNodes.length > 0) {
                        var firstDOM = nd.domNode.childNodes[0];

                        if (firstDOM.style.color !== undefined) { // color
                            firstDOM.style.color = sColor;

                            // font
                            if (sColor === 'black') { // font
                                firstDOM.style.fontStyle = 'normal';
                                firstDOM.style.fontWeight = 'bold';
                            } else if (sColor === 'gray') {
                                firstDOM.style.fontStyle = 'italic';
                                firstDOM.style.fontWeight = 'normal';
                            }
                        }
                    }
                });

            }
        }
    }

    function onClickPluginRmBt() {
        //console.log('mira: plugin rm bt click');
        var cfgPlgRmDlg = new Dialog({
            onCancel: function () {
                cfgPlgRmDlg.hide();
            },

            onHide: function () {
                cfgPlgRmDlg.destroyRecursive();
            },

            onOk: function () {
                // just store update, remove list
                var oSel = reg.byId('cfgPRmPList');
                _.each(oSel.getOptions(), function (value) {
                    if (value.selected && value.loc) {
                        // remove list
                        cpUserPluginList = _.without(cpUserPluginList, value.loc);
                        cpIgnoredPluginList = _.without(cpIgnoredPluginList, value.loc);
                        cpStartPluginList = _.without(cpStartPluginList, value.loc);

                        // remove tree
                        var id = getPluginIDUsingLoc(value.loc);
                        var tObj = reg.byId('cfgPTreeObj');
                        if (tObj) {
                            var tModel = tObj.get('model');
                            if(tModel) {
                                tModel.store.remove(id);
                            }
                        }
                    }
                });



                cfgPlgRmDlg.hide();
            },

            onLoad: function () { // dojo element setting
                // this dialog button
                var oBt;
                oBt = reg.byId('cfgPRmOK');
                dojo.connect(oBt, 'onClick', this.onOk);

                oBt = reg.byId('cfgPRmCancel');
                dojo.connect(oBt, 'onClick', this.onCancel);

                // setting current user plugin list
                var oSel = reg.byId('cfgPRmPList');
                _.each(cpUserPluginList, function (value) {
                    var id = getPluginIDUsingLoc(value);
                    if (!id) {
                        id = value;
                    }
                    var option = { id: id, value: id, label: id, loc: value, selected: false };
                    oSel.addOption(option);
                });

                // oSel empty handle
                var listTggl = new Toggler({
                    node: 'cfgTPListPane'
                });
                var notiTggl = new Toggler({
                    node: 'cfgPRmNotiPane'
                });

                if (oSel.getOptions() <= 0) {
                    listTggl.hide();
                    notiTggl.show();
                } else {
                    listTggl.show();
                    notiTggl.hide();
                }
            }
        });
        cfgPlgRmDlg.set('title', 'Plugin Remove');
        cfgPlgRmDlg.set('content', cfUIPluginRmLayout);
        cfgPlgRmDlg.show();
    }

    function onClickPluginAddBt() {
        //console.log('mira: plugin add bt click');
        var cfgPlgAddDlg = new Dialog({
            onCancel: function () {
                cfgPlgAddDlg.hide();
            },

            onHide: function () {
                cfgPlgAddDlg.destroyRecursive();
            },

            onOk: function (path, ig, st) {
                console.log('mira : path > ' + path.get('value'),
                            'ignore > ' + ig.get('checked'), 'start > ' + st.get('checked'));
                // store update and tree update
                var newPath = path.get('value');

                if (newPath) {
                    // path check
                    // already exist check
                    var bExist = false;
                    _.each(cpUserPluginList, function (value) {
                        if (value === newPath) {
                            bExist = true;
                        }
                    });
                    if (bExist) {
                        toastr.error('already exists...');
                        return;
                    }

                    // owned check
                    newPath = newPath + '/plugin.json';

                    // read plugin.json
                    $.ajax({
                        url: newPath,
                        success: function (content) {
                            // success
                            // add new plugin obj
                            var obj = content;

                            var dependents = getPluginDependents(obj.name);
                            var loc = path.get('value');
                            var ignored  = ig.get('checked');
                            var newPlg = {
                                dependents: dependents,
                                ignored: ignored,
                                loc: loc,
                                manifest: obj
                            };

                            // info not exist
                            if(!obj || !loc || !obj.name) {
                                toastr.error('wrong plugin, please check your plugin.json content');
                                return;
                            }

                            cpAllPlugins[obj.name] = newPlg;

                            // add tree
                            var tObj = reg.byId('cfgPTreeObj');
                            if (tObj) {
                                var tModel = tObj.get('model');
                                if(tModel) {
                                    if (obj.deps && obj.deps.length > 0) {
                                        _.each(obj.deps, function(parent) {
                                            tModel.store.add({id: obj.name, name: obj.name, parent:parent});
                                        });
                                    } else {
                                        tModel.store.add({id: obj.name, name: obj.name, parent:'root'});
                                    }
                                }
                            }

                            if (loc) {
                                cpUserPluginList.push(loc);
                                cpUserPluginList = _.uniq(cpUserPluginList);

                                if (ig.get('checked')) {
                                    cpIgnoredPluginList.push(loc);
                                    cpIgnoredPluginList = _.uniq(cpIgnoredPluginList);
                                }

                                if (st.get('checked')) {
                                    cpStartPluginList.push(loc);
                                    cpStartPluginList = _.uniq(cpStartPluginList);
                                }
                            }

                            //alert('This modification will be reflected in the next IDE boot');
                            cfgPlgAddDlg.hide();
                        },
                        error: function (err) {
                            console.assert(err);
                            toastr.error(err.reason);
                        }
                    });
                } else {
                    toastr.error('please input plugin path...');
                }
            },

            onLoad: function () { // dojo element setting
                // this dialog input path
                var oInputPath = reg.byId('cfgPathTextBox');
                oInputPath.set({
                    trim: true,
                    placeHolder: '/webida/api/fs/file/<<appid>>>/<<plugin>>',
                    selectOnClick: true,
                    required: true,
                    missingMessage: 'value is required'
                });

                var ig = reg.byId('cfgIgCheckBox');
                var st = reg.byId('cfgStCheckBox');

                // this dialog button
                var oBt;
                oBt = reg.byId('cfgPAddOK');
                dojo.connect(oBt, 'onClick',
                             dojo.partial(this.onOk,
                                          oInputPath,
                                          ig,
                                          st
                                         )
                            );

                oBt = reg.byId('cfgPAddCancel');
                dojo.connect(oBt, 'onClick', this.onCancel);
            }
        });
        cfgPlgAddDlg.set('title', 'Plugin Add');
        cfgPlgAddDlg.set('content', cfUIPluginAddLayout);
        cfgPlgAddDlg.show();
    }

    function onClickSettingIgBt(oTree) {
        //console.log('mira: ingnore bt click (TreeObject)  >', oTree);

        var oPlugin = getPluginObject(oTree.selectedItem.id);
        var oSettingIgBt = reg.byId('cfgIgBt');

        if (oSettingIgBt.checked) {
            // add ignore list
            oPlugin.ignored = true;
            setIgnoredPlugin(oPlugin);

            // sublist css gray change
            setTreeNodeStyle(oTree.selectedItem.id, oTree, 'gray', true);
        } else if (!oSettingIgBt.checked) {
            // remove ignore list
            oPlugin.ignored = false;
            unsetIgnoredPlugin(oPlugin);

            // dep plugin's ignore check
            var bIgnoreDep = false;
            if (oPlugin.manifest.deps && oPlugin.manifest.deps.length > 0) {
                for (var i in oPlugin.manifest.deps) {
                    if (oPlugin.manifest.deps[i]) {
                        var name = oPlugin.manifest.deps[i];
                        var oDep = getPluginObject(name);
                        if (oDep.ignored) {
                            bIgnoreDep = true;
                            break;
                        }
                    }
                }
            }

            // sublist css black change
            if (!bIgnoreDep) {
                setTreeNodeStyle(oTree.selectedItem.id, oTree, 'black', false);
            }
        }
    }

    function onClickSettingStBt(oTree) {
        //console.log('mira: setting bt click (TreeObject)  >', oTree);

        var oPlugin = getPluginObject(oTree.selectedItem.id);
        var oSettingStBt = reg.byId('cfgStBt');

        if (oSettingStBt.checked) {
            // add started list
            setStartPlugin(oPlugin);

        } else if (!oSettingStBt.checked) {
            // remove started list
            unsetStartPlugin(oPlugin);
        }
    }

    function onClickPluginTree(item, node, evt) {
        //console.log('mira: tree click (item) >', item);
        //console.log('mira: tree click (node) >', node);
        //console.log('mira: tree click (evt)  >', evt);

        // get selected plugin Info
        var oPlg = getPluginObject(item.id);
        var iLoc = oPlg.loc;
        var iIgnored = oPlg.ignored;
        var iStarted = isStartedPluing(iLoc);
        var iName = oPlg.manifest.name;
        var iDesc = oPlg.manifest.description;
        var iVersion = oPlg.manifest.version;

        // set cfg dialog setting state
        var oSettingIgBt = reg.byId('cfgIgBt');
        // ignored bt
        oSettingIgBt.set('disabled', false);
        oSettingIgBt.set('checked', iIgnored);

        var oSettingStBt = reg.byId('cfgStBt');
        // started bt
        if (!isUserPlugin(iLoc) && isSystemStartPlugin(iLoc)) {  // system plugin && system start plugin
            oSettingStBt.set('disabled', true);
        } else {
            oSettingStBt.set('disabled', false);
        }
        oSettingStBt.set('checked', iStarted);

        if (iStarted) {
            oSettingStBt.set('label', 'on');
        } else {
            oSettingStBt.set('label', 'off');
        }

        // set cfg dialog simple info state
        var oSInfoName = reg.byId('cfgSInfoNamePane');
        oSInfoName.set('content', iName);

        var oSInfoVersion = reg.byId('cfgSInfoVersionPane');
        oSInfoVersion.set('content', iVersion);

        var oSInfoDesc = reg.byId('cfgSInfoDescPane');
        oSInfoDesc.set('content', iDesc);

        var oMInfoExtentions = reg.byId('cfgMInfoExtentionsPane');
        var content = '';
        oMInfoExtentions.set('content', '(no)');
        _.each(_.keys(oPlg.manifest.extensions), function (val) {
            content = content + '<li>' + val + '</li>';
        });
        if (content) {
            oMInfoExtentions.set('content', $(content));
        }

        var oMInfoExtPoint = reg.byId('cfgMInfoExtPointPane');
        content = '';
        oMInfoExtPoint.set('content', '(no)');
        _.each(_.keys(oPlg.manifest.extensionPoints), function (val) {
            content = content + '<li>' + val + '</li>';
        });
        if (content) {
            oMInfoExtPoint.set('content', $(content));
        }
    }

    function isUserPlugin(loc) {
        return loc.indexOf(SYSTEM_PLUGIN_LOC_PREFIX) < 0 ? true : false;
    }

    function isSystemStartPlugin(loc) {
        return _.indexOf(getSystemStartPluginLocationList(), loc) < 0 ? false : true;
    }

    function isStartedPluing(loc) {
        return _.indexOf(cpStartPluginList, loc) < 0 ? false : true;
    }

    function caseInsensitive(str1, str2) {
        var str1lower = str1.toLowerCase();
        var str2lower = str2.toLowerCase();
        return str1lower > str2lower ? 1 : (str1lower < str2lower ? -1 : 0);
    }

    function sortSubNodeObject(obj) {
        var subNode = {};
        if (obj.subNode) {
            var keys = _.keys(obj.subNode).sort(caseInsensitive);
            var _obj = _.clone(obj, true);
            _.each(keys, function (value) {
                var key = value;
                subNode[key] = _obj.subNode[key];
                subNode[key].subNode = sortSubNodeObject(subNode[key]);
            });
        }
        return subNode;
    }

    function sortAscendPluginKeyTreeObject(obj) {
        var newNode = {};
        if (obj.rootNode) {
            var keys = _.keys(obj.rootNode).sort(caseInsensitive);
            _.each(keys, function (value) {
                var key = value;
                newNode[key] = obj.rootNode[key];
                newNode[key].subNode = sortSubNodeObject(newNode[key]);
            });
        }

        return {'rootNode': newNode};
    }

    function getSubNodeObject(key, result) {
        var obj = getPluginObject(key);

        _.each(obj.dependents, function (value) {
            var skey = value;
            var sObj = getPluginObject(skey);

            result.push({id: skey, name: sObj.manifest.name, parent: key});
            if (sObj.dependents.length > 0) {
                getSubNodeObject(skey, result);
            }
        });
        /*
        var obj = getPluginObject(key);
        var subNode = {};

        _.each(obj.dependents, function (value) {
            subNode[value] = getSubNodeObject(value);
        });

        return {'subNode': subNode};
        */
    }

    function getPluginKeyTreeObject() {
        var keys = _.keys(cpAllPlugins).sort(caseInsensitive);

        var result = [{id: 'root', name: 'root'}];
        _.each(keys, function (value) {
            var key = value; // one plugin key
            var obj = getPluginObject(key); // one plugin object

            if (obj.manifest.deps.length === 0) {
                // root node
                result.push({id: key, name: obj.manifest.name, parent: 'root'});

                // sub node
                getSubNodeObject(key, result);
            }
        });
        return result;

        /*
        var rootNode = {};
        _.each(keys, function (value) {
            var key = value; // one plugin key
            var obj = getPluginObject(key); // one plugin object

            if (obj.manifest.deps.length === 0) {
                var subNode = getSubNodeObject(key);
                rootNode[key] = subNode;
            }
        });

        return {'rootNode': rootNode};
        */
    }

    function getPluginObject(key, obj) {
        if (obj) {
            return _.result(obj, key);
        }
        return _.result(cpAllPlugins, key);
    }

    /**
     * plugin ignore setting, actual ignore behavior of the IDE must be reloaded
     * if exist refer plugin of target plugin, then refer plugin also automatically ignore
     *
     * @param {Object} plugin ignore target plugin
     */
    function setIgnoredPlugin(plugin, list) {
        if (plugin && !_.isArray(plugin)) {
            var loc = _.result(plugin, 'loc');

            if (list) {
                list.push(loc);
                list = _.uniq(list);
            } else {
                cpIgnoredPluginList.push(loc);
                cpIgnoredPluginList = _.uniq(cpIgnoredPluginList);
            }
        }
    }

    function getPluginIDUsingLoc(loc) {
        var id;
        _.each(cpAllPlugins, function (value) {
            if (loc === value.loc) {
                id = value.manifest.name;
            }
        });
        return id;
    }

    function getPluginDependents(name) {
        var id = [];
        _.each(cpAllPlugins, function (value) {
            if (value.manifest.deps && value.manifest.deps.length > 0) {
                _.each(value.manifest.deps, function (val) {
                    if (val === name) {
                        id.push(value);
                    }
                });
            }
        });
        return _.uniq(id);
    }

    function unsetIgnoredPlugin(plugin, list) {
        if (plugin && !_.isArray(plugin)) {

            var loc = _.result(plugin, 'loc');
            if (list) {
                list = _.without(list, loc);
            } else {
                cpIgnoredPluginList = _.without(cpIgnoredPluginList, loc);
            }
        }
    }

    function setStartPlugin(plugin, list) {
        if (plugin && !_.isArray(plugin)) {
            var loc = _.result(plugin, 'loc');

            if (list) {
                list.push(loc);
                list = _.uniq(list);
            } else {
                cpStartPluginList.push(loc);
                cpStartPluginList = _.uniq(cpStartPluginList);
            }
        }
    }

    function unsetStartPlugin(plugin, list) {
        if (plugin && !_.isArray(plugin)) {

            var loc = _.result(plugin, 'loc');
            if (list) {
                list = _.without(list, loc);
            } else {
                cpStartPluginList = _.without(cpStartPluginList, loc);
            }
        }
    }

    function getSystemPluginLocationList() {
        var list = [];
        _.each(oriAllPlugins, function (value) {
            var loc = _.result(value, 'loc');
            if (Number(loc.indexOf(SYSTEM_PLUGIN_LOC_PREFIX)) === 0) {
                list.push(loc);
            }
        });
        return list;
    }

    function getUserPluginLocationList() {
        var list = [];
        _.each(oriAllPlugins, function (value) {
            var loc = _.result(value, 'loc');
            if (Number(loc.indexOf(SYSTEM_PLUGIN_LOC_PREFIX)) < 0) {
                list.push(loc);
            }
        });
        return list;
    }

    function getIgnoredPluginLocationList() {
        var list = [];
        if (oriAllPlugins) {
            var plugins =  _.where(oriAllPlugins, {ignored: true});
            _.each(plugins, function (value) {
                list.push(_.result(value, 'loc'));
            });
        }
        return list;
    }

    function getSystemStartPluginLocationList() {
        return pm.getIHStartPlugins();
    }

    function getUserStartPluginLocationList() {
        return pm.getTPStartPlugins();
    }

    function initPuginList() {
        userPluginList = getUserPluginLocationList();
        cpUserPluginList = _.clone(userPluginList, true);
        ignoredPluginList = getIgnoredPluginLocationList();
        cpIgnoredPluginList = _.clone(ignoredPluginList, true);
        startPluginList = _.union(getSystemStartPluginLocationList(), getUserStartPluginLocationList());
        cpStartPluginList = _.clone(startPluginList, true);
    }
    initPuginList();

    function openPluginConfigurator() {
        //console.log('mira: plugin-configurator open called...');
        initPuginList();

        openConfiguratorDialog();
    }

    var item = {
        "&Plug-in Configurator" : [ "cmnd", 'plugins/plugin-configurator/plugin', 'openPluginConfigurator' ]
    };
    function getViableItems() {
        return item;
    }

    var module = {
        openPluginConfigurator: openPluginConfigurator,
        getViableItems: getViableItems
    };

    return module;
});
