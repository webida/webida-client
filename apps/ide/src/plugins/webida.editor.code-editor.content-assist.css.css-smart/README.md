# Css smart content assist plugin 

## Overview
This plugin provides an extension for the "webida.editor.code-editor:contentassist" extension point.
This plugin provides css smart content assist engine and control.

## Extensions
### webida.editor.code-editor:contentassist

```
"extensions" : {        
    "webida.editor.code-editor:contentassist" : [
        { 
            "controlModule" : "./CssSmartControl", 
            "engineModule" : "./css-hint-server",
            "langMode" : "css",
            "engineName" : "CssSmart",
            "hinterModes" : ["css"],
            "hinterNames" : ["cssSmart"]
        }
    ]
}
```