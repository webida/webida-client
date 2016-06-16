(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['../ApiClient', '../model/RestOK', '../model/RestError', '../model/Workspace', '../model/ExecRequest', '../model/ExecResponse', '../model/ExecAsyncResponse'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/RestOK'), require('../model/RestError'), require('../model/Workspace'), require('../model/ExecRequest'), require('../model/ExecResponse'), require('../model/ExecAsyncResponse'));
  } else {
    // Browser globals (root is window)
    if (!root.WebidaServiceApi) {
      root.WebidaServiceApi = {};
    }
    root.WebidaServiceApi.WorkspaceApi = factory(root.WebidaServiceApi.ApiClient, root.WebidaServiceApi.RestOK, root.WebidaServiceApi.RestError, root.WebidaServiceApi.Workspace, root.WebidaServiceApi.ExecRequest, root.WebidaServiceApi.ExecResponse, root.WebidaServiceApi.ExecAsyncResponse);
  }
}(this, function(ApiClient, RestOK, RestError, Workspace, ExecRequest, ExecResponse, ExecAsyncResponse) {
  'use strict';

  /**
   * Workspace service.
   * @module api/WorkspaceApi
   * @version 0.1
   */

  /**
   * Constructs a new WorkspaceApi. 
   * @alias module:api/WorkspaceApi
   * @class
   * @param {module:ApiClient} apiClient Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the cancel operation.
     * @callback module:api/WorkspaceApi~cancelCallback
     * @param {String} error Error message, if any.
     * @param {module:model/RestOK} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * cancels a async execution
     * @param {String} workspaceId webida workspace id (usually same to file system id, wfsId)
     * @param {String} execId the execId property in ExecResponse  
     * @param {module:api/WorkspaceApi~cancelCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/RestOK}
     */
    this.cancel = function(workspaceId, execId, callback) {
      var postBody = null;

      // verify the required parameter 'workspaceId' is set
      if (workspaceId == undefined || workspaceId == null) {
        throw "Missing the required parameter 'workspaceId' when calling cancel";
      }

      // verify the required parameter 'execId' is set
      if (execId == undefined || execId == null) {
        throw "Missing the required parameter 'execId' when calling cancel";
      }


      var pathParams = {
        'workspaceId': workspaceId
      };
      var queryParams = {
        'execId': execId
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
        '/workspaces/{workspaceId}/exec', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the createWorkspace operation.
     * @callback module:api/WorkspaceApi~createWorkspaceCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Workspace} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * create a new workspace at given path
     * @param {String} workspacePath a real path of the system or relative path to workspace cellar
     * @param {module:api/WorkspaceApi~createWorkspaceCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/Workspace}
     */
    this.createWorkspace = function(workspacePath, callback) {
      var postBody = null;

      // verify the required parameter 'workspacePath' is set
      if (workspacePath == undefined || workspacePath == null) {
        throw "Missing the required parameter 'workspacePath' when calling createWorkspace";
      }


      var pathParams = {
      };
      var queryParams = {
        'workspacePath': workspacePath
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['webida-simple-auth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json', 'application/octet-stream'];
      var returnType = Workspace;

      return this.apiClient.callApi(
        '/workspaces', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the exec operation.
     * @callback module:api/WorkspaceApi~execCallback
     * @param {String} error Error message, if any.
     * @param {module:model/ExecResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * execute a shell command
     * @param {String} workspaceId webida workspace id (usually same to file system id, wfsId)
     * @param {module:model/ExecRequest} body 
     * @param {Object} opts Optional parameters
     * @param {Boolean} opts.async Execute a command and returns a dummy response immediatlely, and send actual output (stream of message) with web socket channel of current session. At the end of execution, ExecResponse object with empty stdout/stderr will be delivered at the channel.   (default to false)
     * @param {String} opts.execId mandatory for async execution. the result stream will be identified with this id
     * @param {module:api/WorkspaceApi~execCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/ExecResponse}
     */
    this.exec = function(workspaceId, body, opts, callback) {
      opts = opts || {};
      var postBody = body;

      // verify the required parameter 'workspaceId' is set
      if (workspaceId == undefined || workspaceId == null) {
        throw "Missing the required parameter 'workspaceId' when calling exec";
      }

      // verify the required parameter 'body' is set
      if (body == undefined || body == null) {
        throw "Missing the required parameter 'body' when calling exec";
      }


      var pathParams = {
        'workspaceId': workspaceId
      };
      var queryParams = {
        'async': opts['async'],
        'execId': opts['execId']
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['webida-simple-auth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json', 'application/octet-stream'];
      var returnType = ExecResponse;

      return this.apiClient.callApi(
        '/workspaces/{workspaceId}/exec', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the getAllWorkspaces operation.
     * @callback module:api/WorkspaceApi~getAllWorkspacesCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/Workspace>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * get all registerd (non-disposable) workspaces in the server. since webida is not designed to  host so many workspaces, there&#39;s no good &#39;find&#39; or &#39;query&#39; API. Service/product implementations may create a better opeation. 
     * @param {Object} opts Optional parameters
     * @param {Boolean} opts.disposable include disposable workspaces in response (default to false)
     * @param {module:api/WorkspaceApi~getAllWorkspacesCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {Array.<module:model/Workspace>}
     */
    this.getAllWorkspaces = function(opts, callback) {
      opts = opts || {};
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
        'disposable': opts['disposable']
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['webida-simple-auth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json', 'application/octet-stream'];
      var returnType = [Workspace];

      return this.apiClient.callApi(
        '/workspaces', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the getWorkspace operation.
     * @callback module:api/WorkspaceApi~getWorkspaceCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Workspace} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * get all workspaces registerd (non-disposable) in the server
     * @param {String} workspaceId webida workspace id (usually same to file system id, wfsId)
     * @param {module:api/WorkspaceApi~getWorkspaceCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/Workspace}
     */
    this.getWorkspace = function(workspaceId, callback) {
      var postBody = null;

      // verify the required parameter 'workspaceId' is set
      if (workspaceId == undefined || workspaceId == null) {
        throw "Missing the required parameter 'workspaceId' when calling getWorkspace";
      }


      var pathParams = {
        'workspaceId': workspaceId
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
      var returnType = Workspace;

      return this.apiClient.callApi(
        '/workspaces/{workspaceId}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the removeWorkspace operation.
     * @callback module:api/WorkspaceApi~removeWorkspaceCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Workspace} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * remove a workspace. all sessions on this workspace will be closed.
     * @param {String} workspaceId webida workspace id (usually same to file system id, wfsId)
     * @param {Object} opts Optional parameters
     * @param {Integer} opts.wait Time in seconds to wait for all sessions save &amp; close their data. zero or negative value will close the sessions immediatlely.  (default to 0)
     * @param {module:api/WorkspaceApi~removeWorkspaceCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/Workspace}
     */
    this.removeWorkspace = function(workspaceId, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'workspaceId' is set
      if (workspaceId == undefined || workspaceId == null) {
        throw "Missing the required parameter 'workspaceId' when calling removeWorkspace";
      }


      var pathParams = {
        'workspaceId': workspaceId
      };
      var queryParams = {
        'wait': opts['wait']
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['webida-simple-auth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json', 'application/octet-stream'];
      var returnType = Workspace;

      return this.apiClient.callApi(
        '/workspaces/{workspaceId}', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the updateWorkspace operation.
     * @callback module:api/WorkspaceApi~updateWorkspaceCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Workspace} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * update workspace information. some properties will not be updated by this api.
     * @param {String} workspaceId webida workspace id (usually same to file system id, wfsId)
     * @param {module:api/WorkspaceApi~updateWorkspaceCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/Workspace}
     */
    this.updateWorkspace = function(workspaceId, callback) {
      var postBody = null;

      // verify the required parameter 'workspaceId' is set
      if (workspaceId == undefined || workspaceId == null) {
        throw "Missing the required parameter 'workspaceId' when calling updateWorkspace";
      }


      var pathParams = {
        'workspaceId': workspaceId
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
      var returnType = Workspace;

      return this.apiClient.callApi(
        '/workspaces/{workspaceId}', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));
