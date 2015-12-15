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
 * Event Handler module for FsCache
 *
 * @see
 * @since: 2015.12.04
 * @author: hw.shim@samsung.com
 */

// @formatter:off
define([
    'dojo/topic',
    'webida-lib/app',
    'webida-lib/plugins/workbench/plugin',
    'webida-lib/util/genetic',
    'webida-lib/util/logger/logger-client',
    './plugin'
], function (
    topic,
    ide,
    workbench,
    genetic, 
    Logger,
    editors
) {
    'use strict';
// @formatter:on

    /**
     * @typedef {Object} DataSource
     */

    var logger = new Logger();
    //logger.setConfig('level', Logger.LEVELS.log);
    //logger.off();

    var fsCache = ide.getFSCache();

    var fsCacheHandler = {

        /**
         * For legacy view system compatibility
         * TODO : Refactor file.toRefresh, currentFile, currentFiles, recentFiles
         * @protected
         */
        _onInvalidated: function (fsURL, path) {
            logger.info('fs/cache/file/invalidated arrived');
            var dsRegistry = workbench.getDataSourceRegistry();
            var dataSource = dsRegistry.getDataSourceById(path);
            var file;
            if (dataSource) {
                file = dataSource.getPersistence();
                if (file === editors.currentFile) {
                    fsCache.refreshFileContents(path);
                } else {
                    file.toRefresh = true;
                }
            }
        },

        /**
         * For legacy view system compatibility
         * TODO : Refactor currentFile, currentFiles, recentFiles
         * @protected
         */
        _onEditorSelected: function (oldPart, newPart) {

            if (oldPart !== newPart) {
                if (newPart) {
                    var file = newPart.getDataSource().getPersistence();
                    editors.currentFile = file;
                    if (file) {
                        editors.currentFiles.put(file);
                        editors.recentFiles.put(file.getPath());
                        if (file.toRefresh) {
                            file.toRefresh = false;
                            fsCache.refreshFileContents(file.getPath());
                        }
                    }
                } else {
                    editors.currentFile = null;
                }
            }
        }
    };

    return fsCacheHandler;
});
