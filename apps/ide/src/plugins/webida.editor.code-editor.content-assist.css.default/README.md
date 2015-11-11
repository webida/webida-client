# Css default content assist plugin 

## Overview
This plugin provides an extension for the "webida.editor.code-editor:contentassist" extension point.
This plugin provides css default content assist.

## Extensions
### webida.editor.code-editor:contentassist

```
extensions" : {
    "webida.editor.code-editor:contentassist" : [
        { 
            "controlModule" : "./CssDefaultControl", 
            "engineModule" : "",
            "langMode" : "css",
            "engineName" : "CssDefault",
            "hinterModes" : ["css"],
            "hinterNames" : ["css"]
        }
    ]
}
```