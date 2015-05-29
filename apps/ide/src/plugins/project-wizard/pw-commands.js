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
 * @version: 0.1.0
 * @since: 2013.10.01
 *
 * Src:
 *   plugins/project-wizard/plugin.js
 */

define(['webida-lib/app',
        'webida-lib/webida-0.3',
        'webida-lib/widgets/dialogs/buttoned-dialog/ButtonedDialog',
        'dojo/topic',
        'dijit/registry',
        'dijit/Tooltip',
        'lib/test/bootstrap/bootstrap.custom',
        'text!./layer/pw-layout.html',
        './main',
        './messages',
        './lib/util'
       ],
function (ide, webida, ButtonedDialog, topic, reg, Tooltip, bootstrap, tplLayout, main, Messages, Util) {
    'use strict';

    var win;

    /** Deprecated */
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
                  caption: 'Create',
                  methodOnClick: 'onCreate'
                },
                { id: 'pwCancel',
                  caption: 'Cancel',
                  methodOnClick: 'hide'
                }
            ],
            methodOnEnter: 'onCreate',
            title: 'New Project',
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
                Util.addTooltip(['pwQuickStartOptCordova', 'pwQuickStartOptCordovaLabel'], Messages.PW_OPTIONS_CORDOVA);
                $('#pwQuickStartGuideStart').click(function () {
                    Util.startTour([{
                        element: '#pwQuickStartGuideEmulate',
                        placement: 'top',
                        title: 'Webida Quick Guide',
                        content: Messages.GUIDE_EMULATE
                    }, {
                        element: '#pwQuickStartGuideDevice',
                        placement: 'right',
                        title: 'Webida Quick Guide',
                        content: Messages.GUIDE_CORDOVA
                    }]).then(function (tour) {
                        dlg.tour = tour;
                    });
                });
                var tabs = reg.byId('pwTab');
                tabs.watch('selectedChildWidget', function (name, oval, nval) {
                    if (nval.id === 'pwProjectWizard') {
                        console.log('initPreviewImage by tab selection');
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

            console.log('mira', MSGTYPE_PROJ_CREATION, fsid, targetDir, projName);
            if (fsid === ide.getFsid() && targetDir && projName) {
                var fsCache = ide.getFSCache();
                fsCache.refresh(targetDir + '/', { level: 2 }, function () {
                    topic.publish('projectWizard.created', targetDir, projName);

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

    return {
        'doIt': function () {
            createProject();
        },

        'newProject': newProject
    };
});
