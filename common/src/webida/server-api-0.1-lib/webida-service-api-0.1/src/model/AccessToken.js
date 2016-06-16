(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['../ApiClient', '../model/Token'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./Token'));
  } else {
    // Browser globals (root is window)
    if (!root.WebidaServiceApi) {
      root.WebidaServiceApi = {};
    }
    root.WebidaServiceApi.AccessToken = factory(root.WebidaServiceApi.ApiClient, root.WebidaServiceApi.Token);
  }
}(this, function(ApiClient, Token) {
  'use strict';




  /**
   * The AccessToken model module.
   * @module model/AccessToken
   * @version 0.1
   */

  /**
   * Constructs a new <code>AccessToken</code>.
   * @alias module:model/AccessToken
   * @class
   * @extends module:model/Token
   * @param tokenType
   * @param expiresAt
   * @param issuedAt
   * @param sessionId
   */
  var exports = function(tokenType, expiresAt, issuedAt, sessionId) {
    var _this = this;
    Token.call(_this, tokenType, expiresAt, issuedAt);
    _this['sessionId'] = sessionId;

  };

  /**
   * Constructs a <code>AccessToken</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/AccessToken} obj Optional instance to populate.
   * @return {module:model/AccessToken} The populated <code>AccessToken</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();
      Token.constructFromObject(data, obj);
      if (data.hasOwnProperty('sessionId')) {
        obj['sessionId'] = ApiClient.convertToType(data['sessionId'], 'String');
      }
      if (data.hasOwnProperty('workspaceId')) {
        obj['workspaceId'] = ApiClient.convertToType(data['workspaceId'], 'String');
      }
    }
    return obj;
  }

  exports.prototype = Object.create(Token.prototype);
  exports.prototype.constructor = exports;

  /**
   * An access token should not be shared between ide sessions, for each sessions requires  distinct websocket connection, identified with session id.  To change session id,  call login again. Any Websocket connection will be rejected if requested upgrade does not contains proper access token data  
   * @member {String} sessionId
   */
  exports.prototype['sessionId'] = undefined;
  /**
   * the workspaceId inherited from master token
   * @member {String} workspaceId
   */
  exports.prototype['workspaceId'] = undefined;




  return exports;
}));


