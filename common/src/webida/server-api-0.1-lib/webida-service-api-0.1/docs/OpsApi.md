# WebidaServiceApi.OpsApi

All URIs are relative to *https://localhost/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**search**](OpsApi.md#search) | **GET** /wfs/{wfsId}/ops/search/{wfsPath} | 


<a name="search"></a>
# **search**
> {&#39;String&#39;: Match} search(wfsId, wfsPath, pattern, opts)



search files in some path, with given pattern

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.OpsApi();

var wfsId = "wfsId_example"; // String | webida file system id (same to workspace id) to access.

var wfsPath = "wfsPath_example"; // String | webida file system path to access. without heading /. should be placed at the end of path arguments 

var pattern = "pattern_example"; // String | regex pattern to match

var opts = { 
  'ignoreCase': false, // Boolean | regex matching option to ignore case
  'wholeWord': false // Boolean | regex matching option to match whole word
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.search(wfsId, wfsPath, pattern, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **wfsId** | **String**| webida file system id (same to workspace id) to access. | 
 **wfsPath** | **String**| webida file system path to access. without heading /. should be placed at the end of path arguments  | 
 **pattern** | **String**| regex pattern to match | 
 **ignoreCase** | **Boolean**| regex matching option to ignore case | [optional] [default to false]
 **wholeWord** | **Boolean**| regex matching option to match whole word | [optional] [default to false]

### Return type

[**{&#39;String&#39;: Match}**](Match.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

