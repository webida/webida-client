(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['../ApiClient', '../model/DirEntry', '../model/Stats'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./DirEntry'), require('./Stats'));
  } else {
    // Browser globals (root is window)
    if (!root.WebidaServiceApi) {
      root.WebidaServiceApi = {};
    }
    root.WebidaServiceApi.DirEntry = factory(root.WebidaServiceApi.ApiClient, root.WebidaServiceApi.DirEntry, root.WebidaServiceApi.Stats);
  }
}(this, function(ApiClient, DirEntry, Stats) {
  'use strict';




  /**
   * The DirEntry model module.
   * @module model/DirEntry
   * @version 0.1
   */

  /**
   * Constructs a new <code>DirEntry</code>.
   * a directory entry (file or directory) with children that represents a (sub) tree
   * @alias module:model/DirEntry
   * @class
   * @param name
   * @param stats
   * @param children
   */
  var exports = function(name, stats, children) {
    var _this = this;

    _this['name'] = name;
    _this['stats'] = stats;
    _this['children'] = children;
  };

  /**
   * Constructs a <code>DirEntry</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/DirEntry} obj Optional instance to populate.
   * @return {module:model/DirEntry} The populated <code>DirEntry</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('name')) {
        obj['name'] = ApiClient.convertToType(data['name'], 'String');
      }
      if (data.hasOwnProperty('stats')) {
        obj['stats'] = Stats.constructFromObject(data['stats']);
      }
      if (data.hasOwnProperty('children')) {
        obj['children'] = ApiClient.convertToType(data['children'], [DirEntry]);
      }
    }
    return obj;
  }

  /**
   * @member {String} name
   */
  exports.prototype['name'] = undefined;
  /**
   * @member {module:model/Stats} stats
   */
  exports.prototype['stats'] = undefined;
  /**
   * @member {Array.<module:model/DirEntry>} children
   */
  exports.prototype['children'] = undefined;




  return exports;
}));


