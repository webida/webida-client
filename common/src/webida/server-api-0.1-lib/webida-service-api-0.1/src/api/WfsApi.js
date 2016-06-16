(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['../ApiClient', '../model/RestOK', '../model/RestError', '../model/DirEntry', '../model/Stats'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/RestOK'), require('../model/RestError'), require('../model/DirEntry'), require('../model/Stats'));
  } else {
    // Browser globals (root is window)
    if (!root.WebidaServiceApi) {
      root.WebidaServiceApi = {};
    }
    root.WebidaServiceApi.WfsApi = factory(root.WebidaServiceApi.ApiClient, root.WebidaServiceApi.RestOK, root.WebidaServiceApi.RestError, root.WebidaServiceApi.DirEntry, root.WebidaServiceApi.Stats);
  }
}(this, function(ApiClient, RestOK, RestError, DirEntry, Stats) {
  'use strict';

  /**
   * Wfs service.
   * @module api/WfsApi
   * @version 0.1
   */

  /**
   * Constructs a new WfsApi. 
   * @alias module:api/WfsApi
   * @class
   * @param {module:ApiClient} apiClient Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the copy operation.
     * @callback module:api/WfsApi~copyCallback
     * @param {String} error Error message, if any.
     * @param {module:model/RestOK} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Copy to given path. works like cp -r command, with some funny options Copying a dir on to existing file will return error Copying from sockets, fifo, .. and any other type of file system object is not supported. 
     * @param {String} wfsId webida file system id (same to workspace id) to access.
     * @param {String} wfsPath webida file system path to access. without heading /. should be placed at the end of path arguments 
     * @param {String} srcPath source data path of some operations, with have heading /
     * @param {Object} opts Optional parameters
     * @param {Boolean} opts.removeExisting remove any existing file/dir before writing. (default to false)
     * @param {Boolean} opts.followSymbolicLinks dereference symlinks or not (default to false)
     * @param {Boolean} opts.noPreserveTimestamps to change default behavior, keep mtime/atime of source files in destination (default to false)
     * @param {String} opts.filterPattern execute copy if source matches to this regex pattern.
     * @param {module:api/WfsApi~copyCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/RestOK}
     */
    this.copy = function(wfsId, wfsPath, srcPath, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'wfsId' is set
      if (wfsId == undefined || wfsId == null) {
        throw "Missing the required parameter 'wfsId' when calling copy";
      }

      // verify the required parameter 'wfsPath' is set
      if (wfsPath == undefined || wfsPath == null) {
        throw "Missing the required parameter 'wfsPath' when calling copy";
      }

      // verify the required parameter 'srcPath' is set
      if (srcPath == undefined || srcPath == null) {
        throw "Missing the required parameter 'srcPath' when calling copy";
      }


      var pathParams = {
        'wfsId': wfsId,
        'wfsPath': wfsPath
      };
      var queryParams = {
        'srcPath': srcPath,
        'removeExisting': opts['removeExisting'],
        'followSymbolicLinks': opts['followSymbolicLinks'],
        'noPreserveTimestamps': opts['noPreserveTimestamps'],
        'filterPattern': opts['filterPattern']
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['webida-simple-auth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json', 'application/octet-stream'];
      var returnType = RestOK;

      return this.apiClient.callApi(
        '/wfs/{wfsId}/any/{wfsPath}', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the createDir operation.
     * @callback module:api/WfsApi~createDirCallback
     * @param {String} error Error message, if any.
     * @param {module:model/RestOK} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * create a directory at the path. will return error when wfsPath exists and not empty
     * @param {String} wfsId webida file system id (same to workspace id) to access.
     * @param {String} wfsPath webida file system path to access. without heading /. should be placed at the end of path arguments 
     * @param {Object} opts Optional parameters
     * @param {Boolean} opts.ensure flag to create all parent directories to create file or dir, like mkdir -p (default to false)
     * @param {module:api/WfsApi~createDirCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/RestOK}
     */
    this.createDir = function(wfsId, wfsPath, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'wfsId' is set
      if (wfsId == undefined || wfsId == null) {
        throw "Missing the required parameter 'wfsId' when calling createDir";
      }

      // verify the required parameter 'wfsPath' is set
      if (wfsPath == undefined || wfsPath == null) {
        throw "Missing the required parameter 'wfsPath' when calling createDir";
      }


      var pathParams = {
        'wfsId': wfsId,
        'wfsPath': wfsPath
      };
      var queryParams = {
        'ensure': opts['ensure']
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['webida-simple-auth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json', 'application/octet-stream'];
      var returnType = RestOK;

      return this.apiClient.callApi(
        '/wfs/{wfsId}/dir/{wfsPath}', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the dirTree operation.
     * @callback module:api/WfsApi~dirTreeCallback
     * @param {String} error Error message, if any.
     * @param {module:model/DirEntry} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * returns a directory tree of given path, for listing dir and managing file system 
     * @param {String} wfsId webida file system id (same to workspace id) to access.
     * @param {String} wfsPath webida file system path to access. without heading /. should be placed at the end of path arguments 
     * @param {Integer} maxDepth Maximum depth of tree. Set -1 to build a full tree, 0 to stat, 1 to plain list.
     * @param {module:api/WfsApi~dirTreeCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/DirEntry}
     */
    this.dirTree = function(wfsId, wfsPath, maxDepth, callback) {
      var postBody = null;

      // verify the required parameter 'wfsId' is set
      if (wfsId == undefined || wfsId == null) {
        throw "Missing the required parameter 'wfsId' when calling dirTree";
      }

      // verify the required parameter 'wfsPath' is set
      if (wfsPath == undefined || wfsPath == null) {
        throw "Missing the required parameter 'wfsPath' when calling dirTree";
      }

      // verify the required parameter 'maxDepth' is set
      if (maxDepth == undefined || maxDepth == null) {
        throw "Missing the required parameter 'maxDepth' when calling dirTree";
      }


      var pathParams = {
        'wfsId': wfsId,
        'wfsPath': wfsPath
      };
      var queryParams = {
        'maxDepth': maxDepth
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['webida-simple-auth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json', 'application/octet-stream'];
      var returnType = DirEntry;

      return this.apiClient.callApi(
        '/wfs/{wfsId}/dir/{wfsPath}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the move operation.
     * @callback module:api/WfsApi~moveCallback
     * @param {String} error Error message, if any.
     * @param {module:model/RestOK} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * move file or directory to given path. works like mv command
     * @param {String} wfsId webida file system id (same to workspace id) to access.
     * @param {String} wfsPath webida file system path to access. without heading /. should be placed at the end of path arguments 
     * @param {String} srcPath source data path of some operations, with have heading /
     * @param {Object} opts Optional parameters
     * @param {Boolean} opts.removeExisting remove any existing file/dir before writing. (default to false)
     * @param {module:api/WfsApi~moveCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/RestOK}
     */
    this.move = function(wfsId, wfsPath, srcPath, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'wfsId' is set
      if (wfsId == undefined || wfsId == null) {
        throw "Missing the required parameter 'wfsId' when calling move";
      }

      // verify the required parameter 'wfsPath' is set
      if (wfsPath == undefined || wfsPath == null) {
        throw "Missing the required parameter 'wfsPath' when calling move";
      }

      // verify the required parameter 'srcPath' is set
      if (srcPath == undefined || srcPath == null) {
        throw "Missing the required parameter 'srcPath' when calling move";
      }


      var pathParams = {
        'wfsId': wfsId,
        'wfsPath': wfsPath
      };
      var queryParams = {
        'srcPath': srcPath,
        'removeExisting': opts['removeExisting']
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['webida-simple-auth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json', 'application/octet-stream'];
      var returnType = RestOK;

      return this.apiClient.callApi(
        '/wfs/{wfsId}/dir/{wfsPath}', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the readFile operation.
     * @callback module:api/WfsApi~readFileCallback
     * @param {String} error Error message, if any.
     * @param {File} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * read file data on path
     * @param {String} wfsId webida file system id (same to workspace id) to access.
     * @param {String} wfsPath webida file system path to access. without heading /. should be placed at the end of path arguments 
     * @param {module:api/WfsApi~readFileCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {File}
     */
    this.readFile = function(wfsId, wfsPath, callback) {
      var postBody = null;

      // verify the required parameter 'wfsId' is set
      if (wfsId == undefined || wfsId == null) {
        throw "Missing the required parameter 'wfsId' when calling readFile";
      }

      // verify the required parameter 'wfsPath' is set
      if (wfsPath == undefined || wfsPath == null) {
        throw "Missing the required parameter 'wfsPath' when calling readFile";
      }


      var pathParams = {
        'wfsId': wfsId,
        'wfsPath': wfsPath
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['webida-simple-auth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json', 'application/octet-stream'];
      var returnType = File;

      return this.apiClient.callApi(
        '/wfs/{wfsId}/file/{wfsPath}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the remove operation.
     * @callback module:api/WfsApi~removeCallback
     * @param {String} error Error message, if any.
     * @param {module:model/RestOK} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * delete file or directory
     * @param {String} wfsId webida file system id (same to workspace id) to access.
     * @param {String} wfsPath webida file system path to access. without heading /. should be placed at the end of path arguments 
     * @param {Object} opts Optional parameters
     * @param {Boolean} opts.recursive flag to set copy with (default to false)
     * @param {module:api/WfsApi~removeCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/RestOK}
     */
    this.remove = function(wfsId, wfsPath, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'wfsId' is set
      if (wfsId == undefined || wfsId == null) {
        throw "Missing the required parameter 'wfsId' when calling remove";
      }

      // verify the required parameter 'wfsPath' is set
      if (wfsPath == undefined || wfsPath == null) {
        throw "Missing the required parameter 'wfsPath' when calling remove";
      }


      var pathParams = {
        'wfsId': wfsId,
        'wfsPath': wfsPath
      };
      var queryParams = {
        'recursive': opts['recursive']
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['webida-simple-auth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json', 'application/octet-stream'];
      var returnType = RestOK;

      return this.apiClient.callApi(
        '/wfs/{wfsId}/any/{wfsPath}', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the rename operation.
     * @callback module:api/WfsApi~renameCallback
     * @param {String} error Error message, if any.
     * @param {File} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Rename a file or directory to. This api does not remove an existing one.
     * @param {String} wfsId webida file system id (same to workspace id) to access.
     * @param {String} wfsPath webida file system path to access. without heading /. should be placed at the end of path arguments 
     * @param {String} srcPath source data path of some operations, with have heading /
     * @param {Object} opts Optional parameters
     * @param {Boolean} opts.ensure flag to create all parent directories to create file or dir, like mkdir -p (default to false)
     * @param {module:api/WfsApi~renameCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {File}
     */
    this.rename = function(wfsId, wfsPath, srcPath, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'wfsId' is set
      if (wfsId == undefined || wfsId == null) {
        throw "Missing the required parameter 'wfsId' when calling rename";
      }

      // verify the required parameter 'wfsPath' is set
      if (wfsPath == undefined || wfsPath == null) {
        throw "Missing the required parameter 'wfsPath' when calling rename";
      }

      // verify the required parameter 'srcPath' is set
      if (srcPath == undefined || srcPath == null) {
        throw "Missing the required parameter 'srcPath' when calling rename";
      }


      var pathParams = {
        'wfsId': wfsId,
        'wfsPath': wfsPath
      };
      var queryParams = {
        'srcPath': srcPath,
        'ensure': opts['ensure']
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['webida-simple-auth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json', 'application/octet-stream'];
      var returnType = File;

      return this.apiClient.callApi(
        '/wfs/{wfsId}/file/{wfsPath}', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the stat operation.
     * @callback module:api/WfsApi~statCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Stats} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * get stats of given path. (stat returns &#39;stats&#39; object in node and POSIX)
     * @param {String} wfsId webida file system id (same to workspace id) to access.
     * @param {String} wfsPath webida file system path to access. without heading /. should be placed at the end of path arguments 
     * @param {Object} opts Optional parameters
     * @param {Boolean} opts.ignoreError flag to ignore stat errors to check existence only (default to false)
     * @param {module:api/WfsApi~statCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/Stats}
     */
    this.stat = function(wfsId, wfsPath, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'wfsId' is set
      if (wfsId == undefined || wfsId == null) {
        throw "Missing the required parameter 'wfsId' when calling stat";
      }

      // verify the required parameter 'wfsPath' is set
      if (wfsPath == undefined || wfsPath == null) {
        throw "Missing the required parameter 'wfsPath' when calling stat";
      }


      var pathParams = {
        'wfsId': wfsId,
        'wfsPath': wfsPath
      };
      var queryParams = {
        'ignoreError': opts['ignoreError']
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['webida-simple-auth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json', 'application/octet-stream'];
      var returnType = Stats;

      return this.apiClient.callApi(
        '/wfs/{wfsId}/any/{wfsPath}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the writeFile operation.
     * @callback module:api/WfsApi~writeFileCallback
     * @param {String} error Error message, if any.
     * @param {File} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * create / update file with body data
     * @param {String} wfsId webida file system id (same to workspace id) to access.
     * @param {String} wfsPath webida file system path to access. without heading /. should be placed at the end of path arguments 
     * @param {File} data file contents to write.
     * @param {Object} opts Optional parameters
     * @param {Boolean} opts.ensure flag to create all parent directories to create file or dir, like mkdir -p (default to false)
     * @param {module:api/WfsApi~writeFileCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {File}
     */
    this.writeFile = function(wfsId, wfsPath, data, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'wfsId' is set
      if (wfsId == undefined || wfsId == null) {
        throw "Missing the required parameter 'wfsId' when calling writeFile";
      }

      // verify the required parameter 'wfsPath' is set
      if (wfsPath == undefined || wfsPath == null) {
        throw "Missing the required parameter 'wfsPath' when calling writeFile";
      }

      // verify the required parameter 'data' is set
      if (data == undefined || data == null) {
        throw "Missing the required parameter 'data' when calling writeFile";
      }


      var pathParams = {
        'wfsId': wfsId,
        'wfsPath': wfsPath
      };
      var queryParams = {
        'ensure': opts['ensure']
      };
      var headerParams = {
      };
      var formParams = {
        'data': data
      };

      var authNames = ['webida-simple-auth'];
      var contentTypes = ['multipart/form-data'];
      var accepts = ['application/json', 'application/octet-stream'];
      var returnType = File;

      return this.apiClient.callApi(
        '/wfs/{wfsId}/file/{wfsPath}', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));
