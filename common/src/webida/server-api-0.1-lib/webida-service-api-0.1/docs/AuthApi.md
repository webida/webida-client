# WebidaServiceApi.AuthApi

All URIs are relative to *https://localhost/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**decodeToken**](AuthApi.md#decodeToken) | **GET** /auth/token | 
[**getInfo**](AuthApi.md#getInfo) | **GET** /auth/info | 
[**issueToken**](AuthApi.md#issueToken) | **POST** /auth/token | 
[**login**](AuthApi.md#login) | **POST** /auth/login | 


<a name="decodeToken"></a>
# **decodeToken**
> Token decodeToken(opts)



decode token to get data.

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

var opts = { 
  'tokenText': "tokenText_example" // String | token text to decode. if not given, access token in request will be used
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.decodeToken(opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **tokenText** | **String**| token text to decode. if not given, access token in request will be used | [optional] 

### Return type

[**Token**](Token.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

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
> Token issueToken(tokenType, opts)



Creates new token - Any restrictions are inherited Clients cannot create new access token from exiting one via this operation.  Call login with master token.  When user logs in without master token, login api response alwyas contains master token 

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

var tokenType = "tokenType_example"; // String | 'MASTER' type requires workspaceId parameter  'ACCESS' type will return inherited access token with all same property except  issuedAt & expiredAt.  

var opts = { 
  'workspaceId': "workspaceId_example" // String | mandatory to issue a 'MASTER' type token, restricted to some workspace
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.issueToken(tokenType, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **tokenType** | **String**| &#39;MASTER&#39; type requires workspaceId parameter  &#39;ACCESS&#39; type will return inherited access token with all same property except  issuedAt &amp; expiredAt.   | 
 **workspaceId** | **String**| mandatory to issue a &#39;MASTER&#39; type token, restricted to some workspace | [optional] 

### Return type

[**Token**](Token.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

<a name="login"></a>
# **login**
> LoginResponse login(body)



Basic authentication to support webida-simple-auth security scheme defined in this spec. Service / Product implementations who need better security, should override this operation or add their own login api and security definitions. see webida devloper guide to read details about webida-simpe-auth security sceheme. 

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');

var apiInstance = new WebidaServiceApi.AuthApi();

var body = new WebidaServiceApi.LoginRequest(); // LoginRequest | 


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
 **body** | [**LoginRequest**](LoginRequest.md)|  | 

### Return type

[**LoginResponse**](LoginResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

