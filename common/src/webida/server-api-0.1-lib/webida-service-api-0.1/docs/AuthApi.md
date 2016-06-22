# WebidaServiceApi.AuthApi

All URIs are relative to *https://localhost/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getInfo**](AuthApi.md#getInfo) | **GET** /auth/info | 
[**issueToken**](AuthApi.md#issueToken) | **POST** /auth/token | 
[**login**](AuthApi.md#login) | **POST** /auth/login | 


<a name="getInfo"></a>
# **getInfo**
> User getInfo()



Gets user information of that can be identified with current access token. Implementations should provide a more restful api based on domain data model. Don&#39;t override this operation for multi-user system. 

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.AuthApi();

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.getInfo(callback);
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**User**](User.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

<a name="issueToken"></a>
# **issueToken**
> Token issueToken(type, opts)



Creates new token from current access token, inheriting workspace id &amp; session id Duration of generated token is not (and should be) parameterizable. 

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.AuthApi();

var type = "type_example"; // String | 

var opts = { 
  'workspaceId': "workspaceId_example" // String | mandatory to issue a MASTER type token
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.issueToken(type, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **type** | **String**|  | 
 **workspaceId** | **String**| mandatory to issue a MASTER type token | [optional] 

### Return type

[**Token**](Token.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

<a name="login"></a>
# **login**
> Token login(body)



A &#39;VERY&#39; basic authentication, required to use webida-simple-auth security scheme.  Service / Product implementations who need better security, should override this operation or add their own login api or some other specs like OAuth2. Simple auth is not suitable for large-sacle, multi-tennant service.  Generated accss token inherits all restriction from master token. In normal login, unrestricted access token will be granted with reasonably short expiration time. Every client should respawn another access token with issueToken API before current access token expires. 

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');

var apiInstance = new WebidaServiceApi.AuthApi();

var body = new WebidaServiceApi.Credential(); // Credential | 


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.login(body, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **body** | [**Credential**](Credential.md)|  | 

### Return type

[**Token**](Token.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

