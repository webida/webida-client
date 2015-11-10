# Tern content assist plugin

## Overview
This plugin provides an extension for the "webida.editor.code-editor:contentassist" extension point.
This plugin provides tern.js content assist engine and control.

## Extensions
### webida.editor.code-editor:contentassist

```
extensions" : {
    "webida.editor.code-editor:contentassist" : [
        { 
            "controlModule" : "./TernControl", 
            "engineModule" : "./js-hint-server",
            "mode" : "js",
            "engineName" : "tern-js"
        }
    ]
}
```