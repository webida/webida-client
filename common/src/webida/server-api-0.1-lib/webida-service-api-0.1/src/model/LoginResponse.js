(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['../ApiClient', '../model/AccessToken', '../model/MasterToken'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./AccessToken'), require('./MasterToken'));
  } else {
    // Browser globals (root is window)
    if (!root.WebidaServiceApi) {
      root.WebidaServiceApi = {};
    }
    root.WebidaServiceApi.LoginResponse = factory(root.WebidaServiceApi.ApiClient, root.WebidaServiceApi.AccessToken, root.WebidaServiceApi.MasterToken);
  }
}(this, function(ApiClient, AccessToken, MasterToken) {
  'use strict';




  /**
   * The LoginResponse model module.
   * @module model/LoginResponse
   * @version 0.1
   */

  /**
   * Constructs a new <code>LoginResponse</code>.
   * login response for clients to use in service access. use &#39;decode&#39; api to see detail
   * @alias module:model/LoginResponse
   * @class
   * @param accessToken
   * @param decodedAccessToken
   */
  var exports = function(accessToken, decodedAccessToken) {
    var _this = this;

    _this['accessToken'] = accessToken;
    _this['decodedAccessToken'] = decodedAccessToken;


  };

  /**
   * Constructs a <code>LoginResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/LoginResponse} obj Optional instance to populate.
   * @return {module:model/LoginResponse} The populated <code>LoginResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('accessToken')) {
        obj['accessToken'] = ApiClient.convertToType(data['accessToken'], 'String');
      }
      if (data.hasOwnProperty('decodedAccessToken')) {
        obj['decodedAccessToken'] = AccessToken.constructFromObject(data['decodedAccessToken']);
      }
      if (data.hasOwnProperty('masterToken')) {
        obj['masterToken'] = ApiClient.convertToType(data['masterToken'], 'String');
      }
      if (data.hasOwnProperty('decodedMasterToken')) {
        obj['decodedMasterToken'] = MasterToken.constructFromObject(data['decodedMasterToken']);
      }
    }
    return obj;
  }

  /**
   * actual token text which should be included in header or cookie
   * @member {String} accessToken
   */
  exports.prototype['accessToken'] = undefined;
  /**
   * @member {module:model/AccessToken} decodedAccessToken
   */
  exports.prototype['decodedAccessToken'] = undefined;
  /**
   * unrestricted master token when user has logged in with valid credential
   * @member {String} masterToken
   */
  exports.prototype['masterToken'] = undefined;
  /**
   * @member {module:model/MasterToken} decodedMasterToken
   */
  exports.prototype['decodedMasterToken'] = undefined;




  return exports;
}));


