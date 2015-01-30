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
 * @fileoverview webida - project wizard
 *
 * @version: 1.0.0
 * @since: 2014.04.25
 *
 * Src:
 *   plugins/project-wizard/run-commands.js
 */

define(['webida-lib/app',
        'webida-lib/webida-0.3',
        'webida-lib/util/path',
        'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
        'dojo',
        'dojo/Deferred',
        'dojo/dom',
        'dojo/data/ObjectStore',
        'dojo/store/Memory',
        'dojox/grid/EnhancedGrid',
        'dojox/grid/enhanced/plugins/IndirectSelection',
        'dijit/registry',
        'webida-lib/plugins/workspace/plugin',
        'plugins/project-configurator/projectConfigurator',
        'text!./layer/debug-layout.html',
        './export-commands',
        './constants',
        './launcher',
        './view-commands',
        './lib/util'
       ],
function (ide, webida, pathUtil, ButtonedDialog, dojo, Deferred, dom,
           ObjectStore, Memory, EnhancedGrid, IndirectSelection, reg,
           wv, projectConfigurator, tplLayout, exportViewCommand, Constants, Launcher, ViewCommand, Util) {
    'use strict';

    function RunCommand() {
        this.projectPath = null;
        this.launcher = new Launcher();
    }

    var NAME = 'Mobile Application';

    RunCommand.ConfigurationTypes = {
        MOBILE: 'org.webida.run.mobile'
    };

    RunCommand.DebugTypes = {
        DEVICE: 'device',
        DEVICE_WEINRE: 'deviceWEINRE',
        /*
        BROWSER: 'browser',
        BROWSER_REMOTE: 'browserRemote'
        */
    };

    RunCommand.DebugTypesTable = [
        { name: 'Device', id: RunCommand.DebugTypes.DEVICE },
        { name: 'Device with WEINRE', id: RunCommand.DebugTypes.DEVICE_WEINRE },
        /*
        { name: 'Browser', id: RunCommand.DebugTypes.BROWSER },
        { name: 'Remote Browser', id: RunCommand.DebugTypes.BROWSER_REMOTE }
        */
    ];

    RunCommand.RunTypes = {
        DEVICE: 'device',
        BROWSER: 'browser',
        BROWSER_RIPPLE: 'browserRipple'
    };

    RunCommand.Options = {
        TYPE: 'type',
        DEVICE: 'device'
    };

    RunCommand.DebugOptions = {
        TYPE: 'debug.type'
    };

    RunCommand.RunOptions = {
        TYPE: 'run.type',
        PROFILE: 'run.profile'
    };

    // inherit ViewCommand
    RunCommand.prototype = new ViewCommand('RUN');
    // correct the constructor pointer because it points to ViewCommand
    RunCommand.prototype.constructor = RunCommand;

    // Called from project-configurator plugin
    RunCommand.prototype.run = function (projectProperty, mode, runObject) {
        console.log('run (mode: ' + mode + ')');
        if (mode === projectConfigurator.RUN_MODE) {
            switch (runObject[RunCommand.RunOptions.TYPE]) {
            case RunCommand.RunTypes.DEVICE :
                this.runDevice(projectProperty, runObject[RunCommand.Options.DEVICE]);
                break;
            case RunCommand.RunTypes.BROWSER_RIPPLE :
                this.runRipple(projectProperty, runObject[RunCommand.RunOptions.PROFILE]);
                break;
            }
        } else if (mode === projectConfigurator.DEBUG_MODE) {
            this.debugWith(runObject[RunCommand.DebugOptions.TYPE], runObject[RunCommand.Options.DEVICE]);
        }
    };

    RunCommand.prototype._getProjectPath = function (projectInfo) {
        if (projectInfo) {
            return projectConfigurator.getProjectRootPath(wv.getRootPath() + projectInfo.name);
        } else {
            var curDir = wv.getSelectedPath();
            return projectConfigurator.getProjectRootPath(curDir);
        }
    };

    RunCommand.prototype.runDevice = function (projectInfo, device) {
        console.log('runDevice', (device !== undefined));
        var runOptions = {};
        runOptions[Launcher.RUN_OPTION.DEVICE] = device;
        var saveOptions = {};
        saveOptions[RunCommand.RunOptions.TYPE] = RunCommand.RunTypes.DEVICE;
        this.__runDevice(projectInfo, runOptions, saveOptions);
    };

    RunCommand.prototype.runRipple = function (projectInfo, profile) {
        console.log('runRipple', profile);
        this.projectPath = this._getProjectPath(projectInfo);
        var self = this;
        var _run = function (profile) {
            self.launcher.runToRipple(self.projectPath, profile);
            var options = {};
            options[RunCommand.RunOptions.TYPE] = RunCommand.RunTypes.BROWSER_RIPPLE;
            options[RunCommand.RunOptions.PROFILE] = profile;
            self._addConfiguration(self.projectPath, NAME, RunCommand.ConfigurationTypes.MOBILE, options);
        };

        if (profile) {
            _run(profile);
        } else {
            exportViewCommand.selectProfile(function (profile) {
                if (profile) {
                    _run(profile);
                }
            });
        }
    };

    RunCommand.prototype.debugWith = function (type, device) {
        console.log('debugWith', (device !== undefined));
        var self = this;
        this.projectPath = this._getProjectPath();

        Util.getProjectConfiguration(pathUtil.getName(this.projectPath), function (obj) {
            if (obj !== null) {
                var projectInfo = obj;
                var runOptions = {};
                runOptions[Launcher.RUN_OPTION.DEVICE] = device;

                var fn = function (type) {
                    switch (type) {
                    case RunCommand.DebugTypes.DEVICE :
                        self._debugWithDevice(projectInfo, type, runOptions);
                        break;
                    case RunCommand.DebugTypes.DEVICE_WEINRE :
                        self._debugWithDeviceWEINRE(projectInfo, type, runOptions);
                        break;
                    case RunCommand.DebugTypes.BROWSER :
                        self._debugWithBrowser(projectInfo, type);
                        break;
                    case RunCommand.DebugTypes.BROWSER_REMOTE :
                        self._debugWithBrowserRemote(projectInfo, type);
                        break;
                    }
                };

                if (type) {
                    fn(type);
                } else {
                    self.selectDebugType().then(function (selected) {
                        fn(selected);
                    });
                }
            }
        });
    };

    RunCommand.prototype._openInspector = function (projectInfo) {
        window.open(Constants.getDebugClientUrl(projectInfo.uuid));
    };

    RunCommand.prototype._debugWithDevice = function (projectInfo, type, runOptions) {
        var self = this;
        var _run = function () {
            self.__debugWithDevice(projectInfo, type, runOptions, function () {
                // Chronme Inspector
            });
        };

        // Latest Run
        if (runOptions[Launcher.RUN_OPTION.DEVICE]) {
            _run();
            return;
        }

        // Chrome Inspector
        var msg = 'This feature is Remote Debugging with Chrome on Android 4.4 KitKat.' +
            //Make sure that you have adb installed<br /> and that USB debugging is enabled on your device.' +
            '<ul>' +
            '<li>Connect your device to your computer using a USB cable.' +
            '<li>Launch Companion App on your device.' +
            '<li>If you click \'Proceed\' below, it will launch the application in debugging mode.' +
            '<li>In your Chrome 30+ browser, open the url <b>about:inspect</b>.' +
            //'<li>Find the application to debug in the list, and click the inspect link.' +
            '</ul>' +
            'Please refer <a href="https://developer.chrome.com/devtools/docs/remote-debugging">' +
                'Remote Debugging Chrome on Android</a> for further information.';
        var dlg = new ButtonedDialog({
            buttons: [
                { id: 'downloadOk',
                 caption: 'Proceed',
                 methodOnClick: 'proceed'
                },
                { id: 'downloadCancel',
                 caption: 'Cancel',
                 methodOnClick: 'hide'
                }
            ],
            methodOnEnter: 'ok',
            title: 'Confirm',
            refocus: false,

            onHide: function () {
                dlg.destroyRecursive();
            },

            onLoad: function () {
            },

            proceed: function () {
                _run();
                this.hide();
            }
        });
        dlg.set('doLayout', false);
        dlg.setContentArea(msg);
        dlg.show();
    };

    RunCommand.prototype._debugWithDeviceWEINRE = function (projectInfo, type, runOptions) {
        var self = this;
        var _run = function () {
            runOptions[Launcher.RUN_OPTION.WEINRE] = Constants.getDebugTargetUrl(projectInfo.uuid);
            self.__debugWithDevice(projectInfo, type, runOptions, function () {
                self._openInspector(projectInfo);
            });
        };

        // Latest Run
        if (runOptions[Launcher.RUN_OPTION.DEVICE]) {
            _run();
            return;
        }

        var msg = 'This feature is Remote Debugging with WEINRE on device.' +
            '<ul>' +
            '<li>Launch Companion App on your device.' +
            '<li>If you just click \'Proceed\' below, WEINRE will be connected automatically.' +
            '</ul>';
        var dlg = new ButtonedDialog({
            buttons: [
                { id: 'debugClientOnly',
                 caption: 'Open client',
                 methodOnClick: 'openClient'
                },
                { id: 'debugOk',
                 caption: 'Proceed',
                 methodOnClick: 'proceed'
                },
                { id: 'debugCancel',
                 caption: 'Cancel',
                 methodOnClick: 'hide'
                }
            ],
            methodOnEnter: 'ok',
            title: 'Confirm',
            refocus: false,

            onHide: function () {
                dlg.destroyRecursive();
            },

            onLoad: function () {
            },

            openClient: function () {
                self._openInspector(projectInfo);
            },

            proceed: function () {
                _run();
                this.hide();
            }
        });
        dlg.set('doLayout', false);
        dlg.setContentArea(msg);
        dlg.show();
    };

    RunCommand.prototype.__runDevice = function (projectInfo, options, saveOptions, cb) {
        var self = this;
        this.projectPath = this._getProjectPath(projectInfo);
        var defaults = {};
        defaults[Launcher.RUN_OPTION.CORDOVA] = 'true';
        if (options) {
            $.extend(defaults, options);
        }
        var cbRun = function (regid) {
            if (saveOptions) {
                saveOptions[RunCommand.Options.DEVICE] = regid;
            }
            //if (options && options[Launcher.RUN_OPTION.WEINRE]) { }
            self._addConfiguration(self.projectPath, NAME, RunCommand.ConfigurationTypes.MOBILE, saveOptions);

            if (cb) {
                cb(regid);
            }
        };
        this.launcher.runToDevice(this.projectPath, defaults, cbRun);
    };

    RunCommand.prototype.__debugWithDevice = function (projectInfo, type, options, cb) {
        var runOptions = options || {};
        runOptions.action = Launcher.ACTION.DEBUG;
        var saveOptions = {};
        saveOptions[RunCommand.DebugOptions.TYPE] = type;
        this.__runDevice(projectInfo, runOptions, saveOptions, function () {
            cb();
        });
    };

    RunCommand.prototype.__debugWithBrowser = function (projectInfo, type, template, cb) {
        var self = this;
        require([template], function (tpl) {
            var dlg = new ButtonedDialog({
                buttons: [
                    { id: 'debugCancel',
                     caption: 'Close',
                     methodOnClick: 'close'
                    }
                ],
                methodOnEnter: 'hide',
                title: 'Debug',
                refocus: false,

                onHide: function () {
                    dlg.destroyRecursive();
                },

                onLoad: function () {
                    dojo.connect(reg.byId('btnInspector'), 'onClick', function () {
                        self._openInspector(projectInfo);
                    });
                    cb();
                },

                close: function () {
                    var saveOptions = {};
                    saveOptions[RunCommand.DebugOptions.TYPE] = type;
                    self._addConfiguration(self.projectPath, NAME, RunCommand.ConfigurationTypes.MOBILE, saveOptions);
                    dlg.hide();
                }
            });
            dlg.set('doLayout', false);
            dlg.setContentArea(tpl);
            dlg.show();
        });
    };

    RunCommand.prototype._debugWithBrowser = function (projectInfo, type) {
        var self = this;
        this.__debugWithBrowser(projectInfo, type,
                                'text!plugins/project-wizard/layer/debug-weinre-browser.html', function () {
            dojo.connect(reg.byId('btnBrowser'), 'onClick', function () {
                Util.getAliasPathForIndexFile(pathUtil.detachSlash(self.projectPath), function (url) {
                    var wndChild = window.open(url);
                    wndChild.onload = function () {
                        var script = wndChild.document.createElement('script');
                        //var scriptSrc = Util.getProxyUrl(WEINRE_TARGET_URL);
                        var scriptSrc = Constants.getDebugTargetUrl(projectInfo.uuid);
                        console.log('script', scriptSrc);
                        script.setAttribute('src', scriptSrc);
                        //wndChild.WeinreServerURL = WEINRE_TARGET_HOST;
                        wndChild.document.getElementsByTagName('body')[0].appendChild(script);
                    };
                });
            });
        });
    };

    RunCommand.prototype._debugWithBrowserRemote = function (projectInfo, type) {
        var self = this;
        this.__debugWithBrowser(projectInfo, type,
                                'text!plugins/project-wizard/layer/debug-weinre-browser-remote.html', function () {
            Util.getAliasPathForIndexFile(pathUtil.detachSlash(self.projectPath), function (url) {
                $('#txtBrowserRemote').attr('value', url);
                var targetBookmarklet = 'javascript:(function(e){e.setAttribute("src","' +
                    Constants.getDebugTargetUrl(projectInfo.uuid) +
                    '");document.getElementsByTagName("body")[0].appendChild(e);})' +
                    '(document.createElement("script"));void(0);';
                // TODO: This tip using CORS does not work in Firefox. It just works in Chrome.
                //targetBookmarklet += 'window.WeinreServerURL="' + WEINRE_TARGET_HOST + '";void(0);';
                $('#targetBookmarklet').attr('href', targetBookmarklet);
            });
            require(['plugins/project-wizard/lib/clipboard'], function (Clipboard) {
                Clipboard.initCopy('#btnCopy', '#txtBrowserRemote');
            });
        });
    };

    RunCommand.prototype.selectDebugType = function () {
        var deferred = new Deferred();
        var dlg = new ButtonedDialog({
            selected: null,

            buttons: [
                { id: 'debugWEINRE',
                 caption: 'OK',
                 methodOnClick: 'select'
                },
                { id: 'debugCancel',
                 caption: 'Cancel',
                 methodOnClick: 'hide'
                }
            ],
            methodOnEnter: 'hide',
            title: 'Debug',
            refocus: false,

            onHide: function () {
                dlg.destroyRecursive();
                return deferred.resolve(dlg.selected);
            },

            grid: null,

            onLoad: function () {
                var layout = [[
                    {
                        'name': 'Type',
                        'field': 'name',
                        'width': '100%',
                        'styles': 'border-right-width: 0px;'
                    }
                ]];

                this.grid = new EnhancedGrid({
                    selectionMode: 'single',
                    store:  new ObjectStore({ objectStore: new Memory({
                        data: RunCommand.DebugTypesTable
                    }) }),
                    structure: layout,
                    noDataMessage: '<strong>No data</strong>',
                    autoHeight: true,
                    style: 'border: 1px solid gray;',
                    canSort: function () {
                        return false;
                    },
                    plugins: {
                        indirectSelection: {
                            width: '20px'
                        }
                    },
                    //onRowDblClick: function (test) { }
                }, dojo.query('#debugGrid')[0]);
                this.grid.startup();
            },

            select: function () {
                var items = dlg.grid.selection.getSelected();
                if (items.length > 0) {
                    this.selected = items[0].id;
                }
                dlg.hide();
            },
        });
        dlg.set('doLayout', false);
        dlg.setContentArea(tplLayout);
        dlg.show();

        return deferred.promise;
    };

    RunCommand.prototype._addConfiguration = function (projectPath, name, type, options) {
        var projectName = pathUtil.getName(projectPath);
        Util.getProjectConfiguration(projectName, function (obj) {
            if (obj !== null) {
                var projectInfo = obj;
                Util.addRunConfiguration(projectInfo.run, name, '', true, true);
                var result = $.grep(projectInfo.run.list, function (e) {
                    return e.name === name;
                });
                if (result[0]) {
                    var listItem = result[0];
                    listItem[RunCommand.Options.TYPE] = type;
                    if (options) {
                        $.each(options, function (idx, value) {
                            listItem[idx] = value;
                        });
                    }
                    Util.saveProject(projectInfo, function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            }
        });
    };

    return new RunCommand();
});
