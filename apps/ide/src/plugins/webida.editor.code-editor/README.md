# CodeEditor Plugin

## Overview


## Structure

## Extension points
### webida.editor.code-editor:contentassist

```
extensionPoints" : {
    ...
    "webida.editor.code-editor:contentassist" : [
        { "name" : "controlModule", "type" : "string", "desc" : "Content assist module path" },
        { "name" : "engineModule", "type" : "string", "desc" : "Content assist engine path" },
        { "name" : "langMode", "type" : "string", "desc" : "Working language mode" },
        { "name" : "engineName", "type" : "string", "desc" : "Name of engine" }
    ]
    ...
}
```
- controlModule
  - Path of the control module which returns a constructor function which inherits IContentAssist.
  - Control module instance must provide the following methods.
    - canExecute
    - execCommand
- engineModule
  - Engine module runs on the assist-worker which is a WebWorker.
  - Path of the engine module which returns an object which provides the following methods.
    - startServer
    - stopServer
    - addFile
    - delFile
    - getFile
    - request

 