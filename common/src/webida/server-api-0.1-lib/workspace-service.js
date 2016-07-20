/*
 * Copyright (c) 2012-2016 S-Core Co., Ltd.
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
 * @file workspace-service.js
 * @since 1.7.0
 * @author jh1977.kim@samsung.com
 */

// we don't want cyclic dependencies between common and TokenManager.
//  so, instead of requiring just ./common, we require all dependencies directly
//  the only instance of TokenManager is saved in common
define([
    'external/eventEmitter/EventEmitter',
    'external/lodash/lodash.min',
    'webida-lib/util/genetic',
    './common',
    './session',
],  function (
    EventEmitter,
    _,
    genetic,
    common,
    session
) {
    'use strict';

    var logger = common.logger;
    var workspaceApi = new common.api.WorkspaceApi();

    // workspace service can be 'management' service & 'exec' service
    // exec service need 'connected session' & current workspace data (init)

    // while mgmt service does not
    function WorkspaceService() {
        EventEmitter.call(this);
        this._workspace = null;
    }

    genetic.inherits(WorkspaceService, EventEmitter, {

        _update : function _update(model) {
            var newWorkspace = _.assign({}, model);
            this._workspace = newWorkspace;
        },

        isAvailable: function wsIsAvailable() {
            return session.isConnected && this._workspace;
        },

        getWorkspace: function getWorkspace() {
            return this._workspace;
        },

        // TODO : wrap some workspaceApi operations
        //  findProcs, cancel, update

        // workspace-management service
        //  create, find, update, delete operations should be available when service is not available

        exec : function wsExec(execution, async, callback) {
            try {
                if (!this.isAvailable()) {
                    throw new Error ('workspace service is not available- not initialized or lost session');
                }
                var myself = this;
                var cws = this.getWorkspace();
                workspaceApi.exec(cws.id, execution, { async: async }, function(err, result) {
                    myself._invokeCallback('exec', callback, err, result);
                });
            } catch(e) {
                this._invokeCallback('exec', callback, e);
            }
        },

        _invokeCallback: function _invokeCallback(apiName, callback, err, result) {
            try {
                callback(err, result);
            } catch(e) {
                logger.warn('Callback of WorkspaceService#' + apiName + '() threw error', e);
            }
        }
    });

    var workspaceService = new WorkspaceService();

    // we can start working when session is connected 
    session.on('connect', function() {
       workspaceApi.findWorkspaces(common.bootArgs.workspaceId, { },
           function handleFoundWorkspace(err, result) {
               if (err) {
                   logger.error('cannot find workspace from server', err);
                   workspaceService.emit('error');
                   return;
               }
               logger.debug('workspace service found current workspace', result[0]);
               workspaceService._update(result[0]);
               workspaceService.emit('available');
               logger.debug('workspace service started', workspaceService);
           }
       );
   });

    session.on('disconnect', function() {
        logger.debug('workspace service stops');
        workspaceService.emit('unavailable');
    });

    return workspaceService; 
});
