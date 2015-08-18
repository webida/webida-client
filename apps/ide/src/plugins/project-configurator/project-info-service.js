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
 *
 * @since: 15. 8. 18
 * @author: Koong Kyungmi (kyungmi.k@samsung.com)
 * @module webida.project-configurator:service
 */

define([
    './projectConfigurator'
], function (
    pc
) {
    'use strict';
    
    var module = {};
    
    /**
     * callback that handles the projectInfo
     *
     * @callback projectInfoCallback
     * @param {object} projectInfo
     */
    
    /**
     * Get project information by file path
     * 
     * @param {string} path - full path started with workspace root
     *      e.g. '/workspaceName/projectName/filePath...'
     * @param {projectInfoCallback} [cb] - callback that handles the projectInfo
     * @return {object} - project information
     */
    module.getByPath = pc.getConfigurationObjectByPath;
    
    /**
     * Get project information by project name
     * 
     * @param {string} projectName - project name
     * @param {projectInfoCallback} [cb] - callback that handles the projectInfo
     * @return {object} - project information
     */
    module.getByName = pc.getConfigurationObjectByProjectName;
    
    /**
     * Get all project information in current workspace
     * 
     * @return {Array} - all of the project information list
     */
    module.getAll = pc.getProjectPropertyList;
    
    return module;
});
