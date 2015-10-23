# Calcium content assist plugin

## Overview
This plugin provides an extension for the "webida.editor.code-editor:contentassist" extension point.
This plugin provides calcium content assist engine and control.

## Extensions
### webida.editor.code-editor:contentassist

```
extensions" : {
    "webida.editor.code-editor:contentassist" : [
        {
            "controlModule" : "./CalciumControl",
            "engineModule" : "./calcium-server",
            "mode" : "js",
            "engineName" : "calcium"
        }
    ]
}
```
