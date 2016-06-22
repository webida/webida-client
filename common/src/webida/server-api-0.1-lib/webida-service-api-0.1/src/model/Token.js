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
    root.WebidaServiceApi.Token = factory(root.WebidaServiceApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The Token model module.
   * @module model/Token
   * @version 0.1
   */

  /**
   * Constructs a new <code>Token</code>.
   * a json webtoken and accessible data
   * @alias module:model/Token
   * @class
   * @param text
   * @param tokenType
   * @param expiresAt
   * @param issuedAt
   */
  var exports = function(text, tokenType, expiresAt, issuedAt) {
    var _this = this;

    _this['text'] = text;
    _this['tokenType'] = tokenType;
    _this['expiresAt'] = expiresAt;
    _this['issuedAt'] = issuedAt;


  };

  /**
   * Constructs a <code>Token</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/Token} obj Optional instance to populate.
   * @return {module:model/Token} The populated <code>Token</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('text')) {
        obj['text'] = ApiClient.convertToType(data['text'], 'String');
      }
      if (data.hasOwnProperty('tokenType')) {
        obj['tokenType'] = ApiClient.convertToType(data['tokenType'], 'String');
      }
      if (data.hasOwnProperty('expiresAt')) {
        obj['expiresAt'] = ApiClient.convertToType(data['expiresAt'], 'Date');
      }
      if (data.hasOwnProperty('issuedAt')) {
        obj['issuedAt'] = ApiClient.convertToType(data['issuedAt'], 'Date');
      }
      if (data.hasOwnProperty('sessionId')) {
        obj['sessionId'] = ApiClient.convertToType(data['sessionId'], 'String');
      }
      if (data.hasOwnProperty('workspaceId')) {
        obj['workspaceId'] = ApiClient.convertToType(data['workspaceId'], 'String');
      }
    }
    return obj;
  }

  /**
   * actual token text that should be shipped in header or query
   * @member {String} text
   */
  exports.prototype['text'] = undefined;
  /**
   * MASTER : used to create an access token from clients, without login credential ACCESS : protects api access. should be unique for each ide session ADMIN  : unrestriced access token for hub/admin service who controls server.          there's no way to create admin token with API.  Note that here's no REFRESH token, nor LOGIN token. The login api will create unrestricted access token & master token pair. Desktop app has a side-way to create an unrestricted master token before starting IDE instances. 
   * @member {module:model/Token.TokenTypeEnum} tokenType
   */
  exports.prototype['tokenType'] = undefined;
  /**
   * @member {Date} expiresAt
   */
  exports.prototype['expiresAt'] = undefined;
  /**
   * @member {Date} issuedAt
   */
  exports.prototype['issuedAt'] = undefined;
  /**
   * mandatory for ACCESS token, identifying client instance
   * @member {String} sessionId
   */
  exports.prototype['sessionId'] = undefined;
  /**
   * If truthy, access rights are restricted to specified workspace only.
   * @member {String} workspaceId
   */
  exports.prototype['workspaceId'] = undefined;


  /**
   * Allowed values for the <code>tokenType</code> property.
   * @enum {String}
   * @readonly
   */
  exports.TokenTypeEnum = {
    /**
     * value: "MASTER"
     * @const
     */
    "MASTER": "MASTER",
    /**
     * value: "ACCESS"
     * @const
     */
    "ACCESS": "ACCESS",
    /**
     * value: "ADMIN"
     * @const
     */
    "ADMIN": "ADMIN"  };


  return exports;
}));


