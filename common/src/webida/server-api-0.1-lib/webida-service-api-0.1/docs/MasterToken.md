# WebidaServiceApi.MasterToken

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**workspaceId** | **String** | Some MASTER tokens has some &#39;restricted&#39; access rights, bound to specific workspace, with  as issueToken() operation specifies. Any access tokens created from a restricted master token inherits same restriction. If this value is falsy, token has  no restriction and  can be used to access all apis. If truthy, some api calls that touches internal access registry or session registry will have met 403 error. Some filesystem apis will be rejected, too.   | [optional] 


