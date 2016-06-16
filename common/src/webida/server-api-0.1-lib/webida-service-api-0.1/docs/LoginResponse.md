# WebidaServiceApi.LoginResponse

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**accessToken** | **String** | actual token text which should be included in header or cookie | 
**decodedAccessToken** | [**AccessToken**](AccessToken.md) |  | 
**masterToken** | **String** | unrestricted master token when user has logged in with valid credential | [optional] 
**decodedMasterToken** | [**MasterToken**](MasterToken.md) |  | [optional] 


