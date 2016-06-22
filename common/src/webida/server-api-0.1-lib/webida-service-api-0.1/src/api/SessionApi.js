(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['../ApiClient', '../model/RestOK', '../model/RestError', '../model/Session'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/RestOK'), require('../model/RestError'), require('../model/Session'));
  } else {
    // Browser globals (root is window)
    if (!root.WebidaServiceApi) {
      root.WebidaServiceApi = {};
    }
    root.WebidaServiceApi.SessionApi = factory(root.WebidaServiceApi.ApiClient, root.WebidaServiceApi.RestOK, root.WebidaServiceApi.RestError, root.WebidaServiceApi.Session);
  }
}(this, function(ApiClient, RestOK, RestError, Session) {
  'use strict';

  /**
   * Session service.
   * @module api/SessionApi
   * @version 0.1
   */

  /**
   * Constructs a new SessionApi. 
   * @alias module:api/SessionApi
   * @class
   * @param {module:ApiClient} apiClient Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the deleteSession operation.
     * @callback module:api/SessionApi~deleteSessionCallback
     * @param {String} error Error message, if any.
     * @param {module:model/RestOK} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * close session with timeout
     * @param {String} sessionId webida session id (usually different from socket id from sock.io)
     * @param {Integer} closeAfter waiting time before actual closing, to let client save files and prevent reconnect
     * @param {module:api/SessionApi~deleteSessionCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/RestOK}
     */
    this.deleteSession = function(sessionId, closeAfter, callback) {
      var postBody = null;

      // verify the required parameter 'sessionId' is set
      if (sessionId == undefined || sessionId == null) {
        throw "Missing the required parameter 'sessionId' when calling deleteSession";
      }

      // verify the required parameter 'closeAfter' is set
      if (closeAfter == undefined || closeAfter == null) {
        throw "Missing the required parameter 'closeAfter' when calling deleteSession";
      }


      var pathParams = {
        'sessionId': sessionId
      };
      var queryParams = {
        'closeAfter': closeAfter
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
        '/sessions/{sessionId}', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the getSession operation.
     * @callback module:api/SessionApi~getSessionCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Session} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * get a session object by id
     * @param {String} sessionId webida session id (usually different from socket id from sock.io)
     * @param {module:api/SessionApi~getSessionCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/Session}
     */
    this.getSession = function(sessionId, callback) {
      var postBody = null;

      // verify the required parameter 'sessionId' is set
      if (sessionId == undefined || sessionId == null) {
        throw "Missing the required parameter 'sessionId' when calling getSession";
      }


      var pathParams = {
        'sessionId': sessionId
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
      var returnType = Session;

      return this.apiClient.callApi(
        '/sessions/{sessionId}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the getSessions operation.
     * @callback module:api/SessionApi~getSessionsCallback
     * @param {String} error Error message, if any.
     * @param {Array.<module:model/Session>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * get all / some webida sessions established to server
     * @param {Object} opts Optional parameters
     * @param {String} opts.workspaceId only include sessions working on some given workspace
     * @param {module:api/SessionApi~getSessionsCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {Array.<module:model/Session>}
     */
    this.getSessions = function(opts, callback) {
      opts = opts || {};
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
        'workspaceId': opts['workspaceId']
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['webida-simple-auth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json', 'application/octet-stream'];
      var returnType = [Session];

      return this.apiClient.callApi(
        '/sessions', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));
