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

define(['webida-lib/app-config', 'webida-lib/webida-0.3', 'underscore',
        'plugin-manager', 'toastr', 'dijit/Tooltip'],
function (appConfig, webida, _, pm, toastr, Tooltip) {
    'use strict';

    var fsidWorkspaceProjectName = null;		//ex> 'fePfnAiSb/Deploy/deployApp/'
    var fsidName = null;						//ex> 'fePfnAiSb'
    var workspaceName = null;					//ex> 'Deploy'
    var projectName = null;						//ex> 'deployApp'
    var workspaceProjectName = null;			//ex> 'Deploy/deployApp'
    var fsidWorkspaceName = null;				//ex> 'fePfnAiSb/Deploy'

    var fsRoot = null;							//ex> /
    var username = null;


    function init(projectPath, cb) {
        fsidWorkspaceProjectName = projectPath;

        var splits = projectPath.split('/');
        var splitStartIndex = 0;

        if (!splits[0]) {
            fsidWorkspaceProjectName = projectPath.substring(1);
            splitStartIndex++;
        }
        if (splits.length - splitStartIndex < 3) {
            alert('Error: Argument is invalid (ex>project=fsid/workspace/project)');
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
                alert('get userinfo fail');
                if (cb) {
                    cb(err);
                }
            } else {
                if (!myInfo.uid) {
                    alert('get userinfo fail');
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

    var deploy = {
        openDeploy : function (appPath, projectPath) {
            webida.auth.initAuth(appConfig.clientId, appConfig.redirectUrl);
            
            init(projectPath, function (err) {
                if (err) {
                    return;
                } else {
                    toastr.options = {
                        closeButton: true,
                        debug: false,
                        positionClass: 'toast-bottom-right',
                        onclick: null,
                        showDuration: 300,
                        hideDuration: 300,
                        timeOut: 3000,
                        extendedTimeOut: 1000,
                        showEasing: 'swing',
                        hideEasing: 'swing',
                        showMethod: 'fadeIn',
                        hideMethod: 'fadeOut'
                    };
                    
                    Tooltip.defaultPosition = ['above'];
                    
                    pm.initPlugins(appPath, fsidWorkspaceName);
                    console.log('Booting deploy done');
                }
            });

            // test the accessibility to the workspace.


        },
        getFsidWorkspaceProjectName : function () {
            return fsidWorkspaceProjectName;
        },
        getFsidName : function () {
            return fsidName;
        },
        getWorkspaceName : function () {
            return workspaceName;
        },
        getProjectName : function () {
            return projectName;
        },
        getWorkspaceProjectName : function () {
            return workspaceProjectName;
        },
        getFsidWorkspaceName : function () {
            return fsidWorkspaceName;
        },
        getMount : function () {
            return fsRoot;
        },
        getUserName : function () {
            return username;
        }
    };

    return deploy;
});