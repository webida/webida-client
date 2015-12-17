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
 * project information API service
 * Once project's configuration is changed, 'project/config/changed' topic will be published with its name of project.
 *
 * @since 1.4.0 (2015.08.18)
 * @author kyungmi.k@samsung.com
 * @module ProjectConfigurator/service
 * @see module:ProjectConfigurator
 */

define([
    './projectConfigurator'
], function (
    projectConfigurator
) {
    'use strict';

    var module = {};

    /**
     * callback that handles the projectInfo
     *
     * @callback projectInfoCallback
     * @param {module:ProjectConfigurator.projectInfo} projectInfo
     * @memberof module:ProjectConfigurator/service
     */

    /**
     * callback that handles the projectInfo list
     *
     * @callback projectInfoListCallback
     * @param {Array.<module:ProjectConfigurator.projectInfo>} projectInfoList
     * @memberof module:ProjectConfigurator/service
     */

    /**
     * callback with error
     *
     * @callback errorCallback
     * @param {(Error|Object)} error
     * @memberof module:ProjectConfigurator/service
     */

    /**
     * Get project information by file path
     *
     * @param {string} path - full path started with workspace root
     *      e.g. '/workspaceName/projectName/filePath...'
     * @param {projectInfoCallback} [callback] - callback that handles the projectInfo
     * @return
     */
    module.getByPath = projectConfigurator.getConfigurationObjectByPath;

    /**
     * Get project information by project name
     *
     * @param {string} projectName - project name
     * @param {projectInfoCallback} [callback] - callback that handles the projectInfo
     * @return
     */
    module.getByName = projectConfigurator.getConfigurationObjectByProjectName;

    /**
     * Get all project information in current workspace
     *
     * @param {projectInfoListCallback} [callback] - callback that handles the projectInfo
     * @return
     */
    module.getAll = projectConfigurator.getProjectPropertyList;

    /**
     * Set project information to the project information file
     *
     * @param {string} projectName - project name
     * @param {module:ProjectConfigurator.projectInfo} projectInfo - project information to save
     * @param {errorCallback} [callback] - callback that is called when setting is finished
     */
    module.set = projectConfigurator.saveProjectProperty;

    return module;
});
