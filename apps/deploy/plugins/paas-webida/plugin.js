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

define([
    'underscore',
    'webida-lib/webida-0.3',
    'core/deploy',
    'text!./webidaCreateApp.html',
    'text!./webidaAppInfoTable.html',
    'webida-lib/widgets/dialogs/file-selection/FileSelDlg3States', // FileDialog
    'dojo/parser',
    'dijit/registry',
    'dijit/Dialog',
    'dijit/layout/ContentPane',
    'dojox/layout/TableContainer',
    'dijit/layout/LinkPane',
    'dijit/TitlePane',
    'dijit/form/Button',
    'dijit/form/TextBox',
    'dijit/form/ComboBox',
    'dojo/store/Memory',
    'dijit/Tooltip',
    'toastr',
    'popup-dialog',
    'dijit/registry',
    'dojo/domReady!'
], function (_, webida, deploy, createMarkup, appInfoMarkup, FileDialog, parser, reg, Dialog, ContentPane,
             TableContainer, LinkPane, TitlePane, Button, TextBox, ComboBox, Memory, Tooltip, toastr, PopupDialog) {
    'use strict';

    var showAppPane = null;
    var projectPath = null;
    var createButton = null;
    var noAppLabel = null;

    //var STR_HTTPS = 'https://';
    var STR_DOT = '.';
    var STR_ARCHIVE_PATH = '/.project/deploy.zip';
    var STR_API_CALL_FAIL = 'Failed to call Webida API.';
    var CONTENT_NO_DEPLOYED_APP_INFORMATION =
        'This project has no deployed apps. Please click the \'Create New Deploy\' button.';

    var CREATE_NEW_APP_ENTER_NAME_DOMAIN_TOASTR = 'Enter a name and a domain.';
    var EDIT_APP_SUCCESS_TOASTR = 'Successfully edited the app information.';
    var EDIT_APP_CANCEL_TOASTR = 'Canceled editing the app information.';
    var EDIT_APP_FAIL_TOASTR = 'Failed to edit the app information.';
    var SELECTIVE_SETTING_TITLE_DIALOG = 'Select Files to Deploy';
    var SELECTIVE_SETTING_SUCCESS_TOASTR = 'Files to deploy were selected successfully.';
    var SELECTIVE_SETTING_CANCEL_TOASTR = 'Canceled file selection.';
    var SELECTIVE_SETTING_FAIL_TOASTR = 'Failed to select files to deploy.';
    var DELETE_APP_TITLE_DIALOG = 'Delete Deployed App';
    var DELETE_APP_MESSAGE_DIALOG = 'Are you sure to delete this deployed app?';
    var DELETE_APP_SUCCESS_TOASTR = 'Successfully deleted the deployed app.';
    var DELETE_APP_CANCEL_TOASTR = 'Canceled to delete the deployed app.';
    var DEPLOY_APP_ING_PROGRESS = 'Deploying...';
    var DEPLOY_APP_SUCCESS = '\'{0}\' was successfully deployed';
    var DEPLOY_APP_FAIL_TOASTR = 'Failed to deploy the app.';
    var START_APP_SUCCESS_TOASTR = 'Successfully started the deployed app.';
    var STOP_APP_SUCCESS_TOASTR = 'Successfully stopped the deployed app.';
    var CHECK_AVAILABLE = 'Available';
    var CHECK_NOT_AVAILABLE = 'This domain is not available.';
    var CHECK_NAME_NO_NAME_TOOLTIP = 'Enter a name.';
    var CHECK_NAME_CONTAIN_SPACE_TOOLTIP = 'Names cannot contain spaces.';
    var CHECK_NAME_ALREADY_EXIST_TOOLTIP = 'This name already exists in the project.';
    var CHECK_DOMAIN_GET_FAIL_TOOLTIP = 'Failed to receive a deploy domain.';
    var CHECK_NAME_NO_DOMAIN_TOOLTIP = 'Enter a deploy project domain postfix.';
    var SHOW_STATUS_ERROR = 'Unknown app status';

    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/\{(\d+)\}/g, function ($0, $1) {
            return args[$1] !== void 0 ? args[$1] : $0;
        });
    };

    function isDuplicateDeployName(parent, name) {
        var oldName = $(parent).find('.table-title-name');
        if (name === $(oldName[0]).text()) {
            return false;
        }

        var domNode = showAppPane.domNode;
        var names  = $(domNode).find('.table-title-name');
        for (var i = 0; i < names.length; i++) {
            if (name === $(names[i]).text()) {
                return true;
            }
        }
        return false;
    }

    function checkName(parent, nameBox) {
        var inputVal = nameBox.value;
        if (!inputVal) {
            return CHECK_NAME_NO_NAME_TOOLTIP;
        }

        var blankPattern = /[\s]/g;
        if (blankPattern.test(inputVal) === true) {
            return CHECK_NAME_CONTAIN_SPACE_TOOLTIP;
        }

        if (nameBox.oldValue === inputVal) {
            return CHECK_AVAILABLE;
        }

        if (isDuplicateDeployName(parent, inputVal) === true) {
            return CHECK_NAME_ALREADY_EXIST_TOOLTIP;
        }

        return CHECK_AVAILABLE;
    }

    function checkDomain(parent, domainBox, cb) {
        var domain = getDomain(parent);
        var ret = '';

        if (!domain) {
            cb(CHECK_DOMAIN_GET_FAIL_TOOLTIP);
            return;
        }

        if (!domainBox.value) {
            cb(CHECK_NAME_NO_DOMAIN_TOOLTIP);
            return;
        }

        if (domainBox.value === domainBox.oldValue) {
            cb(CHECK_AVAILABLE);
            return;
        }

        webida.app.isValidDomain(domain, function (err, result) {
            if (err) {
                console.log('webida.app.isValidDomain : ' + err);
                toastr.error(STR_API_CALL_FAIL);
                ret = STR_API_CALL_FAIL;
            } else {
                if (result) {
                    ret = CHECK_AVAILABLE;
                } else {
                    ret = CHECK_NOT_AVAILABLE;
                }
            }
            cb(ret);
        });
    }

    function _removeProjectPath(list) {
        if (!list || list.length < 1) {
            return null;
        }
        var ret = [];
        var removePath = getProjectRootPathFromFullPath(projectPath);

        for (var i = 0; i < list.length; i++) {
            var split = list[i].split(removePath + '/');
            ret[i] = '*' + split[1] + '*';
        }

        return ret;
    }

    function archiveDeployFile(excludeList, cb) {
        var fsMount = deploy.getMount();
        var path = getProjectRootPathFromFullPath(projectPath);
        var args = ['-r', STR_DOT + STR_ARCHIVE_PATH, STR_DOT, '-x'];
        var exclude = _removeProjectPath(excludeList);
        args = args.concat(exclude);

        var info = {
            cmd: 'zip',
            args: args
        };

        var zipFilePath = path + STR_ARCHIVE_PATH;

        function doArchive(path, info) {
            fsMount.exec(path, info, function (err, data) {
                if (err) {
                    console.log('fsMount.exec : ' + err);
                    toastr.error(STR_API_CALL_FAIL);
                } else {
                    if (cb) {
                        cb(zipFilePath, data);
                    }
                }
            });
        }

        fsMount.exists(zipFilePath, function (err, exist) {
            if (err) {
                console.log('fsMount.exists : ' + err);
                toastr.error(STR_API_CALL_FAIL);
                return;
            } else {
                if (exist) {
                    fsMount.delete(zipFilePath, false, function (err) {
                        if (err) {
                            console.log('fsMount.delete : ' + err);
                            toastr.error(STR_API_CALL_FAIL);
                        } else {
                            doArchive(path, info);
                        }
                    });
                } else {
                    doArchive(path, info);
                }
            }
        });
    }

    function _writeObjectFromFile(path, selectiveObject, cb) {
        var fsMount = deploy.getMount();
        var jsonText = JSON.stringify(selectiveObject);

        fsMount.writeFile(path, jsonText, function (err) {
            if (err) {
                console.log(path + '/.project/deploy.json' + ' save fail' + 'fsMount.writeFile : ' + err);
                toastr.error(STR_API_CALL_FAIL);
            }
            if (cb) {
                cb(err);
            }
        });
    }

    function setProjectExcludeListToFile(selectiveObject, cb) {
        var fsMount = deploy.getMount();
        var path = getProjectRootPathFromFullPath(projectPath);

        fsMount.exists(path + '/.project', function (err, exist) {
            if (err) {
                console.log('fsMount.exists : ' + err);
                toastr.error(STR_API_CALL_FAIL);
                if (cb) {
                    cb(err);
                }
                return;
            } else {
                if (exist) {
                    _writeObjectFromFile(path + '/.project/deploy.json', selectiveObject, cb);
                } else {
                    fsMount.createDirectory(path + '/.project', function (err) {
                        if (err) {
                            console.log('fsMount.createDirectory : ' + err);
                            toastr.error(STR_API_CALL_FAIL);
                            cb(err);
                        } else {
                            _writeObjectFromFile(path + '/.project/deploy.json', selectiveObject, cb);
                        }
                    });
                }
            }
        });
    }

    function setExcludeList(appID, list, cb) {
        var obj = {
            'appID': appID,
            'excululist': list
        };

        getProjectExcludeListFromFile(function (err, selectiveObject) {
            if (err) {
                console.log('getProjectExcludeListFromFile : ' + err);
                if (cb) {
                    cb(err);
                }
            } else {
                if (!selectiveObject) {
                    var itemList = [obj];
                    selectiveObject = {
                        list : itemList
                    };
                } else {
                    for (var i = 0; i < selectiveObject.list.length; i++) {
                        if (selectiveObject.list[i].appID === appID) {
                            selectiveObject.list[i].excululist = list;
                            setProjectExcludeListToFile(selectiveObject, cb);
                            return;
                        }
                    }
                    selectiveObject.list.push(obj);
                }

                setProjectExcludeListToFile(selectiveObject, cb);
            }
        });
    }

    function _readObjectFromFile(path, cb) {
        var fsMount = deploy.getMount();
        var selectiveObject = null;
        fsMount.readFile(path, function (err, content) {
            if (err) {
                console.log('fsMount.readFile : ' + err);
                if (cb) {
                    cb(err);
                }
            } else {
                if (content) {
                    selectiveObject = JSON.parse(content);
                }
                if (cb) {
                    cb(null, selectiveObject);
                }
            }
        });
    }

    function getProjectExcludeListFromFile(cb) {
        var fsMount = deploy.getMount();
        var path = getProjectRootPathFromFullPath(projectPath);
        fsMount.exists(path + '/.project', function (err, exist) {
            if (err) {
                console.log('fsMount.exists : ' + err);
                toastr.error(STR_API_CALL_FAIL);
                if (cb) {
                    cb(err);
                }
                return;
            } else {
                if (exist) {
                    _readObjectFromFile(path + '/.project/deploy.json', function (err, selectiveObject) {
                        if (err) {
                            console.log('_readObjectFromFile : ' + err);
                            cb();
                        } else {
                            cb(null, selectiveObject);
                        }
                    });
                } else {
                    cb();
                }
            }
        });
    }

    function getExcludeList(appID, cb) {
        getProjectExcludeListFromFile(function (err, selectiveObject) {
            console.log('getProjectExcludeListFromFile', err);
            if (err) {
                if (cb) {
                    cb(err);
                }
            } else {
                if (selectiveObject && selectiveObject.list) {
                    for (var i = 0; i < selectiveObject.list.length; i++) {
                        if (selectiveObject.list[i].appID === appID) {
                            cb(null, selectiveObject.list[i].excululist);
                            return;
                        }
                    }
                }
                if (cb) {
                    cb();
                }
            }
        });
    }

    function deleteSelectiveSettingInfo(appID, cb) {
        getProjectExcludeListFromFile(function (err, selectiveObject) {
            if (err) {
                console.log('getProjectExcludeListFromFile', err);
                if (cb) {
                    cb(err);
                }
            } else {
                if (selectiveObject) {
                    for (var i = 0; i < selectiveObject.list.length; i++) {
                        if (selectiveObject.list[i].appID === appID) {
                            selectiveObject.list.slice(i, 1);
                            setProjectExcludeListToFile(selectiveObject, cb);
                            if (cb) {
                                cb(null, true);
                            }
                            return;
                        }
                    }
                }
                if (cb) {
                    cb(null, false);
                }
            }
        });
    }

    function getProjectRootPathFromFullPath(fullPath) {
        var split = fullPath.split('/');
        return '/' + split[1] + '/' + split[2];
    }

    function getAppID(parent) {
        if (!parent) {
            return null;
        }
        var domain  = $(parent).find('.table-content-table-inputbox');
        var appID = $(domain[0]).attr('appID');

        return appID;
    }

    function getSrcUrl() {
        var wfsUrl = document.createElement('a');
        wfsUrl.href = webida.conf.fsServer;
        var srcUrl = 'wfs://' + wfsUrl.hostname + '/' + projectPath;
        return srcUrl;
    }

    function showStartStopButtonByStatus(parent) {
        var icon  = $(parent).find('.table-content-table-inputbox-readonly');
        var status = icon[0].value;

        if (status === 'running') {
            icon = $(parent).find('.table-action-start');
            $(icon).removeClass('table-action-start-block');
            icon = $(parent).find('.table-action-stop');
            $(icon).addClass('table-action-stop-block');
        }
        else if (status === 'stopped') {
            icon = $(parent).find('.table-action-stop');
            $(icon).removeClass('table-action-stop-block');
            icon = $(parent).find('.table-action-start');
            $(icon).addClass('table-action-start-block');
        }
        else {
            console.log('error : unknown app status');
            toastr.error(SHOW_STATUS_ERROR);
        }
    }

    function initAppInfoEvent(child) {
        var arrow = $(child).find('.table-title-arrow');
        arrow.bind('mouseup', function () {
            var contentBody = $(child).find('.table-content');
            var toggled = $(contentBody).attr('toggled');
            if (toggled === 'true') {
                $(contentBody).attr('toggled', 'false');
                arrow.removeClass('table-title-arrow-up');
                contentBody.removeClass('table-content-toggled');
            } else {
                $(contentBody).attr('toggled', 'true');
                arrow.addClass('table-title-arrow-up');
                contentBody.addClass('table-content-toggled');
            }
        });

        addActionEvent(child, 'table-title-setting', selectiveSetting);
        addActionEvent(child, 'table-title-trash', deleteApp);
        addActionEvent(child, 'table-title-changeinfo', changeInfoStart);
        addActionEvent(child, 'table-title-cancel', changeInfoCancel);
        addActionEvent(child, 'table-action-deploy', deployApp);
        addActionEvent(child, 'table-action-start', startApp);
        addActionEvent(child, 'table-action-stop', stopApp);
        addActionEvent(child, 'table-action-save', changeInfoDone);
    }

    function getDomain(parent) {
        var username = deploy.getUserName();
        var icon  = $(parent).find('.table-content-table-inputbox');
        var ret = username + '-' + icon[1].value;
        return ret;
    }

    function saveNewApp(parent) {
        var username = deploy.getUserName();
        var icon  = $(parent).find('.table-content-table-inputbox');

        var appinfo = {
            domain: getDomain(parent),
            apptype: 'html',
            name: icon[0].value,
            desc: icon[2].value,
            owner: username
        };

        var checkStr = checkName(parent, icon[0]);
        if (checkStr !== CHECK_AVAILABLE) {
            toastr.warning(checkStr);
            return;
        }

        checkDomain(parent, icon[1], function (result) {
            if (result !== CHECK_AVAILABLE) {
                toastr.warning(result);
                return;
            } else {

                webida.app.createApp(
                    appinfo.domain, appinfo.apptype, appinfo.name, appinfo.desc, function (err, appID) {

                    if (err) {
                        console.log('webida.app.createApp : ' + err);
                        toastr.error(STR_API_CALL_FAIL);
                        alert(err);
                        var app = reg.byNode(parent);
                        createButton.set('disabled', false);
                        showAppPane.removeChild(app);
                    } else {
                        icon  = $(parent).find('.table-content-table-inputbox');
                        $(icon[0]).attr('appID', appID);
                        var excludeList = parent.selectiveSetting;

                        deployApp(parent, excludeList, function (err) {
                            if (err) {
                                console.log('deployApp : ' + err);
                                var app = reg.byNode(parent);
                                showAppPane.removeChild(app);
                                webida.app.deleteApp(appID, function (err) {
                                    if (err) {
                                        toastr.error(err);
                                    }
                                });
                            } else {
                                icon = $(parent).find('.table-title-newappcancel');
                                $(icon).removeClass('table-title-newappcancel-block');
                                icon = $(parent).find('.table-action-newappsave');
                                $(icon).removeClass('deploy-block');
                                icon = $(parent).find('.table-title-newsetting');
                                $(icon).removeClass('table-title-newsetting-block');
                                changeInfoStop(parent);
                                changeInfoUpdate(parent);
                                if (noAppLabel.getParent()) {
                                    showAppPane.removeChild(noAppLabel);
                                }
                            }
                            createButton.set('disabled', false);
                        });
                    }
                });
            }
        });
    }

    function initNewAppEvent(parent) {
        var username = deploy.getUserName();

        var icon = $(parent).find('.table-title-setting');
        $(icon).addClass('table-title-setting-disabled');

        icon = $(parent).find('.table-title-trash');
        $(icon).addClass('table-title-trash-disabled');

        icon = $(parent).find('.table-title-changeinfo');
        $(icon).addClass('table-title-changeinfo-disabled');

        icon  = $(parent).find('.table-content-table-inputbox-label');
        icon.text(username + '-');

        var inputBoxs  = $(parent).find('.table-content-table-inputbox');
        $(inputBoxs).addClass('table-content-table-inputbox-edit');
        $(inputBoxs).removeAttr('readonly');

        $(inputBoxs[0]).bind('input', function () {
            var ret = checkName(parent, inputBoxs[0]);
            if (ret) {
                Tooltip.show(ret, inputBoxs[0]);
            }
        });

        $(inputBoxs[0]).bind('focusout', function () {
            Tooltip.hide(inputBoxs[0]);
        });

        $(inputBoxs[1]).bind('input', function () {
            checkDomain(parent, inputBoxs[1], function (ret) {
                if (ret) {
                    Tooltip.show(ret, inputBoxs[1]);
                }
            });
        });

        $(inputBoxs[1]).bind('focusout', function () {
            Tooltip.hide(inputBoxs[1]);
        });

        icon = $(parent).find('.table-action-deploy');
        $(icon).addClass('table-action-deploy-disabled');

        addActionEvent(parent, 'table-title-newappcancel', null);
        addActionEvent(parent, 'table-action-newappsave', saveNewApp);
        addActionEvent(parent, 'table-title-newsetting', selectiveSettingNewApp);

        icon = $(parent).find('.table-title-newappcancel');
        $(icon).addClass('table-title-newappcancel-block');

        icon = $(parent).find('.table-title-newsetting');
        $(icon).addClass('table-title-newsetting-block');

        icon = $(parent).find('.table-action-newappsave');
        $(icon).addClass('deploy-block');
    }

    function createNewApp() {
        var markup = new ContentPane({
            style: 'text-indent:20px; line-height:100%; background-color:#F5FAFF',
            content: appInfoMarkup
        });

        showAppPane.addChild(markup, 0);

        var child = markup.domNode;

        initAppInfoEvent(child);
        initNewAppEvent(child);

        var icon = $(child).find('.table-title-newappcancel');
        $(icon).bind('mouseup', function () {
            createButton.set('disabled', false);
            showAppPane.removeChild(markup);
        });

        createButton.set('disabled', true);

        toastr.info(CREATE_NEW_APP_ENTER_NAME_DOMAIN_TOASTR);
    }

    function initCreateApp(pane) {
        createButton = new Button({
            label: 'Create New Deploy',
            onClick: createNewApp,
            style: 'position:absolute; right:5px; text-indent: 0px; top:8px'
        });

        noAppLabel = new ContentPane({
            style: 'text-indent:20px; line-height:100%; background-color:#F5FAFF',
            content: CONTENT_NO_DEPLOYED_APP_INFORMATION
        });

        pane.addChild(createButton);
    }

    function initShowApp(pane) {
        showAppPane = pane;
        showAppPane.set('content', CONTENT_NO_DEPLOYED_APP_INFORMATION);
    }

    function checkSrcUrlAndUpdate(parent, appID, srcUrl, count) {
        if (count > 3) {
            alert('Failed to save app information');
            return;
        }

        webida.app.getAppInfo(appID, function (err, appInfo) {
            if (err) {
                console.log('webida.app.getAppInfo : ' + err);
                toastr.error(STR_API_CALL_FAIL);
                var app = reg.byNode(parent);
                showAppPane.removeChild(app);
            } else {
                if (!appInfo.srcurl) {
                    webida.app.setAppInfo(appID, appInfo.domain, appInfo.apptype, appInfo.name, appInfo.desc, srcUrl,
                                          function (err) {

                        if (err) {
                            console.log('webida.app.setAppInfo : ' + err);
                            toastr.error(STR_API_CALL_FAIL);
                            var app = reg.byNode(parent);
                            showAppPane.removeChild(app);
                        } else {
                            checkSrcUrlAndUpdate(parent, appID, srcUrl, count + 1);
                        }
                    });
                } else {
                    addAppInfoText(parent, appInfo);
                }
            }
        });
    }

    function changeInfoUpdate(parent) {
        var appID = getAppID(parent);
        var srcUrl = getSrcUrl();
        checkSrcUrlAndUpdate(parent, appID, srcUrl, 0);
    }

    function changeInfoStop(parent) {
        var icon = $(parent).find('.table-title-setting');
        $(icon).removeClass('table-title-setting-disabled');

        icon = $(parent).find('.table-title-trash');
        $(icon).removeClass('table-title-trash-disabled');

        icon = $(parent).find('.table-title-changeinfo');
        $(icon).removeClass('table-title-changeinfo-disabled');

        icon = $(parent).find('.table-title-cancel');
        $(icon).removeClass('deploy-block');

        icon  = $(parent).find('.table-content-table-inputbox');
        $(icon).removeClass('table-content-table-inputbox-edit');
        $(icon).attr('readonly', 'true');

        icon = $(parent).find('.table-action-deploy');
        $(icon).removeClass('table-action-deploy-disabled');

        icon = $(parent).find('.table-action-save');
        $(icon).removeClass('deploy-block');
    }

    function changeInfoCancel(parent) {
        changeInfoStop(parent);
        showStartStopButtonByStatus(parent);
        var icon  = $(parent).find('.table-content-table-inputbox');
        for (var i = 0; i < icon.length; i++) {
            icon[i].value = icon[i].oldValue ? icon[i].oldValue : '';
        }
        toastr.info(EDIT_APP_CANCEL_TOASTR);
    }

    function changeInfoDone(parent) {
        var icon  = $(parent).find('.table-content-table-inputbox');
        var checkStr = checkName(parent, icon[0]);
        if (checkStr !== CHECK_AVAILABLE) {
            toastr.warning(checkStr);
            return;
        }

        checkDomain(parent, icon[1], function (result) {
            if (result !== CHECK_AVAILABLE) {
                toastr.warning(result);
                return;
            } else {
                var appID = getAppID(parent);

                var newDomainPostfix = icon[1].value;
                var name = icon[0].value;
                var desc = icon[2].value;
                var type = 'html'; // FIXME

                icon  = $(parent).find('.table-content-table-inputbox-label');
                var newDomain = icon.text() + newDomainPostfix;
                var srcUrl = getSrcUrl();

                webida.app.setAppInfo(appID, newDomain, type, name, desc, srcUrl, function (err) {
                    if (err) {
                        console.log('webida.app.setAppInfo : ' + err);
                        toastr.error(STR_API_CALL_FAIL);
                        changeInfoCancel(parent);
                        toastr.error(EDIT_APP_FAIL_TOASTR);
                    } else {
                        changeInfoStop(parent);
                        changeInfoUpdate(parent);
                        toastr.success(EDIT_APP_SUCCESS_TOASTR);
                    }
                });
            }
        });
    }

    function changeInfoStart(parent) {
        var icon = $(parent).find('.table-title-setting');
        $(icon).addClass('table-title-setting-disabled');

        icon = $(parent).find('.table-title-trash');
        $(icon).addClass('table-title-trash-disabled');

        icon = $(parent).find('.table-title-changeinfo');
        $(icon).addClass('table-title-changeinfo-disabled');

        icon = $(parent).find('.table-title-cancel');
        $(icon).addClass('deploy-block');

        var inputBoxs  = $(parent).find('.table-content-table-inputbox');
        for (var i = 0; i < inputBoxs.length; i++) {
            inputBoxs[i].oldValue = inputBoxs[i].value ? inputBoxs[i].value : '';
        }

        $(inputBoxs).addClass('table-content-table-inputbox-edit');
        $(inputBoxs).removeAttr('readonly');

        //$(icon).bind('input', function () {
        //    var saveButton = $(parent).find('.table-action-save');
        //    checkNameAndDomain(parent, saveButton);
        //});

        $(inputBoxs[0]).bind('input', function () {
            var ret = checkName(parent, inputBoxs[0]);
            if (ret) {
                Tooltip.show(ret, inputBoxs[0]);
            }
        });

        $(inputBoxs[0]).bind('focusout', function () {
            Tooltip.hide(inputBoxs[0]);
        });

        $(inputBoxs[1]).bind('input', function () {
            checkDomain(parent, inputBoxs[1], function (ret) {
                if (ret) {
                    Tooltip.show(ret, inputBoxs[1]);
                }
            });
        });

        $(inputBoxs[1]).bind('focusout', function () {
            Tooltip.hide(inputBoxs[1]);
        });

        icon = $(parent).find('.table-action-deploy');
        $(icon).addClass('table-action-deploy-disabled');

        icon = $(parent).find('.table-action-start');
        $(icon).removeClass('table-action-start-block');

        icon = $(parent).find('.table-action-stop');
        $(icon).removeClass('table-action-stop-block');

        icon = $(parent).find('.table-action-save');
        $(icon).addClass('deploy-block');
    }

    function selectiveSetting(parent) {
        var appID = getAppID(parent);

        getExcludeList(appID, function (err, excludeList) {
            if (err) {
                console.log('getExcludeList : ' + err);
            }
            var dlg = new FileDialog({
                mount : deploy.getMount(),
                root: getProjectRootPathFromFullPath(projectPath),
                initialDeselection: excludeList,
                title: SELECTIVE_SETTING_TITLE_DIALOG,
                dirOnly: false
            });
            dlg.open(function (selected) {
                if (selected) {
                    setExcludeList(appID, selected, function (err) {
                        if (err) {
                            console.log('getExcludeList : ' + err);
                            toastr.error(SELECTIVE_SETTING_FAIL_TOASTR);
                        } else {
                            toastr.success(SELECTIVE_SETTING_SUCCESS_TOASTR);
                        }
                    });
                } else {
                    toastr.info(SELECTIVE_SETTING_CANCEL_TOASTR);
                }
            });
        });
    }

    function selectiveSettingNewApp(parent) {
        var oldSettings = parent.selectiveSetting;
        var rootPath = getProjectRootPathFromFullPath(projectPath);

        var dlg = new FileDialog({
            mount : deploy.getMount(),
            root: rootPath,
            initialDeselection: oldSettings,
            title: SELECTIVE_SETTING_TITLE_DIALOG,
            dirOnly: false
        });

        dlg.open(function (selected) {
            if (selected) {
                parent.selectiveSetting = selected;
                toastr.success(SELECTIVE_SETTING_SUCCESS_TOASTR);
            } else {
                toastr.info(SELECTIVE_SETTING_CANCEL_TOASTR);
            }
        });
    }

    function deleteApp(parent) {
        PopupDialog.yesno({
            title: DELETE_APP_TITLE_DIALOG,
            message: DELETE_APP_MESSAGE_DIALOG,
            type: 'info'
        }).then(function () {
            var appID = getAppID(parent);
            webida.app.deleteApp(appID, function (err) {
                if (err) {
                    console.log('webida.app.deleteApp : ' + err);
                    toastr.error(STR_API_CALL_FAIL);
                } else {
                    showAppPane.removeChild(dijit.byNode(parent));
                    deleteSelectiveSettingInfo(appID, function (err) {
                        if (err) {
                            console.log('deleteSelectiveSettingInfo : ' + err);
                        }
                    });
                    if (showAppPane.getChildren().length === 0) {
                        showAppPane.addChild(noAppLabel);
                    }
                    toastr.success(DELETE_APP_SUCCESS_TOASTR);
                }

            });
        }, function () {
            toastr.info(DELETE_APP_CANCEL_TOASTR);
            return;
        });
    }

    function setProgressInfo(parent, bShow, label, value, bIndeterminate) {
        var icon = $(parent).find('.table-action-progress');
        $(icon).addClass('deploy-block');
        var progress = reg.byId(icon[0].id);

        if (label) {
            progress.set('label', label);
        }

        if (bIndeterminate  === true || bIndeterminate === false) {
            progress.set('indeterminate', bIndeterminate);
        }

        if (value) {
            progress.set('value', value);
        }

        if (bShow === true) {
            $(icon).addClass('deploy-block');
        } else {
            $(icon).removeClass('deploy-block');
        }
    }

    function _deployApp(parent, appID, path, cb) {
        setProgressInfo(parent, true, DEPLOY_APP_ING_PROGRESS, null, true);

        var fsMount = deploy.getMount();
        var prjPath = getProjectRootPathFromFullPath(projectPath);
        fsMount.readFile(prjPath + '/.project/project.json', function (err, content) {
            if (err) {
                console.log(err);
            } else {
                var obj = null;
                if (content !== '') {
                    obj = JSON.parse(content);
                    if (obj.natures && $.inArray('org.webida.mobile.MobileNature', obj.natures) > -1) {
                        // In case of mobile application, index.html is under www directory
                        path += '/www';
                        console.log('MobileNature', path);
                    }

                    webida.app.deployApp(appID, path, 'url', function (err) {
                        if (err) {
                            console.log('webida.app.deployApp : ' + err);
                            toastr.error(STR_API_CALL_FAIL);
                            setProgressInfo(parent, true, DEPLOY_APP_FAIL_TOASTR, 0, false);
                        } else {
                            var msg = DEPLOY_APP_SUCCESS.format(appID);
                            toastr.success(msg);
                            setProgressInfo(parent, true, msg, 100, false);
                        }

                        setTimeout(function () {
                            setProgressInfo(parent, false);
                        }, 5000);

                        if (cb) {
                            cb(err);
                        }
                    });
                }
            }
        });
    }

    function excludeDeployApp(parent, excludeList, cb) {
        var appID = getAppID(parent);
        if (excludeList && excludeList.length > 0) {
            archiveDeployFile(excludeList, function (path, data) {
                if (data) {
                    var deployPath = deploy.getFsidName() + path;
                    _deployApp(parent, appID, deployPath, cb);
                } else {
                    console.log('Failed to deploy with excludeList : cannot archive');
                    toastr.error(DEPLOY_APP_FAIL_TOASTR);
                }
            });
        } else {
            _deployApp(parent, appID, projectPath, cb);
        }
    }

    function deployApp(parent, excludeList, cb) {
        var appID = getAppID(parent);

        if (!excludeList) {
            getExcludeList(appID, function (err, list) {
                if (list) {
                    excludeDeployApp(parent, list, cb);
                } else {
                    _deployApp(parent, appID, projectPath, cb);
                }
            });
        } else {
            excludeDeployApp(parent, excludeList, cb);
        }
    }

    function startApp(parent) {
        var appID = getAppID(parent);
        webida.app.startApp(appID, function (err) {
            if (err) {
                console.log('webida.app.startApp : ' + err);
                toastr.error(STR_API_CALL_FAIL);
            } else {
                changeInfoUpdate(parent);
                toastr.success(START_APP_SUCCESS_TOASTR);
            }
        });
    }

    function stopApp(parent) {
        var appID = getAppID(parent);
        webida.app.stopApp(appID, function (err) {
            if (err) {
                console.log('webida.app.stopApp : ' + err);
                toastr.error(STR_API_CALL_FAIL);
            } else {
                changeInfoUpdate(parent);
                toastr.success(STOP_APP_SUCCESS_TOASTR);
            }
        });
    }

    function addActionEvent(parent, classname, cb) {
        var icon = $(parent).find(STR_DOT + classname);

        $(icon).bind('mouseover', function () {
            $(icon).addClass(classname + '-hover');
        });

        $(icon).bind('mouseout', function () {
            $(icon).removeClass(classname + '-hover');
            $(icon).removeClass(classname + '-pushed');
        });

        $(icon).bind('mousedown', function () {
            $(icon).addClass(classname + '-pushed');
        });

        $(icon).bind('mouseup', function () {
            if (cb) {
                cb(parent);
            }
            $(icon).removeClass(classname + '-pushed');
        });
    }

    function addAppInfoText(parent, appInfo) {
        var titleName = $(parent).find('.table-title-name');
        titleName.html(appInfo.name);

        var icon = $(parent).find('.table-content-table-inputbox');
        var domainprefixLabel = $(parent).find('.table-content-table-inputbox-label');

        icon[0].value = appInfo.name;
        $(icon[0]).attr('appID', appInfo.appid);

        var postfixindex = appInfo.domain.indexOf('-');

        if (postfixindex === -1) {
            icon[1].value = appInfo.domain;
        } else {
            domainprefixLabel.text(appInfo.domain.substring(0, postfixindex + 1));
            icon[1].value = appInfo.domain.substring(postfixindex + 1);
        }

        icon[2].value = appInfo.desc;

        icon = $(parent).find('.table-content-table-inputbox-readonly');

        icon[0].value = appInfo.status;

        showStartStopButtonByStatus(parent);

        var urlStr = webida.app.getDeployedAppUrl(appInfo.domain);
        //var hostName = webida.app.getHost();
        //var urlStr = STR_HTTPS + appInfo.domain + STR_DOT + hostName;

        icon = $(parent).find('.table-content-table-url');
        icon.html(urlStr);
        icon.attr('href', urlStr);
    }

    function showAppInfo(findApp) {
        var markup = new ContentPane({
            style: 'text-indent:20px; line-height:100%; background-color:#F5FAFF',
            content: appInfoMarkup
        });
        showAppPane.addChild(markup);

        var child = markup.domNode;
        var arrow = $(child).find('.table-title-arrow');
        arrow.bind('mouseup', function () {
            var contentBody = $(child).find('.table-content');
            var toggled = $(contentBody).attr('toggled');
            if (toggled === 'true') {
                $(contentBody).attr('toggled', 'false');
                arrow.removeClass('table-title-arrow-up');
                contentBody.removeClass('table-content-toggled');
            } else {
                $(contentBody).attr('toggled', 'true');
                arrow.addClass('table-title-arrow-up');
                contentBody.addClass('table-content-toggled');
            }
        });

        addActionEvent(child, 'table-title-setting', selectiveSetting);
        addActionEvent(child, 'table-title-trash', deleteApp);
        addActionEvent(child, 'table-title-changeinfo', changeInfoStart);
        addActionEvent(child, 'table-title-cancel', changeInfoCancel);
        addActionEvent(child, 'table-action-deploy', deployApp);
        addActionEvent(child, 'table-action-start', startApp);
        addActionEvent(child, 'table-action-stop', stopApp);
        addActionEvent(child, 'table-action-save', changeInfoDone);

        addAppInfoText(child, findApp);
    }

    function cbChangeProjectPath(err, appLists) {
        if (err) {
            console.log('webida.app.getMyAppInfo : ' + err);
            toastr.error(STR_API_CALL_FAIL);
        } else {
            if (createButton) {
                if (createButton.get('disabled') === true) {
                    createButton.set('disabled', false);
                }
            }

            var findApp = null;
            var children = showAppPane.getChildren();
            if (children) {
                for (var i = 0; i < children.length; i++) {
                    showAppPane.removeChild(children[i]);
                }
            }
            showAppPane.set('content', '');

            if (!appLists) {
                showAppPane.addChild(noAppLabel);
                return;
            }

            var find = false;
            var srcUrl = getSrcUrl();
            for (var j = 0; j < appLists.length; j++) {
                if (appLists[j].srcurl && appLists[j].srcurl === srcUrl) {
                    findApp = appLists[j];
                    showAppInfo(findApp);
                    find = true;
                }
            }
            if (find === false) {
                showAppPane.addChild(noAppLabel);
            }
        }
    }

    function existUnsaved() {
        if (createButton) {
            if (createButton.get('disabled') === true) {
                return true;
            }
        }

        if (showAppPane) {
            var domNode = showAppPane.domNode;
            var editableInputbox  = $(domNode).find('.table-content-table-inputbox-edit');
            if (editableInputbox && editableInputbox.length > 0) {
                return true;
            }
        }

        return false;
    }

    var module = {
        beforeChange: function (cb) {
            if (existUnsaved() === true) {
                PopupDialog.yesno({
                    title: 'Leave This Page?',
                    message: 'Any unsaved change(s) will be lost. Are you sure?',
                    type: 'info'
                }).then(function () {
                    cb(true);
                }, function () {
                    cb(false);
                });
            } else {
                cb(true);
            }
        },
        // for webida.deploy.workbench:views extension point
        account: function () {
            return false;
        },
        showApps: function (pane) {
            initShowApp(pane);
        },
        createApp: function (pane) {
            initCreateApp(pane);
        },
        changeProjectPath: function (path) {
            //initProjectInfo(path);
            projectPath = path;
            webida.app.getMyAppInfo(cbChangeProjectPath);
        }
    };

    return module;
});
