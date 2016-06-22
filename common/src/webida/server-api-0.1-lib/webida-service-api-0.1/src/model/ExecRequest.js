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
   * execution request, simlilar to node.js spawn(). see node.js documentation for details of each properties. some properties are not configurable for portability    - encoding : fixed to utf-8    - shell : fixed to system default. Using shell variables in command may not work.    - killSignal : fixed to SIGTERM. If process does not die, server can send SIGKILL or                   invoke taskkill to ensure chlid process is killed.    - uid &amp; gid : will not be set    - stdio : all streams are handled by server. no options are avaliable to client.    - shell : always false.    - detached : always false 
   * @alias module:model/ExecRequest
   * @class
   * @param id
   * @param command
   * @param args
   */
  var exports = function(id, command, args) {
    var _this = this;

    _this['id'] = id;
    _this['command'] = command;
    _this['args'] = args;



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

      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'String');
      }
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
      if (data.hasOwnProperty('timeout')) {
        obj['timeout'] = ApiClient.convertToType(data['timeout'], 'Integer');
      }
    }
    return obj;
  }

  /**
   * unique identifier of execution, to demux response stream or cancel request
   * @member {String} id
   */
  exports.prototype['id'] = undefined;
  /**
   * command to run. should not contain any arguments, pipes, redirections 
   * @member {String} command
   */
  exports.prototype['command'] = undefined;
  /**
   * the arguments array
   * @member {Array.<String>} args
   */
  exports.prototype['args'] = undefined;
  /**
   * Current working directory of child process, relative to workspace root. If abscent, CWD will be the workspace root directory. Does not accept any evaluatable form like $HOME, %USERPROFILE%. If absolute, heading / will be discarded. should be unixified. 
   * @member {String} cwd
   */
  exports.prototype['cwd'] = undefined;
  /**
   * input string for child process. if falsy in async execution, async input messages will be pasted into the child's stdin. since we don't use tty, it's recommended to use input string anyway. 
   * @member {String} input
   */
  exports.prototype['input'] = undefined;
  /**
   * The value which In 'milliseconds' the maximum amount of time the child is allowed to run. (not idle time of stdout / stderr stream) if undefined, server will not kill the child process until receiving cancel request  if it doesn't exit by self. 
   * @member {Integer} timeout
   */
  exports.prototype['timeout'] = undefined;




  return exports;
}));


