"use strict"


define([
    './common',
    './WfsEntry',
    './wfs-utils'
], function (
    common,
    WfsEntry,
    wfsUtils
) {

    //
    // provides subset of legacy FileSystem object
    // some methods are not supported, completely
    // we should create better interface in next api 0.2 with cleaner spec and Promise
    //
    var logger = common.logger;
    var wfsApi = new common.api.WfsApi();

    function abstractify(name) {
        return function abstractMethod() {
            var methodName = name || 'method'
            throw new Error(methodName + ' is abstract');
        }
    }
    
    function WfsMount(fsid) {
        this.wfsId = fsid;
    }

    WfsMount.prototype = {
        _fromLegacyPath: function _fromLegacyPath(legacyPath, allowUrl) {
            return wfsUtils.fromLegacyPath(legacyPath, allowUrl ? this.wfsId : undefined);
        },

        // result handler is (result, xhr) => desired (processed) result
        // usually, some json object will be transformed into a class instance

        _createApiCallback(apiName, resultHandler, callback) {
            function echo(x) {
                return x;
            }
            function invokeCallback(callback, err, result) {
                try {
                    callback(err, result);
                } catch(e) {
                    logger.debug('app layer callback for ' + apiName + '() had error', e);
                }
            }
            return function (err, result, response) {
                if (err) {
                    logger.debug('wfsapi.' + apiName + '() error', err);
                    callback(err);
                } else {
                    // if no handler is given, we use incoming result, unmodified
                    resultHandler = resultHandler || echo;
                    // some error handler will takes somewhat long gime
                    // we should accept promise as result of the handler
                    Promise.resolve( resultHandler(result, response.xhr) )
                        .then( function(finalResult) {
                            // if callback throws some unexpected error,
                            // following catch function will catch it and some bad logs will be left.
                            invokeCallback(callback, null, finalResult);
                        })
                        .catch( function (err) {
                            logger.debug('result handler for ' + apiName + '() had error', err);
                            invokeCallback(callback, err);
                        });
                }
            };
        },

        _callSimpleApi : function (apiName, path /*, .... , result handler, callback */ ) {
            var callable = wfsApi[apiName];
            var wfsPath = this._fromLegacyPath(path);
            var args = [ this.wfsId, wfsPath ];
            for (let i = 2; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            var callback = args.pop();
            var resultHandler = args.pop();
            var apiCallback = this._createApiCallback(apiName, resultHandler, callback);
            args.push(apiCallback);

            logger.log('call WfsApi.' + apiName + '()' , args);
            return callable.apply(wfsApi, args);
        },

        createDirectory: function wfsCreateDir(path, recursive, callback) {
            this._callSimpleApi('createDir', path, {ensure : recursive}, null, callback);
        },

        exists: function wfsExists(path, callback) {
            this._callSimpleApi('stat', path, {ignoreError: true},
                function(result) {
                    return (result.type !== 'DUMMY');
                },
                callback
            );
        },

        // legacy stat is renamed to mstat
        // TODO : change operation id of stats to stat, in swagger spec
        stat: function wfsStat(path, callback) {
            this._callSimpleApi('stat', path, { /* no option */ },
                function (result) {
                    return new Stats(result);
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
            var self = this;

            // TODO: 'full recursive' seems to be dangerous
            //   server might suffer from stack overflow or starvation with disk i/o
            //   so, server may response with incomplete tree
            //   1) add a 'response header' for incomplete message
            //   2) add timeout parameter in spec
            //   3) in server, find a way to limit concurrency

            this._callSimpleApi('dirTree', path, maxDepth,
                function (result) {
                    // re-constructing a very large tree in a single tick looks dangerous
                    // we need a fromServerResultAsync, which checks height of tree and take some
                    // reasonable delays while converting response DirEntry object to WfsEntry 
                    // or, introduce som 'builder' class to handle large tree
                    return WfsEntry.fromJson(result);
                },
                callback
            );
        }, 


        remove : function wfsRemove(path, recursive, callback ) {
            this._callSimpleApi('remove', path, {recursive : recursive}, null, callback);
        } ,

        readFile :  function wfsReadFile(path, responseType, callback) {

            // TODO : we need 'as' parameter replacing response type in next client release 
            //  as : enum of ['text', 'blob', 'json'] 

            responseType = responseType || 'text';
            if (!callback) {
                callback = responseType;
                responseType = 'text';
            }

            this._callSimpleApi('readFile', path,
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

        writeFile : function wfsWriteFile(path, data, ensure, callback) {
            if (!callback) {
                callback = ensure;
                ensure = true; // in next relase, default value for ensure will be changed to false
            }
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

            this._callSimpleApi('writeFile', path, data, { ensure: true }, null, callback);
        },

        // deprecated. use stat, instead
        isDirectory: function wfsIsDirectory(path, callback) {
            this._callSimpleApi('stat', path, {/* no option */},
                function (result) {
                    return result.type === 'DIRECTORY';
                },
                callback
            );
        },

        // deprecated. use stat, instead
        isFile: function wfsIsFile(path, callback) {
            this._callSimpleApi('stat', path, {/* no option */},
                function (result) {
                    return result.type !== 'DIRECTORY';
                },
                callback
            );
        },

        // deprecated. use dirTree or never call this method
        isEmpty: function wfsIsEmpty(path, callback) {
            this._callSimpleApi('listDir', path, {recursive: true},
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