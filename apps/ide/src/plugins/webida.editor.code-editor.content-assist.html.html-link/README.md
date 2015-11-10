# Html default content assist plugin 

## Overview
This plugin provides an extension for the "webida.editor.code-editor:contentassist" extension point.
This plugin provides html link content assist.

## Extensions
### webida.editor.code-editor:contentassist

```
"extensions" : {        
    "webida.editor.code-editor:contentassist" : [
        { 
            "controlModule" : "./HtmlLinkControl", 
            "engineModule" : "",
            "langMode" : "html",
            "engineName" : "HtmlLink",
            "hinterModes" : ["html", "htmlmixed"],
            "hinterNames" : ["htmlLink"]
        }
    ]
}
```