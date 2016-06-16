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
    root.WebidaServiceApi.RestError = factory(root.WebidaServiceApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The RestError model module.
   * @module model/RestError
   * @version 0.1
   */

  /**
   * Constructs a new <code>RestError</code>.
   * Contains status text, not status code.
   * @alias module:model/RestError
   * @class
   * @param message
   */
  var exports = function(message) {
    var _this = this;


    _this['message'] = message;
  };

  /**
   * Constructs a <code>RestError</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/RestError} obj Optional instance to populate.
   * @return {module:model/RestError} The populated <code>RestError</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('code')) {
        obj['code'] = ApiClient.convertToType(data['code'], 'String');
      }
      if (data.hasOwnProperty('message')) {
        obj['message'] = ApiClient.convertToType(data['message'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} code
   */
  exports.prototype['code'] = undefined;
  /**
   * @member {String} message
   */
  exports.prototype['message'] = undefined;




  return exports;
}));


