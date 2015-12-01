# Comments content assist plugin 

## Overview
This plugin provides an extension for the "webida.editor.code-editor:contentassist" extension point.
This plugin provides comments content assist engine control.
Linecomment, blockcomment, selectioncomment are provided.

## Extensions
### webida.editor.code-editor:contentassist

```
"extensions" : {        
    "webida.editor.code-editor:contentassist" : [
        { 
            "controlModule" : "./CommentsControl", 
            "engineModule" : "",
            "langMode" : "*",
            "engineName" : "Comments",
            "hinterModes" : [],
            "hinterNames" : []
        }
    ]
}
```