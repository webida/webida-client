(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['../ApiClient', '../model/RestError', '../model/Token', '../model/User', '../model/LoginResponse', '../model/LoginRequest'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/RestError'), require('../model/Token'), require('../model/User'), require('../model/LoginResponse'), require('../model/LoginRequest'));
  } else {
    // Browser globals (root is window)
    if (!root.WebidaServiceApi) {
      root.WebidaServiceApi = {};
    }
    root.WebidaServiceApi.AuthApi = factory(root.WebidaServiceApi.ApiClient, root.WebidaServiceApi.RestError, root.WebidaServiceApi.Token, root.WebidaServiceApi.User, root.WebidaServiceApi.LoginResponse, root.WebidaServiceApi.LoginRequest);
  }
}(this, function(ApiClient, RestError, Token, User, LoginResponse, LoginRequest) {
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
     * Callback function to receive the result of the decodeToken operation.
     * @callback module:api/AuthApi~decodeTokenCallback
     * @param {String} error Error message, if any.
     * @param {module:model/Token} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * decode token to get data.
     * @param {Object} opts Optional parameters
     * @param {String} opts.tokenText token text to decode. if not given, access token in request will be used
     * @param {module:api/AuthApi~decodeTokenCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/Token}
     */
    this.decodeToken = function(opts, callback) {
      opts = opts || {};
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
        'tokenText': opts['tokenText']
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
        '/auth/token', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

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
     * Creates new token - Any restrictions are inherited Clients cannot create new access token from exiting one via this operation.  Call login with master token.  When user logs in without master token, login api response alwyas contains master token 
     * @param {module:model/String} tokenType &#39;MASTER&#39; type requires workspaceId parameter  &#39;ACCESS&#39; type will return inherited access token with all same property except  issuedAt &amp; expiredAt.  
     * @param {Object} opts Optional parameters
     * @param {String} opts.workspaceId mandatory to issue a &#39;MASTER&#39; type token, restricted to some workspace
     * @param {module:api/AuthApi~issueTokenCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/Token}
     */
    this.issueToken = function(tokenType, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'tokenType' is set
      if (tokenType == undefined || tokenType == null) {
        throw "Missing the required parameter 'tokenType' when calling issueToken";
      }


      var pathParams = {
      };
      var queryParams = {
        'tokenType': tokenType,
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
     * @param {module:model/LoginResponse} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Basic authentication to support webida-simple-auth security scheme defined in this spec. Service / Product implementations who need better security, should override this operation or add their own login api and security definitions. see webida devloper guide to read details about webida-simpe-auth security sceheme. 
     * @param {module:model/LoginRequest} body 
     * @param {module:api/AuthApi~loginCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/LoginResponse}
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
      var returnType = LoginResponse;

      return this.apiClient.callApi(
        '/auth/login', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));
