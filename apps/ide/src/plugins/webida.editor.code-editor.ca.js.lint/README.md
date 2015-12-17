# JavaScript lint plugin 

## Overview
This plugin provides javascript linter by extending the "webida.editor.code-editor:contentassist" extension point.

## API

### setLinter (viewer, type, option)
- Set linter options and loads required modules
- Also invokes applyLinter

#### arguments
- viewer
- CodeEditorViewer instance
- type
- Current editor mode (e.g. css, html, js ..)
- Used as filter
- option
- Linter option

### applyLinter (cm, editorMode)
-  Apply current linter setting

#### arguments
- cm
- Codemirror instance
- editorMode
- Current editor mode (e.g. css, html, js ..)