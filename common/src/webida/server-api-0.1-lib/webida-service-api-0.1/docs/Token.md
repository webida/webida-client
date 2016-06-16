# WebidaServiceApi.Token

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**tokenType** | **String** | MASTER : used to create an access token from clients, without login credential ACCESS : protects api access. should be unique for each ide session ADMIN  : unrestriced access token for hub/admin service who controls server.          there&#39;s no way to create admin token with API.           Note that here&#39;s no REFRESH token, nor LOGIN token. The login api will create  unrestricted access token &amp; master token pair. Desktop app has a &#39;side-way&#39; to  create an &#39;unrestricted&#39; master token before starting IDE instances.  So, every ide client has a master token.   If client want to access remote workspace directly, it should call login api  with given master token which is generated from the remote login credential  when adding remote workspace in main ui. Switching from a remote workspace  to local one requires a local master token. It&#39;s not desirable to mix local and remote tokens in a single client instance in the view point of security.  So, it&#39;s recommended to save local master token in session storage.   | 
**expiresAt** | **Date** |  | 
**issuedAt** | **Date** |  | 


<a name="TokenTypeEnum"></a>
## Enum: TokenTypeEnum


* `MASTER` (value: `"MASTER"`)

* `ACCESS` (value: `"ACCESS"`)

* `ADMIN` (value: `"ADMIN"`)




