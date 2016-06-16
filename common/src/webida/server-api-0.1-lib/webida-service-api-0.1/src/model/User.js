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
    root.WebidaServiceApi.User = factory(root.WebidaServiceApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The User model module.
   * @module model/User
   * @version 0.1
   */

  /**
   * Constructs a new <code>User</code>.
   * Any services/products should define some admin apis to manage users in the system and expose what should be exposed to client app. So, no properties are mandatory.  Current properties are defined for compatiblity with legacy clients. Access token data can be decoded with another operations.          
   * @alias module:model/User
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>User</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/User} obj Optional instance to populate.
   * @return {module:model/User} The populated <code>User</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'String');
      }
      if (data.hasOwnProperty('email')) {
        obj['email'] = ApiClient.convertToType(data['email'], 'String');
      }
      if (data.hasOwnProperty('name')) {
        obj['name'] = ApiClient.convertToType(data['name'], 'String');
      }
    }
    return obj;
  }

  /**
   * unique id per user (email is also unique)
   * @member {String} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} email
   */
  exports.prototype['email'] = undefined;
  /**
   * @member {String} name
   */
  exports.prototype['name'] = undefined;




  return exports;
}));


