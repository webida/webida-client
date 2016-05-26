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
 * @file Manage actions and UI for project wizard commands
 * @since 1.0.0
 * @author kh5325.kim@samsung.com
 * @extends module:ProjectWizard/ViewCommands
 */

define([
    'dijit/registry',
    'dijit/Tooltip',
    'dojo/i18n!./nls/resource',
    'dojo/topic',
    'lib/test/bootstrap/bootstrap.custom',
    'webida-lib/app',
    'webida-lib/webida-0.3',
    'webida-lib/util/locale',
    'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
    'text!./layer/pw-layout.html',
    './main',
    './messages',
    './lib/util',
    'webida-lib/plugins/command-system/command/Command',
    'webida-lib/util/genetic'
], function (
    reg,
    Tooltip,
    i18n,
    topic,
    bootstrap,
    ide,
    webida,
    Locale,
    ButtonedDialog,
    tplLayout,
    main,
    Messages,
    Util,
    Command,
    genetic
) {
    'use strict';

    var win;
    var localizer  = new Locale(i18n);

    /* Deprecated */
    function createProject() {
        var dstFS = ide.getFsid();
        var targetPath = ide.getPath();
        var str = '?' + 'dst=' + dstFS + '&' + 'path=' + targetPath;

        var width = 940;
        var height = 720;

        var x = screen.width / 2 - width / 2;
        var y = screen.height / 2 - height / 2;

        var specs =
            'left=' + x + ',top=' + y + ',width=' + width + ',height=' + height + ',' +
            'toolbar=0,location=0,directories=0,status=0,menubar=0,scrollbars=0,copyhistory=0,resizable=0';

        // launch app
        if (!win || !win.window) {
            win = webida.app.launchApp('template-engine', true, str, {
                name: 'project-wizard',
                specs: specs
            });
        }
        win.focus();
    }

    function newProject() {
        var dlg = new ButtonedDialog({
            buttons: [
                { id: 'pwCreate',
                  caption: i18n.buttonCreate,
                  methodOnClick: 'onCreate'
                },
                { id: 'pwCancel',
                  caption: i18n.buttonCancel,
                  methodOnClick: 'hide'
                }
            ],
            methodOnEnter: 'onCreate',
            title: i18n.titleNewProject,
            refocus: false,

            tour: null,

            onHide: function () {
                if (dlg.tour) {
                    dlg.tour.end();
                }
                main.onCloseProject();
                dlg.destroyRecursive();
            },

            onCreate: function () {
                //var jobId = workbench.addJob('Find in Files: ' + pattern);
                //workbench.removeJob(jobId);
                var prjName;
                var selectedChildWidget = dijit.byId('pwTab').selectedChildWidget;
                var item, options = {};
                switch (selectedChildWidget.id) {
                // in case of 'Quick Start', pass the internal type template
                case 'pwQuickStart':
                    prjName = $('#pwQuickStartProjectName').val();
                    options.supportsCordova = $('#pwQuickStartOptCordova').is(':checked');
                    // internal/basic template does not have 'spec.json' file.
                    var appMain = (options.supportsCordova) ? 'www/index.html' : 'index.html';
                    item = {
                        template: {
                            'path': main.getInternalTemplatePath(),
                            'app_class': '',
                            'app_main': appMain
                        }
                    };
                    break;
                case 'pwProjectWizard':
                    prjName = $('#pw-projectNameIp').val();
                    options.supportsCordova = $('#pw-projectOptCordovaIp').is(':checked');
                    break;
                }

                main.onCreateProject(null, prjName, item, options);
                this.hide();
            },

            onLoad: function () {
                /*jshint nonew: false */
                new Tooltip({
                    connectId: ['pwQuickStartOptCordova', 'pwQuickStartOptCordovaLabel'],
                    label: Messages.PW_OPTIONS_CORDOVA,
                    position: ['below']
                });
                /*jshint nonew: true */
                $('#pwQuickStartGuideStart').click(function () {
                    Util.startTour([{
                        element: '#pwQuickStartGuideEmulate',
                        placement: 'top',
                        title: i18n.titleQuickGuide,
                        content: Messages.GUIDE_EMULATE
                    }, {
                        element: '#pwQuickStartGuideDevice',
                        placement: 'right',
                        title: i18n.titleQuickGuide,
                        content: Messages.GUIDE_CORDOVA
                    }]).then(function (tour) {
                        dlg.tour = tour;
                    });
                });
                var tabs = reg.byId('pwTab');
                tabs.watch('selectedChildWidget', function (name, oval, nval) {
                    if (nval.id === 'pwProjectWizard') {
                        main.initPreviewImage();
                    } else if (nval.id === 'pwQuickStart') {
                        $('#pwQuickStartProjectName').focus();
                    }
                });
                main.init(ide.getPath());
            },

            onShow: function () {
            },

            onFocus: function () {
                $('#pwQuickStartProjectName').focus();
            }
        });

        dlg.set('doLayout', false);
        dlg.setContentArea(tplLayout);

        // after setting template layout, now we can localize dialog

        localizer.convertMessage('pwQuickStartProjectNameLabel');
        localizer.convertMessage('pwQuickStartProjectNameType');
        localizer.convertMessage('pwQuickStartProjectTypeWebLabel');
        localizer.convertMessage('pwQuickStartProjectTypeServiceLabel');
        localizer.convertMessage('pwQuickStartOptCordovaLabel');
        localizer.convertMessage('pwQuickStartGuideStart');

        localizer.convertMessage('pw-category-label');
        localizer.convertMessage('pw-template-label');
        localizer.convertMessage('pw-description-label');
        localizer.convertMessage('pw-projectNameLb');
        localizer.convertMessage('pw-projectTargetLocationLb');
        localizer.convertMessage('pw-projectOptCordovaLb');

        dlg.show();
    } // newProject

    var MSGTYPE_PROJ_CREATION = 'project_created:';
    var MSGTYPE_PROJ_CLOSE = 'project_close';
    window.addEventListener('message', function (event) {
        var data = event.data;
        if (data.indexOf(MSGTYPE_PROJ_CREATION) === 0) {
            var arr = data.substr(MSGTYPE_PROJ_CREATION.length).split(',');
            var fsid = arr[0];
            var targetDir = arr[1];
            var projName = arr[2];

            if (fsid === ide.getFsid() && targetDir && projName) {
                var fsCache = ide.getFSCache();
                fsCache.refresh(targetDir + '/', { level: 2 }, function () {
                    topic.publish('project/wizard/created', targetDir, projName);

                    // get node and select, not focus just select
                    require(['webida-lib/plugins/workspace/plugin'], function (wv) {
                        wv.selectNode(targetDir + '/' + projName);
                    });
                });
            }
        } else if (data.indexOf(MSGTYPE_PROJ_CLOSE) === 0) {
            // (hina) The expected message with MSGTYPE_PROJ_CLOSE is not received
            // after the message with MSGTYPE_PROJ_CREATION.
            if (!!win) {
                win = null;
            }
            window.focus();
        }
    });

    function NewProjectCommand(id) {
        NewProjectCommand.id = id;
    }
    genetic.inherits(NewProjectCommand, Command, {
        execute : function () {
            return new Promise(function (resolve) {
                newProject();
                resolve();
            });
        }
    });

    return {
        'doIt': function () {
            createProject();
        },
        'newProject': newProject,
        NewProjectCommand: NewProjectCommand
    };
});

