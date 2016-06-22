(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['../ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.WebidaServiceApi) {
      root.WebidaServiceApi = {};
    }
    root.WebidaServiceApi.Credential = factory(root.WebidaServiceApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The Credential model module.
   * @module model/Credential
   * @version 0.1
   */

  /**
   * Constructs a new <code>Credential</code>.
   * user credential to login. Use https to protect credential.
   * @alias module:model/Credential
   * @class
   * @param loginId
   * @param loginPassword
   */
  var exports = function(loginId, loginPassword) {
    var _this = this;

    _this['loginId'] = loginId;
    _this['loginPassword'] = loginPassword;

  };

  /**
   * Constructs a <code>Credential</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/Credential} obj Optional instance to populate.
   * @return {module:model/Credential} The populated <code>Credential</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('loginId')) {
        obj['loginId'] = ApiClient.convertToType(data['loginId'], 'String');
      }
      if (data.hasOwnProperty('loginPassword')) {
        obj['loginPassword'] = ApiClient.convertToType(data['loginPassword'], 'String');
      }
      if (data.hasOwnProperty('masterToken')) {
        obj['masterToken'] = ApiClient.convertToType(data['masterToken'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} loginId
   */
  exports.prototype['loginId'] = undefined;
  /**
   * @member {String} loginPassword
   */
  exports.prototype['loginPassword'] = undefined;
  /**
   * a master token is issued when user wants to access webida api without id/password from remote or local desktop app. When masterToken is set, client should put some bogus id/password, non-empty. (The values can be used to identify client type) 
   * @member {String} masterToken
   */
  exports.prototype['masterToken'] = undefined;




  return exports;
}));


