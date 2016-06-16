(function(factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['./ApiClient', './model/AccessToken', './model/DirEntry', './model/ExecAsyncResponse', './model/ExecRequest', './model/ExecResponse', './model/LoginRequest', './model/LoginResponse', './model/MasterToken', './model/Match', './model/RestError', './model/RestOK', './model/Session', './model/Stats', './model/Token', './model/User', './model/Workspace', './api/AuthApi', './api/DefaultApi', './api/OpsApi', './api/SessionApi', './api/WfsApi', './api/WorkspaceApi'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('./ApiClient'), require('./model/AccessToken'), require('./model/DirEntry'), require('./model/ExecAsyncResponse'), require('./model/ExecRequest'), require('./model/ExecResponse'), require('./model/LoginRequest'), require('./model/LoginResponse'), require('./model/MasterToken'), require('./model/Match'), require('./model/RestError'), require('./model/RestOK'), require('./model/Session'), require('./model/Stats'), require('./model/Token'), require('./model/User'), require('./model/Workspace'), require('./api/AuthApi'), require('./api/DefaultApi'), require('./api/OpsApi'), require('./api/SessionApi'), require('./api/WfsApi'), require('./api/WorkspaceApi'));
  }
}(function(ApiClient, AccessToken, DirEntry, ExecAsyncResponse, ExecRequest, ExecResponse, LoginRequest, LoginResponse, MasterToken, Match, RestError, RestOK, Session, Stats, Token, User, Workspace, AuthApi, DefaultApi, OpsApi, SessionApi, WfsApi, WorkspaceApi) {
  'use strict';

  /**
   * Webida Service API specfication.<br>
   * The <code>index</code> module provides access to constructors for all the classes which comprise the public API.
   * <p>
   * An AMD (recommended!) or CommonJS application will generally do something equivalent to the following:
   * <pre>
   * var WebidaServiceApi = require('index'); // See note below*.
   * var xxxSvc = new WebidaServiceApi.XxxApi(); // Allocate the API class we're going to use.
   * var yyyModel = new WebidaServiceApi.Yyy(); // Construct a model instance.
   * yyyModel.someProperty = 'someValue';
   * ...
   * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
   * ...
   * </pre>
   * <em>*NOTE: For a top-level AMD script, use require(['index'], function(){...})
   * and put the application logic within the callback function.</em>
   * </p>
   * <p>
   * A non-AMD browser application (discouraged) might do something like this:
   * <pre>
   * var xxxSvc = new WebidaServiceApi.XxxApi(); // Allocate the API class we're going to use.
   * var yyy = new WebidaServiceApi.Yyy(); // Construct a model instance.
   * yyyModel.someProperty = 'someValue';
   * ...
   * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
   * ...
   * </pre>
   * </p>
   * @module index
   * @version 0.1
   */
  var exports = {
    /**
     * The ApiClient constructor.
     * @property {module:ApiClient}
     */
    ApiClient: ApiClient,
    /**
     * The AccessToken model constructor.
     * @property {module:model/AccessToken}
     */
    AccessToken: AccessToken,
    /**
     * The DirEntry model constructor.
     * @property {module:model/DirEntry}
     */
    DirEntry: DirEntry,
    /**
     * The ExecAsyncResponse model constructor.
     * @property {module:model/ExecAsyncResponse}
     */
    ExecAsyncResponse: ExecAsyncResponse,
    /**
     * The ExecRequest model constructor.
     * @property {module:model/ExecRequest}
     */
    ExecRequest: ExecRequest,
    /**
     * The ExecResponse model constructor.
     * @property {module:model/ExecResponse}
     */
    ExecResponse: ExecResponse,
    /**
     * The LoginRequest model constructor.
     * @property {module:model/LoginRequest}
     */
    LoginRequest: LoginRequest,
    /**
     * The LoginResponse model constructor.
     * @property {module:model/LoginResponse}
     */
    LoginResponse: LoginResponse,
    /**
     * The MasterToken model constructor.
     * @property {module:model/MasterToken}
     */
    MasterToken: MasterToken,
    /**
     * The Match model constructor.
     * @property {module:model/Match}
     */
    Match: Match,
    /**
     * The RestError model constructor.
     * @property {module:model/RestError}
     */
    RestError: RestError,
    /**
     * The RestOK model constructor.
     * @property {module:model/RestOK}
     */
    RestOK: RestOK,
    /**
     * The Session model constructor.
     * @property {module:model/Session}
     */
    Session: Session,
    /**
     * The Stats model constructor.
     * @property {module:model/Stats}
     */
    Stats: Stats,
    /**
     * The Token model constructor.
     * @property {module:model/Token}
     */
    Token: Token,
    /**
     * The User model constructor.
     * @property {module:model/User}
     */
    User: User,
    /**
     * The Workspace model constructor.
     * @property {module:model/Workspace}
     */
    Workspace: Workspace,
    /**
     * The AuthApi service constructor.
     * @property {module:api/AuthApi}
     */
    AuthApi: AuthApi,
    /**
     * The DefaultApi service constructor.
     * @property {module:api/DefaultApi}
     */
    DefaultApi: DefaultApi,
    /**
     * The OpsApi service constructor.
     * @property {module:api/OpsApi}
     */
    OpsApi: OpsApi,
    /**
     * The SessionApi service constructor.
     * @property {module:api/SessionApi}
     */
    SessionApi: SessionApi,
    /**
     * The WfsApi service constructor.
     * @property {module:api/WfsApi}
     */
    WfsApi: WfsApi,
    /**
     * The WorkspaceApi service constructor.
     * @property {module:api/WorkspaceApi}
     */
    WorkspaceApi: WorkspaceApi
  };

  return exports;
}));
