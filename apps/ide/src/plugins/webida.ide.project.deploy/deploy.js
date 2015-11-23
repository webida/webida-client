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
    'dijit/Tooltip',
    'dojo/i18n!./nls/resource',
    'webida-lib/util/logger/logger-client',
    'webida-lib/webida-0.3'
], function (
    Tooltip,
    i18n,
    Logger,
    webida
) {
    'use strict';

    var logger = new Logger();

    var fsidWorkspaceProjectName = null;		//ex> 'fePfnAiSb/Deploy/deployApp/'
    var fsidName = null;						//ex> 'fePfnAiSb'
    var workspaceName = null;					//ex> 'Deploy'
    var projectName = null;						//ex> 'deployApp'
    var workspaceProjectName = null;			//ex> 'Deploy/deployApp'
    var fsidWorkspaceName = null;				//ex> 'fePfnAiSb/Deploy'

    var fsRoot = null;							//ex> /
    var username = null;

    function _init(projectPath, cb) {

        fsidWorkspaceProjectName = projectPath;

        var splits = projectPath.split('/');
        var splitStartIndex = 0;

        if (!splits[0]) {
            fsidWorkspaceProjectName = projectPath.substring(1);
            splitStartIndex++;
        }
        if (splits.length - splitStartIndex < 3) {
            alert(i18n.validationInvalidArgument);
            return false;
        }

        fsidName = splits[splitStartIndex];
        workspaceName = splits[splitStartIndex + 1];
        projectName = splits[splitStartIndex + 2];
        workspaceProjectName = workspaceName + '/' + projectName;
        fsidWorkspaceName = fsidName + '/' + workspaceName;

        fsRoot = webida.fs.mountByFSID(fsidName);

        webida.auth.getMyInfo(function (err, myInfo) {
            if (err) {
                alert(i18n.messageFailGetUserInfo);
                if (cb) {
                    cb(err);
                }
            } else {
                if (!myInfo.uid) {
                    alert(i18n.messageFailGetUserInfo);
                    if (cb) {
                        cb('error');
                    }
                } else {
                    username = myInfo.uid;
                    if (cb) {
                        cb();
                    }
                }
            }
        });
    }

    return {
        init: function (projectPath) {
            _init(projectPath, function (err) {
                if (err) {
                    return;
                } else {
                    Tooltip.defaultPosition = ['above'];
                    logger.log('Booting deploy done');
                }
            });
        },
        getFsidWorkspaceProjectName: function () {
            return fsidWorkspaceProjectName;
        },
        getFsidName: function () {
            return fsidName;
        },
        getWorkspaceName: function () {
            return workspaceName;
        },
        getProjectName: function () {
            return projectName;
        },
        getWorkspaceProjectName: function () {
            return workspaceProjectName;
        },
        getFsidWorkspaceName: function () {
            return fsidWorkspaceName;
        },
        getMount: function () {
            return fsRoot;
        },
        getUserName: function () {
            return username;
        }
    };
});