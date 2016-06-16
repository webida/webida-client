(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['../ApiClient', '../model/RestOK', '../model/RestError'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/RestOK'), require('../model/RestError'));
  } else {
    // Browser globals (root is window)
    if (!root.WebidaServiceApi) {
      root.WebidaServiceApi = {};
    }
    root.WebidaServiceApi.DefaultApi = factory(root.WebidaServiceApi.ApiClient, root.WebidaServiceApi.RestOK, root.WebidaServiceApi.RestError);
  }
}(this, function(ApiClient, RestOK, RestError) {
  'use strict';

  /**
   * Default service.
   * @module api/DefaultApi
   * @version 0.1
   */

  /**
   * Constructs a new DefaultApi. 
   * @alias module:api/DefaultApi
   * @class
   * @param {module:ApiClient} apiClient Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the replace operation.
     * @callback module:api/DefaultApi~replaceCallback
     * @param {String} error Error message, if any.
     * @param {module:model/RestOK} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * replace file contents with regex matching
     * @param {String} wfsId webida file system id (same to workspace id) to access.
     * @param {Array.<String>} wfsPathList array of wfsPath, with heading /  (collection format may be changed by implementation)
     * @param {String} pattern regex pattern to match
     * @param {String} replaceTo string to replace with
     * @param {Object} opts Optional parameters
     * @param {Boolean} opts.ignoreCase regex matching option to ignore case (default to false)
     * @param {Boolean} opts.wholeWord regex matching option to match whole word (default to false)
     * @param {module:api/DefaultApi~replaceCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {module:model/RestOK}
     */
    this.replace = function(wfsId, wfsPathList, pattern, replaceTo, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'wfsId' is set
      if (wfsId == undefined || wfsId == null) {
        throw "Missing the required parameter 'wfsId' when calling replace";
      }

      // verify the required parameter 'wfsPathList' is set
      if (wfsPathList == undefined || wfsPathList == null) {
        throw "Missing the required parameter 'wfsPathList' when calling replace";
      }

      // verify the required parameter 'pattern' is set
      if (pattern == undefined || pattern == null) {
        throw "Missing the required parameter 'pattern' when calling replace";
      }

      // verify the required parameter 'replaceTo' is set
      if (replaceTo == undefined || replaceTo == null) {
        throw "Missing the required parameter 'replaceTo' when calling replace";
      }


      var pathParams = {
        'wfsId': wfsId
      };
      var queryParams = {
        'wfsPathList': this.apiClient.buildCollectionParam(wfsPathList, 'multi'),
        'pattern': pattern,
        'replaceTo': replaceTo,
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
      var returnType = RestOK;

      return this.apiClient.callApi(
        '/wfs/{wfsId}/ops/replace', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));
