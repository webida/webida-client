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
    root.WebidaServiceApi.Session = factory(root.WebidaServiceApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The Session model module.
   * @module model/Session
   * @version 0.1
   */

  /**
   * Constructs a new <code>Session</code>.
   * an application session per ide instance. bound to access token
   * @alias module:model/Session
   * @class
   * @param id
   * @param name
   * @param state
   * @param workspaceId
   * @param clientAddress
   * @param connectedAt
   * @param disconnectedAt
   */
  var exports = function(id, name, state, workspaceId, clientAddress, connectedAt, disconnectedAt) {
    var _this = this;

    _this['id'] = id;
    _this['name'] = name;
    _this['state'] = state;
    _this['workspaceId'] = workspaceId;
    _this['clientAddress'] = clientAddress;
    _this['connectedAt'] = connectedAt;
    _this['disconnectedAt'] = disconnectedAt;


  };

  /**
   * Constructs a <code>Session</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/Session} obj Optional instance to populate.
   * @return {module:model/Session} The populated <code>Session</code> instance.
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
      if (data.hasOwnProperty('state')) {
        obj['state'] = ApiClient.convertToType(data['state'], 'String');
      }
      if (data.hasOwnProperty('workspaceId')) {
        obj['workspaceId'] = ApiClient.convertToType(data['workspaceId'], 'String');
      }
      if (data.hasOwnProperty('clientAddress')) {
        obj['clientAddress'] = ApiClient.convertToType(data['clientAddress'], 'String');
      }
      if (data.hasOwnProperty('connectedAt')) {
        obj['connectedAt'] = ApiClient.convertToType(data['connectedAt'], 'Date');
      }
      if (data.hasOwnProperty('disconnectedAt')) {
        obj['disconnectedAt'] = ApiClient.convertToType(data['disconnectedAt'], 'Date');
      }
      if (data.hasOwnProperty('willCloseAt')) {
        obj['willCloseAt'] = ApiClient.convertToType(data['willCloseAt'], 'Date');
      }
      if (data.hasOwnProperty('willLoseAt')) {
        obj['willLoseAt'] = ApiClient.convertToType(data['willLoseAt'], 'Date');
      }
    }
    return obj;
  }

  /**
   * the id of a session. usually same to socket id.
   * @member {String} id
   */
  exports.prototype['id'] = undefined;
  /**
   * human readable name, usually derived from workspace name.
   * @member {String} name
   */
  exports.prototype['name'] = undefined;
  /**
   * state of this session NORMAL = connected, normally working LOSING = disconnected, waiting reconnection. still accessible with api CLOSING = socket connection will close connection by server (clinet will be notified)  there's no 'CLOSED' / 'LOST' state, for server will remove session object in registry when the server closes connection or stops waiting for reconnection for timeout. 
   * @member {module:model/Session.StateEnum} state
   */
  exports.prototype['state'] = undefined;
  /**
   * the id of workspace that this sessions is working on.
   * @member {String} workspaceId
   */
  exports.prototype['workspaceId'] = undefined;
  /**
   * the peer address of session connection. not always
   * @member {String} clientAddress
   */
  exports.prototype['clientAddress'] = undefined;
  /**
   * the time when socket connection is established
   * @member {Date} connectedAt
   */
  exports.prototype['connectedAt'] = undefined;
  /**
   * the time when socket is closed.
   * @member {Date} disconnectedAt
   */
  exports.prototype['disconnectedAt'] = undefined;
  /**
   * when state becomes CLOSING, actual closing time will be updated by server.
   * @member {Date} willCloseAt
   */
  exports.prototype['willCloseAt'] = undefined;
  /**
   * when state becomes LOSING, server will not wait for reconnection after this time.
   * @member {Date} willLoseAt
   */
  exports.prototype['willLoseAt'] = undefined;


  /**
   * Allowed values for the <code>state</code> property.
   * @enum {String}
   * @readonly
   */
  exports.StateEnum = {
    /**
     * value: "NORMAL"
     * @const
     */
    "NORMAL": "NORMAL",
    /**
     * value: "LOSING"
     * @const
     */
    "LOSING": "LOSING",
    /**
     * value: "CLOSING"
     * @const
     */
    "CLOSING": "CLOSING"  };


  return exports;
}));


