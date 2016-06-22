# WebidaServiceApi.Session

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | the id of a session. usually same to socket id. | 
**name** | **String** | human readable name, usually derived from workspace name. | 
**state** | **String** | state of this session NORMAL &#x3D; connected, normally working LOSING &#x3D; disconnected, waiting reconnection. still accessible with api CLOSING &#x3D; socket connection will close connection by server (clinet will be notified)  there&#39;s no &#39;CLOSED&#39; / &#39;LOST&#39; state, for server will remove session object in registry when the server closes connection or stops waiting for reconnection for timeout.  | 
**workspaceId** | **String** | the id of workspace that this sessions is working on. | 
**clientAddress** | **String** | the peer address of session connection. not always | 
**connectedAt** | **Date** | the time when socket connection is established | 
**disconnectedAt** | **Date** | the time when socket is closed. | 
**willCloseAt** | **Date** | when state becomes CLOSING, actual closing time will be updated by server. | [optional] 
**willLoseAt** | **Date** | when state becomes LOSING, server will not wait for reconnection after this time. | [optional] 


<a name="StateEnum"></a>
## Enum: StateEnum


* `NORMAL` (value: `"NORMAL"`)

* `LOSING` (value: `"LOSING"`)

* `CLOSING` (value: `"CLOSING"`)




