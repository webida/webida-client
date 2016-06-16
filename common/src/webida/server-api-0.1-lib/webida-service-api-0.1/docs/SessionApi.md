# WebidaServiceApi.SessionApi

All URIs are relative to *https://localhost/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**deleteSession**](SessionApi.md#deleteSession) | **DELETE** /sessions/{sessionId} | 
[**getSession**](SessionApi.md#getSession) | **GET** /sessions/{sessionId} | 
[**getSessions**](SessionApi.md#getSessions) | **GET** /sessions | 


<a name="deleteSession"></a>
# **deleteSession**
> [Session] deleteSession(sessionId)



close session with timeout

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.SessionApi();

var sessionId = "sessionId_example"; // String | webida session id (usually different from socket id from sock.io)


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.deleteSession(sessionId, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **sessionId** | **String**| webida session id (usually different from socket id from sock.io) | 

### Return type

[**[Session]**](Session.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

<a name="getSession"></a>
# **getSession**
> [Session] getSession(sessionId)



get a session object by id

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.SessionApi();

var sessionId = "sessionId_example"; // String | webida session id (usually different from socket id from sock.io)


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.getSession(sessionId, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **sessionId** | **String**| webida session id (usually different from socket id from sock.io) | 

### Return type

[**[Session]**](Session.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

<a name="getSessions"></a>
# **getSessions**
> [Session] getSessions(opts)



get all / some webida sessions established to server

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.SessionApi();

var opts = { 
  'workspaceId': "workspaceId_example" // String | only include sessions working on some given workspace
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.getSessions(opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **workspaceId** | **String**| only include sessions working on some given workspace | [optional] 

### Return type

[**[Session]**](Session.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

