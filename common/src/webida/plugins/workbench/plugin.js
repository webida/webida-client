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
 * @fileoverview webida - workbench
 *
 * @version: 0.1.0
 * @since: 2013.09.25
 *
 * Src:
 */

define([
    'require',
    'external/lodash/lodash.min',
    'webida-lib/plugin-manager-0.1',          // pm
    'webida-lib/plugins/command-system/system/command-system',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/widgets/views/viewmanager',   // vm
    './job-manager',                          // jobManager
    './views-controller',                     // jobManager
    './command-system/context-menu',          // contextMenu
    './command-system/top-menu',              // menubar
    './command-system/toolbar',               // toolbar
    './ui/Page',                              // Page
    './ui/Workbench',                         // Workbench
    'dojo/text!./workbench.html',             // markup
    'dijit/focus',
    'dojo/topic',
    'dojo/dom',
    'dojo/dom-class'
], function (
    require,
    _,
    pm,
    commandSystem,
    genetic,
    Logger,
    vm,
    jobManager,
    viewsController,
    contextMenu,
    topMenu,
    toolbar,
    Page,
    Workbench,
    markup,
    focus,
    topic,
    dom,
    domClass
) {
    'use strict';

	var singleLogger = new Logger.getSingleton();
	var logger = new Logger();
	//logger.setConfig('level', Logger.LEVELS.log);
	//logger.off();

    //console.log('hina: Loading workbench module');

    var menuItemTrees = {};

    var topElem, elem, elemTopPanel, elemCenterPanel;

    var context = {
        lastFocusedWidget : null,
        paths : null,
        projectPath : null,
        etc : null
    };

    $(document.body).append(markup);
    topElem = document.getElementById('app-workbench');
    topElem.focus();  // to enable global shortcut keys at any time

    jobManager.init();

    singleLogger.log('(a) in initialization of workbench module');

    elem = document.getElementById('app-workbench-border-container');
    viewsController.initialize(elem);

    singleLogger.log('(b) in initialization of workbench module');

    elemTopPanel = document.getElementById('app-workbench-top-panel');
    elemCenterPanel = document.getElementById('app-workbench-center-panel');

    singleLogger.log('(c) in initialization of workbench module');

    topElem.addEventListener('keydown', function (e) {
        commandSystem.service.shortcutBind.eventListener(e, context.lastFocusedWidget);
    });
    // extensions of webida.common.workbench:menu
    /*
    var exts = pm.getExtensions('webida.common.workbench:menu');
    var menuConfig = pm.getAppConfig('webida.common.workbench')['webida.common.workbench:menu'];
    var predefinedHierarchy = (menuConfig && menuConfig.hierarchy) || {};
    var predefinedToolbarItems = (menuConfig && menuConfig['toolbar-items']) || { options: [], list: [] };
    var menuItemTree = new MenuItemTree(predefinedHierarchy, exts, topElem, 'workbench',
                                       pm.getAppConfig('webida.common.workbench').menuSystem);

    singleLogger.log('(d) in initialization of workbench module');

    if (menuItemTree instanceof Error) {
        alert(string.substitute(i18n.alertFailedToInitTopLevelMenu, {
            msg: menuItemTree.message
        }));
    } else {
        menuItemTrees.workbench = menuItemTree;

        //menubar.init(menuItemTree);
        topMenu.create();
        toolbar.init(menuItemTree, predefinedToolbarItems);

        topic.subscribe('workbench/loading/started', function () {
            menuItemTree.getViableItems(function () {
                singleLogger.log('(Y) loading modules contributing to the top-level menu done');
                singleLogger.log('%c*** Loading Time = ' + singleLogger.getDuration() +
                                 ' ***', 'color:green');
            });
        });
    }*/
    topMenu.create();
    toolbar.create();


    singleLogger.log('(e) in initialization of workbench module');

    var regionsToInitialize;
    var regionsInitialized = 0;
    function checkIfInitDone() {
        if (regionsToInitialize === regionsInitialized) {
            topic.publish('workbench/load');
        }
    }

    var panels = pm.getExtensions('webida.common.workbench:panels');
    var views = pm.getExtensions('webida.common.workbench:views');
    regionsToInitialize = panels.length + views.length;

    function addContextMenuHandler(pluginName, menuExtPoint, elem) {
        if (pluginName === 'webida.common.editors' ||
            pluginName === 'webida.common.workspace') {
            elem.addEventListener('contextmenu', function (evt) {
                commandSystem.service.updateContextMenuModel(function () {
                    contextMenu.create(pluginName, evt);
                });
                evt.preventDefault();
                evt.stopPropagation();
            });
        }
    }

    var locations0 = ['top', 'center'];
    //console.log('panels', panels);
    panels.forEach(function (ext) {
        if (locations0.indexOf(ext.location) < 0) {
            console.error('Error: Illegal extension to "webida.common.workbench:panels" is ignored');
            return;
        }

        //console.log('hina temp: ext.module in workbench.js = ' + ext.module);
        require([ext.module], function (mod) {
            var panel = mod[ext.getPanel]();
            var panelTopElem;
            if (panel) {
                if (ext.location === 'top') {
                    elemTopPanel.appendChild(panel);
                    panelTopElem = elemTopPanel; // TODO: this is temporary
                } else if (ext.location === 'center') {
                    elemCenterPanel.appendChild(panel);
                    panelTopElem = elemCenterPanel; // TODO: this is temporary
                }

                // init context menu of the panel
                var pluginManifest = ext.__plugin__.manifest;
                var pluginName = pluginManifest.name;
                var menuExtPoint = pluginManifest.extensionPoints &&
                    pluginManifest.extensionPoints[pluginName + ':menu'];
                addContextMenuHandler(pluginName, menuExtPoint, panelTopElem);
                // end of 'init context menu of the panel'

                mod[ext.onPanelAppended]();
                regionsInitialized++;
                checkIfInitDone();

                //console.log('onPanelAppended done');
            } else {
                console.error('Error: Illegal return value from an extension to "webida.common.workbench:panels"');
            }
        });

    });

    singleLogger.log('(f) in initialization of workbench module');

    // extensions of webida.common.workbench:views
    var locations1 = ['top', 'left', 'right', 'bottom', 'center'];
    views.forEach(function (ext) {
        if (locations1.indexOf(ext.location) < 0) {
            console.error('Error: Illegal extension to "webida.common.workbench:views" is ignored');
            return;
        }

        //console.log('hina temp: ext.module in workbench.js = ' + ext.module);
        require([ext.module], function (mod) {
            var view = mod[ext.getView]();
            var viewTopElem;
            if (view) {
                if (ext.location === 'top') {
                    elemTopPanel.appendChild(view);
                    viewTopElem = elemTopPanel; // TODO: this is temporary
                } else if (ext.location === 'center') {
                    elemCenterPanel.appendChild(view);
                    viewTopElem = elemCenterPanel; // TODO: this is temporary
                } else {
                    viewsController._addView(view, ext.location, 0);
                    viewTopElem = view.contentPane.domNode; // TODO: this is temporary
                }

                // init context menu of the view
                var pluginManifest = ext.__plugin__.manifest;
                var pluginName = pluginManifest.name;
                var menuExtPoint = pluginManifest.extensionPoints &&
                    pluginManifest.extensionPoints[pluginName + ':menu'];
                addContextMenuHandler(pluginName, menuExtPoint, viewTopElem);
                // end of 'init context menu of the view'

                mod[ext.onViewAppended]();
                regionsInitialized++;
                checkIfInitDone();

                //console.log('onViewAppended');
            } else {
                console.error('Error: Illegal return value from an extension to "webida.common.workbench:views"');
            }
        });

    });

    singleLogger.log('(g) in initialization of workbench module');

    if (regionsToInitialize === 0) {
        topic.publish('workbench/load');
    }

    $(document.body).focus();
    /*
    $(document.body).bind('bubble', function (evt) {
        function collectViableItems(menuHolders, i, accum) {
            if (i === menuHolders.length) {
                require(['./command-system/shortcutKeysDlg'], function (dlg) {
                    var exts;
                    function collectAdditionalShortcuts(i) {
                        if (i === exts.length) {
                            dlg.open(accum, wholeAccum,
                                     additionalShortcuts, evt.shortcutHolders || [],
                                     _.uniq(evt.bubbleTouchers), false);
                        } else {
                            var ext = exts[i];
                            require([ext.module], function (mod) {
                                var plugin = ext.__plugin__.manifest.name;
                                if (!additionalShortcuts[plugin]) {
                                    additionalShortcuts[plugin] = [];
                                }
                                if (typeof mod[ext.getShortcuts] === 'function') {
                                    var shortcutsOfPlugin = additionalShortcuts[plugin];
                                    var shortcuts = mod[ext.getShortcuts]();
                                    var len = shortcuts.length;
                                    for (var j = 0; j < len; j++) {

                                        var shortcut = shortcuts[j];
                                        var normalizedKeys = MenuItemTree.normalizeKeysStr(shortcut.keys);
                                        if (normalizedKeys) {
                                            var item = {
                                                keys: normalizedKeys,
                                                title: shortcut.title,
                                                desc: shortcut.desc,
                                                viable: shortcut.viable
                                            };
                                            shortcutsOfPlugin.push(item);
                                        } else {
                                            alert(string.substitute(i18n.alertInvalidShortcutKeyString, {
                                                keys: shortcut.keys,
                                                plugin: plugin
                                            }));
                                            break;
                                        }
                                    }
                                }

                                collectAdditionalShortcuts(i + 1);
                            });
                        }
                    }

                    var wholeAccum = {};
                    Object.keys(menuItemTrees).forEach(function (pluginName) {
                        wholeAccum[pluginName] = menuItemTrees[pluginName].getWholeItems();
                    });

                    // collect shortcuts registered via webida.common.workbench:shortcutList
                    exts = pm.getExtensions('webida.common.workbench:shortcutList');
                    var additionalShortcuts = {};
                    collectAdditionalShortcuts(0);

                    //dlg.open(accum, wholeAccum, false);
                });
            } else {
                var menuHolder = menuHolders[i];
                var menuItemTree = menuItemTrees[menuHolder];
                menuItemTree.getViableItems(function (items) {
                    if (items) {
                        accum[menuHolder] = items;
                        //accum[menuHolder + '@whole'] = menuItemTree.getWholeItems();
                    }
                    collectViableItems(menuHolders, i + 1, accum);
                });
            }

        }

        if (evt.bubbleTouchers) {
            //console.log('hina temp: evt.menuHolders = ' + evt.menuHolders);
            collectViableItems(_.uniq(evt.menuHolders || []), 0, {});
        } else {
            alert(i18n.alertKeyboardInputFocusIsOutOfWorkbench);
        }
    }); */

    singleLogger.log('(h) in initialization of workbench module');

    // add bubble event handler to the extensions of webida.common.workbench:shortcutList
    /*
    exts = pm.getExtensions('webida.common.workbench:shortcutList');
    exts.forEach(function (ext) {
        require([ext.module], function (mod) {
            if (typeof mod[ext.getEnclosingDOMElem] === 'function') {
                var elem = mod[ext.getEnclosingDOMElem]();
                if (elem) {
                    $(elem).bind('bubble', function (evt) {
                        //console.log('hina temp: bubble event reached to ' + pluginName);
                        if (!evt.shortcutHolders) {
                            evt.shortcutHolders = [];
                        }
                        if (!evt.bubbleTouchers) {
                            evt.bubbleTouchers = [];
                        }
                        var holder = ext.__plugin__.manifest.name;
                        evt.shortcutHolders.push(holder);
                        evt.bubbleTouchers.push(holder);
                    });
                }
            }
        });
    }); */

    singleLogger.log('(i) in initialization of workbench module');

    function updateStatusbar() {
        var statusInfos = [];

        if (context.projectPath) {
            statusInfos.push({text: context.projectPath, tooltip: 'Project'});
        }
        if (context.paths) {
            if (context.paths.length > 1) {
                statusInfos.push({text: context.paths.length + ' ' + 'items', tooltip: 'selected item count'});
            } else if (context.paths.length === 1) {
                var path = context.paths[0];
                if (context.projectPath && (path.split(context.projectPath).length > 1)) {
                    path = path.split(context.projectPath)[1];
                }
                statusInfos.push({text: path, tooltip: 'Path'});
            }
        }

        if (context.etc) {
            var keys = Object.keys(context.etc);
            keys.forEach(function (key) {
                statusInfos.push({text: context.etc[key]});
            });
        }

        viewsController.setStatusbarInfos(statusInfos);
    }

    focus.watch('activeStack', function (name, oldValue, newValue) {
        if (newValue.length > 0 && newValue[0] === 'app-workbench-border-container') {
            var id = newValue[newValue.length - 1];
            var widgetNode;
            if ((widgetNode = dom.byId(id))) {
                context.lastFocusedWidget = widgetNode;
            }
        }
    });

    function focusLastWidget() {
        // case editor
        var id;
        if (context.lastFocusedWidget && (id = context.lastFocusedWidget.id) && dom.byId(id)) {
            if (id.indexOf('view_') !== -1) {
                var view = vm.getView(id);
                if (view) {
                    view.select(true);
                }
            } else { // case view
                focus.focus(context.lastFocusedWidget);
            }
        }
    }

    singleLogger.log('(j) in initialization of workbench module');

	//TODO : refactor this plugin into WorkBench

    function WebidaWorkbench() {
        Workbench.call(this);

		//TODO : split into a file to save and restore
        var model = {
            pages: [{
                name: 'JavaScript',
                type: 'Page',
                id: 'webida.page.javascript',
                split: {
                    orientation: 0,
                    ratio: [0.3, 0.7]
                },
                children: [{
                    type: 'LayoutPane',
                    id: 'webida.layout_pane.left'
                }, {
                    type: 'LayoutPane',
                    id: 'webida.layout_pane.center_and_right',
                    split: {
                        orientation: 0,
                        ratio: [0.7, 0.3]
                    },
                    children: [{
                        type: 'CompatibleLayoutPane',
                        id: 'webida.layout_pane.center'
                    }, {
                        type: 'LayoutPane',
                        id: 'webida.layout_pane.right'
                    }]
                }]
            }]
        };

		this.parseModel(model);
		logger.info(this);
    }

    genetic.inherits(WebidaWorkbench, Workbench, {

        appendView: function (view, location) {
            viewsController.appendView(view, location);
        },

        getMenuItemTrees: function () {
            return menuItemTrees;
        },

        /*
         getNullItems : function () {
         return null;
         },
         */

        getShortcutsItems: function () {
            return {
                '&Shortcut List': ['cmnd', 'webida-lib/plugins/workbench/wb-commands', 'showViableShortcutKeys'],
                '&Command List': ['cmnd', 'webida-lib/plugins/workbench/wb-commands', 'showCmdList']
            };
        },
        getBogusItems: function () {
            return {
                'Focus Menu Bar': ['cmnd', 'webida-lib/plugins/workbench/wb-commands', 'focusTopMenubar']
            };
        },
        getWorkspaceSeletionItem: function () {
            return {
                'Switc&h Workspace': ['cmnd', 'webida-lib/plugins/workbench/workspaceSelectionDialog', 'show'],
                'Save Status': ['cmnd', 'webida-lib/app', 'saveStatus'],
                '&Quit': ['cmnd', 'webida-lib/plugins/workbench/wb-commands', 'quit']
            };
        },

        getItemsUnderView: function () {
            var items = {};
            items['Select View from &List'] = ['cmnd', 'webida-lib/plugins/workbench/views-controller', 'showViewList'];
            items['Toggle &Menu'] = ['cmnd', 'webida-lib/plugins/workbench/views-controller', 'toggleMenubar'];
            items['Toggle &Toolbar'] = ['cmnd', 'webida-lib/plugins/workbench/views-controller', 'toggleToolbar'];
            items['Toggle &Full-Screen'] = ['cmnd', 'webida-lib/plugins/workbench/views-controller',
                                            'toggleFullScreen'];

            return items;
        },

        registToViewFocusList: function (view, opt) {
            var option = {};
            option.fields = {
                title: opt.title
            };
            if (opt.hasOwnProperty('key')) {
                option.key = opt.key;
            }
            viewsController.focusController.registerView(view, option);
        },

        unregistFromViewFocusList: function (view) {
            return viewsController.focusController.unregisterView(view);
        },

        registToElementFocusList: function (/*element, opt*/) {
            //return focusManager.registElement(element, opt);
        },

        unregistFromElementFocusList: function (/*element*/) {

        },

        menuCallbackShowMenubar: function (index) {
            if (index === 0) {
                viewsController.setMenubarState('show');
            } else {
                viewsController.setMenubarState('hide');
            }
        },

        menuCallbackShowToolbar: function (index) {
            if (index === 0) {
                viewsController.setToolbarState('show');
            } else {
                viewsController.setToolbarState('hide');
            }
        },

        showTopMenubar: function () {
            viewsController.removeClass(viewsController.getWorkbenchTopElement(), 'workbenchMenubarHide');
        },

        hideTopMenubar: function () {
            domClass.addClass(viewsController.getWorkbenchTopElement(), 'workbenchMenubarHide');
        },

        showTopToolbar: function () {
            domClass.removeClass(viewsController.getWorkbenchTopElement(), 'workbenchToolbarHide');
        },

        hideTopToolbar: function () {
            domClass.addClass(viewsController.getWorkbenchTopElement(), 'workbenchToolbarHide');
        },

        isTopMenubarHided: function () {
            return domClass.contains(viewsController.getWorkbenchTopElement(), 'workbenchMenubarHide');
        },

        isTopToolbarHided: function () {
            return domClass.contains(viewsController.getWorkbenchTopElement(), 'workbenchToolbarHide');
        },

        setStatusText: function (text) {
            viewsController.setStatusbarText(text);
        },

        addJob: function (title) {
            return jobManager.addJob(title);
        },

        removeJob: function (id) {
            jobManager.removeJob(id);
        },

        getContext: function () {
            return context;
        },

        setContext: function (paths, etc) {
            if (paths && paths.length > 0) {
                context.paths = paths;
                var path = paths[0].split('/');
                var projectPath;
                if (path.length >= 3) {
                    projectPath = path[0] + '/' + path[1] + '/' + path[2];
                } else {
                    projectPath = '';
                }
                context.projectPath = projectPath;
            }

            if (etc) {
                context.etc = etc;
            } else {
                context.etc = null;
            }

            updateStatusbar();
            topic.publish('workbench/context/changed', context);
        },

        focusLastWidget: focusLastWidget,

        openWorkspaceView: function () {
            // left pane is closed
            if (viewsController.isPanelCollapsed('left')) {
                viewsController.expandPanel('left');
            }
        },

        toggleFullScreen: function () {
            viewsController.toggleFullScreen();
        }
    });


    singleLogger.log('initialized workbench plugin\'s module');

	return new WebidaWorkbench();
});
