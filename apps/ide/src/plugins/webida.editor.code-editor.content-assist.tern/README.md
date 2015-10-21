# Tern content assist plugin

## Overview
This plugin provides an extension for the "webida.editor.code-editor:contentassist" extension point.
This plugin provides ter.js content assist engine and control.

## Extensions
### webida.editor.code-editor:contentassist

```javascript
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