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
    root.WebidaServiceApi.Match = factory(root.WebidaServiceApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The Match model module.
   * @module model/Match
   * @version 0.1
   */

  /**
   * Constructs a new <code>Match</code>.
   * search result for a file
   * @alias module:model/Match
   * @class
   * @param line
   * @param text
   */
  var exports = function(line, text) {
    var _this = this;

    _this['line'] = line;
    _this['text'] = text;
  };

  /**
   * Constructs a <code>Match</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/Match} obj Optional instance to populate.
   * @return {module:model/Match} The populated <code>Match</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('line')) {
        obj['line'] = ApiClient.convertToType(data['line'], 'Integer');
      }
      if (data.hasOwnProperty('text')) {
        obj['text'] = ApiClient.convertToType(data['text'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {Integer} line
   */
  exports.prototype['line'] = undefined;
  /**
   * @member {String} text
   */
  exports.prototype['text'] = undefined;




  return exports;
}));


