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
 *   plugins/project-wizard/build/build-menu.js
 */

define(['webida-lib/app',
        'webida-lib/webida-0.3',
        'webida-lib/util/path',
        'dojo',
        'dojo/Deferred',
        'dojo/dom',
        'dojo/topic',
        'dijit/registry',
        './build',
        './buildProfile',
        '../messages',
        '../lib/util'
       ],
function (ide, webida, pathUtil, dojo, Deferred, dom, topic, reg,
    Build, BuildProfile, Messages, Util) {
    'use strict';

    function BuildMenu(projectInfo, projectPath) {
        this.projectInfo = projectInfo;
        this.projectPath = projectPath;
    }

    BuildMenu.prototype.requestBuild = function (buildType, buildProfile, signing, element, resultCallback, monitor) {
        //console.log('requestBuild'); // 'this' is ViewCommand?
        if (!this.projectInfo) {
            throw new Error('No projectInfo');
        }

        var workspaceName = Util.getWorkspaceName(this.projectPath);
        var projectName = pathUtil.getName(this.projectPath);

        var profileId = buildProfile.name;
        var platform = buildProfile.platform;

        var uuid = this.projectInfo.uuid ? this.projectInfo.uuid : 'anonymous'; // project uuid (serial)
        var profileInfo = {
            workspaceName: workspaceName,
            projectName: projectName,
            profileId : profileId,
            profileName: buildProfile.name,
            platform: platform,
            buildType: buildProfile.type,
            plugins: buildProfile.plugins,
            projectSrl: uuid
        };

        var p = buildProfile[platform];
        var platformInfo = {
            'packageName': p.packageName,
            'minSdkVersion': p.minSdkVersion,
            'targetSdkVersion': p.targetSdkVersion,
            'versionCode': p.versionCode,
            'versionName': p.versionName
        };

        if (signing) {
            var alias = signing[BuildProfile.SIGNING.ALIAS];
            console.log('signing with ' + alias);
            profileInfo.signing = {
                alias: alias
            };
        }
        var builder = new Build(this.projectPath, element, monitor);
        builder.build(buildType, profileInfo, platformInfo, resultCallback);
    };

    BuildMenu.prototype.selectProfile = function (projectInfo, buildStore, options, cb) {
        require(['plugins/project-wizard/build/buildProfile-select'], function (SelectBuildProfile) {
            var delegate = new SelectBuildProfile(projectInfo, buildStore, options);
            delegate.openDialog().then(cb);
        });
    };

    BuildMenu.prototype.selectSigning = function (projectInfo, cb) {
        require(['plugins/project-wizard/build/signing-select'], function (SelectBuildProfile) {
            var delegate = new SelectBuildProfile(projectInfo);
            delegate.openDialog().then(cb);
        });
    };

    BuildMenu.printElapsedTime = function (elapsedTime) {
        topic.publish('#REQUEST.log',
            '<br />' + Messages.SUCCESS + '<br />' +
            '-----------------<br />' +
            elapsedTime + ' (ms)<br />'
        );
    };

    return BuildMenu;
});
