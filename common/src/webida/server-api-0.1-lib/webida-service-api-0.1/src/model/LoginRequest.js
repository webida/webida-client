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
    root.WebidaServiceApi.LoginRequest = factory(root.WebidaServiceApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The LoginRequest model module.
   * @module model/LoginRequest
   * @version 0.1
   */

  /**
   * Constructs a new <code>LoginRequest</code>.
   * @alias module:model/LoginRequest
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
   * Constructs a <code>LoginRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/LoginRequest} obj Optional instance to populate.
   * @return {module:model/LoginRequest} The populated <code>LoginRequest</code> instance.
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
   * If master token is set and valid, login Id / Password will be ignored but still required.  Put some bogus values to pass argument validation. Bogus master token in request will not make server issue a new master token.  
   * @member {String} masterToken
   */
  exports.prototype['masterToken'] = undefined;




  return exports;
}));


