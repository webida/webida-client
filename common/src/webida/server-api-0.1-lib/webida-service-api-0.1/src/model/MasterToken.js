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
    root.WebidaServiceApi.MasterToken = factory(root.WebidaServiceApi.ApiClient, root.WebidaServiceApi.Token);
  }
}(this, function(ApiClient, Token) {
  'use strict';




  /**
   * The MasterToken model module.
   * @module model/MasterToken
   * @version 0.1
   */

  /**
   * Constructs a new <code>MasterToken</code>.
   * @alias module:model/MasterToken
   * @class
   * @extends module:model/Token
   * @param tokenType
   * @param expiresAt
   * @param issuedAt
   */
  var exports = function(tokenType, expiresAt, issuedAt) {
    var _this = this;
    Token.call(_this, tokenType, expiresAt, issuedAt);

  };

  /**
   * Constructs a <code>MasterToken</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/MasterToken} obj Optional instance to populate.
   * @return {module:model/MasterToken} The populated <code>MasterToken</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();
      Token.constructFromObject(data, obj);
      if (data.hasOwnProperty('workspaceId')) {
        obj['workspaceId'] = ApiClient.convertToType(data['workspaceId'], 'String');
      }
    }
    return obj;
  }

  exports.prototype = Object.create(Token.prototype);
  exports.prototype.constructor = exports;

  /**
   * Some MASTER tokens has some 'restricted' access rights, bound to specific workspace, with  as issueToken() operation specifies. Any access tokens created from a restricted master token inherits same restriction. If this value is falsy, token has  no restriction and  can be used to access all apis. If truthy, some api calls that touches internal access registry or session registry will have met 403 error. Some filesystem apis will be rejected, too.  
   * @member {String} workspaceId
   */
  exports.prototype['workspaceId'] = undefined;




  return exports;
}));


