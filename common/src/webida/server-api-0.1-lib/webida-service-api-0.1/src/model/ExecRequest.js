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
    root.WebidaServiceApi.ExecRequest = factory(root.WebidaServiceApi.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The ExecRequest model module.
   * @module model/ExecRequest
   * @version 0.1
   */

  /**
   * Constructs a new <code>ExecRequest</code>.
   * execution request, simlilar to node.js child_proc.exec / spawn see node.js documentation for details of each properties. some properties are not configurable for portability    - encoding : fixed to utf-8    - shell : fixed to system default. Using shell env variables in command is not recommended.    - killSignal : fixed to default (SIGTERM)    - uid, gid : will not be set    - stdio : does not support &#39;ignore&#39; and &#39;inherit&#39;. all streams are handled by server. 
   * @alias module:model/ExecRequest
   * @class
   * @param command
   */
  var exports = function(command) {
    var _this = this;

    _this['command'] = command;




  };

  /**
   * Constructs a <code>ExecRequest</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/ExecRequest} obj Optional instance to populate.
   * @return {module:model/ExecRequest} The populated <code>ExecRequest</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('command')) {
        obj['command'] = ApiClient.convertToType(data['command'], 'String');
      }
      if (data.hasOwnProperty('args')) {
        obj['args'] = ApiClient.convertToType(data['args'], ['String']);
      }
      if (data.hasOwnProperty('cwd')) {
        obj['cwd'] = ApiClient.convertToType(data['cwd'], 'String');
      }
      if (data.hasOwnProperty('input')) {
        obj['input'] = ApiClient.convertToType(data['input'], 'String');
      }
      if (data.hasOwnProperty('maxBuffer')) {
        obj['maxBuffer'] = ApiClient.convertToType(data['maxBuffer'], 'String');
      }
    }
    return obj;
  }

  /**
   * name or path of executable file to run. should not contain any arguments. 
   * @member {String} command
   */
  exports.prototype['command'] = undefined;
  /**
   * the command line arguments for the command. if 'shell' property is true, this args will be joined with ' ' and appended to command string 
   * @member {Array.<String>} args
   */
  exports.prototype['args'] = undefined;
  /**
   * Current working directory of child process, relative to workspace root. If abscent, CWD will be the workspace root directory. Does not accept shell-variable form like $HOME, %USERPROFILE% 
   * @member {String} cwd
   */
  exports.prototype['cwd'] = undefined;
  /**
   * The value which will be passed as stdin to the spawned process. If abscent, server will not write to input anything 
   * @member {String} input
   */
  exports.prototype['input'] = undefined;
  /**
   * largest amount of data (in bytes) allowed on stdout or stderr. if exceeded child process is killed by server. if async is true, this arguments will be ignored by spawn() 
   * @member {String} maxBuffer
   */
  exports.prototype['maxBuffer'] = undefined;




  return exports;
}));


