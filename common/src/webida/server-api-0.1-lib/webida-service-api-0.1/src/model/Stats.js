(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['../ApiClient', '../model/RestError'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./RestError'));
  } else {
    // Browser globals (root is window)
    if (!root.WebidaServiceApi) {
      root.WebidaServiceApi = {};
    }
    root.WebidaServiceApi.Stats = factory(root.WebidaServiceApi.ApiClient, root.WebidaServiceApi.RestError);
  }
}(this, function(ApiClient, RestError) {
  'use strict';




  /**
   * The Stats model module.
   * @module model/Stats
   * @version 0.1
   */

  /**
   * Constructs a new <code>Stats</code>.
   * simplified/augmented fs.Stats class - see node.js doc for all properties
   * @alias module:model/Stats
   * @class
   * @param type
   */
  var exports = function(type) {
    var _this = this;

    _this['type'] = type;






  };

  /**
   * Constructs a <code>Stats</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/Stats} obj Optional instance to populate.
   * @return {module:model/Stats} The populated <code>Stats</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('type')) {
        obj['type'] = ApiClient.convertToType(data['type'], 'String');
      }
      if (data.hasOwnProperty('birthtime')) {
        obj['birthtime'] = ApiClient.convertToType(data['birthtime'], 'Date');
      }
      if (data.hasOwnProperty('mtime')) {
        obj['mtime'] = ApiClient.convertToType(data['mtime'], 'Date');
      }
      if (data.hasOwnProperty('mode')) {
        obj['mode'] = ApiClient.convertToType(data['mode'], 'String');
      }
      if (data.hasOwnProperty('size')) {
        obj['size'] = ApiClient.convertToType(data['size'], 'Integer');
      }
      if (data.hasOwnProperty('nlink')) {
        obj['nlink'] = ApiClient.convertToType(data['nlink'], 'Integer');
      }
      if (data.hasOwnProperty('error')) {
        obj['error'] = RestError.constructFromObject(data['error']);
      }
    }
    return obj;
  }

  /**
   * @member {module:model/Stats.TypeEnum} type
   */
  exports.prototype['type'] = undefined;
  /**
   * @member {Date} birthtime
   */
  exports.prototype['birthtime'] = undefined;
  /**
   * @member {Date} mtime
   */
  exports.prototype['mtime'] = undefined;
  /**
   * @member {String} mode
   */
  exports.prototype['mode'] = undefined;
  /**
   * @member {Integer} size
   */
  exports.prototype['size'] = undefined;
  /**
   * @member {Integer} nlink
   */
  exports.prototype['nlink'] = undefined;
  /**
   * @member {module:model/RestError} error
   */
  exports.prototype['error'] = undefined;


  /**
   * Allowed values for the <code>type</code> property.
   * @enum {String}
   * @readonly
   */
  exports.TypeEnum = {
    /**
     * value: "DUMMY"
     * @const
     */
    "DUMMY": "DUMMY",
    /**
     * value: "FILE"
     * @const
     */
    "FILE": "FILE",
    /**
     * value: "DIRECTORY"
     * @const
     */
    "DIRECTORY": "DIRECTORY",
    /**
     * value: "BLOCK_DEVICE"
     * @const
     */
    "BLOCK_DEVICE": "BLOCK_DEVICE",
    /**
     * value: "CHARACTER_DEVICE"
     * @const
     */
    "CHARACTER_DEVICE": "CHARACTER_DEVICE",
    /**
     * value: "LINK"
     * @const
     */
    "LINK": "LINK",
    /**
     * value: "FIFO"
     * @const
     */
    "FIFO": "FIFO",
    /**
     * value: "SOCKET"
     * @const
     */
    "SOCKET": "SOCKET"  };


  return exports;
}));


