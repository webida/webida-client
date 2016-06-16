# WebidaServiceApi.AccessToken

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**sessionId** | **String** | An access token should not be shared between ide sessions, for each sessions requires  distinct websocket connection, identified with session id.  To change session id,  call login again. Any Websocket connection will be rejected if requested upgrade does not contains proper access token data   | 
**workspaceId** | **String** | the workspaceId inherited from master token | [optional] 


