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
 * @file WfsEntry.js
 * @since 1.7.0
 * @author jh1977.kim@samsung.com
 */

define([
    '../common',
    '../session',
    './WfsStats',
    './WfsEntry',
    './WfsEventGate',
    './wfs-utils'
], function (
    common,
    session,
    WfsStats,
    WfsEntry,
    WfsEventGate,
    wfsUtils
) {
    'use strict';

    // provides subset of legacy FileSystem object
    // some methods are not supported, completely
    // we should create better interface in next api 0.2 with cleaner spec and Promise
    
    var logger = common.logger;
    var wfsApi = new common.api.WfsApi();

    function abstractify(name) {
        return function abstractMethod() {
            var methodName = name || 'method';
            var callback = arguments[arguments.length-1];
            var err = new Error(methodName + ' is abstract');
            if (typeof(callback) === 'function') {
                return callback(err);
            } else {
                throw err;
            }
        };
    }
    
    function WfsMount(fsid) {
        this.wfsId = fsid;
        this.eventGate = new WfsEventGate(session, fsid);
        var myself = this; 

        // if watcher has already started by other client
        // wfsWatcher#start event will never be delivered to session socket
        session.on('wfsWatcher', function(wfsId, event) {
            if (myself.eventGate && myself.wfsId === wfsId && event === 'stop') {
                myself.eventGate.stopListening();
                myself.eventGate = null;
            }
        });
     }

    WfsMount.prototype = {
        _fromLegacyPath: function _fromLegacyPath(legacyPath, allowUrl) {
            try {
                return wfsUtils.fromLegacyPath(legacyPath, allowUrl ? this.wfsId : undefined);
            } catch (e) {
                console.error('legacy path seems to be invalid : ' + legacyPath);
            }
        },

        // result handler is (result, xhr) => desired (processed) result
        // usually, some json object will be transformed into a class instance
        _createApiCallback: function (apiName, resultHandler, callback, maskingPath) {
            var myself = this; 
            function echo(x) { return x; }
            function invokeCallback(callback, err, result) {
                try {
                    callback(err, result);
                } catch(e) {
                    logger.warn('app layer callback for ' + apiName + '() threw error', e);
                }
            }
            return function generatedCallback(err, result, response) {
                if (err) {
                    logger.debug('wfsapi.' + apiName + '() error', err);
                    if (maskingPath && myself.eventGate) {
                        myself.eventGate.unmaskEvents(maskingPath, false);
                    }
                    invokeCallback(callback, err);
                } else {
                    if (maskingPath && myself.eventGate) {
                        myself.eventGate.unmaskEvents(maskingPath, true, false);
                    }
                    var handler = resultHandler || echo; // echo is default result hander
                    try {
                        var handled = handler(result, response.xhr);
                        invokeCallback(callback, null, handled);
                    } catch (err) {
                        logger.warn('result handler for ' + apiName + '() error', err);
                        invokeCallback(callback, err);
                    }
                }
            };
        },

        _callRestApi : function (apiName, path /*, .... , result handler, callback */ ) {
            var callable = wfsApi[apiName];

            var wfsPath = this._fromLegacyPath(path);
            var args = [ this.wfsId, wfsPath ];
            for (var i = 2; i < arguments.length; i++) {
                args.push(arguments[i]);
            }

            var callback = args.pop();
            var resultHandler = args.pop();
            var apiCallback = null; 
            if (callback.useEventMasking && this.eventGate) {
                this.eventGate.maskEvents(wfsPath, apiName);
                apiCallback = this._createApiCallback(apiName, resultHandler, callback, wfsPath);
                delete callback.useEventMasking; 
            } else {
                apiCallback = this._createApiCallback(apiName, resultHandler, callback);
            }
            args.push(apiCallback);
            return callable.apply(wfsApi, args);
        },

        // do we need to set mask on path? 
        // this simple operation may not cause any harmful effect, probably 
        createDirectory: function wfsCreateDir(path, recursive, callback) {
            callback.useEventMasking = true; 
            this._callRestApi('createDir', path, {ensure:recursive}, null, callback);
        },

        exists: function wfsExists(path, callback) {
            this._callRestApi('stat', path, {ignoreError: true},
                function(result) {
                    return (result.type !== 'DUMMY');
                },
                callback
            );
        },

        // legacy stat is renamed to mstat
        // TODO : change operation id of stats to stat, in swagger spec
        stat: function wfsStat(path, callback) {
            this._callRestApi('stat', path, { /* no option */ },
                function (result) {
                    return new WfsStats(result);
                },
                callback
            );
        },

        // prefer dirTree
        list : function wfsList(path, recursive, callback) {
            if (!callback) {
                callback = recursive;
                recursive = false;
            }
            this.dirTree(path, (recursive ? -1 : 1) , function (err, tree) {
                callback(err, tree.children);
            }); 
        },

        dirTree: function wfsDirTree(path, maxDepth, callback) {
            // TODO: 'full recursive' seems to be dangerous
            //   server might suffer from stack overflow or starvation with disk i/o
            //   so, server may response with incomplete tree
            //   1) add a 'response header' for incomplete message
            //   2) add timeout parameter in spec
            //   3) in server, find a way to limit concurrency

            this._callRestApi('dirTree', path, maxDepth,
                function (result) {
                    // re-constructing a very large tree in a single tick looks dangerous
                    // we need a fromServerResultAsync, who injects some reasonable delays 
                    // while building tree from json 
                    var ret = WfsEntry.fromJson(result);
                    ret.path = path;
                    // logger.debug('wfsDirTree got dir tree on path ', result, ret);
                    return ret;
                },
                callback
            );
        }, 


        remove : function wfsRemove(path, recursive, callback ) {
            callback.useEventMasking = true;
            this._callRestApi('remove', path, {recursive : recursive}, null, callback);
        } ,

        readFile :  function wfsReadFile(path, responseType, callback) {

            // TODO : we need 'as' parameter replacing response type in next client release 
            //  as : enum of ['text', 'blob', 'json'] 

            responseType = responseType || 'text';
            if (!callback) {
                callback = responseType;
                responseType = 'text';
            }

            this._callRestApi('readFile', path,
                function (noUseResult, xhr) {
                    if (responseType === '' || responseType === 'text') {
                        return xhr.responseText;
                    } else {
                        return xhr.response;
                    }
                },
                callback
            );
        },

        writeFile : function wfsWriteFile(path, data, callback) {
            var dataType = typeof(data);

            // TODO : support plain object serialization, using AsyncApi class from swagger
            switch( dataType ) {
                case 'string':
                    data = new Blob([data], {type:'text/plain'});
                    break;
                case 'object':
                    if (!(data instanceof Blob)) {
                        throw new Error('invalid data - should be string or Blob');
                    }
                    break;
                default:
                    throw new Error('invalid data type - should be string or Blob');
            }
            // TODO: change 'ensure' default value to false, adding ensure parameter
            callback.useEventMasking = true;
            this._callRestApi('writeFile', path, data, { ensure: true }, null, callback);
        },

        // deprecated. use stat, instead
        isDirectory: function wfsIsDirectory(path, callback) {
            this._callRestApi('stat', path, {/* no option */},
                function (result) {
                    return result.type === 'DIRECTORY';
                },
                callback
            );
        },

        // deprecated. use stat, instead
        isFile: function wfsIsFile(path, callback) {
            this._callRestApi('stat', path, {/* no option */},
                function (result) {
                    return result.type !== 'DIRECTORY';
                },
                callback
            );
        },

        // deprecated. use dirTree or never call this method
        isEmpty: function wfsIsEmpty(path, callback) {
            this._callRestApi('dirTree', path, {recursive: true},
                function (result) {
                    return result.children && result.children.length > 0;
                },
                callback
            );
        },

        // deprecated. use 'remove' 
        'delete' : function wfsDelete(path, recursive, callback ) {
            return this.remove(path, recursive, callback);
        } ,
        
        // not implemented yet
        copy: abstractify('copy'),
        move : abstractify('move'),
        exec : abstractify('exec'),
        searchFiles: abstractify('searchFiles'),
        replaceFiles: abstractify('replaceFiles'),
        addAlias : abstractify('addAlias'),
        mstat : abstractify('mstat') // we should GET :wfsid/op/mstats, not :wfsid/any/:wfsPath
    };

    return WfsMount;
});