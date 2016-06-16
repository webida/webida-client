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
    root.WebidaServiceApi.Workspace = factory(root.WebidaServiceApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The Workspace model module.
   * @module model/Workspace
   * @version 0.1
   */

  /**
   * Constructs a new <code>Workspace</code>.
   * Users&#39; workspace in server
   * @alias module:model/Workspace
   * @class
   * @param id
   * @param name
   * @param workspacePath
   * @param createdAt
   * @param accessedAt
   */
  var exports = function(id, name, workspacePath, createdAt, accessedAt) {
    var _this = this;

    _this['id'] = id;
    _this['name'] = name;
    _this['workspacePath'] = workspacePath;
    _this['createdAt'] = createdAt;
    _this['accessedAt'] = accessedAt;
  };

  /**
   * Constructs a <code>Workspace</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/Workspace} obj Optional instance to populate.
   * @return {module:model/Workspace} The populated <code>Workspace</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'String');
      }
      if (data.hasOwnProperty('name')) {
        obj['name'] = ApiClient.convertToType(data['name'], 'String');
      }
      if (data.hasOwnProperty('workspacePath')) {
        obj['workspacePath'] = ApiClient.convertToType(data['workspacePath'], 'String');
      }
      if (data.hasOwnProperty('createdAt')) {
        obj['createdAt'] = ApiClient.convertToType(data['createdAt'], 'Date');
      }
      if (data.hasOwnProperty('accessedAt')) {
        obj['accessedAt'] = ApiClient.convertToType(data['accessedAt'], 'Date');
      }
    }
    return obj;
  }

  /**
   * the id of a workspace. usually same to file system id
   * @member {String} id
   */
  exports.prototype['id'] = undefined;
  /**
   * display text of this workspace. should not conflit to other workspaces
   * @member {String} name
   */
  exports.prototype['name'] = undefined;
  /**
   * absolute path of this workspace in server
   * @member {String} workspacePath
   */
  exports.prototype['workspacePath'] = undefined;
  /**
   * the time when this workspace is created (registered from local file system)
   * @member {Date} createdAt
   */
  exports.prototype['createdAt'] = undefined;
  /**
   * the time when the last session on this workspace was made
   * @member {Date} accessedAt
   */
  exports.prototype['accessedAt'] = undefined;




  return exports;
}));


