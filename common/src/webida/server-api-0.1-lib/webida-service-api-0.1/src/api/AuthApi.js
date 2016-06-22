(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['../ApiClient', '../model/User', '../model/RestError', '../model/Token', '../model/Credential'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/User'), require('../model/RestError'), require('../model/Token'), require('../model/Credential'));
  } else {
    // Browser globals (root is window)
    if (!root.WebidaServiceApi) {
      root.WebidaServiceApi = {};
    }
    root.WebidaServiceApi.AuthApi = factory(root.WebidaServiceApi.ApiClient, root.WebidaServiceApi.User, root.WebidaServiceApi.RestError, root.WebidaServiceApi.Token, root.WebidaServiceApi.Credential);
  }
}(this, function(ApiClient, User, RestError, Token, Credential) {
  'use strict';

  /**
   * Auth service.
   * @module api/AuthApi
   * @version 0.1
   */

  /**
   * Constructs a new AuthApi. 
   * @alias module:api/AuthApi
   * @class
   * @param {module:ApiClient} apiClient Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the getInfo operation.
     * @callback module:api/AuthApi~getInfoCallback
     * @param {String} error Error message, if any.
     * @param {module:model/User} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Gets user information of that can be identified with current access token. Implementations should provide a more restful api based on domain data model. Don&#39;t override this operation for multi-user system. 
     * @param {module:api/AuthApi~getInfoCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/User}
     */
    this.getInfo = function(callback) {
      var postBody = null;


      var pathParams = {
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
      var returnType = User;

      return this.apiClient.callApi(
        '/auth/info', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the issueToken operation.
     * @callback module:api/AuthApi~issueTokenCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Token} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Creates new token from current access token, inheriting workspace id &amp; session id Duration of generated token is not (and should be) parameterizable. 
     * @param {module:model/String} type 
     * @param {Object} opts Optional parameters
     * @param {String} opts.workspaceId mandatory to issue a MASTER type token
     * @param {module:api/AuthApi~issueTokenCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/Token}
     */
    this.issueToken = function(type, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'type' is set
      if (type == undefined || type == null) {
        throw "Missing the required parameter 'type' when calling issueToken";
      }


      var pathParams = {
      };
      var queryParams = {
        'type': type,
        'workspaceId': opts['workspaceId']
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['webida-simple-auth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json', 'application/octet-stream'];
      var returnType = Token;

      return this.apiClient.callApi(
        '/auth/token', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the login operation.
     * @callback module:api/AuthApi~loginCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Token} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * A &#39;VERY&#39; basic authentication, required to use webida-simple-auth security scheme.  Service / Product implementations who need better security, should override this operation or add their own login api or some other specs like OAuth2. Simple auth is not suitable for large-sacle, multi-tennant service.  Generated accss token inherits all restriction from master token. In normal login, unrestricted access token will be granted with reasonably short expiration time. Every client should respawn another access token with issueToken API before current access token expires. 
     * @param {module:model/Credential} body 
     * @param {module:api/AuthApi~loginCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/Token}
     */
    this.login = function(body, callback) {
      var postBody = body;

      // verify the required parameter 'body' is set
      if (body == undefined || body == null) {
        throw "Missing the required parameter 'body' when calling login";
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json'];
      var accepts = ['application/json', 'application/octet-stream'];
      var returnType = Token;

      return this.apiClient.callApi(
        '/auth/login', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));
