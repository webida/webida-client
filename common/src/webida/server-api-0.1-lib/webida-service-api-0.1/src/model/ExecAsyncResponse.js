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
    root.WebidaServiceApi.ExecAsyncResponse = factory(root.WebidaServiceApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The ExecAsyncResponse model module.
   * @module model/ExecAsyncResponse
   * @version 0.1
   */

  /**
   * Constructs a new <code>ExecAsyncResponse</code>.
   * execution response with output and exit code 
   * @alias module:model/ExecAsyncResponse
   * @class
   * @param exitCode
   * @param stdout
   * @param stderr
   */
  var exports = function(exitCode, stdout, stderr) {
    var _this = this;

    _this['exitCode'] = exitCode;
    _this['stdout'] = stdout;
    _this['stderr'] = stderr;
  };

  /**
   * Constructs a <code>ExecAsyncResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/ExecAsyncResponse} obj Optional instance to populate.
   * @return {module:model/ExecAsyncResponse} The populated <code>ExecAsyncResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('exitCode')) {
        obj['exitCode'] = ApiClient.convertToType(data['exitCode'], 'Integer');
      }
      if (data.hasOwnProperty('stdout')) {
        obj['stdout'] = ApiClient.convertToType(data['stdout'], 'String');
      }
      if (data.hasOwnProperty('stderr')) {
        obj['stderr'] = ApiClient.convertToType(data['stderr'], 'String');
      }
    }
    return obj;
  }

  /**
   * exit code of child process. for async operation, it's always 0
   * @member {Integer} exitCode
   */
  exports.prototype['exitCode'] = undefined;
  /**
   * standard out of child process
   * @member {String} stdout
   */
  exports.prototype['stdout'] = undefined;
  /**
   * standard error of child process
   * @member {String} stderr
   */
  exports.prototype['stderr'] = undefined;




  return exports;
}));


