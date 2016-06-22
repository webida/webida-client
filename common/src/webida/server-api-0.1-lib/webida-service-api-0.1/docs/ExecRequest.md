# WebidaServiceApi.ExecRequest

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** | unique identifier of execution, to demux response stream or cancel request | 
**command** | **String** | command to run. should not contain any arguments, pipes, redirections  | 
**args** | **[String]** | the arguments array | 
**cwd** | **String** | Current working directory of child process, relative to workspace root. If abscent, CWD will be the workspace root directory. Does not accept any evaluatable form like $HOME, %USERPROFILE%. If absolute, heading / will be discarded. should be unixified.  | [optional] 
**input** | **String** | input string for child process. if falsy in async execution, async input messages will be pasted into the child&#39;s stdin. since we don&#39;t use tty, it&#39;s recommended to use input string anyway.  | [optional] 
**timeout** | **Integer** | The value which In &#39;milliseconds&#39; the maximum amount of time the child is allowed to run. (not idle time of stdout / stderr stream) if undefined, server will not kill the child process until receiving cancel request  if it doesn&#39;t exit by self.  | [optional] 


