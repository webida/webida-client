# Beautify content assist plugin 

## Overview
This plugin provides an extension for the "webida.editor.code-editor:contentassist" extension point.
This plugin provides beautify content assist control.

## Extensions
### webida.editor.code-editor:contentassist

```
"extensions" : {        
    "webida.editor.code-editor:contentassist" : [
        { 
            "controlModule" : "./BeautifyControl", 
            "engineModule" : "",
            "langMode" : "*",
            "engineName" : "Beautify",
            "hinterModes" : [],
            "hinterNames" : []
        }
    ]
}
```