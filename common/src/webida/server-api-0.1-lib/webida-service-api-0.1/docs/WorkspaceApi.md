# WebidaServiceApi.WorkspaceApi

All URIs are relative to *https://localhost/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**cancel**](WorkspaceApi.md#cancel) | **DELETE** /workspaces/{workspaceId}/exec | 
[**createWorkspace**](WorkspaceApi.md#createWorkspace) | **POST** /workspaces | 
[**exec**](WorkspaceApi.md#exec) | **POST** /workspaces/{workspaceId}/exec | 
[**getAllWorkspaces**](WorkspaceApi.md#getAllWorkspaces) | **GET** /workspaces | 
[**getWorkspace**](WorkspaceApi.md#getWorkspace) | **GET** /workspaces/{workspaceId} | 
[**removeWorkspace**](WorkspaceApi.md#removeWorkspace) | **DELETE** /workspaces/{workspaceId} | 
[**updateWorkspace**](WorkspaceApi.md#updateWorkspace) | **PUT** /workspaces/{workspaceId} | 


<a name="cancel"></a>
# **cancel**
> RestOK cancel(workspaceId, execId)



cancels a async execution

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.WorkspaceApi();

var workspaceId = "workspaceId_example"; // String | webida workspace id (usually same to file system id, wfsId)

var execId = "execId_example"; // String | the execId property in ExecResponse  


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.cancel(workspaceId, execId, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **workspaceId** | **String**| webida workspace id (usually same to file system id, wfsId) | 
 **execId** | **String**| the execId property in ExecResponse   | 

### Return type

[**RestOK**](RestOK.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

<a name="createWorkspace"></a>
# **createWorkspace**
> Workspace createWorkspace(workspacePath)



create a new workspace at given path

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.WorkspaceApi();

var workspacePath = "workspacePath_example"; // String | a real path of the system or relative path to workspace cellar


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.createWorkspace(workspacePath, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **workspacePath** | **String**| a real path of the system or relative path to workspace cellar | 

### Return type

[**Workspace**](Workspace.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

<a name="exec"></a>
# **exec**
> ExecResponse exec(workspaceId, body, opts)



execute a shell command

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.WorkspaceApi();

var workspaceId = "workspaceId_example"; // String | webida workspace id (usually same to file system id, wfsId)

var body = new WebidaServiceApi.ExecRequest(); // ExecRequest | 

var opts = { 
  'async': false, // Boolean | Execute a command and returns a dummy response immediatlely, and send actual output (stream of message) with web socket channel of current session. At the end of execution, ExecResponse object with empty stdout/stderr will be delivered at the channel.  
  'execId': "execId_example" // String | mandatory for async execution. the result stream will be identified with this id
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.exec(workspaceId, body, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **workspaceId** | **String**| webida workspace id (usually same to file system id, wfsId) | 
 **body** | [**ExecRequest**](ExecRequest.md)|  | 
 **async** | **Boolean**| Execute a command and returns a dummy response immediatlely, and send actual output (stream of message) with web socket channel of current session. At the end of execution, ExecResponse object with empty stdout/stderr will be delivered at the channel.   | [optional] [default to false]
 **execId** | **String**| mandatory for async execution. the result stream will be identified with this id | [optional] 

### Return type

[**ExecResponse**](ExecResponse.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

<a name="getAllWorkspaces"></a>
# **getAllWorkspaces**
> [Workspace] getAllWorkspaces(opts)



get all registerd (non-disposable) workspaces in the server. since webida is not designed to  host so many workspaces, there&#39;s no good &#39;find&#39; or &#39;query&#39; API. Service/product implementations may create a better opeation. 

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.WorkspaceApi();

var opts = { 
  'disposable': false // Boolean | include disposable workspaces in response
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.getAllWorkspaces(opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **disposable** | **Boolean**| include disposable workspaces in response | [optional] [default to false]

### Return type

[**[Workspace]**](Workspace.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

<a name="getWorkspace"></a>
# **getWorkspace**
> Workspace getWorkspace(workspaceId, )



get all workspaces registerd (non-disposable) in the server

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.WorkspaceApi();

var workspaceId = "workspaceId_example"; // String | webida workspace id (usually same to file system id, wfsId)


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.getWorkspace(workspaceId, , callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **workspaceId** | **String**| webida workspace id (usually same to file system id, wfsId) | 

### Return type

[**Workspace**](Workspace.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

<a name="removeWorkspace"></a>
# **removeWorkspace**
> Workspace removeWorkspace(workspaceId, , opts)



remove a workspace. all sessions on this workspace will be closed.

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.WorkspaceApi();

var workspaceId = "workspaceId_example"; // String | webida workspace id (usually same to file system id, wfsId)

var opts = { 
  'wait': 0 // Integer | Time in seconds to wait for all sessions save & close their data. zero or negative value will close the sessions immediatlely. 
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.removeWorkspace(workspaceId, , opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **workspaceId** | **String**| webida workspace id (usually same to file system id, wfsId) | 
 **wait** | **Integer**| Time in seconds to wait for all sessions save &amp; close their data. zero or negative value will close the sessions immediatlely.  | [optional] [default to 0]

### Return type

[**Workspace**](Workspace.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

<a name="updateWorkspace"></a>
# **updateWorkspace**
> Workspace updateWorkspace(workspaceId, )



update workspace information. some properties will not be updated by this api.

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.WorkspaceApi();

var workspaceId = "workspaceId_example"; // String | webida workspace id (usually same to file system id, wfsId)


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.updateWorkspace(workspaceId, , callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **workspaceId** | **String**| webida workspace id (usually same to file system id, wfsId) | 

### Return type

[**Workspace**](Workspace.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

