# Html smart content assist plugin 

## Overview
This plugin provides an extension for the "webida.editor.code-editor:contentassist" extension point.
This plugin provides html smart content assist engine and control.

## Extensions
### webida.editor.code-editor:contentassist

```
"extensions" : {        
    "webida.editor.code-editor:contentassist" : [
        { 
            "controlModule" : "./HtmlSmartControl", 
            "engineModule" : "./html-hint-server",
            "langMode" : "html",
            "engineName" : "HtmlSmart",
            "hinterModes" : ["html", "htmlmixed"],
            "hinterNames" : ["htmlSmart"]
        }
    ]
}
```