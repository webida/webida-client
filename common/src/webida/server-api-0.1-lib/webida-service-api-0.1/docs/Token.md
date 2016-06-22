# WebidaServiceApi.Token

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**text** | **String** | actual token text that should be shipped in header or query | 
**tokenType** | **String** | MASTER : used to create an access token from clients, without login credential ACCESS : protects api access. should be unique for each ide session ADMIN  : unrestriced access token for hub/admin service who controls server.          there&#39;s no way to create admin token with API.  Note that here&#39;s no REFRESH token, nor LOGIN token. The login api will create unrestricted access token &amp; master token pair. Desktop app has a side-way to create an unrestricted master token before starting IDE instances.  | 
**expiresAt** | **Date** |  | 
**issuedAt** | **Date** |  | 
**sessionId** | **String** | mandatory for ACCESS token, identifying client instance | [optional] 
**workspaceId** | **String** | If truthy, access rights are restricted to specified workspace only. | [optional] 


<a name="TokenTypeEnum"></a>
## Enum: TokenTypeEnum


* `MASTER` (value: `"MASTER"`)

* `ACCESS` (value: `"ACCESS"`)

* `ADMIN` (value: `"ADMIN"`)




