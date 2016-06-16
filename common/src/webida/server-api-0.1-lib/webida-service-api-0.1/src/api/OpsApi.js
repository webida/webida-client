(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['../ApiClient', '../model/RestError', '../model/Match'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/RestError'), require('../model/Match'));
  } else {
    // Browser globals (root is window)
    if (!root.WebidaServiceApi) {
      root.WebidaServiceApi = {};
    }
    root.WebidaServiceApi.OpsApi = factory(root.WebidaServiceApi.ApiClient, root.WebidaServiceApi.RestError, root.WebidaServiceApi.Match);
  }
}(this, function(ApiClient, RestError, Match) {
  'use strict';

  /**
   * Ops service.
   * @module api/OpsApi
   * @version 0.1
   */

  /**
   * Constructs a new OpsApi. 
   * @alias module:api/OpsApi
   * @class
   * @param {module:ApiClient} apiClient Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the search operation.
     * @callback module:api/OpsApi~searchCallback
     * @param {String} error Error message, if any.
     * @param {Object.<String, module:model/{'String': Match}>} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * search files in some path, with given pattern
     * @param {String} wfsId webida file system id (same to workspace id) to access.
     * @param {String} wfsPath webida file system path to access. without heading /. should be placed at the end of path arguments 
     * @param {String} pattern regex pattern to match
     * @param {Object} opts Optional parameters
     * @param {Boolean} opts.ignoreCase regex matching option to ignore case (default to false)
     * @param {Boolean} opts.wholeWord regex matching option to match whole word (default to false)
     * @param {module:api/OpsApi~searchCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {Object.<String, module:model/{'String': Match}>}
     */
    this.search = function(wfsId, wfsPath, pattern, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'wfsId' is set
      if (wfsId == undefined || wfsId == null) {
        throw "Missing the required parameter 'wfsId' when calling search";
      }

      // verify the required parameter 'wfsPath' is set
      if (wfsPath == undefined || wfsPath == null) {
        throw "Missing the required parameter 'wfsPath' when calling search";
      }

      // verify the required parameter 'pattern' is set
      if (pattern == undefined || pattern == null) {
        throw "Missing the required parameter 'pattern' when calling search";
      }


      var pathParams = {
        'wfsId': wfsId,
        'wfsPath': wfsPath
      };
      var queryParams = {
        'pattern': pattern,
        'ignoreCase': opts['ignoreCase'],
        'wholeWord': opts['wholeWord']
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['webida-simple-auth'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json', 'application/octet-stream'];
      var returnType = {'String': Match};

      return this.apiClient.callApi(
        '/wfs/{wfsId}/ops/search/{wfsPath}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));
