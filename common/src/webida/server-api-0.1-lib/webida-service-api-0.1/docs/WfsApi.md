# WebidaServiceApi.WfsApi

All URIs are relative to *https://localhost/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**copy**](WfsApi.md#copy) | **PUT** /wfs/{wfsId}/any/{wfsPath} | 
[**createDir**](WfsApi.md#createDir) | **PUT** /wfs/{wfsId}/dir/{wfsPath} | 
[**dirTree**](WfsApi.md#dirTree) | **GET** /wfs/{wfsId}/dir/{wfsPath} | 
[**move**](WfsApi.md#move) | **POST** /wfs/{wfsId}/dir/{wfsPath} | 
[**readFile**](WfsApi.md#readFile) | **GET** /wfs/{wfsId}/file/{wfsPath} | 
[**remove**](WfsApi.md#remove) | **DELETE** /wfs/{wfsId}/any/{wfsPath} | 
[**rename**](WfsApi.md#rename) | **POST** /wfs/{wfsId}/file/{wfsPath} | 
[**stat**](WfsApi.md#stat) | **GET** /wfs/{wfsId}/any/{wfsPath} | 
[**writeFile**](WfsApi.md#writeFile) | **PUT** /wfs/{wfsId}/file/{wfsPath} | 


<a name="copy"></a>
# **copy**
> RestOK copy(wfsId, wfsPath, srcPath, opts)



Copy to given path. works like cp -r command, with some funny options Copying a dir on to existing file will return error Copying from sockets, fifo, .. and any other type of file system object is not supported. 

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.WfsApi();

var wfsId = "wfsId_example"; // String | webida file system id (same to workspace id) to access.

var wfsPath = "wfsPath_example"; // String | webida file system path to access. without heading /. should be placed at the end of path arguments 

var srcPath = "srcPath_example"; // String | source data path of some operations, with have heading /

var opts = { 
  'removeExisting': false // Boolean | remove any existing file/dir before writing.
  'followSymbolicLinks': false, // Boolean | dereference symlinks or not
  'noPreserveTimestamps': false, // Boolean | to change default behavior, keep mtime/atime of source files in destination
  'filterPattern': "filterPattern_example" // String | execute copy if source matches to this regex pattern.
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.copy(wfsId, wfsPath, srcPath, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **wfsId** | **String**| webida file system id (same to workspace id) to access. | 
 **wfsPath** | **String**| webida file system path to access. without heading /. should be placed at the end of path arguments  | 
 **srcPath** | **String**| source data path of some operations, with have heading / | 
 **removeExisting** | **Boolean**| remove any existing file/dir before writing. | [optional] [default to false]
 **followSymbolicLinks** | **Boolean**| dereference symlinks or not | [optional] [default to false]
 **noPreserveTimestamps** | **Boolean**| to change default behavior, keep mtime/atime of source files in destination | [optional] [default to false]
 **filterPattern** | **String**| execute copy if source matches to this regex pattern. | [optional] 

### Return type

[**RestOK**](RestOK.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

<a name="createDir"></a>
# **createDir**
> RestOK createDir(wfsId, wfsPath, , opts)



create a directory at the path. will return error when wfsPath exists and not empty

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.WfsApi();

var wfsId = "wfsId_example"; // String | webida file system id (same to workspace id) to access.

var wfsPath = "wfsPath_example"; // String | webida file system path to access. without heading /. should be placed at the end of path arguments 

var opts = { 
  'ensure': false // Boolean | flag to create all parent directories to create file or dir, like mkdir -p
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.createDir(wfsId, wfsPath, , opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **wfsId** | **String**| webida file system id (same to workspace id) to access. | 
 **wfsPath** | **String**| webida file system path to access. without heading /. should be placed at the end of path arguments  | 
 **ensure** | **Boolean**| flag to create all parent directories to create file or dir, like mkdir -p | [optional] [default to false]

### Return type

[**RestOK**](RestOK.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

<a name="dirTree"></a>
# **dirTree**
> DirEntry dirTree(wfsId, wfsPath, maxDepth)



returns a directory tree of given path, for listing dir and managing file system 

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.WfsApi();

var wfsId = "wfsId_example"; // String | webida file system id (same to workspace id) to access.

var wfsPath = "wfsPath_example"; // String | webida file system path to access. without heading /. should be placed at the end of path arguments 

var maxDepth = 56; // Integer | Maximum depth of tree. Set -1 to build a full tree, 0 to stat, 1 to plain list.


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.dirTree(wfsId, wfsPath, maxDepth, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **wfsId** | **String**| webida file system id (same to workspace id) to access. | 
 **wfsPath** | **String**| webida file system path to access. without heading /. should be placed at the end of path arguments  | 
 **maxDepth** | **Integer**| Maximum depth of tree. Set -1 to build a full tree, 0 to stat, 1 to plain list. | 

### Return type

[**DirEntry**](DirEntry.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

<a name="move"></a>
# **move**
> RestOK move(wfsId, wfsPath, srcPath, opts)



move file or directory to given path. works like mv command

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.WfsApi();

var wfsId = "wfsId_example"; // String | webida file system id (same to workspace id) to access.

var wfsPath = "wfsPath_example"; // String | webida file system path to access. without heading /. should be placed at the end of path arguments 

var srcPath = "srcPath_example"; // String | source data path of some operations, with have heading /

var opts = { 
  'removeExisting': false // Boolean | remove any existing file/dir before writing.
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.move(wfsId, wfsPath, srcPath, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **wfsId** | **String**| webida file system id (same to workspace id) to access. | 
 **wfsPath** | **String**| webida file system path to access. without heading /. should be placed at the end of path arguments  | 
 **srcPath** | **String**| source data path of some operations, with have heading / | 
 **removeExisting** | **Boolean**| remove any existing file/dir before writing. | [optional] [default to false]

### Return type

[**RestOK**](RestOK.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

<a name="readFile"></a>
# **readFile**
> File readFile(wfsId, wfsPath, )



read file data on path

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.WfsApi();

var wfsId = "wfsId_example"; // String | webida file system id (same to workspace id) to access.

var wfsPath = "wfsPath_example"; // String | webida file system path to access. without heading /. should be placed at the end of path arguments 


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.readFile(wfsId, wfsPath, , callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **wfsId** | **String**| webida file system id (same to workspace id) to access. | 
 **wfsPath** | **String**| webida file system path to access. without heading /. should be placed at the end of path arguments  | 

### Return type

**File**

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

<a name="remove"></a>
# **remove**
> RestOK remove(wfsId, wfsPath, , opts)



delete file or directory

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.WfsApi();

var wfsId = "wfsId_example"; // String | webida file system id (same to workspace id) to access.

var wfsPath = "wfsPath_example"; // String | webida file system path to access. without heading /. should be placed at the end of path arguments 

var opts = { 
  'recursive': false // Boolean | flag to set copy with
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.remove(wfsId, wfsPath, , opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **wfsId** | **String**| webida file system id (same to workspace id) to access. | 
 **wfsPath** | **String**| webida file system path to access. without heading /. should be placed at the end of path arguments  | 
 **recursive** | **Boolean**| flag to set copy with | [optional] [default to false]

### Return type

[**RestOK**](RestOK.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

<a name="rename"></a>
# **rename**
> File rename(wfsId, wfsPath, srcPath, opts)



Rename a file or directory to. This api does not remove an existing one.

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.WfsApi();

var wfsId = "wfsId_example"; // String | webida file system id (same to workspace id) to access.

var wfsPath = "wfsPath_example"; // String | webida file system path to access. without heading /. should be placed at the end of path arguments 

var srcPath = "srcPath_example"; // String | source data path of some operations, with have heading /

var opts = { 
  'ensure': false // Boolean | flag to create all parent directories to create file or dir, like mkdir -p
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.rename(wfsId, wfsPath, srcPath, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **wfsId** | **String**| webida file system id (same to workspace id) to access. | 
 **wfsPath** | **String**| webida file system path to access. without heading /. should be placed at the end of path arguments  | 
 **srcPath** | **String**| source data path of some operations, with have heading / | 
 **ensure** | **Boolean**| flag to create all parent directories to create file or dir, like mkdir -p | [optional] [default to false]

### Return type

**File**

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

<a name="stat"></a>
# **stat**
> Stats stat(wfsId, wfsPath, , opts)



get stats of given path. (stat returns &#39;stats&#39; object in node and POSIX)

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.WfsApi();

var wfsId = "wfsId_example"; // String | webida file system id (same to workspace id) to access.

var wfsPath = "wfsPath_example"; // String | webida file system path to access. without heading /. should be placed at the end of path arguments 

var opts = { 
  'ignoreError': false // Boolean | flag to ignore stat errors to check existence only
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.stat(wfsId, wfsPath, , opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **wfsId** | **String**| webida file system id (same to workspace id) to access. | 
 **wfsPath** | **String**| webida file system path to access. without heading /. should be placed at the end of path arguments  | 
 **ignoreError** | **Boolean**| flag to ignore stat errors to check existence only | [optional] [default to false]

### Return type

[**Stats**](Stats.md)

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/octet-stream

<a name="writeFile"></a>
# **writeFile**
> File writeFile(wfsId, wfsPath, data, opts)



create / update file with body data

### Example
```javascript
var WebidaServiceApi = require('webida-service-api');
var defaultClient = WebidaServiceApi.ApiClient.default;

// Configure API key authorization: webida-simple-auth
var webida-simple-auth = defaultClient.authentications['webida-simple-auth'];
webida-simple-auth.apiKey = 'YOUR API KEY';
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//webida-simple-auth.apiKeyPrefix = 'Token';

var apiInstance = new WebidaServiceApi.WfsApi();

var wfsId = "wfsId_example"; // String | webida file system id (same to workspace id) to access.

var wfsPath = "wfsPath_example"; // String | webida file system path to access. without heading /. should be placed at the end of path arguments 

var data = "/path/to/file.txt"; // File | file contents to write.

var opts = { 
  'ensure': false // Boolean | flag to create all parent directories to create file or dir, like mkdir -p
};

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
apiInstance.writeFile(wfsId, wfsPath, data, opts, callback);
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **wfsId** | **String**| webida file system id (same to workspace id) to access. | 
 **wfsPath** | **String**| webida file system path to access. without heading /. should be placed at the end of path arguments  | 
 **data** | **File**| file contents to write. | 
 **ensure** | **Boolean**| flag to create all parent directories to create file or dir, like mkdir -p | [optional] [default to false]

### Return type

**File**

### Authorization

[webida-simple-auth](../README.md#webida-simple-auth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json, application/octet-stream

