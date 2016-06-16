# WebidaServiceApi.DefaultApi

All URIs are relative to *https://localhost/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**replace**](DefaultApi.md#replace) | **POST** /wfs/{wfsId}/ops/replace | 


<a name="replace"></a>
# **replace**
> RestOK replace(wfsId, wfsPathList, patternreplaceTo, opts)



replace file contents with regex matching

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.DefaultApi();

var wfsId = "wfsId_example"; // String | webida file system id (same to workspace id) to access.

var wfsPathList = ["wfsPathList_example"]; // [String] | array of wfsPath, with heading /  (collection format may be changed by implementation)

var pattern = "pattern_example"; // String | regex pattern to match

var replaceTo = "replaceTo_example"; // String | string to replace with

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
apiInstance.replace(wfsId, wfsPathList, patternreplaceTo, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **wfsId** | **String**| webida file system id (same to workspace id) to access. | 
 **wfsPathList** | [**[String]**](String.md)| array of wfsPath, with heading /  (collection format may be changed by implementation) | 
 **pattern** | **String**| regex pattern to match | 
 **replaceTo** | **String**| string to replace with | 
 **ignoreCase** | **Boolean**| regex matching option to ignore case | [optional] [default to false]
 **wholeWord** | **Boolean**| regex matching option to match whole word | [optional] [default to false]

### Return type

[**RestOK**](RestOK.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

