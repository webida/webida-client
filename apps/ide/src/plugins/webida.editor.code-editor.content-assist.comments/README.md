# Comments assist plugin 

## Overview
This plugin provides comments assist by extending the "webida.editor.code-editor:contentassist" extension point.

## API

### isLineCommentable (editor)
- Returns if the current selection is line commentable.

#### arguments
- editor
 - codemirror instance
 
### isBlockCommentable (editor)
- Returns if the current selection is block commentable.

#### arguments
- editor
 - codemirror instance

### isSelectionCommentable (editor)
- Returns if the current selection is commentable.

#### arguments
- editor
 - codemirror instance

### lineComment (cm)
- Performs line comment.

#### arguments
- cm
 - codemirror instance

### blockComment (cm)
- Performs block comment.

#### arguments
- cm
 - codemirror instance

### commentOutSelection (cm)
- Performs commenting out selection.

#### arguments
- cm
 - codemirror instance
