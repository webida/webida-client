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
 * @file Action trigger for build
 * @since 1.0.0 (2014.04.25)
 * @author cimfalab@gmail.com
 *
 * @see module:ProjectWizard/BuildRunner
 * @see module:ProjectWizard/BuildProfile
 * @module ProjectWizard/BuildMenu
 */

define([
    'dojo/topic',
    'webida-lib/util/logger/logger-client',
    'webida-lib/util/path',
    './build',
    './buildProfile',
    '../messages',
    '../lib/util'
], function (
    topic,
    Logger,
    pathUtil,
    Build,
    BuildProfile,
    Messages,
    Util
) {
    'use strict';
    var logger = new Logger();
    logger.off();
    /**
     * Build Menu
     * @param {module:ProjectWizard/ProjectConfigurator.projectInfo} projectInfo - project information
     * @param {string} projectPath - path to project
     * @constructor
     */
    function BuildMenu(projectInfo, projectPath) {
        this.projectInfo = projectInfo;
        this.projectPath = projectPath;
    }

    /**
     * Prepare information and request to run build
     *
     * @param {module:ProjectWizard/BuildRunner.buildRunType} buildType - build run type
     * @param {module:ProjectWizard/BuildProfile} buildProfile - build profile
     * @param {Object} signing
     * @param {(HTMLElement|jQuery)} element - This element surrounded with the TR Element that has the information of
     *      this build
     * @callback resultCallback
     * @param {Object} monitor - object for progress bar
     */
    BuildMenu.prototype.requestBuild = function (buildType, buildProfile, signing, element, resultCallback, monitor) {
        //logger.log('requestBuild'); // 'this' is ViewCommand?
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
            profileId: profileId,
            profileName: buildProfile.name,
            platform: platform,
            buildType: buildProfile.type,
            plugins: buildProfile.plugins,
            projectSrl: uuid
        };

        var p = buildProfile[platform];
        var platformInfo = {
            packageName: p.packageName,
            minSdkVersion: p.minSdkVersion,
            targetSdkVersion: p.targetSdkVersion,
            versionCode: p.versionCode,
            versionName: p.versionName
        };

        if (signing) {
            var alias = signing[BuildProfile.SIGNING.ALIAS];
            logger.log('signing with ' + alias);
            profileInfo.signing = {
                alias: alias
            };
        }
        var builder = new Build(this.projectPath, element, monitor);
        builder.build(buildType, profileInfo, platformInfo, resultCallback);
    };

    /**
     * Open a dialog for selecting profile
     * @see module:ProjectWizard/ProfileSelectionDialog
     * @param {module:ProjectConfigurator.projectInfo} projectInfo - project information
     * @param {Memory} buildStore - store for build information that includes name
     *      and {@link module:ProjectWizard/BuildProfile}
     * @param {Object} options - filter, message
     * @callback cb
     */
    BuildMenu.prototype.selectProfile = function (projectInfo, buildStore, options, cb) {
        require(['plugins/project-wizard/build/buildProfile-select'], function (SelectBuildProfile) {
            var delegate = new SelectBuildProfile(projectInfo, buildStore, options);
            delegate.openDialog().then(cb);
        });
    };

    /**
     * Open a dialog for selecting singing method
     * @see module:ProjectWizard/SigningSelectionDialog
     * @param {module:ProjectConfigurator.projectInfo} projectInfo - project information
     * @callback cb
     */
    BuildMenu.prototype.selectSigning = function (projectInfo, cb) {
        require(['plugins/project-wizard/build/signing-select'], function (SelectBuildProfile) {
            var delegate = new SelectBuildProfile(projectInfo);
            delegate.openDialog().then(cb);
        });
    };

    /**
     * Print elasped time to the log view
     * @param {number} elapsedTime
     */
    BuildMenu.printElapsedTime = function (elapsedTime) {
        topic.publish('#REQUEST.log',
            '<br />' + Messages.SUCCESS + '<br />' +
            '-----------------<br />' +
            elapsedTime + ' (ms)<br />'
        );
    };

    return BuildMenu;
});
