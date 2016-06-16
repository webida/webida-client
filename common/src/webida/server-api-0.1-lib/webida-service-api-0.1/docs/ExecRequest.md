# WebidaServiceApi.ExecRequest

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**command** | **String** | name or path of executable file to run. should not contain any arguments.  | 
**args** | **[String]** | the command line arguments for the command. if &#39;shell&#39; property is true, this args will be joined with &#39; &#39; and appended to command string  | [optional] 
**cwd** | **String** | Current working directory of child process, relative to workspace root. If abscent, CWD will be the workspace root directory. Does not accept shell-variable form like $HOME, %USERPROFILE%  | [optional] 
**input** | **String** | The value which will be passed as stdin to the spawned process. If abscent, server will not write to input anything  | [optional] 
**maxBuffer** | **String** | largest amount of data (in bytes) allowed on stdout or stderr. if exceeded child process is killed by server. if async is true, this arguments will be ignored by spawn()  | [optional] 


