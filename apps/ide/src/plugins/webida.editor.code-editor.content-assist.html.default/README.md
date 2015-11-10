# Html default content assist plugin 

## Overview
This plugin provides an extension for the "webida.editor.code-editor:contentassist" extension point.
This plugin provides html default content assist.

## Extensions
### webida.editor.code-editor:contentassist

```
extensions" : {
    "webida.editor.code-editor:contentassist" : [
        { 
            "controlModule" : "./HtmlDefaultControl", 
            "engineModule" : "",
            "langMode" : "html",
            "engineName" : "HtmlDefault",
            "hinterModes" : ["html", "htmlmixed"],
            "hinterNames" : ["html"]
        }
    ]
}
```